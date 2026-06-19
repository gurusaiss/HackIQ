import { useState, useEffect } from 'react'
import { User, Save, CheckCircle, Sparkles, AlertCircle } from 'lucide-react'
import TagInput from '../components/TagInput'
import { getProfile, saveProfile } from '../lib/supabase'
import { useToast } from '../hooks/useToast'

const SKILL_SUGGESTIONS = [
  'Python', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Vue',
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'scikit-learn',
  'SQL', 'MongoDB', 'PostgreSQL', 'Figma', 'UI/UX', 'Design', 'Photoshop',
  'Illustrator', 'Technical Writing', 'Marketing', 'Business Strategy', 'Finance',
  'Solidity', 'Web3', 'Blockchain', 'Go', 'Rust', 'Java', 'C++', 'Swift',
  'Docker', 'Kubernetes', 'AWS', 'Google Cloud', 'Azure', 'CI/CD',
  'Algorithms', 'Data Structures', 'Statistics', 'R', 'Tableau', 'Power BI',
  'NLP', 'Computer Vision', 'Reinforcement Learning', 'LLMs', 'RAG',
]

const INTEREST_OPTIONS = [
  'AI', 'Web3', 'Health', 'Climate', 'Education', 'Gaming',
  'Finance', 'Social Impact', 'Open Source', 'IoT', 'Space', 'Security',
  'Robotics', 'AR/VR', 'Sustainability', 'Biotech',
]

const EXPERIENCE_LEVELS = ['Student', 'Junior', 'Mid', 'Senior']
const PRIZE_PREFS = ['Cash', 'Job Offer', 'Recognition', 'Swag']
const LOCATIONS = ['India', 'Global', 'Remote']

const EMPTY = { id: 'local-user', name: '', skills: [], interests: [], experience_level: 'Mid', prize_preference: 'Cash', location_preference: 'Global' }

function completionScore(p) {
  let score = 0
  if (p.name?.trim()) score += 20
  if (p.skills?.length >= 3) score += 30
  else if (p.skills?.length > 0) score += 15
  if (p.interests?.length >= 2) score += 20
  else if (p.interests?.length > 0) score += 10
  if (p.experience_level) score += 10
  if (p.prize_preference) score += 10
  if (p.location_preference) score += 10
  return score
}

