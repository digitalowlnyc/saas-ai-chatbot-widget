# Project Changelog

---

## 2026-04-27 — Initial project build

**updated_by: CLA**

### What Changed (Plain Language)

Built the entire Conversions Chatbot project from scratch. This is a reusable AI chatbot widget that bryguy can embed on any SaaS homepage with a single `<script>` tag to help convert visitors. The widget streams AI responses in real-time and supports both Claude and OpenAI as AI providers (switchable per site). Site-specific behavior (system prompt, branding, allowed origins) is controlled via a single `sites.config.js` file with no dashboard required.

User requested this directly as a greenfield project.

### Technical Details

- **Monorepo**: npm workspaces with three packages: `shared/` (TypeScript types), `server/` (Fastify API), `widget/` (Preact UI)
- **Shared types** (`shared/src/types.ts`): `SiteConfig`, `ChatMessage`, `ChatRequest`, `StreamChunk`, `SitePublicConfig`
- **Server** (`server/src/`):
  - `index.ts`: Fastify 5.x bootstrap with `@fastify/cors` (v11) and `@fastify/rate-limit` (v10) — had to use v11/v10 because Fastify 5.x requires updated plugin versions
  - `config.ts`: Loads `sites.config.js` at startup with `createRequire()` (CJS interop), validates shape, builds `Map<siteId, SiteConfig>`
  - `providers/base.ts`: `AIProvider` interface + `createProvider()` factory using dynamic `import()`
  - `providers/claude.ts`: Anthropic SDK streaming via `client.messages.stream()`, model `claude-sonnet-4-6`
  - `providers/openai.ts`: OpenAI SDK streaming via `client.chat.completions.create({ stream: true })`, model `gpt-4o`
  - `routes/chat.ts`: `POST /api/chat` (SSE stream, origin validation, JSON Schema body validation) + `GET /api/site-config/:siteId` (public metadata only)
  - `routes/widget.ts`: `GET /widget.js` serves `widget/dist/widget.iife.js`
- **Widget** (`widget/src/`):
  - Built with Vite 5 in IIFE format (esbuild minifier — terser not installed by default in Vite v5+)
  - `index.ts`: IIFE entry reads `data-site-id` from own `<script>` tag, derives `serverUrl` from `scriptTag.src`, mounts Preact into Shadow DOM
  - `widget.tsx`: Preact component with streaming state, auto-resize textarea, typing indicator, error handling
  - `api.ts`: Manual SSE parser over `fetch` ReadableStream (EventSource doesn't support POST)
  - `styles.ts`: CSS template literal injected into Shadow DOM — full isolation from host page
- **Build output**: `widget/dist/widget.iife.js` — 24kb / 9.5kb gzipped
- **Verified routes**: `/health`, `/api/site-config/:siteId`, `/widget.js` (200), `/api/chat` with bad origin (403), unknown siteId (404)
