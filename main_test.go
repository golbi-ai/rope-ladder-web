package main

import (
	"bytes"
	"context"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

type fakeReleaseBucket struct {
	objects map[string][]byte
	signed  []string
}

func (bucket *fakeReleaseBucket) ReadObject(_ context.Context, name string) (io.ReadCloser, releaseObjectAttrs, error) {
	data, ok := bucket.objects[name]
	if !ok {
		return nil, releaseObjectAttrs{}, errors.New("missing object")
	}
	return io.NopCloser(bytes.NewReader(data)), releaseObjectAttrs{ContentType: "text/plain", Size: int64(len(data))}, nil
}

func (bucket *fakeReleaseBucket) SignedURL(name string, _ time.Duration) (string, error) {
	bucket.signed = append(bucket.signed, name)
	return "https://signed.example/" + name, nil
}

func useReleaseBucket(t *testing.T, bucket releaseBucket) {
	t.Helper()
	previous := releases
	releases = bucket
	manifestState.Lock()
	manifestState.value, manifestState.at = nil, time.Time{}
	manifestState.Unlock()
	t.Cleanup(func() {
		releases = previous
		manifestState.Lock()
		manifestState.value, manifestState.at = nil, time.Time{}
		manifestState.Unlock()
	})
}

func TestHealth(t *testing.T) {
	response := httptest.NewRecorder()
	newMux().ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/health", nil))
	if response.Code != http.StatusOK || response.Body.String() != "ok" {
		t.Fatalf("health = %d %q", response.Code, response.Body.String())
	}
}

func TestFetchCatalogReadsLatestMain(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/repos/golbi-ai/rope-ladder-lesson-plans/contents/plans":
			if got := r.URL.Query().Get("ref"); got != "main" {
				t.Fatalf("ref = %q", got)
			}
			_, _ = w.Write([]byte(`[{"name":"sample","type":"dir"}]`))
		case "/golbi-ai/rope-ladder-lesson-plans/main/plans/sample/metadata.yaml":
			_, _ = w.Write([]byte("format: 1\nname: Sample curriculum\ndescription: A concise guide.\ntags: [go, cli]\nattestation:\n  public_source: true\n  rights_to_publish: true\n"))
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	originalAPI, originalRaw, originalClient := catalogAPIBase, catalogRawBase, catalogClient
	catalogAPIBase, catalogRawBase, catalogClient = server.URL, server.URL, server.Client()
	catalogState.Lock()
	catalogState.entries, catalogState.fetched = nil, time.Time{}
	catalogState.Unlock()
	t.Cleanup(func() {
		catalogAPIBase, catalogRawBase, catalogClient = originalAPI, originalRaw, originalClient
		catalogState.Lock()
		catalogState.entries, catalogState.fetched = nil, time.Time{}
		catalogState.Unlock()
	})

	entries, err := fetchCatalog(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) != 1 || entries[0].Slug != "sample" || !strings.Contains(entries[0].Name, "Sample") {
		t.Fatalf("entries = %#v", entries)
	}
}

func TestUnknownSitePathDoesNotSoft200(t *testing.T) {
	response := httptest.NewRecorder()
	newMux().ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/not-a-page", nil))
	if response.Code != http.StatusNotFound {
		t.Fatalf("site status = %d", response.Code)
	}
}

func TestReleaseHandlersServeManifestAndSignedRedirect(t *testing.T) {
	bucket := &fakeReleaseBucket{objects: map[string][]byte{
		"version.json": []byte(`{"version":"1.2.3","assets":[{"os":"linux","arch":"amd64","url":"https://rpldr.golbi.ai/releases/v1.2.3/rope-ladder-linux-amd64.tar.gz","sha256":"abc"}]}`),
		"apt/KEY.gpg":  []byte("public key"),
	}}
	useReleaseBucket(t, bucket)
	mux := newMux()
	manifest := httptest.NewRecorder()
	mux.ServeHTTP(manifest, httptest.NewRequest(http.MethodGet, "/version.json", nil))
	if manifest.Code != http.StatusOK || !strings.Contains(manifest.Body.String(), `"version":"1.2.3"`) {
		t.Fatalf("manifest=%d %q", manifest.Code, manifest.Body.String())
	}
	release := httptest.NewRecorder()
	mux.ServeHTTP(release, httptest.NewRequest(http.MethodGet, "/releases/latest/rope-ladder-linux-amd64.tar.gz", nil))
	if release.Code != http.StatusFound || release.Header().Get("Location") != "https://signed.example/v1.2.3/rope-ladder-linux-amd64.tar.gz" {
		t.Fatalf("release=%d location=%q", release.Code, release.Header().Get("Location"))
	}
	apt := httptest.NewRecorder()
	mux.ServeHTTP(apt, httptest.NewRequest(http.MethodGet, "/apt/KEY.gpg", nil))
	if apt.Code != http.StatusOK || apt.Body.String() != "public key" {
		t.Fatalf("apt=%d %q", apt.Code, apt.Body.String())
	}
}

func TestReleaseHandlersRejectTraversalAndEmbedInstallers(t *testing.T) {
	useReleaseBucket(t, &fakeReleaseBucket{objects: map[string][]byte{}})
	mux := newMux()
	for _, url := range []string{"/releases/latest/../version.json", "/apt/../version.json"} {
		response := httptest.NewRecorder()
		request := httptest.NewRequest(http.MethodGet, url, nil)
		if strings.HasPrefix(url, "/releases/") {
			serveRelease(response, request)
		} else {
			serveAPT(response, request)
		}
		if response.Code != http.StatusNotFound {
			t.Fatalf("%s = %d", url, response.Code)
		}
	}
	installer := httptest.NewRecorder()
	mux.ServeHTTP(installer, httptest.NewRequest(http.MethodGet, "/install.sh", nil))
	if installer.Code != http.StatusOK || !strings.Contains(installer.Body.String(), "ROPE_LADDER_INSTALL_BASE") {
		t.Fatalf("installer=%d %q", installer.Code, installer.Body.String())
	}
}
