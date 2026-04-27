import OpenAI from "openai"
import type { AIProvider } from "./base.js"
import type { ChatMessage } from "../types.js"

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export class OpenAIProvider implements AIProvider {
  async *stream(
    messages: ChatMessage[],
    systemPrompt: string
  ): AsyncGenerator<string, void, unknown> {
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content
        }))
      ]
    })

    for await (const chunk of completion) {
      const delta = chunk.choices[0]?.delta?.content
      if (delta) yield delta
    }
  }
}
