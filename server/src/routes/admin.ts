import type { FastifyPluginAsync } from "fastify"
import type { ConversationRepository } from "../storage/index.js"

interface AdminRouteOptions {
  repo: ConversationRepository
}

function requireAuth(secret: string, authHeader: string | undefined): boolean {
  if (!authHeader) return false
  if (authHeader.startsWith("Basic ")) {
    const decoded = Buffer.from(authHeader.slice(6), "base64").toString()
    return decoded === `:${secret}` || decoded.split(":")[1] === secret
  }
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7) === secret
  }
  return false
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
  })
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function renderPage(body: string, title = "Conversations"): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — Chatbot Admin</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #1e293b; background: #f8fafc; margin: 0; padding: 0; }
    .topbar { background: #fff; border-bottom: 1px solid #e2e8f0; padding: 12px 24px; display: flex; align-items: center; gap: 16px; }
    .topbar h1 { font-size: 16px; font-weight: 600; margin: 0; }
    .topbar a { color: #6366f1; text-decoration: none; font-size: 13px; }
    .container { max-width: 900px; margin: 0 auto; padding: 24px; }
    .filters { display: flex; gap: 10px; align-items: center; margin-bottom: 20px; }
    select, input { padding: 7px 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; background: #fff; }
    .btn { padding: 7px 14px; background: #6366f1; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; text-decoration: none; display: inline-block; }
    table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
    th { text-align: left; padding: 10px 14px; background: #f1f5f9; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; border-bottom: 1px solid #e2e8f0; }
    td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #f8fafc; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; background: #e0e7ff; color: #4338ca; font-weight: 500; }
    .link { color: #6366f1; text-decoration: none; font-weight: 500; }
    .link:hover { text-decoration: underline; }
    .pagination { display: flex; gap: 8px; margin-top: 16px; align-items: center; }
    .pagination a { padding: 6px 12px; border: 1px solid #e2e8f0; border-radius: 6px; color: #1e293b; text-decoration: none; font-size: 13px; background: #fff; }
    .pagination a.active { background: #6366f1; color: #fff; border-color: #6366f1; }
    .pagination a:hover:not(.active) { background: #f1f5f9; }
    .meta { font-size: 12px; color: #94a3b8; }
    .msg-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
    .msg { padding: 10px 14px; border-radius: 10px; max-width: 78%; font-size: 14px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
    .msg.user { background: #6366f1; color: #fff; align-self: flex-end; }
    .msg.assistant { background: #f1f5f9; color: #1e293b; align-self: flex-start; }
    .msg-wrap { display: flex; flex-direction: column; }
    .msg-time { font-size: 11px; color: #94a3b8; margin-top: 4px; }
    .msg-time.user { align-self: flex-end; }
    .back { display: inline-block; margin-bottom: 16px; color: #6366f1; text-decoration: none; font-size: 13px; }
    .back:hover { text-decoration: underline; }
    .empty { text-align: center; padding: 48px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="topbar">
    <h1>💬 Chatbot Admin</h1>
    <a href="/admin">Conversations</a>
  </div>
  <div class="container">${body}</div>
</body>
</html>`
}

export const adminRoutes: FastifyPluginAsync<AdminRouteOptions> = async (fastify, opts) => {
  const secret = process.env.ADMIN_SECRET
  if (!secret) {
    fastify.log.warn("ADMIN_SECRET not set — /admin routes are disabled")
    return
  }

  function auth(req: { headers: { authorization?: string } }, reply: { code: (n: number) => { header: (k: string, v: string) => { send: (b: string) => void } } }) {
    if (!requireAuth(secret!, req.headers.authorization)) {
      reply.code(401).header("WWW-Authenticate", 'Basic realm="Chatbot Admin"').send("Unauthorized")
      return false
    }
    return true
  }

  // Conversation list
  fastify.get<{ Querystring: { siteId?: string; page?: string } }>("/admin", async (request, reply) => {
    if (!auth(request, reply)) return

    const siteId = request.query.siteId || undefined
    const page = Math.max(1, parseInt(request.query.page ?? "1"))
    const limit = 20
    const offset = (page - 1) * limit

    const { conversations, total } = opts.repo.listConversations({ siteId, limit, offset })
    const siteIds = opts.repo.listSiteIds()
    const totalPages = Math.ceil(total / limit)

    const siteOptions = ["", ...siteIds]
      .map(s => `<option value="${escHtml(s)}" ${s === (siteId ?? "") ? "selected" : ""}>${s || "All sites"}</option>`)
      .join("")

    const rows = conversations.length === 0
      ? `<tr><td colspan="4" class="empty">No conversations yet.</td></tr>`
      : conversations.map(c => `
        <tr>
          <td><a class="link" href="/admin/conversations/${escHtml(c.id)}">${escHtml(c.id.slice(0, 8))}…</a></td>
          <td><span class="badge">${escHtml(c.siteId)}</span></td>
          <td>${formatDate(c.startedAt)}</td>
          <td>${c.messageCount}</td>
        </tr>`).join("")

    const pageLinks = Array.from({ length: totalPages }, (_, i) => {
      const p = i + 1
      const qs = new URLSearchParams({ ...(siteId ? { siteId } : {}), page: String(p) })
      return `<a href="/admin?${qs}" class="${p === page ? "active" : ""}">${p}</a>`
    }).join("")

    const body = `
      <div class="filters">
        <form method="get" action="/admin" style="display:flex;gap:8px;align-items:center;">
          <select name="siteId" onchange="this.form.submit()">
            ${siteOptions}
          </select>
          <span class="meta">${total} conversation${total !== 1 ? "s" : ""}</span>
        </form>
      </div>
      <table>
        <thead><tr><th>ID</th><th>Site</th><th>Started</th><th>Messages</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      ${totalPages > 1 ? `<div class="pagination">${pageLinks}</div>` : ""}
    `

    return reply.header("Content-Type", "text/html").send(renderPage(body))
  })

  // Single conversation view
  fastify.get<{ Params: { id: string }; Querystring: { siteId?: string } }>("/admin/conversations/:id", async (request, reply) => {
    if (!auth(request, reply)) return

    const conv = opts.repo.getConversation(request.params.id)
    if (!conv) return reply.code(404).header("Content-Type", "text/html").send(renderPage("<p>Conversation not found.</p>"))

    const backQs = conv.siteId ? `?siteId=${encodeURIComponent(conv.siteId)}` : ""
    const msgItems = conv.messages.map(m => `
      <div class="msg-wrap">
        <div class="msg ${m.role}">${escHtml(m.content)}</div>
        <div class="msg-time ${m.role}">${formatDate(m.createdAt)}</div>
      </div>`).join("")

    const body = `
      <a class="back" href="/admin${backQs}">← Back to conversations</a>
      <table style="margin-bottom:20px;">
        <thead><tr><th>Conversation</th><th>Site</th><th>Started</th><th>Messages</th></tr></thead>
        <tbody>
          <tr>
            <td class="meta">${escHtml(conv.id)}</td>
            <td><span class="badge">${escHtml(conv.siteId)}</span></td>
            <td>${formatDate(conv.startedAt)}</td>
            <td>${conv.messageCount}</td>
          </tr>
        </tbody>
      </table>
      <ul class="msg-list">${msgItems}</ul>
    `

    return reply.header("Content-Type", "text/html").send(renderPage(body, `Conversation ${conv.id.slice(0, 8)}`))
  })
}
