import type { ChatMessage, SiteConfig } from "../types.js"

export interface AIProvider {
  stream(messages: ChatMessage[], systemPrompt: string): AsyncGenerator<string, void, unknown>
}

export async function createProvider(config: SiteConfig): Promise<AIProvider> {
  if (config.aiProvider === "claude") {
    const { ClaudeProvider } = await import("./claude.js")
    return new ClaudeProvider()
  }
  if (config.aiProvider === "openai") {
    const { OpenAIProvider } = await import("./openai.js")
    return new OpenAIProvider()
  }
  throw new Error(`Unknown provider: ${config.aiProvider}`)
}
