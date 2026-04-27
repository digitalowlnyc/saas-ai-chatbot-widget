import path from "path"
import { createRequire } from "module"
import { fileURLToPath } from "url"
import type { SiteConfig } from "./types.js"
import type { SiteConfigMap } from "./types.js"

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

function validate(raw: unknown): SiteConfig[] {
  if (!Array.isArray(raw)) throw new Error("sites.config.js must export an array")
  const required = ["siteId", "aiProvider", "systemPrompt", "greeting", "accentColor", "allowedOrigins"] as const
  for (const site of raw) {
    for (const key of required) {
      if (!site[key]) throw new Error(`sites.config.js: site missing required field "${key}"`)
    }
    if (!["claude", "openai"].includes(site.aiProvider)) {
      throw new Error(`sites.config.js: siteId "${site.siteId}" has invalid aiProvider "${site.aiProvider}"`)
    }
    if (!Array.isArray(site.allowedOrigins) || site.allowedOrigins.length === 0) {
      throw new Error(`sites.config.js: siteId "${site.siteId}" must have at least one allowedOrigin`)
    }
  }
  return raw as SiteConfig[]
}

export function loadSiteConfig(): SiteConfigMap {
  const configPath = path.resolve(__dirname, "../../sites.config.js")
  const raw = require(configPath)
  const sites = validate(raw)
  const map: SiteConfigMap = new Map()
  for (const site of sites) map.set(site.siteId, site)
  console.log(`Loaded ${map.size} site(s): ${[...map.keys()].join(", ")}`)
  return map
}
