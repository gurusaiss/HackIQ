// ─── Constants ────────────────────────────────────────────────────────────────

const CACHE_KEY = 'ciq_results_v2'
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

// ─── Prompt builders ──────────────────────────────────────────────────────────

function today() { return new Date().toISOString().split('T')[0] }
function plusDays(n) {
  const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]
}

const SYSTEM_PROMPT = `You are CompeteIQ's competition discovery engine.

Generate exactly 20 realistic, currently open competitions. Use these REAL platform URLs:
• Devpost hackathons → https://devpost.com/hackathons
• Kaggle competitions → https://www.kaggle.com/competitions
• HackerEarth challenges → https://www.hackerearth.com/challenges/
• Unstop competitions → https://unstop.com/competitions
• Topcoder challenges → https://www.topcoder.com/challenges
• MLH hackathons → https://mlh.io/seasons/2025/events
• HackerRank contests → https://www.hackerrank.com/contests
• NASA challenges → https://www.nasa.gov/tournaments
• Google competitions → https://developers.google.com/community/gdsc-solution-challenge
• Chainlink hackathons → https://chain.link/hackathon

Prize ranges: student competitions $500–$10K, open professional $5K–$100K, enterprise $50K+.
All deadlines MUST be between ${today()} and ${plusDays(90)}.

Return ONLY a valid JSON array — no markdown, no commentary, nothing else.
Each object must have exactly these fields (no extras, no missing):
{
  "title": "string",
  "description": "string (3 sentences, specific and compelling)",
  "prize_amount": number,
  "prize_currency": "USD",
  "deadline": "YYYY-MM-DD",
  "category": "Hackathon|Coding|Design|Writing|Data Science|Science|Business",
  "skills_required": ["string", "..."],
  "platform": "string",
  "apply_url": "https://...",
  "eligibility": "string",
  "team_size": "Solo|Team|Both",
  "is_remote": true,
  "is_global": true,
  "organizer": "string"
}`

function buildPrompt(profile) {
  const skills = profile?.skills?.join(', ') || 'Python, JavaScript, design'
  const interests = profile?.interests?.join(', ') || 'AI, technology'
  const level = profile?.experience_level || 'Mid'
  const prizes = profile?.prize_preference || 'Cash'
  const location = profile?.location_preference || 'Global'

  return `Find 20 open competitions for this user profile:
- Skills: ${skills}
- Interests: ${interests}
- Experience: ${level}
- Prize preference: ${prizes}
- Location: ${location}
- Today's date: ${today()} — all deadlines must be after this

Prioritise competitions that match their skills (${skills}) and interests (${interests}).
Mix categories: include Hackathons, Coding contests, Data Science, Design, and Writing competitions.
Return ONLY the JSON array.`
}

// ─── JSON extraction ──────────────────────────────────────────────────────────

function extractJSON(text) {
  if (!text) return []
  // Strip markdown code fences
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (fenced) { try { return JSON.parse(fenced[1]) } catch (_) {} }
  // Find raw array
  const s = text.indexOf('['), e = text.lastIndexOf(']')
  if (s !== -1 && e > s) { try { return JSON.parse(text.slice(s, e + 1)) } catch (_) {} }
  try { return JSON.parse(text) } catch (_) { return [] }
}

// ─── Helpers (exported) ───────────────────────────────────────────────────────

export function formatPrize(amount, currency = 'USD') {
  const n = parseFloat(String(amount ?? '').replace(/[^0-9.]/g, ''))
  if (!n || isNaN(n)) return 'Prize TBD'
  const sym = { USD: '$', EUR: '€', INR: '₹', GBP: '£' }[currency] ?? '$'
  if (n >= 1_000_000) return `${sym}${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${sym}${(n / 1_000).toFixed(0)}K`
  return `${sym}${n.toLocaleString()}`
}

export function getDeadlineInfo(deadline) {
  if (!deadline) return { label: 'No deadline', isUrgent: false, isExpired: false, daysLeft: null }
  const diff = new Date(deadline) - new Date()
  if (diff < 0) return { label: 'Expired', isExpired: true, isUrgent: false, daysLeft: 0 }
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  if (days === 0) return { label: `${hours}h left`, isUrgent: true, isExpired: false, daysLeft: 0 }
  if (days <= 7) return { label: `${days}d left`, isUrgent: true, isExpired: false, daysLeft: days }
  if (days <= 30) return { label: `${days} days`, isClosingSoon: true, isExpired: false, daysLeft: days }
  const end = new Date(deadline)
  return {
    label: end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    isExpired: false, daysLeft: days,
  }
}

