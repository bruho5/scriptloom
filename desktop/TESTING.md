# Validation

- Go 1.27.4; MyGo and mygo-runtime 0.10.0.
- `go test -race ./...`: native service mock tests, AI adapter and file store pass.
- `node --test tests/*.test.mjs`: 11/11 pass.
- Browser mock native bridge: original editor/save/import/export flows 7/7; credential-state regressions 8/8; status and settings layout visually checked.
- Credential tests cover saved-but-disabled restart, explicit enable, lock/remove, unavailable store versus absent key, stale cache, temporary key without persistence and field-specific messages. All credentials are synthetic.
- Windows x64 PE cross-build succeeded. Eight embedded ICO sizes (16,24,32,48,64,96,128,256) were extracted and pixel-compared with source assets. Window.SetIcon receives the PNG resource.
- The maintainer reported the preview and icon update working. Automated tests do not establish real Windows Credential Manager, dialog, WebView2, proxy, IME or live API behavior. These remain acceptance checks.
- No real API request or credential was used in automated checks.
