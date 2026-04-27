import Anthropic from "@anthropic-ai/sdk"
import type { AIProvider } from "./base.js"
import type { ChatMessage } from "../types.js"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export class ClaudeProvider implements AIProvider {
  async *stream(
    messages: ChatMessage[],
    systemPrompt: string
  ): AsyncGenerator<string, void, unknown> {
    const stream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content }))
    })

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield event.delta.text
      }
    }
  }
}
