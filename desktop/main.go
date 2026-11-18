package main

import (
	"context"
	"embed"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/egoist/mygo"
	"github.com/egoist/mygo/netproxy"
	"scriptloom-desktop/internal/ai"
	"scriptloom-desktop/internal/store"
)

//go:embed all:web
var assets embed.FS

//go:embed assets/scriptloom.png
var windowIcon []byte

type credentialStore interface {
	Get(string) ([]byte, error)
	Set(string, []byte) error
	Delete(string) error
}

type Desktop struct {
	secrets credentialStore
	storage *store.Store
	client  *ai.Client
	mu      sync.Mutex
	key     string
}

func (d *Desktop) LoadStorage() (map[string]string, error)  { return d.storage.Load() }
func (d *Desktop) SaveStorage(data map[string]string) error { return d.storage.Save(data) }
func (d *Desktop) KeyStatus() (map[string]bool, error) {
	d.mu.Lock()
	defer d.mu.Unlock()
	_, err := d.secrets.Get("openai-api-key")
	if err != nil && !errors.Is(err, mygo.ErrSecretNotFound) {
		return nil, errors.New("credential store unavailable")
	}
	return map[string]bool{"saved": err == nil, "unlocked": d.key != ""}, nil
}
func (d *Desktop) SaveKey(key string) error {
	if !ai.ValidKey(key) {
		return errors.New("invalid key")
	}
	d.mu.Lock()
	defer d.mu.Unlock()
	if d.secrets.Set("openai-api-key", []byte(key)) != nil {
		return errors.New("credential store unavailable")
	}
	d.key = key
	return nil
}
func (d *Desktop) UnlockKey() error {
	d.mu.Lock()
	defer d.mu.Unlock()
	d.key = ""
	key, err := d.secrets.Get("openai-api-key")
	if err != nil {
		return errors.New("credential unavailable")
	}
	if !ai.ValidKey(string(key)) {
		return errors.New("invalid credential")
	}
	d.key = string(key)
	return nil
}
func (d *Desktop) LockKey() { d.mu.Lock(); defer d.mu.Unlock(); d.key = "" }
func (d *Desktop) ForgetKey() error {
	d.mu.Lock()
	defer d.mu.Unlock()
	d.key = ""
	err := d.secrets.Delete("openai-api-key")
	if err != nil && !errors.Is(err, mygo.ErrSecretNotFound) {
		return errors.New("credential removal failed")
	}
	d.key = ""
	return nil
}
func (d *Desktop) Draft(ctx context.Context, temporaryKey string, req ai.Request) (ai.Result, error) {
	key := temporaryKey
	if key == "" {
		d.mu.Lock()
		key = d.key
		d.mu.Unlock()
	}
	result, err := d.client.Draft(ctx, key, req)
	if err != nil {
		var ae *ai.Error
		if errors.As(err, &ae) {
			return result, errors.New(strconv.Itoa(ae.Status))
		}
		return result, errors.New("request failed")
	}
	return result, nil
}
func (d *Desktop) Export(ctx context.Context, name, text string) (string, error) {
	if len(text) > 32<<20 {
		return "", errors.New("export too large")
	}
	name = filepath.Base(strings.ReplaceAll(name, "\\", "/"))
	path, err := mygo.Dialog.Save(mygo.SaveDialogOptions{Parent: mygo.CallerWindow(ctx), DefaultPath: name})
	if err != nil {
		return "", errors.New("save dialog failed")
	}
	if path == "" {
		return "", nil
	}
	if os.WriteFile(path, []byte(text), 0600) != nil {
		return "", errors.New("export failed")
	}
	return path, nil
}
func main() {
	mygo.App.SetName("Scriptloom")
	if !mygo.App.RequestSingleInstanceLock() {
		return
	}
	path, err := mygo.App.Path(mygo.PathUserData)
	if err != nil {
		fmt.Fprintln(os.Stderr, "Scriptloom: cannot open local application data directory")
		os.Exit(1)
	}
	desktop := &Desktop{secrets: mygo.Secrets, storage: &store.Store{Dir: filepath.Join(path, "desktop-v1")}, client: ai.NewClient(netproxy.Transport())}
	mygo.Bind(desktop)
	web, _ := fs.Sub(assets, "web")
	mygo.SetFrontend(web)
	var win *mygo.Window
	mygo.App.OnSecondInstance(func(_ []string, _ string) {
		if win != nil {
			win.Restore()
			win.Focus()
		}
	})
	mygo.App.WhenReady(func() {
		win = mygo.NewWindow(mygo.WindowOptions{Title: "Scriptloom", URL: "/", Width: 1280, Height: 900})
		_ = win.SetIcon(windowIcon)
		win.Page().SetWindowOpenHandler(func(mygo.WindowOpenRequest) *mygo.WindowOptions { return nil })
		win.Page().OnWillNavigate(func(e *mygo.NavigateEvent) { e.PreventDefault() })
		var closing atomic.Bool
		var ready atomic.Bool
		win.OnClose(func(e *mygo.CloseEvent) {
			if ready.Load() {
				return
			}
			e.PreventDefault()
			if closing.Swap(true) {
				return
			}
			go func() {
				defer closing.Store(false)
				ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
				defer cancel()
				ok, err := win.Page().EvalContext(ctx, "window.scriptloomFlush ? window.scriptloomFlush() : false")
				if err == nil && ok == true {
					ready.Store(true)
					desktop.LockKey()
					win.Close()
				} else {
					mygo.Dialog.Message(mygo.MessageOptions{Parent: win, Type: mygo.MessageWarning, Message: "草稿尚未成功保存 / Draft not saved", Detail: "请保持窗口打开，导出备份或重试保存。 / Keep the window open and export a backup or retry."})
				}
			}()
		})
	})
	if err := mygo.App.Run(); err != nil {
		fmt.Fprintln(os.Stderr, "Scriptloom startup failed:", err)
		os.Exit(1)
	}
}
