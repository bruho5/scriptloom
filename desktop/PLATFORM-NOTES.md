# Scriptloom desktop preview / 桌面预览版

Download the archive matching your operating system and CPU. Extract before opening. No Go/Node is needed at runtime. There is no installer, auto-update or cloud sync. These are experimental builds, not verified across all operating systems.
按系统和处理器选择包，解压后使用。运行无需 Go/Node。不含安装器、自动更新或云同步。实验构建，未完成跨系统实机验收。

## Windows x64
Open `Scriptloom.exe`. Requires Microsoft Edge WebView2 Runtime. Unsigned; Windows may warn about an unknown publisher.
双击 Scriptloom.exe；需要 WebView2，未签名，可能出现未知发布者提示。
https://developer.microsoft.com/microsoft-edge/webview2/

## macOS 13 Ventura or newer / macOS 13 及以上
- Apple Silicon: `macos-arm64`; Intel: `macos-x64`. Extract, then move `Scriptloom.app` to Applications if desired.
- Uses the system WKWebView. No Developer ID signature, notarization or sealed bundle. The arm64 Go executable has only a linker-generated ad-hoc signature; the Intel executable is unsigned.
- Gatekeeper may block launch. This is not a guaranteed double-click installer. Do not disable Gatekeeper; use a signed build if your policy requires one. We do not provide a bypass script.
- macOS 包包含正确 .app 目录和图标，但未经 Developer ID 签名、公证或完整 bundle 签名。系统可能阻止打开；不是承诺双击即开的正式安装包。不要关闭 Gatekeeper。
- Saved API keys use the login Keychain under bundle ID `io.github.bruho5.scriptloom`. Reading status or enabling a key may trigger a system permission prompt, especially after updating the executable/signature. The app does not bypass that prompt.

## Linux x64 (glibc desktop)
- Requires a graphical desktop session, GTK 3 and current WebKitGTK 4.1 (2.40+ recommended). Not a static binary and not for musl-only distributions such as a stock Alpine installation.
- Debian 12+/Ubuntu 22.04+ package names: `libwebkit2gtk-4.1-0` (pulls GTK dependencies), `libsecret-1-0`. Use your distribution's package manager. A running Secret Service (e.g. GNOME Keyring) and session D-Bus are needed to save keys.
- Extract the tar.gz, open its Scriptloom directory and run `./Scriptloom`. Executable permissions are included. If libraries/display are unavailable, launch from a terminal to read the startup error.
- Linux 需要 glibc 图形桌面、GTK3、WebKitGTK4.1；保存密钥另需 libsecret 和正在运行的 Secret Service。非静态包，不承诺适用于 Alpine。解压后运行 `./Scriptloom`；缺依赖可从终端查看错误。
- If the credential store is unavailable, temporary API keys still work; the app never falls back to plaintext secret storage.

## Data / 数据
- Windows: `%APPDATA%\Scriptloom\desktop-v1`
- macOS: `~/Library/Application Support/Scriptloom/desktop-v1`
- Linux: `$XDG_CONFIG_HOME/Scriptloom/desktop-v1`, or `~/.config/Scriptloom/desktop-v1` when unset.

Drafts/notes/preferences are plaintext `workspace.json`; `workspace.previous.json` is one prior write, not version history. Keep independent JSON exports. Exit before updating. Replacing the program folder does not erase these directories. Importing workspace JSON replaces the current workspace (with one pre-import backup). No automatic browser/desktop migration.
草稿和设置是明文；请独立导出备份。先退出再覆盖程序，勿删除数据目录。导入 JSON 会替换工作区，非自动合并。

AI requires your own OpenAI API key, model access and API billing. Saved keys must be explicitly enabled each session. Same-user apps may access credential stores on Windows/Linux. No keys are bundled. No paid/live model calls are made during automated tests.

## Test scope / 测试边界
All target binaries are compiled and inspected; archive permissions, plist/icon resources and CPU formats are checked. Go tests/race and frontend unit/mock tests run on Linux. Windows preview operation was reported by the maintainer; macOS and Linux graphical operation, credential dialogs, IME, native dialogs and live AI are not comprehensively tested. Cross-compilation alone is not evidence that every system will run the application.
