# Scriptloom Desktop

[简体中文](README.zh-CN.md) · English

A desktop preview built with MyGo for Windows x64, Linux x64 and macOS Apple Silicon/Intel. It reuses Scriptloom's editor, word banks, floating notebook and AI draft workflow. The browser app at the repository root remains independent.

## Download and run

Download the [Windows x64 portable ZIP](https://github.com/bruho5/scriptloom/releases/download/v0.2.0-preview.4/Scriptloom-0.2.0-preview.4-windows-x64.zip), extract it and open **Scriptloom.exe**. No Go, Node or terminal is needed at runtime. A [standalone EXE](https://github.com/bruho5/scriptloom/releases/download/v0.2.0-preview.4/Scriptloom.exe), [checksums](https://github.com/bruho5/scriptloom/releases/download/v0.2.0-preview.4/SHA256SUMS.txt) and [release notes](https://github.com/bruho5/scriptloom/releases/tag/v0.2.0-preview.4) are also available. This unsigned preview requires Microsoft's [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/). Exit the previous version before replacing program files; workspace data and saved credentials remain separate.

GitHub's **Source code** archives and **Code → Download ZIP** contain source, not the runnable app.


**Other experimental builds:** [macOS Apple Silicon (13+)](https://github.com/bruho5/scriptloom/releases/download/v0.2.0-preview.4/Scriptloom-0.2.0-preview.4-macos-arm64.zip) · [macOS Intel (13+)](https://github.com/bruho5/scriptloom/releases/download/v0.2.0-preview.4/Scriptloom-0.2.0-preview.4-macos-x64.zip) · [Linux x64](https://github.com/bruho5/scriptloom/releases/download/v0.2.0-preview.4/Scriptloom-0.2.0-preview.4-linux-x64.tar.gz).

macOS bundles have no Developer ID signature or notarization and may be blocked by Gatekeeper. Linux requires a glibc graphical desktop, GTK3 and WebKitGTK4.1; persistent keys need Secret Service. These builds passed compilation/package checks, **not native GUI acceptance tests**. Read [platform notes](https://github.com/bruho5/scriptloom/releases/download/v0.2.0-preview.4/PLATFORM-NOTES.md) before downloading.

## Other platforms and packaging

See [platform requirements and safety notes](PLATFORM-NOTES.md). macOS requires version 13+; unsigned/unnotarized bundles may be blocked by Gatekeeper. Linux requires glibc, a graphical session, GTK3 and WebKitGTK4.1; persistent keys additionally require libsecret and a Secret Service. Temporary keys remain available when the credential store fails.

After `npm ci`, `python3 scripts/package.py` builds all four targets into `out/packages/`, with executable permissions, app metadata/icons and SHA256SUMS. It does not sign, notarize or upload. Requires Python 3; set `SCRIPTLOOM_GO` only when Go is not named `go`.

## Build from source

Download the repository with **Code → Download ZIP**, extract it, and open a terminal in the `desktop` directory.

Requirements: [Go 1.27.4+](https://go.dev/dl/), [Node.js 22+](https://nodejs.org/en/download) and npm. For Windows execution, install Microsoft's [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/) if it is not already available.

On Windows, run:

```powershell
npm ci
npm run build:web
go test ./...
node --test tests/key-state.test.mjs tests/storage.test.mjs
go run github.com/tc-hib/go-winres@v0.3.3 make --arch amd64
go build -tags mygo_noinspector -buildvcs=false -trimpath -ldflags="-s -w -H windowsgui -X github.com/egoist/mygo.production=1" -o out/Scriptloom.exe .
```

Alternatively, run `BUILD.ps1` from PowerShell where local script execution is permitted. Do not change system security policy just to run it; the individual commands above are equivalent. On non-Windows hosts, set `GOOS=windows GOARCH=amd64 CGO_ENABLED=0` for the final build. Cross-compilation is not runtime validation.

Open `out/Scriptloom.exe`. The built executable embeds its frontend, starts no localhost server and needs neither Go nor Node at runtime. It is unsigned, so Windows may show an unknown publisher warning. A multi-resolution S icon is embedded in the EXE and set for the window.

## Use

- The first workspace contains a public-domain English *Hamlet* excerpt.
- Browser drafts are not read automatically. Export a workspace JSON in the browser and import it in the desktop app. Import replaces the current workspace and retains one pre-import backup; make a separate export first.
- Save AI settings in Settings. A temporary API key can be entered in the AI dialog. Optional persistent keys go to Windows Credential Manager only after an explicit save action.
- Saved keys must be **enabled each session**, in Settings or the AI dialog. Enabling does not send a request. Saved secret values are not returned to frontend JavaScript.
- Select notebook text, open AI draft, review the context/model/token limit and billing consent, then send. Results are previews and never replace the script automatically.

## Storage and security

Drafts, notes and preferences are plaintext local data in `%APPDATA%\Scriptloom\desktop-v1\workspace.json`. `workspace.previous.json` keeps the immediately preceding write, not a long-term history. Writes use a temporary file, flush and replacement; the UI only reports saved after the native write succeeds. Normal close waits for a save. Power loss, forced termination or OS shutdown can still lose uncommitted input. Export independent JSON backups regularly.

The credential service remains `Scriptloom`, account `openai-api-key`. Locking disables its in-memory use; removing deletes the app's saved credential but does not revoke it at OpenAI. Other applications running as the same Windows user may access the credential store. No plaintext fallback is used when the credential store fails. Temporary keys are not saved.

AI requests go directly from Go to `https://api.openai.com/v1/responses`; no Sites authentication gateway is needed. Network access, a valid key, model permission and API credit are required. Environment proxy variables take precedence over the system proxy. Requests have a 90-second timeout, bounded inputs/outputs, no automatic retries and no redirects. `store:false` is not a zero-retention guarantee. Canceling does not refund work already performed. Tests use fake keys and mocked responses, never real API calls.

Replacing the application files after exiting does not delete the data directory or saved credentials. Do not delete the data directory while updating. Browser and desktop workspaces are not synchronized.

## Verification and limitations

See [TESTING.md](TESTING.md). Windows x64 cross-build, extracted icon resources, Go tests/race checks, frontend unit tests and browser mock flows were checked. The maintainer reported that the preview and icon update worked; this is not comprehensive Windows acceptance testing. Real Credential Manager, native dialogs, system proxy, IME, hardware shortcuts and live API behavior still need validation. There is no installer, signing, auto-update or cloud sync.

## Structure and licensing

- `main.go`: MyGo bindings, window lifecycle, credentials and native export.
- `internal/store`: atomic workspace persistence and backup.
- `internal/ai`: bounded OpenAI Responses adapter.
- `web`: desktop-adapted frontend; root `src` is left unchanged.
- `assets`, `winres`: vector source, multi-size icon assets and resource build configuration.
- `licenses`: dependency notices. Application code is [MIT](LICENSE), copyright bruho5. The S glyph is outlined from Noto Serif under the included font license; it preserves the existing brand design without requiring a font installation.

