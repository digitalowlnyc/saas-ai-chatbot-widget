export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface StreamChunk {
  type: "delta" | "done" | "error"
  content?: string
  error?: string
}

export async function* streamChat(
  serverUrl: string,
  siteId: string,
  messages: ChatMessage[]
): AsyncGenerator<StreamChunk> {
  let response: Response
  try {
    response = await fetch(`${serverUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId, messages })
    })
  } catch {
    yield { type: "error", error: "Could not reach the server. Please try again." }
    return
  }

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText)
    yield { type: "error", error: `Error ${response.status}: ${text}` }
    return
  }

  if (!response.body) {
    yield { type: "error", error: "No response body received." }
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue
      try {
        const chunk = JSON.parse(line.slice(6)) as StreamChunk
        yield chunk
        if (chunk.type === "done" || chunk.type === "error") return
      } catch {
        // malformed SSE line — skip
      }
    }
  }
}

export async function fetchSiteConfig(
  serverUrl: string,
  siteId: string
): Promise<{ greeting: string; accentColor: string } | null> {
  try {
    const res = await fetch(`${serverUrl}/api/site-config/${siteId}`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
