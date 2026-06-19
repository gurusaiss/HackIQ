import { SlidersHorizontal, X } from 'lucide-react'

const CATEGORIES = ['Hackathon', 'Coding', 'Design', 'Writing', 'Data Science', 'Science', 'Business']
const DEADLINES = [
  { value: 7, label: 'This week' },
  { value: 30, label: 'This month' },
  { value: 90, label: 'Next 3 months' },
  { value: 0, label: 'Any time' },
]
const SKILL_THRESHOLDS = [50, 70, 90]
const TEAM_SIZES = ['Solo', 'Team', 'Both']
const SORT_OPTIONS = [
  { value: 'matchScore', label: 'Match Score' },
  { value: 'prize', label: 'Prize Money' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'newest', label: 'Newest' },
]

export default function FilterSidebar({ filters, onChange, onReset, count }) {
  function toggle(key, val) {
    const cur = filters[key] || []
    onChange(key, cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val])
  }

  return (
    <aside
      className="card h-fit sticky top-24"
      style={{ padding: '1.25rem', minWidth: 220 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-indigo-400" />
          <span className="font-semibold text-sm text-white">Filters</span>
        </div>
        <div className="flex items-center gap-2">
          {count !== undefined && (
            <span className="text-xs text-white/40">{count} results</span>
          )}
          <button onClick={onReset} className="text-xs text-white/40 hover:text-indigo-400 transition-colors flex items-center gap-1">
            <X size={12} /> Reset
          </button>
        </div>
      </div>

      {/* Sort */}
      <Section title="Sort by">
        <select
          value={filters.sort}
          onChange={e => onChange('sort', e.target.value)}
          className="input text-sm"
          style={{ padding: '0.5rem 0.75rem' }}
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </Section>

      {/* Category */}
      <Section title="Category">
        <div className="flex flex-col gap-1.5">
          {CATEGORIES.map(cat => (
            <label key={cat} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={(filters.categories || []).includes(cat)}
                onChange={() => toggle('categories', cat)}
                className="w-3.5 h-3.5 rounded accent-indigo-500"
              />
              <span className="text-sm text-white/60 group-hover:text-white/90 transition-colors">{cat}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* Prize range */}
      <Section title={`Prize: $${(filters.minPrize ?? 0).toLocaleString()} – $${(filters.maxPrize ?? 100000).toLocaleString()}+`}>
        <input
          type="range" min={0} max={100000} step={1000}
          value={filters.maxPrize ?? 100000}
          onChange={e => onChange('maxPrize', Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-white/30 mt-1">
          <span>$0</span><span>$100K+</span>
        </div>
      </Section>

      {/* Deadline */}
      <Section title="Deadline">
        <div className="flex flex-col gap-1.5">
          {DEADLINES.map(d => (
            <label key={d.value} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="deadline"
                checked={filters.deadlineDays === d.value}
                onChange={() => onChange('deadlineDays', d.value)}
                className="accent-indigo-500"
              />
              <span className="text-sm text-white/60 group-hover:text-white/90 transition-colors">{d.label}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* Skill match */}
      <Section title="Min match score">
        <div className="flex gap-2">
          {SKILL_THRESHOLDS.map(t => (
            <button
              key={t}
              onClick={() => onChange('minMatch', filters.minMatch === t ? 0 : t)}
              className="flex-1 py-1.5 rounded-md text-xs font-semibold transition-all duration-150"
              style={filters.minMatch === t
                ? { background: '#6366F1', color: '#fff' }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }
              }
            >
              {t}%+
            </button>
          ))}
        </div>
      </Section>

      {/* Remote only */}
      <Section title="">
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={filters.remoteOnly}
            onChange={e => onChange('remoteOnly', e.target.checked)}
            className="w-3.5 h-3.5 rounded accent-indigo-500"
          />
          <span className="text-sm text-white/60 group-hover:text-white/90 transition-colors">Remote only</span>
        </label>
      </Section>

      {/* Team size */}
      <Section title="Team size">
        <div className="flex flex-col gap-1.5">
          {TEAM_SIZES.map(sz => (
            <label key={sz} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="teamSize"
                checked={filters.teamSize === sz || (!filters.teamSize && sz === 'Both')}
                onChange={() => onChange('teamSize', sz)}
                className="accent-indigo-500"
              />
              <span className="text-sm text-white/60 group-hover:text-white/90 transition-colors">{sz}</span>
            </label>
          ))}
        </div>
      </Section>
    </aside>
  )
}

function Section({ title, children }) {
  return (
    <div className="mb-5">
      {title && <p className="label mb-2">{title}</p>}
      {children}
    </div>
  )
}
