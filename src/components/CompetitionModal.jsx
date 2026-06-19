import { useEffect, useCallback } from 'react'
import { X, ExternalLink, Bookmark, BookmarkCheck, Share2, Trophy, Clock, Users, Tag, Building, Globe, CalendarDays } from 'lucide-react'
import { MatchRing } from './MatchScoreRing'
import { formatPrize, getDeadlineInfo } from '../lib/searchApi'
import { useToast } from '../hooks/useToast'

const CATEGORY_COLORS = {
  Hackathon: '#818CF8', Coding: '#22D3EE', Design: '#F472B6',
  Writing: '#FCD34D', 'Data Science': '#34D399', Science: '#A78BFA', Business: '#FB923C',
}

export default function CompetitionModal({ competition, onClose, onSave, isSaved }) {
  const { addToast } = useToast()
  const deadline = getDeadlineInfo(competition.deadline)
  const prize = formatPrize(competition.prize_amount, competition.prize_currency)
  const catColor = CATEGORY_COLORS[competition.category] || '#818CF8'

  // Keyboard + scroll lock
  const handleKey = useCallback(e => { if (e.key === 'Escape') onClose() }, [onClose])
  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [handleKey])

  async function handleShare() {
    const text = `${competition.title} — ${prize} prize | Apply: ${competition.apply_url}`
    try {
      if (navigator.share) {
        await navigator.share({ title: competition.title, text, url: competition.apply_url })
      } else {
        await navigator.clipboard.writeText(text)
        addToast('Copied to clipboard!', 'success')
      }
    } catch {}
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Panel */}
      <div
        className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl animate-slide-up"
        style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
      >
        {/* Header bar */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 border-b"
          style={{ background: '#111827', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-1 rounded-md" style={{ background: `${catColor}18`, color: catColor, border: `1px solid ${catColor}30` }}>
              {competition.category}
            </span>
            {competition.is_remote && (
              <span className="text-xs px-2 py-1 rounded-md" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}>
                Remote
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pt-5 pb-6">
          {/* Title + match ring */}
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-1">
              <h2 className="font-display font-bold text-xl text-white leading-snug mb-1">
                {competition.title}
              </h2>
              {competition.organizer && (
                <p className="text-sm text-white/40 flex items-center gap-1.5">
                  <Building size={12} /> {competition.organizer}
                </p>
              )}
            </div>
            <MatchRing score={competition.matchScore ?? 0} size={68} />
          </div>

          {/* Description */}
          <p className="text-sm text-white/65 leading-relaxed mb-5">
            {competition.description}
          </p>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <StatBox icon={<Trophy size={15} style={{ color: '#10B981' }} />} label="Prize">
              <span className="text-base font-bold" style={{ color: '#10B981' }}>{prize}</span>
            </StatBox>

            <StatBox
              icon={<Clock size={15} className={deadline.isUrgent ? 'text-red-400' : 'text-white/40'} />}
              label="Deadline"
            >
              {deadline.isUrgent ? (
                <span className="text-sm font-bold text-red-400">⚡ {deadline.label}</span>
              ) : deadline.isExpired ? (
                <span className="text-sm text-white/30 line-through">{deadline.label}</span>
              ) : deadline.isClosingSoon ? (
                <span className="text-sm font-semibold text-amber-400">{deadline.label}</span>
              ) : (
                <span className="text-sm font-medium text-white/80">{deadline.label}</span>
              )}
            </StatBox>

            <StatBox icon={<Users size={15} className="text-indigo-400" />} label="Team">
              <span className="text-sm font-medium text-white/80">{competition.team_size || 'Any'}</span>
            </StatBox>
          </div>

          {/* Skills */}
          {competition.skills_required?.length > 0 && (
            <div className="mb-4">
              <p className="label mb-2">Skills required</p>
              <div className="flex flex-wrap gap-1.5">
                {competition.skills_required.map(s => (
                  <span key={s} className="tag" style={{ background: 'rgba(99,102,241,0.1)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.75rem' }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Meta info */}
          <div className="grid sm:grid-cols-2 gap-3 mb-5 text-sm">
            {competition.eligibility && (
              <MetaRow icon={<Globe size={13} />} label="Eligibility" value={competition.eligibility} />
            )}
            {competition.platform && (
              <MetaRow icon={<Tag size={13} />} label="Platform" value={competition.platform} />
            )}
            {competition.deadline && (
              <MetaRow
                icon={<CalendarDays size={13} />}
                label="Closes"
                value={new Date(competition.deadline).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleShare}
              className="btn-secondary flex-shrink-0"
              style={{ padding: '0.625rem 1rem', fontSize: '0.875rem' }}
            >
              <Share2 size={14} /> Share
            </button>

            <button
              onClick={() => onSave?.(competition)}
              className="btn-secondary flex-shrink-0"
              style={isSaved ? { padding: '0.625rem 1rem', fontSize: '0.875rem', color: '#6366F1', borderColor: 'rgba(99,102,241,0.4)' } : { padding: '0.625rem 1rem', fontSize: '0.875rem' }}
            >
              {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
              {isSaved ? 'Saved' : 'Save'}
            </button>

            <a
              href={competition.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex-1 justify-center"
              style={{ minWidth: 120, fontSize: '0.9rem' }}
            >
              Apply Now <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatBox({ icon, label, children }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs text-white/40 font-medium">{label}</span>
      </div>
      {children}
    </div>
  )
}

function MetaRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2 text-white/50">
      <span className="mt-0.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>{icon}</span>
      <div>
        <span className="text-xs text-white/30 block">{label}</span>
        <span className="text-sm text-white/70">{value}</span>
      </div>
    </div>
  )
}
