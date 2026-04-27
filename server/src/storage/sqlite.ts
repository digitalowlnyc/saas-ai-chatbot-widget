import Database from "better-sqlite3"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"
import type { ConversationRepository, Conversation, ConversationSummary, ListResult } from "./repository.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export class SqliteRepository implements ConversationRepository {
  private db: Database.Database

  constructor(dbPath?: string) {
    const resolved = dbPath ?? path.resolve(__dirname, "../../../data/conversations.db")
    fs.mkdirSync(path.dirname(resolved), { recursive: true })
    this.db = new Database(resolved)
    this.db.pragma("journal_mode = WAL")
    this.migrate()
  }

  private migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id          TEXT PRIMARY KEY,
        site_id     TEXT NOT NULL,
        started_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_conversations_site_id ON conversations(site_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

      CREATE TABLE IF NOT EXISTS messages (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id TEXT NOT NULL REFERENCES conversations(id),
        role            TEXT NOT NULL,
        content         TEXT NOT NULL,
        created_at      TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
    `)
  }

  saveMessages({ conversationId, siteId, userContent, assistantContent }: {
    conversationId: string
    siteId: string
    userContent: string
    assistantContent: string
  }) {
    const now = new Date().toISOString()

    const upsertConversation = this.db.prepare(`
      INSERT INTO conversations (id, site_id, started_at, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET updated_at = excluded.updated_at
    `)

    const insertMessage = this.db.prepare(`
      INSERT INTO messages (conversation_id, role, content, created_at)
      VALUES (?, ?, ?, ?)
    `)

    this.db.transaction(() => {
      upsertConversation.run(conversationId, siteId, now, now)
      insertMessage.run(conversationId, "user", userContent, now)
      insertMessage.run(conversationId, "assistant", assistantContent, now)
    })()
  }

  listConversations({ siteId, limit, offset }: { siteId?: string; limit: number; offset: number }): ListResult {
    const where = siteId ? "WHERE c.site_id = ?" : ""
    const params = siteId ? [siteId, limit, offset] : [limit, offset]
    const countParams = siteId ? [siteId] : []

    const rows = this.db.prepare(`
      SELECT c.id, c.site_id, c.started_at, c.updated_at,
             COUNT(m.id) AS message_count
      FROM conversations c
      LEFT JOIN messages m ON m.conversation_id = c.id
      ${where}
      GROUP BY c.id
      ORDER BY c.updated_at DESC
      LIMIT ? OFFSET ?
    `).all(...params) as Array<{
      id: string; site_id: string; started_at: string; updated_at: string; message_count: number
    }>

    const { total } = this.db.prepare(
      `SELECT COUNT(*) AS total FROM conversations ${where}`
    ).get(...countParams) as { total: number }

    const conversations: ConversationSummary[] = rows.map(r => ({
      id: r.id,
      siteId: r.site_id,
      startedAt: r.started_at,
      updatedAt: r.updated_at,
      messageCount: r.message_count
    }))

    return { conversations, total }
  }

  getConversation(id: string): Conversation | null {
    const conv = this.db.prepare(
      "SELECT id, site_id, started_at, updated_at FROM conversations WHERE id = ?"
    ).get(id) as { id: string; site_id: string; started_at: string; updated_at: string } | undefined

    if (!conv) return null

    const msgs = this.db.prepare(
      "SELECT role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY id ASC"
    ).all(id) as Array<{ role: "user" | "assistant"; content: string; created_at: string }>

    return {
      id: conv.id,
      siteId: conv.site_id,
      startedAt: conv.started_at,
      updatedAt: conv.updated_at,
      messageCount: msgs.length,
      messages: msgs.map(m => ({ role: m.role, content: m.content, createdAt: m.created_at }))
    }
  }

  listSiteIds(): string[] {
    const rows = this.db.prepare(
      "SELECT DISTINCT site_id FROM conversations ORDER BY site_id"
    ).all() as Array<{ site_id: string }>
    return rows.map(r => r.site_id)
  }
}
