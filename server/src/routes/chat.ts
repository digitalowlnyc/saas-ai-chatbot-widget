import type { FastifyPluginAsync } from "fastify"
import { createProvider } from "../providers/base.js"
import type { SiteConfigMap, ChatRequest, StreamChunk } from "../types.js"
import type { ConversationRepository } from "../storage/index.js"

interface ChatRouteOptions {
  siteConfigs: SiteConfigMap
  repo: ConversationRepository
}

export const chatRoutes: FastifyPluginAsync<ChatRouteOptions> = async (fastify, opts) => {
  // Public site metadata — never exposes systemPrompt or allowedOrigins
  fastify.get<{ Params: { siteId: string } }>("/api/site-config/:siteId", async (request, reply) => {
    const config = opts.siteConfigs.get(request.params.siteId)
    if (!config) return reply.code(404).send({ error: "Site not found" })
    return {
      greeting: config.greeting,
      accentColor: config.accentColor,
      saveConversations: config.saveConversations ?? false
    }
  })

  fastify.post<{ Body: ChatRequest }>("/api/chat", {
    schema: {
      body: {
        type: "object",
        required: ["siteId", "messages"],
        properties: {
          siteId: { type: "string" },
          conversationId: { type: "string" },
          messages: {
            type: "array",
            items: {
              type: "object",
              required: ["role", "content"],
              properties: {
                role: { type: "string", enum: ["user", "assistant"] },
                content: { type: "string", maxLength: 4000 }
              }
            },
            maxItems: 50
          }
        }
      }
    }
  }, async (request, reply) => {
    const { siteId, messages, conversationId } = request.body

    const config = opts.siteConfigs.get(siteId)
    if (!config) {
      return reply.code(404).send({ error: `Unknown siteId: ${siteId}` })
    }

    const origin = request.headers.origin ?? "null"
    if (!config.allowedOrigins.includes(origin)) {
      return reply.code(403).send({ error: "Origin not allowed" })
    }

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": origin
    })

    const provider = await createProvider(config)
    let assistantContent = ""

    try {
      for await (const delta of provider.stream(messages, config.systemPrompt)) {
        assistantContent += delta
        const chunk: StreamChunk = { type: "delta", content: delta }
        reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`)
      }
      reply.raw.write(`data: ${JSON.stringify({ type: "done" } satisfies StreamChunk)}\n\n`)

      // Save exchange after successful stream
      if (config.saveConversations && conversationId && messages.length > 0) {
        const userMessage = messages[messages.length - 1]
        if (userMessage.role === "user") {
          try {
            opts.repo.saveMessages({
              conversationId,
              siteId,
              userContent: userMessage.content,
              assistantContent
            })
          } catch (err) {
            fastify.log.error({ err }, "Failed to save conversation")
          }
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : "Stream error"
      reply.raw.write(`data: ${JSON.stringify({ type: "error", error } satisfies StreamChunk)}\n\n`)
    } finally {
      reply.raw.end()
    }
  })
}
