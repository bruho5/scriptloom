# Scriptloom Desktop

简体中文 · [English](README.md)

使用 MyGo 构建的 Windows x64 桌面预览版，复用剧本编辑器、词库、浮动笔记和 AI 样稿流程。仓库根目录的网页版保持独立。

## 下载与运行

下载 [Windows x64 便携 ZIP](https://github.com/bruho5/scriptloom/releases/download/v0.2.0-preview.3/Scriptloom-0.2.0-preview.3-windows-x64.zip)，解压后双击 **Scriptloom.exe**，无需 Go、Node 或命令行。另提供[单独 EXE](https://github.com/bruho5/scriptloom/releases/download/v0.2.0-preview.3/Scriptloom.exe)、[校验和](https://github.com/bruho5/scriptloom/releases/download/v0.2.0-preview.3/SHA256SUMS.txt)及[版本说明](https://github.com/bruho5/scriptloom/releases/tag/v0.2.0-preview.3)。当前为未签名预览版，需要微软 [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/)。更新前先退出旧版，再替换程序文件；草稿和凭据保存在其他位置，不会被覆盖。

GitHub 自动生成的 **Source code** 和 **Code → Download ZIP** 下载的是源码，不是可运行成品。

## 从源码构建

在仓库选择 **Code → Download ZIP**，解压后进入 `desktop` 文件夹并打开终端。

需要 [Go 1.27.4+](https://go.dev/dl/)、[Node.js 22+](https://nodejs.org/en/download) 和 npm。Windows 运行时需要 [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/)，缺失时从微软官方安装。

在 Windows 中依次运行：

```powershell
npm ci
npm run build:web
go test ./...
node --test tests/key-state.test.mjs tests/storage.test.mjs
go run github.com/tc-hib/go-winres@v0.3.3 make --arch amd64
go build -buildvcs=false -trimpath -ldflags="-s -w -H windowsgui" -o out/Scriptloom.exe .
```

也可在允许本地脚本执行的 PowerShell 中运行 `BUILD.ps1`；无需为此修改系统安全策略，直接执行上面的命令即可。其他系统交叉构建时，仅为最后的构建命令设置 `GOOS=windows GOARCH=amd64 CGO_ENABLED=0`。交叉编译不等于运行验证。

完成后打开 `out/Scriptloom.exe`。程序内嵌界面、不启动 localhost 服务，运行时无需 Go 或 Node。程序尚未签名，Windows 可能显示未知发布者提示。EXE 和窗口使用多尺寸 S 图标。

## 使用

- 首次打开提供公版英文《哈姆雷特》片段。
- 网页草稿不会自动迁移。先在网页导出工作区 JSON，再在桌面版导入。导入会替换当前工作区，并保留一次导入前备份；建议另行导出原稿。
- 在设置中保存基础选项。AI 窗口支持临时输入 API Key；只有明确点击保存后，才会把 Key 写入 Windows 凭据管理器。
- 保存的 Key 每次启动后仍需在设置或 AI 窗口**启用**。启用不会自动发请求，已保存密钥不会返回前端 JavaScript。
- 选中笔记，打开 AI 样稿，检查上下文、模型、输出上限和计费确认，再发送。结果只作预览，不自动改正文。

## 数据与安全

草稿、笔记和设置以明文存于 `%APPDATA%\Scriptloom\desktop-v1\workspace.json`；`workspace.previous.json` 保留上一次写入，并非长期历史。原生层先写临时文件、落盘并替换，成功后界面才显示已保存；正常关闭会等待保存。断电、强制结束或系统关机仍可能丢失尚未提交的输入，请定期独立导出 JSON。

凭据服务名为 `Scriptloom`，凭据项为 `openai-api-key`。停用只撤销当前进程的内存使用权限；移除删除此应用保存的凭据，不撤销 OpenAI 端 Key。同一 Windows 用户运行的其他程序仍可能访问凭据库。凭据库失败时不降级为明文保存，临时 Key 不持久化。

AI 从 Go 直接请求 `https://api.openai.com/v1/responses`，无需 Sites 网关。需要网络、有效 Key、模型权限及 API 余额；环境代理变量优先于系统代理。请求有 90 秒超时及输入/响应上限，不自动重试，不跟随重定向。`store:false` 不等于零留存；取消不能撤销已产生费用。测试仅使用假 Key 和模拟响应，不发真实 API 请求。

退出后覆盖程序文件不会删除数据目录或凭据。更新时不要删除数据目录。网页与桌面版之间没有自动同步。

## 验证与限制

详见 [TESTING.md](TESTING.md)。已检查 Windows x64 交叉构建、图标资源提取、Go 测试/race、前端单元测试及浏览器 mock 流程。维护者反馈预览版及图标更新可用，但不等于完整 Windows 验收。真实凭据库、原生对话框、系统代理、输入法、实体快捷键和真实 API 行为仍需进一步验证。不含安装器、签名、自动更新或云同步。

## 目录与许可

- `main.go`：MyGo 绑定、窗口、凭据和原生导出。
- `internal/store`：本机原子保存与备份。
- `internal/ai`：OpenAI Responses 适配。
- `web`：桌面适配界面；根目录 `src` 不变。
- `assets`、`winres`：矢量源、多尺寸图标及资源配置。
- `licenses`：依赖许可。应用采用 [MIT](LICENSE)，署名 bruho5。S 字形由 Noto Serif 转为轮廓，附字体许可，不要求用户安装字体。