// ─── Match score ──────────────────────────────────────────────────────────────

export function computeMatchScore(comp, profile) {
  if (!profile) return Math.floor(Math.random() * 30 + 40)
  let score = 0
  const uSkills = (profile.skills || []).map(s => s.toLowerCase())
  const uInterests = (profile.interests || []).map(i => i.toLowerCase())
  const rSkills = (comp.skills_required || []).map(s => s.toLowerCase())
  const cat = (comp.category || '').toLowerCase()
  const desc = (comp.description || '').toLowerCase()
  const elig = (comp.eligibility || '').toLowerCase()

  // Skills — 40 pts
  if (rSkills.length > 0) {
    const matched = rSkills.filter(rs =>
      uSkills.some(us => us.includes(rs) || rs.includes(us) || (rs.length > 3 && us.length > 3 && (us.includes(rs.slice(0, 4)) || rs.includes(us.slice(0, 4)))))
    ).length
    score += (matched / rSkills.length) * 40
  } else {
    score += 20
  }

  // Interests — 30 pts
  if (uInterests.some(i => cat.includes(i) || desc.includes(i))) score += 30
  else if (uInterests.length === 0) score += 15

  // Experience — 20 pts
  const lvl = (profile.experience_level || '').toLowerCase()
  const studentTerms = ['student', 'undergraduate', 'college', 'university', 'fresher', 'beginner']
  const isStudentComp = studentTerms.some(t => elig.includes(t))
  if (lvl === 'student' && isStudentComp) score += 20
  else if (lvl === 'student' && !isStudentComp && comp.is_global) score += 12
  else if (lvl !== 'student') score += 20

  // Location — 10 pts
  const loc = (profile.location_preference || '').toLowerCase()
  const plat = (comp.platform || '').toLowerCase()
  if (loc === 'india') {
    if (['india', 'hackerearth', 'unstop', 'indian'].some(t => elig.includes(t) || plat.includes(t))) score += 10
    else if (comp.is_global) score += 7
  } else {
    score += comp.is_remote ? 10 : 5
  }

  return Math.min(100, Math.max(0, Math.round(score)))
}

// ─── Caching ──────────────────────────────────────────────────────────────────

function profileKey(p) {
  if (!p) return 'anon'
  try {
    return btoa([
      ...(p.skills || []).slice().sort(),
      ...(p.interests || []).slice().sort(),
      p.experience_level || '',
      p.location_preference || '',
    ].join('|')).slice(0, 24)
  } catch { return 'anon' }
}

export function getCachedResults(profile) {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, ts, key } = JSON.parse(raw)
    if (key !== profileKey(profile)) return null
    if (Date.now() - ts > CACHE_TTL) return null
    return { data, ts }
  } catch { return null }
}

function setCache(data, profile) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now(), key: profileKey(profile) }))
  } catch {}
}

export function clearCache() {
  try { localStorage.removeItem(CACHE_KEY) } catch {}
}

// ─── API callers ──────────────────────────────────────────────────────────────

async function callGroq(profile) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildPrompt(profile) },
  ]
  const body = { model: 'llama-3.3-70b-versatile', messages, temperature: 0.75, max_tokens: 7000 }

  // Try dev proxy first (key stays server-side)
  if (import.meta.env.DEV) {
    const r = await fetch('/api/groq/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (r.ok) {
      const d = await r.json()
      return extractJSON(d.choices?.[0]?.message?.content || '')
    }
  }

  // Production: Vercel serverless function
  const vercelR = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'groq', ...body }),
  }).catch(() => null)

  if (vercelR?.ok) {
    const d = await vercelR.json()
    return extractJSON(d.choices?.[0]?.message?.content || '')
  }

  // Last resort: direct browser call (requires VITE_ key; Groq supports CORS)
  const key = import.meta.env.VITE_GROQ_API_KEY
  if (!key) throw new Error('No Groq API key configured')
  const r2 = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  })
  if (!r2.ok) throw new Error(`Groq error ${r2.status}`)
  const d2 = await r2.json()
  return extractJSON(d2.choices?.[0]?.message?.content || '')
}

