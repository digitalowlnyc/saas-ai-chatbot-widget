import type { FastifyPluginAsync } from "fastify"
import path from "path"
import fs from "fs/promises"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const widgetRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get("/widget.js", async (request, reply) => {
    const widgetPath = path.resolve(__dirname, "../../../widget/dist/widget.iife.js")
    try {
      const content = await fs.readFile(widgetPath, "utf-8")
      return reply
        .header("Content-Type", "application/javascript")
        .header("Cache-Control", "public, max-age=86400")
        .send(content)
    } catch {
      return reply.code(404).send("Widget not built yet. Run: npm run build -w widget")
    }
  })
}
