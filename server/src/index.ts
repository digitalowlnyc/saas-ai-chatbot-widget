import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.env") })

// tsx watch adds an exit listener per file watcher; raise the limit to suppress the warning
process.setMaxListeners(25)
import Fastify from "fastify"
import cors from "@fastify/cors"
import rateLimit from "@fastify/rate-limit"
import { loadSiteConfig } from "./config.js"
import { chatRoutes } from "./routes/chat.js"
import { widgetRoute } from "./routes/widget.js"
import { adminRoutes } from "./routes/admin.js"
import { createRepository } from "./storage/index.js"

const siteConfigs = loadSiteConfig()
const repo = createRepository()

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === "production" ? "warn" : "info"
  }
})

// Build the set of all allowed origins across all sites
const allAllowedOrigins = new Set(
  Array.from(siteConfigs.values()).flatMap(s => s.allowedOrigins)
)

await fastify.register(cors, {
  origin: (origin, callback) => {
    const o = origin ?? "null"
    if (allAllowedOrigins.has(o)) {
      callback(null, true)
    } else {
      // Return false — @fastify/cors will send a 400/403 response without a body
      callback(null, false)
    }
  },
  methods: ["GET", "POST", "OPTIONS"]
})

await fastify.register(rateLimit, {
  max: 30,
  timeWindow: "1 minute",
  keyGenerator: (req) => {
    const body = req.body as { siteId?: string } | null
    return `${req.ip}-${body?.siteId ?? "unknown"}`
  }
})

await fastify.register(chatRoutes, { siteConfigs, repo })
await fastify.register(widgetRoute)
await fastify.register(adminRoutes, { repo })

fastify.get("/health", async () => ({ status: "ok", sites: [...siteConfigs.keys()] }))

const port = Number(process.env.PORT) || 4000
await fastify.listen({ port, host: "0.0.0.0" })
console.log(`\nServer ready at http://localhost:${port}`)
console.log(`Widget served at http://localhost:${port}/widget.js\n`)
