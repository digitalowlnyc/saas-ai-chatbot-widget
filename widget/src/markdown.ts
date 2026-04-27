function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function renderInline(s: string): string {
  // Links must be processed before HTML escaping to capture raw URLs,
  // then the label and URL are escaped individually.
  const linked = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, (_, label, url) => {
    const safeUrl = encodeURI(url)
    const safeLabel = escapeHtml(label)
    return `\x00LINK\x01${safeUrl}\x01${safeLabel}\x00`
  })

  return escapeHtml(linked)
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Restore link placeholders — \x01 can't appear in URLs or labels
    .replace(/\x00LINK\x01([^\x01]+)\x01([^\x00]+)\x00/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$2</a>')
}

export function renderMarkdown(text: string): string {
  const lines = text.split("\n")
  const out: string[] = []
  let inList = false
  let pendingParagraph = ""

  function flushParagraph() {
    if (pendingParagraph) {
      out.push(`<p>${renderInline(pendingParagraph)}</p>`)
      pendingParagraph = ""
    }
  }

  function closeList() {
    if (inList) {
      out.push("</ul>")
      inList = false
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    const listMatch = line.match(/^[-*]\s+(.*)/)

    if (listMatch) {
      flushParagraph()
      if (!inList) {
        out.push("<ul>")
        inList = true
      }
      out.push(`<li>${renderInline(listMatch[1])}</li>`)
      continue
    }

    closeList()

    if (line.trim() === "") {
      flushParagraph()
      continue
    }

    // Numbered list  e.g. "1. item"
    const numMatch = line.match(/^\d+\.\s+(.*)/)
    if (numMatch) {
      flushParagraph()
      if (!inList) {
        out.push("<ol>")
        inList = true
      }
      out.push(`<li>${renderInline(numMatch[1])}</li>`)
      continue
    }

    // Heading  e.g. "### Title"
    const headingMatch = line.match(/^(#{1,3})\s+(.*)/)
    if (headingMatch) {
      flushParagraph()
      const level = Math.min(headingMatch[1].length + 3, 6)
      out.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`)
      continue
    }

    // Continuation of previous line — join with a space
    if (pendingParagraph) {
      pendingParagraph += " " + line
    } else {
      pendingParagraph = line
    }
  }

  closeList()
  flushParagraph()

  return out.join("")
}
