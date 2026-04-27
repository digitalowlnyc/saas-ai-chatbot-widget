# Conversions Chatbot — Project Memory

## What This Is
An embeddable AI chatbot widget for SaaS homepages, designed to increase conversions. Added to any website via a single `<script>` tag. AI responses stream in real-time. Supports Claude (Anthropic) and OpenAI, switchable per site.

## Monorepo Structure

| Package | Purpose |
|---------|---------|
| `shared/` | TypeScript types shared between server and widget |
| `server/` | Fastify API server — handles AI calls, serves widget.js |
| `widget/` | Preact chat UI — compiled to a self-contained IIFE bundle |
| `sites.config.js` | Per-site configuration (CJS, loaded at server runtime) |

## How the Embed Works
1. Site owner pastes: `<script src="https://your-server.com/widget.js" data-site-id="my-saas-app"></script>`
2. IIFE executes, reads `data-site-id` from its own script tag
3. Derives `serverUrl` from `new URL(scriptTag.src).origin` — no hardcoded URLs
4. Mounts Preact into a Shadow DOM (style isolation from host page)
5. On first open: fetches `GET /api/site-config/:siteId` for greeting + accent color
6. User sends message → `POST /api/chat` → SSE stream → text appears character by character

## Key Design Decisions
- **Shadow DOM**: widget styles never bleed in or out of the host page
- **IIFE bundle**: no `import`/`require` on host page, works with any framework
- **SSE via fetch**: `EventSource` only supports GET; we POST + read `ReadableStream` manually
- **Provider abstraction**: `AIProvider` interface in `server/src/providers/base.ts` — add new providers by implementing the interface
- **No hardcoded server URL in widget**: derived from the script tag's `src` attribute

## Server Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/health` | GET | Status + loaded sites |
| `/widget.js` | GET | Serves built `widget/dist/widget.iife.js` |
| `/api/site-config/:siteId` | GET | Public config (greeting, accentColor only) |
| `/api/chat` | POST | Streams AI response as SSE |

## Security
- CORS: `@fastify/cors` with per-site origin allowlist built at startup
- Origin check: `/api/chat` handler validates `request.headers.origin` against `allowedOrigins` → 403
- Rate limiting: 30 req/min per IP+siteId via `@fastify/rate-limit`
- Schema validation: Fastify JSON Schema on request body (maxItems: 50 messages, maxLength: 4000 chars)
- `systemPrompt` and `allowedOrigins` are NEVER exposed to the client

## Adding a New Site
Edit `sites.config.js` and add an entry:
```js
{
  siteId: "your-site-id",         // matches data-site-id in script tag
  aiProvider: "claude",           // "claude" | "openai"
  systemPrompt: "You are...",     // never sent to browser
  greeting: "Hi! How can I...",
  accentColor: "#your-hex",
  allowedOrigins: ["https://yoursite.com"]
}
```
Then restart the server.

## Environment Variables
- `ANTHROPIC_API_KEY` — required if any site uses Claude
- `OPENAI_API_KEY` — required if any site uses OpenAI
- `PORT` — defaults to 4000

## Tech Stack
- Node.js (v24+), TypeScript 5.4
- Fastify 5.x + `@fastify/cors` + `@fastify/rate-limit`
- `@anthropic-ai/sdk` (claude-sonnet-4-6), `openai` (gpt-4o)
- Preact 10.x, Vite 5.x (IIFE build, esbuild minifier)
- npm workspaces monorepo
