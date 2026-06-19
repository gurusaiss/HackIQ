import { useState } from 'react'
import { ExternalLink, Bookmark, BookmarkCheck, Clock, Users, Trophy, Tag, ChevronRight } from 'lucide-react'
import { MatchRing } from './MatchScoreRing'
import { formatPrize, getDeadlineInfo } from '../lib/searchApi'

const CATEGORY_COLORS = {
  Hackathon:     { bg: 'rgba(99,102,241,0.12)',  text: '#818CF8', border: 'rgba(99,102,241,0.25)' },
  Coding:        { bg: 'rgba(6,182,212,0.10)',   text: '#22D3EE', border: 'rgba(6,182,212,0.25)' },
  Design:        { bg: 'rgba(236,72,153,0.10)',  text: '#F472B6', border: 'rgba(236,72,153,0.25)' },
  Writing:       { bg: 'rgba(245,158,11,0.10)',  text: '#FCD34D', border: 'rgba(245,158,11,0.25)' },
  'Data Science':{ bg: 'rgba(16,185,129,0.10)',  text: '#34D399', border: 'rgba(16,185,129,0.25)' },
  Science:       { bg: 'rgba(139,92,246,0.10)',  text: '#A78BFA', border: 'rgba(139,92,246,0.25)' },
  Business:      { bg: 'rgba(251,146,60,0.10)',  text: '#FB923C', border: 'rgba(251,146,60,0.25)' },
}

export default function CompetitionCard({ competition, onSave, isSaved, onClick }) {
  const [saving, setSaving] = useState(false)
  const deadline = getDeadlineInfo(competition.deadline)
  const prize = formatPrize(competition.prize_amount, competition.prize_currency)
  const cat = CATEGORY_COLORS[competition.category] || CATEGORY_COLORS.Hackathon

  async function handleSave(e) {
    e.stopPropagation()
    setSaving(true)
    await onSave?.(competition)
    setSaving(false)
  }

  return (
    <article
      className="card card-hover flex flex-col h-full cursor-pointer"
      style={{ padding: '1.125rem' }}
      onClick={() => onClick?.(competition)}
    >
      {/* Top: category + remote + match ring */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          <span className="tag" style={{ background: cat.bg, color: cat.text, border: `1px solid ${cat.border}`, fontSize: '0.7rem' }}>
            {competition.category}
          </span>
          {competition.is_remote && (
            <span className="tag" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)', fontSize: '0.7rem' }}>
              Remote
            </span>
          )}
        </div>
        <MatchRing score={competition.matchScore ?? 0} size={52} />
      </div>

      {/* Title */}
      <h3 className="font-display font-semibold text-white text-sm leading-snug mb-1.5 line-clamp-2">
        {competition.title}
      </h3>

      {/* Description */}
      <p className="text-xs text-white/45 leading-relaxed mb-3 line-clamp-2 flex-1">
        {competition.description}
      </p>

      {/* Prize + Deadline */}
      <div className="flex flex-wrap items-center gap-3 mb-2.5">
        <div className="flex items-center gap-1">
          <Trophy size={12} style={{ color: '#10B981', flexShrink: 0 }} />
          <span className="text-sm font-bold" style={{ color: '#10B981' }}>{prize}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={11} className="flex-shrink-0 text-white/35" />
          {deadline.isUrgent ? (
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.12)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)' }}>
              ⚡ {deadline.label}
            </span>
          ) : deadline.isExpired ? (
            <span className="text-xs text-white/25 line-through">{deadline.label}</span>
          ) : deadline.isClosingSoon ? (
            <span className="text-xs font-medium" style={{ color: '#FBBF24' }}>{deadline.label}</span>
          ) : (
            <span className="text-xs text-white/40">{deadline.label}</span>
          )}
        </div>
      </div>

      {/* Skills */}
      {competition.skills_required?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {competition.skills_required.slice(0, 3).map(s => (
            <span key={s} className="tag" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.07)', fontSize: '0.68rem' }}>
              {s}
            </span>
          ))}
          {competition.skills_required.length > 3 && (
            <span className="text-xs text-white/25">+{competition.skills_required.length - 3}</span>
          )}
        </div>
      )}

      {/* Platform */}
      <div className="flex items-center gap-2 mb-3 text-xs text-white/30">
        <span className="flex items-center gap-1"><Tag size={10} />{competition.platform}</span>
        {competition.team_size && <span className="flex items-center gap-1"><Users size={10} />{competition.team_size}</span>}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto" onClick={e => e.stopPropagation()}>
        <button
          onClick={handleSave}
          disabled={saving}
          title={isSaved ? 'Saved' : 'Save'}
          className="btn-secondary flex-shrink-0 px-3"
          style={{ padding: '0.45rem 0.75rem' }}
        >
          {isSaved
            ? <BookmarkCheck size={13} style={{ color: '#6366F1' }} />
            : <Bookmark size={13} />
          }
        </button>

        <button
          onClick={() => onClick?.(competition)}
          className="btn-secondary flex-1 justify-center text-xs gap-1"
          style={{ padding: '0.45rem 0.75rem' }}
        >
          Details <ChevronRight size={12} />
        </button>

        <a
          href={competition.apply_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary flex-shrink-0"
          style={{ padding: '0.45rem 0.875rem', fontSize: '0.8rem' }}
          onClick={e => e.stopPropagation()}
        >
          Apply <ExternalLink size={11} />
        </a>
      </div>
    </article>
  )
}
