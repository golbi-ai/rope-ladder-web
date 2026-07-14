package main

import (
	"context"
	_ "embed"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"path"
	"strings"
	"sync"
	"time"

	"cloud.google.com/go/storage"
	"google.golang.org/api/googleapi"
)

const releaseBucketName = "rope-ladder-cli-releases"

//go:embed install.sh
var installSh []byte

//go:embed install.ps1
var installPS1 []byte

type releaseManifest struct {
	Version     string         `json:"version"`
	PublishedAt string         `json:"published_at"`
	NotesURL    string         `json:"notes_url"`
	Assets      []releaseAsset `json:"assets"`
}

type releaseAsset struct {
	OS     string `json:"os"`
	Arch   string `json:"arch"`
	URL    string `json:"url"`
	SHA256 string `json:"sha256"`
	Size   int64  `json:"size"`
}

type releaseObjectAttrs struct {
	ContentType  string
	Size         int64
	ETag         string
	LastModified time.Time
}

type releaseBucket interface {
	ReadObject(context.Context, string) (io.ReadCloser, releaseObjectAttrs, error)
	SignedURL(string, time.Duration) (string, error)
}

type gcsReleaseBucket struct {
	client  *storage.Client
	bucket  string
	saEmail string
}

func (bucket *gcsReleaseBucket) ReadObject(ctx context.Context, name string) (io.ReadCloser, releaseObjectAttrs, error) {
	object := bucket.client.Bucket(bucket.bucket).Object(name)
	reader, err := object.NewReader(ctx)
	if err != nil {
		return nil, releaseObjectAttrs{}, err
	}
	attrs, err := object.Attrs(ctx)
	if err != nil {
		reader.Close()
		return nil, releaseObjectAttrs{}, err
	}
	return reader, releaseObjectAttrs{
		ContentType:  reader.ContentType(),
		Size:         reader.Size(),
		ETag:         fmt.Sprintf("%q", attrs.Etag),
		LastModified: attrs.Updated,
	}, nil
}

func (bucket *gcsReleaseBucket) SignedURL(name string, expiry time.Duration) (string, error) {
	return bucket.client.Bucket(bucket.bucket).SignedURL(name, &storage.SignedURLOptions{
		GoogleAccessID: bucket.saEmail,
		Method:         http.MethodGet,
		Expires:        time.Now().Add(expiry),
		Scheme:         storage.SigningSchemeV4,
	})
}

type unavailableReleaseBucket struct{}

func (unavailableReleaseBucket) ReadObject(context.Context, string) (io.ReadCloser, releaseObjectAttrs, error) {
	return nil, releaseObjectAttrs{}, errors.New("release storage unavailable")
}
func (unavailableReleaseBucket) SignedURL(string, time.Duration) (string, error) {
	return "", errors.New("release storage unavailable")
}

var (
	releases      releaseBucket = unavailableReleaseBucket{}
	manifestState struct {
		sync.Mutex
		value *releaseManifest
		at    time.Time
	}
)

func configureReleaseStore(ctx context.Context) error {
	client, err := storage.NewClient(ctx)
	if err != nil {
		return err
	}
	email, err := runtimeServiceAccountEmail()
	if err != nil {
		return err
	}
	releases = &gcsReleaseBucket{client: client, bucket: releaseBucketName, saEmail: email}
	return nil
}

