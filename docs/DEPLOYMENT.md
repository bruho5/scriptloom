# Deployment / 部署

## Static editor
Serve the contents of src/ over HTTP(S), preserving relative paths. Use index.html as the entrypoint. A static host (including GitHub Pages) supports writing, notes, browser storage, imports/exports and manual prompt preparation.

It does NOT provide /api/draft. The AI button remains visible but requests will fail without a compatible backend; do not describe static-only hosting as a working AI demo. Changing origin creates a separate browser storage area: export/import JSON when moving the editor.

## Local preview
npm run dev serves src/ at http://127.0.0.1:4173/ and also exposes /tests/ for development. It is a loopback-only static development server, not a production server or a local AI proxy. npm run build bundles assets and the API handler into dist/server/index.js. No credentials or real hosted project identity are bundled.

## Existing Sites-compatible Worker integration
This source contains an adapter originally built for the Sites runtime. Create your OWN project using the host's supported workflow. Copy .openai/hosting.example.json to .openai/hosting.json and replace its placeholder with your own returned project ID. Do not commit that local configuration. Build, then use the hosting service's source/version/archive publishing workflow.

The generated Worker includes static assets in memory and /api/draft. It assumes the platform enforces authentication and controls the oai-authenticated-user-id header. Confirm that gateway behavior and access policy before deployment. A project manifest alone does not set up authentication.

## Other Worker/server hosting
This repository does not include a ready-to-use authenticated generic host adapter. Before adapting:
1. Implement server-verified sessions/identity, not a client-provided header.
2. Enforce HTTPS, same-origin/CSRF policy, size/rate limits and safe error/log handling.
3. Supply a routing/Worker entrypoint that serves assets and routes POST /api/draft.
4. Keep the fixed OpenAI destination or explicitly audit any provider change.
5. Test missing/forged identity, cross-origin calls, invalid input, cancellation and billing behavior.
6. Review SECURITY.md. Do not expose a shared secret or personal API key in static assets.

## 中文说明
本地和纯静态部署可运行编辑器，不含 AI 后端。当前 Worker 只适合置于具有可信身份网关的环境；裸部署会失去正确的认证边界。仓库只提供部署示例配置，不包含原作者的项目 ID、私有站点地址或凭据。自建时请配置自己的项目和认证，不要直接复用身份请求头检查。
