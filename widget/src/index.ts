import { h, render } from "preact"
import { Widget } from "./widget.js"
import { buildStyles } from "./styles.js"

function findOwnScriptTag(): HTMLScriptElement | null {
  if (document.currentScript instanceof HTMLScriptElement) {
    return document.currentScript
  }
  const scripts = document.querySelectorAll<HTMLScriptElement>("script[data-site-id]")
  return scripts[scripts.length - 1] ?? null
}

async function isReachable(serverUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(`${serverUrl}/health`, { signal: controller.signal })
    clearTimeout(timeout)
    return res.ok
  } catch {
    return false
  }
}

async function mount() {
  const scriptTag = findOwnScriptTag()
  if (!scriptTag) {
    console.warn("[chatbot-widget] Could not find <script data-site-id>")
    return
  }

  const siteId = scriptTag.getAttribute("data-site-id")
  if (!siteId) {
    console.warn("[chatbot-widget] data-site-id attribute is missing or empty")
    return
  }

  const serverUrl = new URL(scriptTag.src).origin

  if (!await isReachable(serverUrl)) {
    return
  }

  const host = document.createElement("div")
  host.id = "chatbot-widget-host"
  document.body.appendChild(host)

  const shadow = host.attachShadow({ mode: "closed" })

  // Inject styles BEFORE first render to prevent a flash of unstyled content.
  const styleEl = document.createElement("style")
  styleEl.textContent = buildStyles("#6366f1")
  shadow.appendChild(styleEl)

  render(
    h(Widget, { siteId, serverUrl, styleEl }),
    shadow
  )
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount)
} else {
  mount()
}
