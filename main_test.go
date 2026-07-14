package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

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
