import { h, render } from "preact"
import { Widget } from "./widget.js"

function findOwnScriptTag(): HTMLScriptElement | null {
  if (document.currentScript instanceof HTMLScriptElement) {
    return document.currentScript
  }
  // Fallback for async/deferred: find the last script with data-site-id
  const scripts = document.querySelectorAll<HTMLScriptElement>("script[data-site-id]")
  return scripts[scripts.length - 1] ?? null
}

function mount() {
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

  // Derive server URL from the script's own src so the widget always talks
  // back to the same host it was loaded from — no hardcoded URLs needed.
  const serverUrl = new URL(scriptTag.src).origin

  const host = document.createElement("div")
  host.id = "chatbot-widget-host"
  document.body.appendChild(host)

  const shadow = host.attachShadow({ mode: "closed" })

  render(
    h(Widget, { siteId, serverUrl, shadowRoot: shadow }),
    shadow
  )
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount)
} else {
  mount()
}
