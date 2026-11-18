# Contributing / 贡献

Small focused improvements are welcome: editing reliability, accessibility, translations, import/export safety and tests.

1. Use Node.js 22+ and npm ci.
2. Run npm test, npm run typecheck and npm run build.
3. Launch npm run dev, then run /tests/browser.html in Chromium.
4. Check desktop and narrow-screen layouts for UI changes. Document untested browsers and real IME/hardware-key limitations.
5. Describe changed behavior and include only synthetic/public-domain samples in reproduction files.

Never commit real API keys, encrypted personal key-vault blobs, private scripts, notebook backups, account information, node_modules, build output or a real hosting manifest. Do not add automatic AI calls or new external data transmission without making the behavior explicit and opt-in. Keep storage compatibility when changing the UI.

请保持小而明确的改动，附测试结果。截图只使用合成或公版示例，不带真实草稿、账户信息或 Key。改动自动保存和导入导出时，应重点验证已有数据不会被覆盖。
