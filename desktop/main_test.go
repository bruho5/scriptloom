package main

import (
	"context"
	"errors"
	"github.com/egoist/mygo"
	"io"
	"net/http"
	"scriptloom-desktop/internal/ai"
	"strings"
	"testing"
)

type fakeSecrets struct {
	value []byte
	fail  bool
}

func (s *fakeSecrets) Get(string) ([]byte, error) {
	if s.fail {
		return nil, errors.New("OS private error")
	}
	if s.value == nil {
		return nil, mygo.ErrSecretNotFound
	}
	return append([]byte{}, s.value...), nil
}
func (s *fakeSecrets) Set(_ string, v []byte) error {
	if s.fail {
		return errors.New("OS private error")
	}
	s.value = append([]byte{}, v...)
	return nil
}
func (s *fakeSecrets) Delete(string) error {
	if s.fail {
		return errors.New("OS private error")
	}
	s.value = nil
	return nil
}
func TestKeyRestartExplicitEnable(t *testing.T) {
	s := &fakeSecrets{}
	d := &Desktop{secrets: s}
	status, e := d.KeyStatus()
	if e != nil || status["saved"] || status["unlocked"] {
		t.Fatal(status, e)
	}
	if e = d.SaveKey("sk-fake-unit-test-never-real"); e != nil {
		t.Fatal(e)
	}
	status, _ = d.KeyStatus()
	if !status["saved"] || !status["unlocked"] {
		t.Fatal(status)
	}
	restarted := &Desktop{secrets: s, client: ai.NewClient(nil)}
	status, _ = restarted.KeyStatus()
	if !status["saved"] || status["unlocked"] {
		t.Fatal("restart must not auto-enable", status)
	}
	if _, e = restarted.Draft(context.Background(), "", ai.Request{}); e == nil || e.Error() != "401" {
		t.Fatal("must fail before network", e)
	}
	if e = restarted.UnlockKey(); e != nil {
		t.Fatal(e)
	}
	status, _ = restarted.KeyStatus()
	if !status["unlocked"] {
		t.Fatal(status)
	}
	restarted.LockKey()
	status, _ = restarted.KeyStatus()
	if status["unlocked"] || !status["saved"] {
		t.Fatal(status)
	}
	if e = restarted.ForgetKey(); e != nil {
		t.Fatal(e)
	}
	status, _ = restarted.KeyStatus()
	if status["unlocked"] || status["saved"] {
		t.Fatal(status)
	}
}
func TestCredentialStoreFailureIsNotMissing(t *testing.T) {
	s := &fakeSecrets{fail: true}
	d := &Desktop{secrets: s}
	status, e := d.KeyStatus()
	if e == nil || status != nil || strings.Contains(e.Error(), "private") {
		t.Fatal(status, e)
	}
	if d.SaveKey("sk-fake-unit-test-never-real") == nil || d.key != "" {
		t.Fatal("failed save enabled key")
	}
	d.key = "sk-fake-unit-test-never-real"
	if d.UnlockKey() == nil || d.key != "" {
		t.Fatal("stale key after failed unlock")
	}
	d.key = "sk-fake-unit-test-never-real"
	if d.ForgetKey() == nil || d.key != "" {
		t.Fatal("stale key after failed remove")
	}
}

type fakeTransport func(*http.Request) (*http.Response, error)

func (f fakeTransport) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }
func TestTemporaryKeyNeverPersists(t *testing.T) {
	s := &fakeSecrets{}
	calls := 0
	d := &Desktop{secrets: s, client: ai.NewClient(fakeTransport(func(r *http.Request) (*http.Response, error) {
		calls++
		if r.Header.Get("Authorization") != "Bearer sk-fake-temporary-never-real" {
			t.Fatal("wrong temporary credential")
		}
		return &http.Response{StatusCode: 200, Body: io.NopCloser(strings.NewReader(`{"status":"completed","output":[{"type":"message","content":[{"type":"output_text","text":"Mock scene"}]}]}`)), Header: http.Header{}}, nil
	}))}
	result, e := d.Draft(context.Background(), "sk-fake-temporary-never-real", ai.Request{Notes: "Fake note", Model: "mock-model", MaxOutputTokens: 256})
	if e != nil || result.Text != "Mock scene" || calls != 1 {
		t.Fatal(result, e, calls)
	}
	if d.key != "" || s.value != nil {
		t.Fatal("temporary credential persisted")
	}
}
