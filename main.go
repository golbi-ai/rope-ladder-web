package main

import (
	"context"
	"embed"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"log"
	"mime"
	"net/http"
	"net/url"
	"os"
	"path"
	"sort"
	"strings"
	"sync"
	"time"

	"gopkg.in/yaml.v3"
)

// A checked-out source tree has this committed placeholder, while the
// production image replaces it with React Router's prerendered build.
//
//go:embed all:web/dist/client
var webDist embed.FS

var siteFS = mustSubFS(webDist, "web/dist/client")

const (
	catalogRepository = "golbi-ai/rope-ladder-lesson-plans"
	catalogBranch     = "main"
	catalogTTL        = 5 * time.Minute
	maxCatalogBody    = 1 << 20
)

var (
	catalogAPIBase = "https://api.github.com"
	catalogRawBase = "https://raw.githubusercontent.com"
	catalogClient  = &http.Client{Timeout: 12 * time.Second}
	catalogState   struct {
		sync.Mutex
		entries []catalogEntry
		fetched time.Time
	}
)

type catalogEntry struct {
	Slug        string   `json:"slug"`
	Name        string   `json:"name"`
	Codebase    string   `json:"codebase,omitempty"`
	Description string   `json:"description"`
	Tags        []string `json:"tags"`
}

type catalogMetadata struct {
	Format      int      `yaml:"format"`
	Name        string   `yaml:"name"`
	Codebase    string   `yaml:"codebase"`
	Description string   `yaml:"description"`
	Tags        []string `yaml:"tags"`
	Attestation struct {
		PublicSource    bool `yaml:"public_source"`
		RightsToPublish bool `yaml:"rights_to_publish"`
	} `yaml:"attestation"`
}

type githubContent struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("rope-ladder-web listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, newMux()))
}

func newMux() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", serveHealth)
	mux.HandleFunc("GET /api/catalog", serveCatalog)
	mux.HandleFunc("GET /", serveSite)
	return mux
}

func mustSubFS(f embed.FS, dir string) fs.FS {
	sub, err := fs.Sub(f, dir)
	if err != nil {
		panic(err)
	}
	return sub
}

// serveSite maps only known prerendered pages and built assets. In particular,
// it does not turn an unknown page into a misleading success response.
func serveSite(w http.ResponseWriter, r *http.Request) {
	p := r.URL.Path
	if p != "/" && strings.HasSuffix(p, "/") {
		target := strings.TrimSuffix(p, "/")
		if r.URL.RawQuery != "" {
			target += "?" + r.URL.RawQuery
		}
		http.Redirect(w, r, target, http.StatusMovedPermanently)
		return
	}

	base := path.Base(p)
	if base == ".gitkeep" {
		http.NotFound(w, r)
		return
	}
	if ext := path.Ext(base); ext != "" {
		serveSiteAsset(w, r, p, ext)
		return
	}

	file := "index.html"
	if p != "/" {
		file = strings.TrimPrefix(p, "/") + "/index.html"
	}
	data, err := fs.ReadFile(siteFS, file)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(data)
}

func serveSiteAsset(w http.ResponseWriter, r *http.Request, urlPath, ext string) {
	data, err := fs.ReadFile(siteFS, strings.TrimPrefix(urlPath, "/"))
	if err != nil {
		http.NotFound(w, r)
		return
	}
	contentType := mime.TypeByExtension(ext)
	if contentType == "" {
		contentType = "application/octet-stream"
	}
	w.Header().Set("Content-Type", contentType)
	if strings.HasPrefix(urlPath, "/assets/") {
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	} else {
		w.Header().Set("Cache-Control", "public, max-age=3600")
	}
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(data)
}

func serveHealth(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("ok"))
}

func serveCatalog(w http.ResponseWriter, r *http.Request) {
	entries, err := fetchCatalog(r.Context())
	if err != nil {
		log.Printf("catalog: %v", err)
		writeText(w, http.StatusBadGateway, "catalog temporarily unavailable")
		return
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "public, max-age=300")
	if err := json.NewEncoder(w).Encode(entries); err != nil {
		log.Printf("catalog response: %v", err)
	}
}