async function callAnthropic(profile) {
  const body = {
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
    messages: [{ role: 'user', content: buildPrompt(profile) }],
  }

  // Dev proxy
  if (import.meta.env.DEV) {
    const r = await fetch('/api/anthropic/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (r.ok) {
      const d = await r.json()
      const text = (d.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n')
      return extractJSON(text)
    }
  }

  // Vercel function
  const r2 = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'anthropic', ...body }),
  }).catch(() => null)

  if (r2?.ok) {
    const d = await r2.json()
    const text = (d.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n')
    return extractJSON(text)
  }

  throw new Error('Anthropic API unavailable')
}

// ─── Mock fallback ────────────────────────────────────────────────────────────

const MOCK = [
  { title: 'Google AI Hackathon 2025', description: 'Build AI solutions using Google Cloud and Gemini APIs. Open to developers worldwide with $50K in total prizes for the most creative applications of AI technology.', prize_amount: 50000, prize_currency: 'USD', deadline: plusDays(18), category: 'Hackathon', skills_required: ['Python', 'Machine Learning', 'Google Cloud', 'API Integration'], platform: 'Devpost', apply_url: 'https://devpost.com/hackathons', eligibility: 'Global, 18+', team_size: 'Both', is_remote: true, is_global: true, organizer: 'Google' },
  { title: 'Kaggle Climate Forecasting Challenge', description: 'Predict climate patterns using satellite imagery and historical weather data. This data science challenge is open to all skill levels globally.', prize_amount: 25000, prize_currency: 'USD', deadline: plusDays(45), category: 'Data Science', skills_required: ['Python', 'Machine Learning', 'Statistics', 'Data Visualization'], platform: 'Kaggle', apply_url: 'https://www.kaggle.com/competitions', eligibility: 'Global, all levels', team_size: 'Both', is_remote: true, is_global: true, organizer: 'Kaggle' },
  { title: 'HackerEarth Backend Engineering Sprint', description: 'Design high-performance APIs handling millions of concurrent requests. Real-world system design problems judged on efficiency, scalability, and code quality.', prize_amount: 5000, prize_currency: 'USD', deadline: plusDays(5), category: 'Coding', skills_required: ['Node.js', 'Python', 'System Design', 'Algorithms', 'SQL'], platform: 'HackerEarth', apply_url: 'https://www.hackerearth.com/challenges/', eligibility: 'India & Global', team_size: 'Solo', is_remote: true, is_global: false, organizer: 'HackerEarth' },
  { title: 'Figma Community Accessibility Design Award', description: 'Create original UI/UX designs that solve real accessibility problems. Submissions judged on creativity, usability research depth, and measurable impact on users with disabilities.', prize_amount: 10000, prize_currency: 'USD', deadline: plusDays(30), category: 'Design', skills_required: ['Figma', 'UI/UX', 'Accessibility', 'Prototyping', 'User Research'], platform: 'Figma Community', apply_url: 'https://www.figma.com/community', eligibility: 'Global, students & professionals', team_size: 'Both', is_remote: true, is_global: true, organizer: 'Figma' },
  { title: 'NASA Space Apps Challenge 2025', description: 'Tackle NASA-defined challenges around Earth observation, space science, and sustainability using real NASA datasets. Build apps, visualizations, or hardware prototypes to address global problems.', prize_amount: 35000, prize_currency: 'USD', deadline: plusDays(22), category: 'Science', skills_required: ['Python', 'Data Visualization', 'React', 'Machine Learning', 'GIS'], platform: 'NASA', apply_url: 'https://www.spaceappschallenge.org/', eligibility: 'Global, all ages', team_size: 'Team', is_remote: true, is_global: true, organizer: 'NASA' },
  { title: 'Unstop National Startup Pitch Competition', description: 'Present your startup idea to top VCs and angel investors across India. Win equity-free funding, mentorship from industry leaders, and nationwide media coverage for your venture.', prize_amount: 15000, prize_currency: 'USD', deadline: plusDays(12), category: 'Business', skills_required: ['Business Strategy', 'Presentation', 'Finance', 'Market Research'], platform: 'Unstop', apply_url: 'https://unstop.com/competitions', eligibility: 'India, students & early-stage founders', team_size: 'Both', is_remote: false, is_global: false, organizer: 'Unstop' },
  { title: 'Meta Open Source Hackathon', description: 'Build meaningful open-source tools using Meta\'s React, PyTorch, or Llama ecosystems. Winning projects receive $30K in prizes, potential Meta collaboration, and a feature in the Developer blog.', prize_amount: 30000, prize_currency: 'USD', deadline: plusDays(35), category: 'Hackathon', skills_required: ['React', 'Python', 'PyTorch', 'Open Source', 'LLMs'], platform: 'Devpost', apply_url: 'https://devpost.com/hackathons', eligibility: 'Global, 18+', team_size: 'Both', is_remote: true, is_global: true, organizer: 'Meta' },
  { title: 'Topcoder Algorithm Championship', description: 'Five rounds of intense algorithmic challenges spanning dynamic programming, graph theory, and competitive programming. Rated competition counts toward Topcoder world rankings.', prize_amount: 3000, prize_currency: 'USD', deadline: plusDays(6), category: 'Coding', skills_required: ['Algorithms', 'Data Structures', 'C++', 'Java', 'Mathematics'], platform: 'Topcoder', apply_url: 'https://www.topcoder.com/challenges', eligibility: 'Global', team_size: 'Solo', is_remote: true, is_global: true, organizer: 'Topcoder' },
  { title: 'Developer Documentation Grant', description: 'Write comprehensive tutorials, API references, or technical guides for emerging developer tools. Grants of $2K–$8K based on scope, quality, and community impact of your documentation.', prize_amount: 8000, prize_currency: 'USD', deadline: plusDays(40), category: 'Writing', skills_required: ['Technical Writing', 'Documentation', 'Markdown', 'API Knowledge'], platform: 'GitHub', apply_url: 'https://github.com/readme', eligibility: 'Global', team_size: 'Solo', is_remote: true, is_global: true, organizer: 'GitHub ReadME' },
  { title: 'Chainlink Web3 × AI Hackathon', description: 'Build decentralized applications at the intersection of AI and blockchain using Chainlink oracles. $75K total prize pool for the most innovative combinations of on-chain and off-chain AI capabilities.', prize_amount: 75000, prize_currency: 'USD', deadline: plusDays(28), category: 'Hackathon', skills_required: ['Solidity', 'Python', 'Machine Learning', 'Web3', 'JavaScript'], platform: 'Chainlink', apply_url: 'https://chain.link/hackathon', eligibility: 'Global, 18+', team_size: 'Team', is_remote: true, is_global: true, organizer: 'Chainlink Labs' },
  { title: 'MLH Local Hack Day — Build', description: 'A 24-hour global hackathon hosted simultaneously at hundreds of campus chapters. Build anything you can dream up using any technology, with mentorship from experienced engineers throughout.', prize_amount: 2000, prize_currency: 'USD', deadline: plusDays(9), category: 'Hackathon', skills_required: ['Any programming language', 'Creativity', 'Rapid Prototyping'], platform: 'MLH', apply_url: 'https://mlh.io/seasons/2025/events', eligibility: 'Students worldwide', team_size: 'Team', is_remote: true, is_global: true, organizer: 'Major League Hacking' },
  { title: 'HackerRank Data Structures Championship', description: 'Solve 30 progressive data structures and algorithms challenges over 30 days. Top performers receive cash prizes, HackerRank Gold certification, and referrals to top tech companies.', prize_amount: 2500, prize_currency: 'USD', deadline: plusDays(3), category: 'Coding', skills_required: ['Algorithms', 'Data Structures', 'SQL', 'Problem Solving'], platform: 'HackerRank', apply_url: 'https://www.hackerrank.com/contests', eligibility: 'Global', team_size: 'Solo', is_remote: true, is_global: true, organizer: 'HackerRank' },
]

// ─── Main search entry point ──────────────────────────────────────────────────

export async function searchCompetitions(profile, { force = false } = {}) {
  // Serve from cache unless forced refresh
  if (!force) {
    const cached = getCachedResults(profile)
    if (cached) return { data: cached.data, fromCache: true, cachedAt: cached.ts }
  }

  let raw = []

  // Try Anthropic first (has real web_search)
  const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY || import.meta.env.DEV
  if (anthropicKey) {
    try { raw = await callAnthropic(profile) } catch (e) { console.warn('[CIQ] Anthropic failed:', e.message) }
  }

  // Fall back to Groq
  if (raw.length < 5) {
    const groqKey = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.DEV
    if (groqKey) {
      try { raw = await callGroq(profile) } catch (e) { console.warn('[CIQ] Groq failed:', e.message) }
    }
  }

  // Final fallback — mock data
  if (raw.length < 5) raw = MOCK

  const data = raw
    .filter(c => c && c.title)
    .map((c, i) => ({
      ...c,
      id: c.id || `ciq-${Date.now()}-${i}`,
      matchScore: computeMatchScore(c, profile),
    }))

  setCache(data, profile)
  return { data, fromCache: false, cachedAt: Date.now() }
}
