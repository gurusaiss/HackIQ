import { useState, useEffect, useMemo } from 'react'
import { Bookmark, Trash2, ExternalLink, Clock, Trophy, ChevronDown, Filter } from 'lucide-react'
import { getSavedCompetitions, updateCompetitionStatus, removeCompetition } from '../lib/supabase'
import { formatPrize, getDeadlineInfo } from '../lib/searchApi'
import EmptyState from '../components/EmptyState'
import CompetitionModal from '../components/CompetitionModal'
import { useToast } from '../hooks/useToast'

const STATUSES = ['All', 'Bookmarked', 'Applied', 'Won']
const STATUS_STYLES = {
  Bookmarked: { bg: 'rgba(99,102,241,0.12)',  color: '#818CF8', border: 'rgba(99,102,241,0.3)' },
  Applied:    { bg: 'rgba(245,158,11,0.12)',  color: '#FCD34D', border: 'rgba(245,158,11,0.3)' },
  Won:        { bg: 'rgba(16,185,129,0.12)',  color: '#34D399', border: 'rgba(16,185,129,0.3)' },
}

function SavedCard({ item, onStatusChange, onRemove, onView }) {
  const comp = item.competition_data || {}
  const deadline = getDeadlineInfo(comp.deadline)
  const prize = formatPrize(comp.prize_amount, comp.prize_currency)
  const s = STATUS_STYLES[item.status] || STATUS_STYLES.Bookmarked
  const savedDate = new Date(item.saved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <article className="card card-hover flex flex-col animate-fade-in cursor-pointer" style={{ padding: '1.125rem' }} onClick={() => onView(comp)}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span className="text-xs text-white/30 block mb-1">Saved {savedDate}</span>
          <h3 className="font-display font-semibold text-white text-sm leading-snug line-clamp-2">
            {comp.title || 'Untitled Competition'}
          </h3>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onRemove(item.id) }}
          className="text-white/15 hover:text-red-400 transition-colors flex-shrink-0 p-1 -mr-1 -mt-0.5"
          title="Remove"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Prize + deadline */}
      <div className="flex flex-wrap gap-3 mb-2 text-sm">
        <span className="flex items-center gap-1">
          <Trophy size={11} style={{ color: '#10B981' }} />
          <span className="font-bold text-xs" style={{ color: '#10B981' }}>{prize}</span>
        </span>
        <span className="flex items-center gap-1">
          <Clock size={11} className="text-white/30" />
          {deadline.isUrgent
            ? <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.12)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)' }}>⚡ {deadline.label}</span>
            : deadline.isExpired
            ? <span className="text-xs text-white/25 line-through">{deadline.label}</span>
            : <span className="text-xs text-white/40">{deadline.label}</span>
          }
        </span>
      </div>

      {/* Category + platform */}
      <p className="text-xs text-white/30 mb-3">{[comp.category, comp.platform].filter(Boolean).join(' · ')}</p>

      {/* Status + Apply */}
      <div className="flex gap-2 mt-auto" onClick={e => e.stopPropagation()}>
        <div className="relative flex-1">
          <select
            value={item.status}
            onChange={e => onStatusChange(item.id, e.target.value)}
            className="w-full appearance-none px-3 py-1.5 rounded-lg text-xs font-semibold pr-7 cursor-pointer outline-none"
            style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
          >
            {['Bookmarked', 'Applied', 'Won'].map(st => <option key={st} value={st}>{st}</option>)}
          </select>
          <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: s.color }} />
        </div>
        {comp.apply_url && (
          <a href={comp.apply_url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs" style={{ padding: '0.375rem 0.625rem' }} onClick={e => e.stopPropagation()}>
            <ExternalLink size={11} />
          </a>
        )}
      </div>
    </article>
  )
}

function StatsRow({ items, activeFilter, onFilter }) {
  const counts = { All: items.length, Bookmarked: 0, Applied: 0, Won: 0 }
  items.forEach(i => { counts[i.status] = (counts[i.status] || 0) + 1 })
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {STATUSES.map(s => {
        const st = s === 'All' ? null : STATUS_STYLES[s]
        const isActive = activeFilter === s
        return (
          <button
            key={s}
            onClick={() => onFilter(s)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={isActive && st
              ? { background: st.bg, color: st.color, border: `1px solid ${st.border}` }
              : isActive
              ? { background: 'rgba(99,102,241,0.15)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.3)' }
              : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }
            }
          >
            <span className="font-bold">{counts[s] ?? 0}</span>
            <span className="text-xs">{s}</span>
          </button>
        )
      })}
    </div>
  )
}

export default function Saved() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')
  const [viewComp, setViewComp] = useState(null)
  const { addToast } = useToast()

  useEffect(() => {
    getSavedCompetitions()
      .then(setItems)
      .catch(() => addToast('Failed to load saved competitions', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const visible = useMemo(
    () => statusFilter === 'All' ? items : items.filter(i => i.status === statusFilter),
    [items, statusFilter]
  )

  async function handleStatusChange(id, status) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i))
    try { await updateCompetitionStatus(id, status); addToast(`Marked as ${status}`, 'success') }
    catch { addToast('Failed to update status', 'error') }
  }

  async function handleRemove(id) {
    setItems(prev => prev.filter(i => i.id !== id))
    try { await removeCompetition(id); addToast('Removed', 'info') }
    catch { addToast('Failed to remove', 'error') }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
          <Bookmark size={19} className="text-indigo-400" />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Saved Competitions</h1>
          <p className="text-sm text-white/40 mt-0.5">Track applications and wins</p>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState type="noSaved" />
      ) : (
        <>
          <StatsRow items={items} activeFilter={statusFilter} onFilter={setStatusFilter} />

          {visible.length === 0 ? (
            <div className="text-center py-16 text-white/30">
              <Filter size={32} className="mx-auto mb-3 opacity-30" />
              <p>No {statusFilter.toLowerCase()} competitions yet</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {visible.map(item => (
                <SavedCard
                  key={item.id}
                  item={item}
                  onStatusChange={handleStatusChange}
                  onRemove={handleRemove}
                  onView={comp => setViewComp({ ...comp, matchScore: comp.matchScore ?? 50 })}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Detail modal */}
      {viewComp && (
        <CompetitionModal
          competition={viewComp}
          onClose={() => setViewComp(null)}
          isSaved
        />
      )}
    </div>
  )
}
