import { useState, useEffect, useMemo } from 'react'
import { Search, RefreshCw, Zap, SlidersHorizontal, X, Clock } from 'lucide-react'
import CompetitionCard from '../components/CompetitionCard'
import CompetitionModal from '../components/CompetitionModal'
import FilterSidebar from '../components/FilterSidebar'
import SkeletonGrid from '../components/SkeletonCard'
import EmptyState from '../components/EmptyState'
import { searchCompetitions, getCachedResults, clearCache } from '../lib/searchApi'
import { getProfile, saveCompetition, getSavedCompetitions } from '../lib/supabase'
import { useToast } from '../hooks/useToast'

const DEFAULT_FILTERS = {
  categories: [], maxPrize: 100000, deadlineDays: 0,
  minMatch: 0, remoteOnly: false, teamSize: 'Both', sort: 'matchScore',
}

function applyFilters(list, f) {
  let out = [...list]
  if (f.categories.length > 0) out = out.filter(c => f.categories.includes(c.category))
  if (f.maxPrize < 100000) out = out.filter(c => (c.prize_amount || 0) <= f.maxPrize)
  if (f.deadlineDays > 0) {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() + f.deadlineDays)
    out = out.filter(c => c.deadline && new Date(c.deadline) <= cutoff && new Date(c.deadline) >= new Date())
  }
  if (f.minMatch > 0) out = out.filter(c => (c.matchScore || 0) >= f.minMatch)
  if (f.remoteOnly) out = out.filter(c => c.is_remote)
  if (f.teamSize && f.teamSize !== 'Both') out = out.filter(c => c.team_size === f.teamSize || c.team_size === 'Both')
  switch (f.sort) {
    case 'prize': out.sort((a, b) => (b.prize_amount || 0) - (a.prize_amount || 0)); break
    case 'deadline': out.sort((a, b) => { if (!a.deadline) return 1; if (!b.deadline) return -1; return new Date(a.deadline) - new Date(b.deadline) }); break
    case 'matchScore': default: out.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
  }
  return out
}

function timeSince(ts) {
  const mins = Math.floor((Date.now() - ts) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

export default function Discover() {
  const [profile, setProfile] = useState(null)
  const [competitions, setCompetitions] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [cachedAt, setCachedAt] = useState(null)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [savedIds, setSavedIds] = useState(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [selectedComp, setSelectedComp] = useState(null)
  const { addToast } = useToast()

  // Load profile + saved IDs + check cache on mount
  useEffect(() => {
    Promise.all([
      getProfile().catch(() => null),
      getSavedCompetitions().catch(() => []),
    ]).then(([p, saved]) => {
      setProfile(p)
      setSavedIds(new Set(saved.map(s => s.competition_data?.id).filter(Boolean)))

      // Restore cached results
      const cache = getCachedResults(p)
      if (cache) {
        setCompetitions(cache.data)
        setSearched(true)
        setCachedAt(cache.ts)
      }
    })
  }, [])

  const filtered = useMemo(() => applyFilters(competitions, filters), [competitions, filters])

  function setFilter(key, val) { setFilters(f => ({ ...f, [key]: val })) }

  async function handleSearch(force = false) {
    setLoading(true)
    setSearched(true)
    try {
      const { data, fromCache, cachedAt: ts } = await searchCompetitions(profile, { force })
      setCompetitions(data)
      setCachedAt(ts)
      if (fromCache) addToast('Showing cached results', 'info')
      else addToast(`Found ${data.length} competitions!`, 'success')
    } catch (err) {
      addToast('Search failed — check API key in .env', 'error')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleRefresh() {
    clearCache()
    await handleSearch(true)
  }

  async function handleSave(competition) {
    if (savedIds.has(competition.id)) { addToast('Already saved', 'info'); return }
    try {
      await saveCompetition(competition)
      setSavedIds(prev => new Set([...prev, competition.id]))
      addToast(`Saved "${competition.title}"`, 'success')
    } catch { addToast('Failed to save', 'error') }
  }

  const hasProfile = Boolean(profile?.skills?.length)
  const hasKey = Boolean(import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_ANTHROPIC_API_KEY || import.meta.env.DEV)

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="hero-glow relative py-14 sm:py-20 px-4 text-center overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-xs font-medium" style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#818CF8' }}>
            <Zap size={11} /> AI-Powered Discovery
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white mb-4 leading-tight tracking-tight">
            Find Competitions<br />
            <span className="gradient-text">Built For You</span>
          </h1>

          <p className="text-white/50 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            {hasProfile
              ? `Personalised for your skills in ${profile.skills.slice(0, 3).join(', ')}${profile.skills.length > 3 ? ' & more' : ''}`
              : 'Set up your profile to unlock personalised match scores for every competition.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={() => handleSearch()} disabled={loading} className="btn-primary text-base px-8 py-3.5">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Searching…</>
              ) : (
                <><Search size={17} /> Search Now</>
              )}
            </button>

            {searched && !loading && (
              <button onClick={handleRefresh} className="btn-secondary text-sm" title="Force fresh search">
                <RefreshCw size={14} /> Refresh
              </button>
            )}

            {!hasProfile && (
              <a href="/profile" className="btn-secondary text-sm">Set up profile →</a>
            )}
          </div>

          {/* Status line */}
          <div className="mt-4 flex items-center justify-center gap-3 flex-wrap text-xs text-white/30">
            {!hasKey && (
              <span>No API key — showing demo results. Add <code className="text-indigo-400">GROQ_API_KEY</code> to .env for live AI search.</span>
            )}
            {cachedAt && !loading && (
              <span className="flex items-center gap-1">
                <Clock size={10} /> Loaded <span className="text-white/50">{timeSince(cachedAt)}</span> — refreshes every 30 min
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── Mobile filter toggle ── */}
      {searched && competitions.length > 0 && (
        <div className="lg:hidden flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-xs text-white/40">{filtered.length} of {competitions.length}</span>
          <button className="btn-secondary text-xs" style={{ padding: '0.375rem 0.75rem' }} onClick={() => setShowFilters(v => !v)}>
            <SlidersHorizontal size={13} /> Filters {showFilters && <X size={11} />}
          </button>
        </div>
      )}

      {/* ── Main content ── */}
      {(searched || loading) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex gap-6 items-start">
            {/* Sidebar */}
            <div className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-60 flex-shrink-0`}>
              <FilterSidebar
                filters={filters}
                onChange={setFilter}
                onReset={() => setFilters(DEFAULT_FILTERS)}
                count={filtered.length}
              />
            </div>

            {/* Grid */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4"><SkeletonGrid count={6} /></div>
              ) : filtered.length === 0 ? (
                <EmptyState type="noResults" onReset={() => setFilters(DEFAULT_FILTERS)} />
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map((comp, i) => (
                    <div key={comp.id || i} style={{ animationDelay: `${Math.min(i * 35, 350)}ms`, opacity: 0, animation: 'fadeIn 0.4s ease-out forwards' }}>
                      <CompetitionCard
                        competition={comp}
                        onSave={handleSave}
                        isSaved={savedIds.has(comp.id)}
                        onClick={setSelectedComp}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pre-search */}
      {!searched && !loading && (
        <EmptyState type={hasProfile ? 'noSearch' : 'noProfile'} />
      )}

      {/* Competition modal */}
      {selectedComp && (
        <CompetitionModal
          competition={selectedComp}
          onClose={() => setSelectedComp(null)}
          onSave={handleSave}
          isSaved={savedIds.has(selectedComp.id)}
        />
      )}
    </div>
  )
}
