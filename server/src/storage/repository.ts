export interface StoredMessage {
  role: "user" | "assistant"
  content: string
  createdAt: string
}

export interface Conversation {
  id: string
  siteId: string
  startedAt: string
  updatedAt: string
  messageCount: number
  messages: StoredMessage[]
}

export interface ConversationSummary {
  id: string
  siteId: string
  startedAt: string
  updatedAt: string
  messageCount: number
}

export interface ListResult {
  conversations: ConversationSummary[]
  total: number
}

export interface ConversationRepository {
  saveMessages(opts: {
    conversationId: string
    siteId: string
    userContent: string
    assistantContent: string
  }): void

  listConversations(opts: {
    siteId?: string
    limit: number
    offset: number
  }): ListResult

  getConversation(id: string): Conversation | null

  listSiteIds(): string[]
}
