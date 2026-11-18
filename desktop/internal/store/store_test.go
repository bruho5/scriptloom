package store

import (
	"os"
	"path/filepath"
	"testing"
)

func TestRoundTripBackupAndRejectSecret(t *testing.T) {
	s := Store{Dir: t.TempDir()}
	m, e := s.Load()
	if e != nil || len(m) != 0 {
		t.Fatal(e)
	}
	k := "shortlife.scriptdesk.v1"
	if e = s.Save(map[string]string{k: "one"}); e != nil {
		t.Fatal(e)
	}
	if e = s.Save(map[string]string{k: "two"}); e != nil {
		t.Fatal(e)
	}
	m, e = s.Load()
	if e != nil || m[k] != "two" {
		t.Fatal(e, m)
	}
	b, e := os.ReadFile(filepath.Join(s.Dir, "workspace.previous.json"))
	if e != nil || string(b) != "{\"shortlife.scriptdesk.v1\":\"one\"}" {
		t.Fatal(e, string(b))
	}
	if s.Save(map[string]string{"api-key": "secret"}) == nil {
		t.Fatal("allowed secret")
	}
}
func TestCorruptionNotOverwrittenOnLoad(t *testing.T) {
	s := Store{Dir: t.TempDir()}
	p := filepath.Join(s.Dir, "workspace.json")
	os.WriteFile(p, []byte("broken"), 0600)
	if _, e := s.Load(); e == nil {
		t.Fatal("accepted corruption")
	}
	b, _ := os.ReadFile(p)
	if string(b) != "broken" {
		t.Fatal("overwrote file")
	}
}
