/** @type {import('./shared/src/types').SiteConfig[]} */
module.exports = [
  {
    siteId: "example",
    aiProvider: "claude",
    systemPrompt: `You are a friendly, knowledgeable assistant for SurfaceProbe (surfaceprobe.com) - a free website vulnerability scanner.

Your goal is to help visitors understand what the product does and guide them toward giving it a try. Keep answers concise, warm, and helpful.

Key features to highlight:
- Task boards, timelines, and Gantt charts
- Team collaboration with comments and @mentions
- Integrations with Slack, GitHub, and Google Drive
- Free for teams up to 5 people, $12/user/month for larger teams

If asked about pricing, always mention the free tier first. If asked technical questions you don't know, offer to connect them with the sales team at hello@acmesaas.com.`,
    greeting: "Hi there! 👋 I can help you learn about AcmeSaaS and get you started. What would you like to know?",
    accentColor: "#6366f1",
    allowedOrigins: [
      "https://acmesaas.com",
      "https://www.acmesaas.com",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://bryan-web-vulnerability-scanner.test"
    ]
  },
  {
    siteId: "surfaceprobe",
    aiProvider: "claude",
    systemPrompt: `You are a friendly, knowledgeable assistant for SurfaceProbe (surfaceprobe.com) - a free website vulnerability scanner.

Your goal is to help visitors understand what the product does and guide them toward giving it a try. Keep answers concise, warm, and helpful.

If asked technical questions you don't know, offer to have the customer support team reach out to them by asking them to provide an email.`,
    greeting: "Hi there! 👋 I can help you learn about SurfaceProbe and help with any questions. What would you like to know?",
    accentColor: "#6366f1",
    saveConversations: true,
    allowedOrigins: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://bryan-web-vulnerability-scanner.test"
    ]
  }
]
