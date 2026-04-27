import { h, Fragment } from "preact"
import { useState, useEffect, useRef } from "preact/hooks"
import { buildStyles } from "./styles.js"
import { streamChat, fetchSiteConfig, type ChatMessage } from "./api.js"
import { renderMarkdown } from "./markdown.js"

const escapeUser = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")

interface WidgetProps {
  siteId: string
  serverUrl: string
  styleEl: HTMLStyleElement
}

export function Widget({ siteId, serverUrl, styleEl }: WidgetProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [accentColor, setAccentColor] = useState("#6366f1")
  const [errorMsg, setErrorMsg] = useState("")
  const messagesBottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Update the pre-injected style element when accentColor changes
  useEffect(() => {
    styleEl.textContent = buildStyles(accentColor)
  }, [accentColor])

  // Fetch site config and show greeting on first open
  useEffect(() => {
    if (!open || initialized) return
    setInitialized(true)
    fetchSiteConfig(serverUrl, siteId).then(config => {
      if (config) {
        setAccentColor(config.accentColor)
        setMessages([{ role: "assistant", content: config.greeting }])
      } else {
        setMessages([{ role: "assistant", content: "Hi! How can I help you today?" }])
      }
    })
  }, [open])

  // Scroll to bottom on new message
  useEffect(() => {
    messagesBottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streaming])

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  async function send() {
    const text = input.trim()
    if (!text || streaming) return

    setErrorMsg("")
    const userMsg: ChatMessage = { role: "user", content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")
    setStreaming(true)

    // Append empty assistant bubble to stream into
    setMessages(prev => [...prev, { role: "assistant", content: "" }])

    try {
      for await (const chunk of streamChat(serverUrl, siteId, newMessages)) {
        if (chunk.type === "delta" && chunk.content) {
          setMessages(prev => {
            const updated = [...prev]
            const last = updated[updated.length - 1]
            updated[updated.length - 1] = { ...last, content: last.content + chunk.content }
            return updated
          })
        }
        if (chunk.type === "error") {
          setErrorMsg(chunk.error ?? "Something went wrong. Please try again.")
          // Remove empty assistant bubble
          setMessages(prev => {
            const updated = [...prev]
            if (updated[updated.length - 1].content === "") updated.pop()
            return updated
          })
          break
        }
        if (chunk.type === "done") break
      }
    } catch {
      setErrorMsg("Connection lost. Please try again.")
    } finally {
      setStreaming(false)
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function handleInput(e: Event) {
    const ta = e.target as HTMLTextAreaElement
    setInput(ta.value)
    // Auto-resize
    ta.style.height = "auto"
    ta.style.height = `${Math.min(ta.scrollHeight, 100)}px`
  }

  const isLastStreaming = streaming && messages.length > 0 && messages[messages.length - 1].content === ""

  return (
    <Fragment>
      <div class={`panel${open ? " open" : ""}`} role="dialog" aria-label="Chat assistant">
        <div class="header">
          <span class="header-dot" aria-hidden="true" />
          Chat with us
        </div>

        <div class="messages" role="log" aria-live="polite">
          {messages.map((m, i) => (
            <div
              key={i}
              class={`message ${m.role}`}
              dangerouslySetInnerHTML={{ __html: m.role === "assistant" ? renderMarkdown(m.content) : escapeUser(m.content) }}
            />
          ))}
          {isLastStreaming && (
            <div class="typing" aria-label="Assistant is typing">
              <div class="dot" />
              <div class="dot" />
              <div class="dot" />
            </div>
          )}
          <div ref={messagesBottomRef} />
        </div>

        {errorMsg && <div class="error-msg">{errorMsg}</div>}

        <div class="input-row">
          <textarea
            ref={inputRef}
            class="input"
            rows={1}
            value={input}
            placeholder="Type a message…"
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            disabled={streaming}
            aria-label="Chat message"
          />
          <button
            class="send-btn"
            onClick={send}
            disabled={streaming || !input.trim()}
            aria-label="Send message"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>

      <button
        class="bubble"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? "Close chat" : "Open chat"}
        aria-expanded={open}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </Fragment>
  )
}
