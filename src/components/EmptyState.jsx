import { useNavigate } from 'react-router-dom'
import { Search, Trophy, Bookmark, Frown } from 'lucide-react'

const CONFIGS = {
  noSearch: {
    icon: Search,
    title: 'Ready to discover competitions?',
    desc: 'Set up your profile then hit "Search Now" — our AI will find competitions tailored to your skills and interests.',
    cta: 'Set up profile →',
    ctaAction: 'profile',
    color: '#6366F1',
  },
  noResults: {
    icon: Frown,
    title: 'No competitions match your filters',
    desc: 'Try relaxing the filters — reduce the minimum match score or expand the category selection.',
    cta: 'Reset filters',
    ctaAction: 'reset',
    color: '#F59E0B',
  },
  noProfile: {
    icon: Trophy,
    title: 'No profile set up yet',
    desc: 'Add your skills and interests so we can show you a personalised match score for every competition.',
    cta: 'Build your profile →',
    ctaAction: 'profile',
    color: '#10B981',
  },
  noSaved: {
    icon: Bookmark,
    title: 'No saved competitions yet',
    desc: 'Start discovering competitions and bookmark the ones you like. Track your applications here.',
    cta: 'Discover competitions →',
    ctaAction: 'discover',
    color: '#6366F1',
  },
}

export default function EmptyState({ type = 'noSearch', onReset }) {
  const navigate = useNavigate()
  const cfg = CONFIGS[type]
  const Icon = cfg.icon

  function handleCta() {
    if (cfg.ctaAction === 'reset') onReset?.()
    else if (cfg.ctaAction === 'profile') navigate('/profile')
    else if (cfg.ctaAction === 'discover') navigate('/')
  }

  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}30` }}
      >
        <Icon size={34} style={{ color: cfg.color }} />
      </div>
      <h3 className="font-display font-semibold text-xl text-white mb-2">{cfg.title}</h3>
      <p className="text-white/50 text-sm max-w-sm mb-6 leading-relaxed">{cfg.desc}</p>
      <button className="btn-primary" onClick={handleCta}>
        {cfg.cta}
      </button>
    </div>
  )
}
