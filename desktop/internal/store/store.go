// Package store persists only allowlisted workspace/preferences data, never API keys.
package store

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"sync"
)

var allowed = map[string]bool{"shortlife.scriptdesk.v1": true, "shortlife.scriptdesk.v1.before-import": true, "shortlife.scriptdesk.v1.recovery": true, "shortlife.preferences.v1": true}

type Store struct {
	mu  sync.Mutex
	Dir string
}

func validate(data map[string]string) error {
	if len(data) > len(allowed) {
		return errors.New("invalid storage")
	}
	for k, v := range data {
		if !allowed[k] || len(v) > 16<<20 {
			return errors.New("invalid storage")
		}
	}
	return nil
}
func (s *Store) Load() (map[string]string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	b, e := os.ReadFile(filepath.Join(s.Dir, "workspace.json"))
	if os.IsNotExist(e) {
		return map[string]string{}, nil
	}
	if e != nil {
		return nil, errors.New("workspace read failed")
	}
	if len(b) > 48<<20 {
		return nil, errors.New("workspace too large")
	}
	var data map[string]string
	if json.Unmarshal(b, &data) != nil || validate(data) != nil || data == nil {
		return nil, errors.New("workspace damaged; preserve file and restore backup")
	}
	return data, nil
}
func (s *Store) Save(data map[string]string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if err := validate(data); err != nil {
		return err
	}
	b, err := json.Marshal(data)
	if err != nil {
		return errors.New("invalid storage")
	}
	if len(b) > 48<<20 {
		return errors.New("workspace too large")
	}
	if os.MkdirAll(s.Dir, 0700) != nil {
		return errors.New("workspace directory unavailable")
	}
	path := filepath.Join(s.Dir, "workspace.json")
	if old, e := os.ReadFile(path); e == nil {
		if e = atomic(filepath.Join(s.Dir, "workspace.previous.json"), old); e != nil {
			return errors.New("backup write failed")
		}
	}
	if atomic(path, b) != nil {
		return errors.New("workspace write failed")
	}
	return nil
}
func atomic(path string, b []byte) error {
	f, e := os.CreateTemp(filepath.Dir(path), ".scriptloom-*")
	if e != nil {
		return e
	}
	tmp := f.Name()
	defer os.Remove(tmp)
	if e = f.Chmod(0600); e != nil {
		f.Close()
		return e
	}
	if _, e = f.Write(b); e != nil {
		f.Close()
		return e
	}
	if e = f.Sync(); e != nil {
		f.Close()
		return e
	}
	if e = f.Close(); e != nil {
		return e
	}
	return replace(tmp, path)
}
