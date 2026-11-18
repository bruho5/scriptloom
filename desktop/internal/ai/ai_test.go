package ai

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

const fakeKey = "sk-test-placeholder-not-real"

func validRequest() Request {
	return Request{Notes: "A machine enters.", Style: "Enter a sentinel.", Direction: "Brief.", Model: "test-model", MaxOutputTokens: 512}
}

type roundTripper func(*http.Request) (*http.Response, error)

func (f roundTripper) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }
func expectError(t *testing.T, err error, code string, status int) {
	t.Helper()
	var e *Error
	if !errors.As(err, &e) || e.Code != code || e.Status != status {
		t.Fatalf("unexpected safe error: %v", err)
	}
}

// Redirect only in the TEST transport to a local httptest server. Production
// client exposes no endpoint override and always constructs the fixed URL.
func localClient(t *testing.T, h http.HandlerFunc) *Client {
	t.Helper()
	s := httptest.NewServer(h)
	t.Cleanup(s.Close)
	return NewClient(roundTripper(func(r *http.Request) (*http.Response, error) {
		if r.URL.String() != endpoint {
			t.Errorf("wrong endpoint")
		}
		clone := r.Clone(r.Context())
		u := *r.URL
		clone.URL = &u
		clone.URL.Scheme = "http"
		clone.URL.Host = strings.TrimPrefix(s.URL, "http://")
		return http.DefaultTransport.RoundTrip(clone)
	}))
}
func TestDraft(t *testing.T) {
	c := localClient(t, func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" || r.Header.Get("Authorization") != "Bearer "+fakeKey {
			t.Error("request metadata")
		}
		var p map[string]any
		if json.NewDecoder(r.Body).Decode(&p) != nil {
			t.Error("json")
		}
		if p["store"] != false || p["max_output_tokens"] != float64(512) || p["model"] != "test-model" {
			t.Error("payload options")
		}
		var input map[string]string
		if json.Unmarshal([]byte(p["input"].(string)), &input) != nil || input["selected_notes"] != "A machine enters." || input["context_mode"] != "single" {
			t.Error("input")
		}
		io.WriteString(w, `{"status":"completed","output":[{"type":"reasoning","content":[{"type":"output_text","text":"ignore"}]},{"type":"message","content":[{"type":"output_text","text":"Scene one"},{"type":"output_text","text":"Scene two"}]}],"usage":{"input_tokens":12,"output_tokens":20}}`)
	})
	got, err := c.Draft(context.Background(), fakeKey, validRequest())
	if err != nil || got.Text != "Scene one\nScene two" || got.Usage.InputTokens != 12 {
		t.Fatalf("unexpected result: %+v %v", got, err)
	}
}
func TestValidationDoesNotSend(t *testing.T) {
	c := NewClient(roundTripper(func(*http.Request) (*http.Response, error) { t.Fatal("must not send"); return nil, nil }))
	_, err := c.Draft(context.Background(), "bad\nkey", validRequest())
	expectError(t, err, "key", 401)
	for _, mutate := range []func(*Request){func(r *Request) { r.Notes = " " }, func(r *Request) { r.Notes = strings.Repeat("😀", 6001) }, func(r *Request) { r.Direction = strings.Repeat("x", 2001) }, func(r *Request) { r.Model = "bad/model" }, func(r *Request) { r.MaxOutputTokens = 4001 }} {
		r := validRequest()
		mutate(&r)
		_, err = c.Draft(context.Background(), fakeKey, r)
		expectError(t, err, "input", 400)
	}
	r := validRequest()
	r.Style = strings.Repeat("x", 24000)
	r.After = "x"
	_, err = c.Draft(context.Background(), fakeKey, r)
	expectError(t, err, "context", 400)
	r = validRequest()
	r.ContextMode = "unknown"
	_, err = c.Draft(context.Background(), fakeKey, r)
	expectError(t, err, "context", 400)
}
func TestSafeFailures(t *testing.T) {
	for _, tc := range []struct {
		name, body, code string
		status, want     int
	}{
		{"rate", fakeKey, "provider", 429, 429}, {"server", fakeKey, "provider", 500, 502}, {"redirect", fakeKey, "provider", 302, 502},
		{"invalid", fakeKey, "response_json", 200, 502}, {"empty", `{"output":[]}`, "empty", 200, 502}, {"oversize", strings.Repeat("x", maxResponseBytes+1), "response_size", 200, 502},
	} {
		t.Run(tc.name, func(t *testing.T) {
			count := 0
			c := localClient(t, func(w http.ResponseWriter, r *http.Request) {
				count++
				w.Header().Set("Location", "https://example.invalid/leak")
				w.WriteHeader(tc.status)
				io.WriteString(w, tc.body)
			})
			_, err := c.Draft(context.Background(), fakeKey, validRequest())
			expectError(t, err, tc.code, tc.want)
			if count != 1 || strings.Contains(err.Error(), fakeKey) {
				t.Error("retry or secret leak")
			}
		})
	}
}
func TestCancellation(t *testing.T) {
	c := NewClient(roundTripper(func(r *http.Request) (*http.Response, error) { <-r.Context().Done(); return nil, r.Context().Err() }))
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	_, err := c.Draft(ctx, fakeKey, validRequest())
	expectError(t, err, "cancelled", 499)
	ctx, cancel = context.WithTimeout(context.Background(), time.Millisecond)
	defer cancel()
	_, err = c.Draft(ctx, fakeKey, validRequest())
	expectError(t, err, "timeout", 504)
}
func TestIncomplete(t *testing.T) {
	c := localClient(t, func(w http.ResponseWriter, r *http.Request) {
		io.WriteString(w, `{"status":"incomplete","output":[{"type":"message","content":[{"type":"output_text","text":"Partial scene"}]}]}`)
	})
	result, err := c.Draft(context.Background(), fakeKey, validRequest())
	if err != nil || !result.Incomplete {
		t.Error("incomplete flag")
	}
}
