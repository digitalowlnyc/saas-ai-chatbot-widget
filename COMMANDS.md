# Commands

## Development

```bash
# Install all workspace dependencies
npm install

# Copy env file and add your API keys
cp .env.example .env

# Start dev servers (Fastify on :4000 + Vite watch build)
npm run dev
```

## Build

```bash
# Build everything (shared → widget → server)
npm run build
```

## Run production server

```bash
npm start
```

## Test the widget locally

Create `/tmp/test.html`:
```html
<!DOCTYPE html>
<html>
<head><title>Widget Test</title></head>
<body>
  <h1>My SaaS Homepage</h1>
  <script src="http://localhost:4000/widget.js" data-site-id="my-saas-app"></script>
</body>
</html>
```

Serve it on port 3000 (must match `allowedOrigins` in `sites.config.js`):
```bash
python3 -m http.server 3000 --directory /tmp
# Open: http://localhost:3000/test.html
```

## Test the API directly

```bash
# Health check
curl http://localhost:4000/health

# Site config (public)
curl http://localhost:4000/api/site-config/my-saas-app

# Stream a chat response (SSE)
curl -N -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"siteId":"my-saas-app","messages":[{"role":"user","content":"What does AcmeSaaS do?"}]}'
```

## Add a new site

1. Add an entry to `sites.config.js`
2. Restart the server
3. Embed on your site: `<script src="https://your-server.com/widget.js" data-site-id="your-site-id"></script>`
