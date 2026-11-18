# Scriptloom
### Weave scattered notes into a scene.

[简体中文](README.zh-CN.md) · English

A small, browser-local script desk with colored word banks, a floating notebook, and optional AI-assisted sample scenes. Write first; use AI only when you explicitly ask.

## Desktop previews

A MyGo desktop version is available as source in [desktop/](desktop/README.md), alongside the unchanged browser app. It uses native local files, Windows Credential Manager and a direct OpenAI API connection. See [desktop build and usage instructions](desktop/README.md).

**Ready to run:** [Windows x64 portable ZIP](https://github.com/bruho5/scriptloom/releases/download/v0.2.0-preview.4/Scriptloom-0.2.0-preview.4-windows-x64.zip) · [EXE](https://github.com/bruho5/scriptloom/releases/download/v0.2.0-preview.4/Scriptloom.exe) · [release notes and requirements](https://github.com/bruho5/scriptloom/releases/tag/v0.2.0-preview.4) · [SHA256](https://github.com/bruho5/scriptloom/releases/download/v0.2.0-preview.4/SHA256SUMS.txt). Extract the portable ZIP and open Scriptloom.exe; no Go or Node is needed. WebView2 is required. This is an unsigned preview.

**Code → Download ZIP** downloads source, not the desktop executable. The instructions below describe the browser version.


**Other experimental builds:** [macOS Apple Silicon (13+)](https://github.com/bruho5/scriptloom/releases/download/v0.2.0-preview.4/Scriptloom-0.2.0-preview.4-macos-arm64.zip) · [macOS Intel (13+)](https://github.com/bruho5/scriptloom/releases/download/v0.2.0-preview.4/Scriptloom-0.2.0-preview.4-macos-x64.zip) · [Linux x64](https://github.com/bruho5/scriptloom/releases/download/v0.2.0-preview.4/Scriptloom-0.2.0-preview.4-linux-x64.tar.gz).

macOS bundles have no Developer ID signature or notarization and may be blocked by Gatekeeper. Linux requires a glibc graphical desktop, GTK3 and WebKitGTK4.1; persistent keys need Secret Service. These builds passed compilation/package checks, **not native GUI acceptance tests**. Read [platform notes](https://github.com/bruho5/scriptloom/releases/download/v0.2.0-preview.4/PLATFORM-NOTES.md) before downloading.

## Installation and usage

**Requirements:** Node.js 22+ ([LTS download](https://nodejs.org/en/download)) and a modern browser. On Windows, use the official Windows Installer (.msi).

### 1. Download
On the [repository page](https://github.com/bruho5/scriptloom), select **Code → Download ZIP**. Extract the archive and open the **scriptloom-main** folder containing **package.json**, **src**, and **scripts**.

### 2. Start the local server
Open a terminal in that folder. On Windows, enter **cmd** in File Explorer's address bar and press Enter, then run:

~~~sh
node scripts/serve.mjs
~~~

Open **http://127.0.0.1:4173/** in your browser. Keep the terminal open while using the editor; press **Ctrl + C** to stop it. To return later, run the same command again.

The preview server uses Node.js built-in modules. No dependency installation or build step is required for local writing. Run from the extracted folder rather than opening index.html directly.

### 3. Write and save
- Edit the Hamlet sample, or choose **Import / Export → Back up & start a blank draft**.
- Open the right-edge notebook to collect notes.
- Work autosaves in the current browser. Use the same browser and address when returning.
- Export **Full workspace .json** regularly to back up or transfer a draft. Browser storage does not sync across devices; clearing it or closing a private browsing session can remove work.

### AI availability
The local server serves the editor only; it does not provide **/api/draft**. Automatic AI generation requires a separately deployed, authenticated backend, even if an API key is entered. **Prepare text · Copy / export** works locally without an API call. See [deployment notes](docs/DEPLOYMENT.md) for backend requirements.

<details>
<summary>Troubleshooting</summary>

- **node is not recognized:** install Node.js and reopen the terminal. Check with **node --version**.
- **Cannot find module ...serve.mjs:** run from the folder containing package.json and scripts.
- **EADDRINUSE:** port 4173 is occupied. If the editor is already running, open its address; otherwise stop the server you previously started before retrying.
- **Page unavailable:** confirm the terminal is still running and use the complete http address.
- **Workspace missing in another browser:** export JSON from the original browser and import it into the new one.

</details>

![Scriptloom workflow diagram, not a screenshot](docs/images/workflow.svg)

## What it does
- **Write and annotate:** plain-text script editing, independent colored annotations, customizable word groups, undo/redo.
- **Keep words close:** ten slots per group, with Caps Lock + digits in the script and notebook. Shift + wheel changes groups; Settings can change that modifier to Ctrl.
- **Catch a thought:** a sliding notebook above the editor, with a draggable vertical handle and independent undo/redo.
- **Keep your work:** browser-local autosave; JSON workspace backup/restore; TXT import/export; colored reading-only HTML export.
- **Optional AI:** select notes, edit the context and instructions, review the transmission, then request a summary and sample scene using your own OpenAI API key. Results are previews, never automatic replacements.
- **Preferences:** Chinese/English interface, editable model list/default, output limit, and optional passphrase-encrypted local key storage.
- **First-run sample:** a public-domain English opening excerpt from *Hamlet*, with character and stage annotations. Existing saved workspaces are preserved.

This is an early prototype, not a collaborative editor, production credential manager, or automatic full-script summarizer. No cloud document sync or universal AI-provider integration is included.

## Developer setup and checks
Use Node.js 22 or newer and npm:

~~~sh
npm ci
npm run dev
~~~

Open **http://127.0.0.1:4173/**. Editing, notebook, settings, import/export and prompt preparation work locally. **The local preview is static: AI generation is not wired to a local backend.** You do not need an API key for ordinary writing or tests.

~~~sh
npm test
npm run typecheck
npm run build
~~~

Browser integration checks: open **http://127.0.0.1:4173/tests/browser.html** while the dev server runs, then click “Run browser checks.” These use isolated fake storage and mocked API responses.

## AI workflow
1. Open the notebook and select the text to process.
2. Click **Selected notes → AI draft**.
3. Review the selected notes; edit the default script context, or switch to separate previous/following context.
4. Choose a model available to your API account, an output limit, and optional writing directions.
5. Supply a temporary key, or unlock your optional locally encrypted key. Confirm the data transmission and API billing.
6. Send; review, copy or download the preview. Closing the dialog clears its preview.

Notes are limited to 12,000 characters; context totals 24,000; additional direction 2,000. The default context is only the first 24,000 script characters, not necessarily the whole script. Output limit: 256–4,000 tokens. Limits use JavaScript string length. There is no automatic chapter summary or hidden second model call. API charges belong to the supplied key's account; cancelling does not refund prior work.

## Deployment
See [deployment notes](docs/DEPLOYMENT.md). The bundled AI endpoint targets a **trusted Sites authentication gateway**. It is **not safe to expose unchanged behind arbitrary hosting**: a client-supplied identity header is not authentication. GitHub Pages can host the editor assets, but cannot run this Worker endpoint.

No live demo link is included: the author's existing deployment remains private.

## Privacy and security
Drafts, notes and preferences are stored in this browser, not in a workspace database. Plain draft storage is **not encrypted**. Export regular JSON backups.

Only explicit AI generation sends selected notes, edited context, directions and your API credential through the hosting backend to OpenAI. The request sets store:false, but this does **not** guarantee zero provider/platform retention. See [security notes](SECURITY.md) before using key storage or deploying.

## Project map
| Path | Purpose |
| --- | --- |
| src/ | Framework-free browser app |
| server/api.mjs | OpenAI Responses API forwarding handler |
| scripts/ | Local static preview and Worker asset bundling |
| tests/ | Unit tests and manual-launch browser harness |
| docs/ | Deployment and design diagram |

## Verification
The preparation build passes 21 unit tests and TypeScript checking. The latest app revision passed 32 Chromium browser checks, including new Hamlet defaults and existing-workspace preservation. Desktop and 390px responsive settings layouts were visually checked. Windows hardware Caps/IME behavior and real iOS/Safari remain manual checks. Tests do not make paid model calls.

## Contributing and license
[MIT](LICENSE), copyright bruho5. See [CONTRIBUTING.md](CONTRIBUTING.md) and [third-party notices](THIRD_PARTY_NOTICES.md).

