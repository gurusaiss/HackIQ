// Vercel serverless function — keeps API keys server-side in production.
// Deploy to Vercel and set GROQ_API_KEY / ANTHROPIC_API_KEY as environment variables.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { provider, ...body } = req.body || {}

  try {
    if (provider === 'groq') {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      return res.status(response.status).json(data)
    }

    if (provider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'web-search-2025-03-05',
        },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      return res.status(response.status).json(data)
    }

    res.status(400).json({ error: 'Unknown provider. Use "groq" or "anthropic".' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