// fetchCatalog intentionally reads the public catalog's latest main branch,
// rather than a database or a build-time copy. The cache limits GitHub API
// traffic and lets the catalog remain the single source of truth.
func fetchCatalog(ctx context.Context) ([]catalogEntry, error) {
	catalogState.Lock()
	defer catalogState.Unlock()
	if catalogState.entries != nil && time.Since(catalogState.fetched) < catalogTTL {
		return copyCatalogEntries(catalogState.entries), nil
	}

	entries, err := fetchCatalogFresh(ctx)
	if err != nil {
		if catalogState.entries != nil {
			// A temporarily unavailable upstream must not take the already-known
			// public catalog down with it.
			return copyCatalogEntries(catalogState.entries), nil
		}
		return nil, err
	}
	catalogState.entries = entries
	catalogState.fetched = time.Now()
	return copyCatalogEntries(entries), nil
}

func copyCatalogEntries(entries []catalogEntry) []catalogEntry {
	out := make([]catalogEntry, len(entries))
	copy(out, entries)
	return out
}

func fetchCatalogFresh(ctx context.Context) ([]catalogEntry, error) {
	apiURL := fmt.Sprintf("%s/repos/%s/contents/plans?ref=%s", strings.TrimSuffix(catalogAPIBase, "/"), catalogRepository, catalogBranch)
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return nil, err
	}
	request.Header.Set("Accept", "application/vnd.github+json")
	request.Header.Set("User-Agent", "rope-ladder-web")
	response, err := catalogClient.Do(request)
	if err != nil {
		return nil, fmt.Errorf("list catalog plans: %w", err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("list catalog plans: GitHub returned %s", response.Status)
	}
	response.Body = io.NopCloser(io.LimitReader(response.Body, maxCatalogBody))
	var directories []githubContent
	if err := json.NewDecoder(response.Body).Decode(&directories); err != nil {
		return nil, fmt.Errorf("decode catalog plans: %w", err)
	}

	entries := make([]catalogEntry, 0, len(directories))
	for _, directory := range directories {
		if directory.Type != "dir" || !validSlug(directory.Name) {
			continue
		}
		entry, err := fetchCatalogMetadata(ctx, directory.Name)
		if err != nil {
			return nil, err
		}
		entries = append(entries, entry)
	}
	sort.Slice(entries, func(i, j int) bool { return entries[i].Name < entries[j].Name })
	return entries, nil
}

func fetchCatalogMetadata(ctx context.Context, slug string) (catalogEntry, error) {
	rawURL := fmt.Sprintf("%s/%s/%s/plans/%s/metadata.yaml", strings.TrimSuffix(catalogRawBase, "/"), catalogRepository, catalogBranch, url.PathEscape(slug))
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
	if err != nil {
		return catalogEntry{}, err
	}
	request.Header.Set("User-Agent", "rope-ladder-web")
	response, err := catalogClient.Do(request)
	if err != nil {
		return catalogEntry{}, fmt.Errorf("read %s metadata: %w", slug, err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return catalogEntry{}, fmt.Errorf("read %s metadata: GitHub returned %s", slug, response.Status)
	}
	response.Body = io.NopCloser(io.LimitReader(response.Body, maxCatalogBody))
	decoder := yaml.NewDecoder(response.Body)
	decoder.KnownFields(true)
	var metadata catalogMetadata
	if err := decoder.Decode(&metadata); err != nil {
		return catalogEntry{}, fmt.Errorf("decode %s metadata: %w", slug, err)
	}
	if err := validateCatalogMetadata(metadata); err != nil {
		return catalogEntry{}, fmt.Errorf("validate %s metadata: %w", slug, err)
	}
	return catalogEntry{Slug: slug, Name: metadata.Name, Codebase: metadata.Codebase, Description: metadata.Description, Tags: metadata.Tags}, nil
}

func validateCatalogMetadata(metadata catalogMetadata) error {
	if metadata.Format != 1 || strings.TrimSpace(metadata.Name) == "" || strings.TrimSpace(metadata.Description) == "" || len(metadata.Tags) == 0 || !metadata.Attestation.PublicSource || !metadata.Attestation.RightsToPublish {
		return errors.New("missing required catalog metadata")
	}
	if metadata.Codebase != "" {
		parsed, err := url.Parse(metadata.Codebase)
		if err != nil || (parsed.Scheme != "https" && parsed.Scheme != "http") || parsed.Host == "" {
			return errors.New("invalid codebase URL")
		}
	}
	return nil
}

func validSlug(value string) bool {
	if len(value) == 0 || len(value) > 80 || value[0] == '-' {
		return false
	}
	for _, char := range value {
		if (char < 'a' || char > 'z') && (char < '0' || char > '9') && char != '-' {
			return false
		}
	}
	return true
}

func writeText(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(status)
	_, _ = io.WriteString(w, message)
}
