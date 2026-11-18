# Security and privacy / 安全与隐私

## Data boundaries
- Drafts, notebook text, word groups and preferences live in browser localStorage. They are not encrypted; same-origin scripts and anyone with access to the browser profile may read them.
- Workspace JSON exports include the script, annotations, word banks and notebook. Share them only deliberately. Reading-only HTML does not include notebook text or executable scripts.
- No analytics, tracking SDK or remote font is bundled. Local prompt preparation makes no model request.
- Explicit AI generation sends selected notes, visible edited context, direction, model and output budget to the same-origin API, then OpenAI. The user's API key is carried in the Authorization header. The host processes that credential; this is not browser-to-provider end-to-end encryption.
- The application does not intentionally log request bodies or keys. Hosting infrastructure may collect metadata. No zero-retention or regulatory-compliance guarantee is made.
- Responses request store:false. Provider/platform handling and retention remain subject to their policies.

## Optional key vault
AES-GCM encrypts the key using a random salt and IV, with a PBKDF2-SHA256-derived key (310,000 iterations) and a user-selected passphrase of at least 12 characters. Only ciphertext is persisted. The passphrase is not saved; an unlocked key stays in tab memory until lock or pagehide.

This is NOT a password manager. It does not protect against malicious same-origin code, browser extensions, an already-compromised device, weak passphrases or an unlocked tab. Clearing site data loses the saved key; forgetting the passphrase requires entering the original key again. “Remove local key” does not revoke the key at OpenAI. The temporary-key field is cleared on send/close; an unlocked saved key remains available until explicitly locked.

## Hosting trust boundary
The Worker requires oai-authenticated-user-id and same-origin Origin. That identity header is trustworthy ONLY when an authenticated gateway strips attacker-supplied copies and inserts the verified identity. A direct deployment without such a gateway is not authenticated. Origin checks alone are not authentication.

For other hosting: implement real authentication/session checks, CSRF protection, gateway/header sanitization, HTTPS, request and rate limits, and safe logging before enabling the API. Restrict gateway bypass routes. Do not add an owner API key to a public frontend.

## Reporting
Do not post keys, passwords, private drafts or exploit details in public issues. If the repository offers GitHub private vulnerability reporting, use it; otherwise open a non-sensitive issue asking for a private reporting channel. Rotate any exposed credential with its issuer.

## 中文摘要
普通草稿不加密；JSON 备份含笔记，分享前请检查。AI 请求会经过站点服务器，Key 也会随请求发给服务器再转交 OpenAI。加密 Key 只提供本机静态存储保护，不是专业密码管理器，也防不了同源恶意脚本或已被入侵的设备。跨站 Origin 检查和可伪造的身份头不能替代真实认证。请勿在公开 Issue 上传凭据和私人草稿。
