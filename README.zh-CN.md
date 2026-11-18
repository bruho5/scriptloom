# Scriptloom
### 把零散灵感，织成一场戏。

简体中文 · [English](README.md)

一个轻量的浏览器本地剧本工作台：彩色词库、浮动笔记，以及可选的 AI 样稿辅助。先创作，需要时再主动调用 AI。

## Windows 桌面预览版

[desktop/](desktop/README.zh-CN.md) 提供 MyGo 桌面版源码，与原网页版并存。桌面版使用本机文件、Windows 凭据管理器及 OpenAI 直连，详见[桌面版构建与使用说明](desktop/README.zh-CN.md)。

**直接使用：**[Windows x64 便携 ZIP](https://github.com/bruho5/scriptloom/releases/download/v0.2.0-preview.3/Scriptloom-0.2.0-preview.3-windows-x64.zip) · [单独 EXE](https://github.com/bruho5/scriptloom/releases/download/v0.2.0-preview.3/Scriptloom.exe) · [版本说明与依赖](https://github.com/bruho5/scriptloom/releases/tag/v0.2.0-preview.3) · [SHA256 校验](https://github.com/bruho5/scriptloom/releases/download/v0.2.0-preview.3/SHA256SUMS.txt)。解压便携包后双击 Scriptloom.exe，无需 Go 或 Node；需要 WebView2。当前为未签名预览版。

**Code → Download ZIP** 下载的是源码，不是桌面成品。下面的安装流程仍适用于网页版。

## 安装与使用

**环境要求：**Node.js 22+（[LTS 下载](https://nodejs.org/en/download)）及现代浏览器。Windows 可使用官方 Windows Installer（.msi）安装。

### 1. 下载
在[仓库首页](https://github.com/bruho5/scriptloom)选择 **Code → Download ZIP**。解压后，打开包含 **package.json、src、scripts** 的 **scriptloom-main** 文件夹。

### 2. 启动本地服务
在该文件夹打开终端。Windows 可在资源管理器地址栏输入 **cmd** 并回车，然后运行：

~~~sh
node scripts/serve.mjs
~~~

在浏览器打开 **http://127.0.0.1:4173/**。使用期间保持终端窗口开启，退出时按 **Ctrl + C** 停止服务；下次使用时重新运行同一命令。

本地服务仅使用 Node.js 内置模块，普通写作无需安装依赖或执行构建。请从解压后的文件夹运行，不要直接打开 index.html。

### 3. 创作与保存
- 编辑《哈姆雷特》示例，或在「导入 / 导出」中选择「备份并新建空白剧本」。
- 通过右侧笔记把手展开笔记本，记录草稿。
- 工作区自动保存在当前浏览器中；再次使用时保持同一浏览器和地址。
- 定期导出「完整工作区 .json」用于备份或迁移。浏览器存储不会跨设备同步，清理数据或结束无痕会话可能导致稿件丢失。

### AI 功能
本地服务仅提供编辑器页面，不包含 **/api/draft** 后端。自动生成样稿需要另外部署并配置经过认证的后端，输入 API Key 不会直接启用本地生成。「整理提示词 · 复制 / 导出」可在本地使用，不调用 API。后端要求见[部署说明](docs/DEPLOYMENT.md)。

<details>
<summary>常见问题</summary>

- **node 不是内部或外部命令：**安装 Node.js 后重新打开终端，可用 **node --version** 检查。
- **Cannot find module ...serve.mjs：**确认终端位于包含 package.json 和 scripts 的文件夹。
- **EADDRINUSE：**4173 端口已被占用。若编辑器已经启动，直接打开地址；否则先停止自己此前启动的服务，再重试。
- **网页打不开：**确认终端仍在运行，并使用完整的 http 地址。
- **换浏览器后工作区为空：**从原浏览器导出 JSON，再在新浏览器导入。

</details>

![Scriptloom 创作流程示意图，非截图](docs/images/workflow.svg)

## 能做什么
- **写与标记：**纯文本剧本、独立的彩色标记、自定义词组、撤销/重做。
- **把常用词放在手边：**每组十个词位。Caps Lock 开启后，在正文和笔记中用数字插词；Shift + 滚轮切组，可在设置中换为 Ctrl + 滚轮。
- **留住灵感：**覆盖在编辑区上方的抽拉笔记本，可拖动边缘把手调整高度，笔记有独立撤销/重做。
- **保存和带走：**浏览器本地自动保存，JSON 完整工作区备份/恢复，TXT 导入导出，彩色只读 HTML 导出。
- **可选 AI：**选中笔记，编辑上下文与要求，确认后使用自己的 OpenAI API Key 生成总结和样稿。结果仅预览，不自动改正文。
- **基础设置：**中英文界面，自定义模型列表及默认模型、输出上限，可选口令加密保存 Key。
- **首次示例：**《哈姆雷特》第一幕第一场开头的公版英文节选，附人物和舞台标记。已有工作区不会被新示例覆盖。

这是早期原型，不是多人协作编辑器、专业密码管理器或自动全剧本概括工具；不含云端文档同步，也不是通用模型提供商客户端。

## 开发者安装与检查
使用 Node.js 22 或更新版本以及 npm：

~~~sh
npm ci
npm run dev
~~~

打开 **http://127.0.0.1:4173/**。编辑、笔记、设置、导入导出与本地提示词整理可以使用。**本地预览是静态服务，没有接通 AI 后端。**普通写作和测试不需要 API Key。

~~~sh
npm test
npm run typecheck
npm run build
~~~

浏览器检查：保持开发服务器运行，打开 **http://127.0.0.1:4173/tests/browser.html**，点 “Run browser checks”。使用隔离的模拟存储和模拟 API，不会发付费请求。

## AI 怎么用
1. 展开笔记，选中要处理的文字。
2. 点击「选中笔记 → AI 样稿」。
3. 检查笔记，编辑剧本上下文，也可选择「上文 / 下文分开」。
4. 选择自己 API 账户可用的模型、输出上限，补充创作方向。
5. 输入临时 Key，或解锁之前选择加密保存的 Key；确认发送内容与 API 计费。
6. 发送并审阅结果，复制或下载；关闭窗口会清除本次预览。

所选笔记上限 12,000 字符，上下文合计 24,000，额外要求 2,000；默认仅取正文前 24,000 字符，不一定是全剧本。输出上限为 256–4,000 tokens。字符数按 JavaScript 字符串长度计算。没有自动章节概括或隐藏的二次调用。费用由 Key 对应的账户承担，取消等待不会退回已产生费用。

## 部署与隐私
见 [部署说明](docs/DEPLOYMENT.md) 和 [安全说明](SECURITY.md)。

当前 AI Worker 依赖 **Sites 的可信认证网关**。不能直接暴露在任意服务器上并把客户端可伪造的身份请求头当登录认证。GitHub Pages 可以放编辑器静态文件，但不能运行这个 Worker API。

现有作者站点仍为私人站点，本仓库不提供其地址或登录方式。草稿和笔记仅自动保存于本浏览器，但普通草稿存储**没有加密**，请定期导出 JSON。

主动请求 AI 时，选中笔记、编辑过的上下文、要求及 API 凭据会经过站点后端发往 OpenAI。请求设置 store:false，不等于承诺平台或提供商零留存。不要把真实 Key、私人草稿或含账户信息的截图提交到仓库。

## 测试状态
发布准备版通过 21 项单元测试和 TypeScript 检查；最新应用版本通过 32 项 Chromium 浏览器检查，包括新用户示例和旧工作区兼容。桌面及 390px 布局已视觉检查。Windows 实体 Caps/输入法及真实 iOS/Safari 仍需手测。

## 贡献与许可
[MIT 许可证](LICENSE)，版权署名 bruho5。参见 [贡献说明](CONTRIBUTING.md) 和 [第三方来源](THIRD_PARTY_NOTICES.md)。