function CompletionBar({ score }) {
  const color = score >= 80 ? '#10B981' : score >= 50 ? '#F59E0B' : '#6366F1'
  const label = score >= 80 ? 'Profile complete' : score >= 50 ? 'Good start' : 'Incomplete'
  return (
    <div className="card p-4 mb-6 flex items-center gap-4">
      <div className="flex-1">
        <div className="flex justify-between mb-1.5">
          <span className="text-xs text-white/50 font-medium">Profile strength</span>
          <span className="text-xs font-bold" style={{ color }}>{label} — {score}%</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${score}%`, background: color }}
          />
        </div>
      </div>
    </div>
  )
}

export default function Profile() {
  const [profile, setProfile] = useState(EMPTY)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()
  const completion = completionScore(profile)

  useEffect(() => {
    getProfile()
      .then(p => { if (p) setProfile(p) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function set(key, val) { setProfile(p => ({ ...p, [key]: val })); setSaved(false) }

  function toggleInterest(i) {
    const active = profile.interests.includes(i)
    set('interests', active ? profile.interests.filter(x => x !== i) : [...profile.interests, i])
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!profile.name.trim()) { addToast('Please enter your name', 'error'); return }
    if (profile.skills.length === 0) { addToast('Add at least one skill', 'error'); return }
    setSaving(true)
    try {
      await saveProfile(profile)
      setSaved(true)
      // Clear search cache so next search uses updated profile
      try { localStorage.removeItem('ciq_results_v2') } catch {}
      addToast('Profile saved! Your next search will use the updated data.', 'success')
    } catch (err) {
      addToast('Failed to save — check console', 'error')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
          <User size={19} className="text-indigo-400" />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Your Profile</h1>
          <p className="text-sm text-white/40 mt-0.5">Drives personalised match scores and search results</p>
        </div>
      </div>

      <CompletionBar score={completion} />

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        {/* Name */}
        <div className="card p-5">
          <label className="label">Full name</label>
          <input
            className="input"
            value={profile.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Your name"
          />
        </div>

        {/* Skills */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <label className="label mb-0">Skills</label>
            {profile.skills.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(16,185,129,0.12)', color: '#34D399' }}>{profile.skills.length} added</span>
            )}
          </div>
          <TagInput
            tags={profile.skills}
            onChange={v => set('skills', v)}
            suggestions={SKILL_SUGGESTIONS}
            placeholder="Type a skill and press Enter…"
          />
          {profile.skills.length === 0 && (
            <p className="text-xs text-amber-400/70 flex items-center gap-1 mt-2">
              <AlertCircle size={11} /> Add at least 3 skills for best match results
            </p>
          )}
          {/* Quick-add suggestions */}
          <div className="mt-3">
            <p className="text-xs text-white/25 mb-1.5">Popular skills</p>
            <div className="flex flex-wrap gap-1.5">
              {['Python', 'React', 'Machine Learning', 'Figma', 'SQL', 'TypeScript'].filter(s => !profile.skills.includes(s)).map(s => (
                <button key={s} type="button" onClick={() => set('skills', [...profile.skills, s])}
                  className="text-xs px-2 py-1 rounded-md transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  + {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Interests */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <label className="label mb-0">Interests</label>
            {profile.interests.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(16,185,129,0.12)', color: '#34D399' }}>{profile.interests.length} selected</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map(i => {
              const active = profile.interests.includes(i)
              return (
                <button key={i} type="button" onClick={() => toggleInterest(i)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
                  style={active
                    ? { background: 'rgba(99,102,241,0.2)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.4)' }
                    : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }
                  }
                >
                  {i}
                </button>
              )
            })}
          </div>
        </div>

        {/* Preferences */}
        <div className="card p-5">
          <div className="grid sm:grid-cols-3 gap-6">
            <RadioGroup label="Experience level" options={EXPERIENCE_LEVELS} value={profile.experience_level} onChange={v => set('experience_level', v)} />
            <RadioGroup label="Prize preference" options={PRIZE_PREFS} value={profile.prize_preference} onChange={v => set('prize_preference', v)} />
            <RadioGroup label="Location" options={LOCATIONS} value={profile.location_preference} onChange={v => set('location_preference', v)} />
          </div>
        </div>

        {/* Save */}
        <button type="submit" className="btn-primary justify-center" disabled={saving}>
          {saving
            ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving…</>
            : saved
            ? <><CheckCircle size={16} /> Profile saved!</>
            : <><Save size={16} /> Save profile</>
          }
        </button>

        {!import.meta.env.VITE_FIREBASE_PROJECT_ID && (
          <p className="text-center text-xs text-white/25">Saving to localStorage (add Firebase keys for cloud sync)</p>
        )}
      </form>

      <div className="mt-8 rounded-xl p-4 flex gap-3" style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)' }}>
        <Sparkles size={15} className="text-indigo-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-white/55 leading-relaxed">
          The more specific your skills and interests, the more accurate the AI match scores. Saving your profile clears the search cache so your next search uses the updated data.
        </p>
      </div>
    </div>
  )
}

function RadioGroup({ label, options, value, onChange }) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex flex-col gap-1.5">
        {options.map(o => (
          <label key={o} className="flex items-center gap-2 cursor-pointer group">
            <input type="radio" name={label} value={o} checked={value === o} onChange={() => onChange(o)} className="accent-indigo-500" />
            <span className="text-sm text-white/55 group-hover:text-white/90 transition-colors">{o}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
