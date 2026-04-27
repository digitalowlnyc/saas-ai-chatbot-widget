export interface SiteConfig {
  siteId: string
  aiProvider: "claude" | "openai"
  systemPrompt: string
  greeting: string
  accentColor: string
  allowedOrigins: string[]
  saveConversations?: boolean
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface ChatRequest {
  siteId: string
  messages: ChatMessage[]
  conversationId?: string
}

export interface StreamChunk {
  type: "delta" | "done" | "error"
  content?: string
  error?: string
}

export interface SitePublicConfig {
  greeting: string
  accentColor: string
  saveConversations: boolean
}