func runtimeServiceAccountEmail() (string, error) {
	request, err := http.NewRequest(http.MethodGet, "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/email", nil)
	if err != nil {
		return "", err
	}
	request.Header.Set("Metadata-Flavor", "Google")
	response, err := (&http.Client{Timeout: 5 * time.Second}).Do(request)
	if err != nil {
		return "", fmt.Errorf("metadata server: %w", err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return "", fmt.Errorf("metadata server returned HTTP %d", response.StatusCode)
	}
	body, err := io.ReadAll(io.LimitReader(response.Body, 4096))
	if err != nil {
		return "", err
	}
	email := strings.TrimSpace(string(body))
	if email == "" {
		return "", errors.New("metadata server returned empty service-account email")
	}
	return email, nil
}

func fetchReleaseManifest(ctx context.Context) (*releaseManifest, error) {
	manifestState.Lock()
	defer manifestState.Unlock()
	if manifestState.value != nil && time.Since(manifestState.at) < 5*time.Minute {
		return manifestState.value, nil
	}
	body, _, err := releases.ReadObject(ctx, "version.json")
	if err != nil {
		return nil, err
	}
	defer body.Close()
	var manifest releaseManifest
	if err := json.NewDecoder(io.LimitReader(body, 1<<20)).Decode(&manifest); err != nil {
		return nil, err
	}
	if manifest.Version == "" {
		return nil, errors.New("release manifest has no version")
	}
	manifestState.value, manifestState.at = &manifest, time.Now()
	return manifestState.value, nil
}

func serveInstallSh(w http.ResponseWriter, _ *http.Request)  { serveInstaller(w, installSh) }
func serveInstallPS1(w http.ResponseWriter, _ *http.Request) { serveInstaller(w, installPS1) }

func serveInstaller(w http.ResponseWriter, body []byte) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Header().Set("Cache-Control", "public, max-age=3600")
	_, _ = w.Write(body)
}

func serveReleaseManifest(w http.ResponseWriter, request *http.Request) {
	manifest, err := fetchReleaseManifest(request.Context())
	if err != nil {
		writeText(w, http.StatusBadGateway, "release manifest unavailable")
		return
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "public, max-age=300")
	_ = json.NewEncoder(w).Encode(manifest)
}

func serveRelease(w http.ResponseWriter, request *http.Request) {
	relative := strings.TrimPrefix(request.URL.Path, "/releases/")
	if !validReleaseObjectPath(relative) {
		writeText(w, http.StatusNotFound, "not found")
		return
	}
	parts := strings.SplitN(relative, "/", 2)
	version, rest := parts[0], parts[1]
	object, expiry, cache := "", 24*time.Hour, "public, max-age=86400"
	if version == "latest" {
		manifest, err := fetchReleaseManifest(request.Context())
		if err != nil {
			writeText(w, http.StatusBadGateway, "release manifest unavailable")
			return
		}
		object, expiry, cache = "v"+strings.TrimPrefix(manifest.Version, "v")+"/"+rest, 15*time.Minute, "public, max-age=300"
	} else {
		object = "v" + strings.TrimPrefix(version, "v") + "/" + rest
	}
	url, err := releases.SignedURL(object, expiry)
	if err != nil {
		writeText(w, http.StatusBadGateway, "release download unavailable")
		return
	}
	w.Header().Set("Cache-Control", cache)
	http.Redirect(w, request, url, http.StatusFound)
}

func serveAPT(w http.ResponseWriter, request *http.Request) {
	relative := strings.TrimPrefix(request.URL.Path, "/apt/")
	if relative == "" || !validReleaseObjectPath("v0/"+relative) {
		writeText(w, http.StatusNotFound, "not found")
		return
	}
	body, attrs, err := releases.ReadObject(request.Context(), "apt/"+relative)
	if err != nil {
		var apiError *googleapi.Error
		if errors.As(err, &apiError) && apiError.Code == http.StatusNotFound {
			writeText(w, http.StatusNotFound, "not found")
			return
		}
		writeText(w, http.StatusBadGateway, "apt repository unavailable")
		return
	}
	defer body.Close()
	if attrs.ContentType != "" {
		w.Header().Set("Content-Type", attrs.ContentType)
	}
	if attrs.Size > 0 {
		w.Header().Set("Content-Length", fmt.Sprint(attrs.Size))
	}
	if attrs.ETag != "" {
		w.Header().Set("ETag", attrs.ETag)
	}
	if !attrs.LastModified.IsZero() {
		w.Header().Set("Last-Modified", attrs.LastModified.UTC().Format(http.TimeFormat))
	}
	w.Header().Set("Cache-Control", "public, max-age=3600")
	_, _ = io.Copy(w, body)
}

func validReleaseObjectPath(value string) bool {
	if value == "" || strings.Contains(value, "\\") || strings.Contains(value, "//") || path.Clean(value) != value {
		return false
	}
	parts := strings.Split(value, "/")
	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		return false
	}
	for _, part := range parts {
		for _, char := range part {
			if !(char >= 'a' && char <= 'z' || char >= 'A' && char <= 'Z' || char >= '0' && char <= '9' || strings.ContainsRune("._+-", char)) {
				return false
			}
		}
	}
	return true
}
