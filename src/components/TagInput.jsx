import { useState, useRef } from 'react'
import { X } from 'lucide-react'

export default function TagInput({
  tags = [],
  onChange,
  suggestions = [],
  placeholder = 'Add tag...',
  maxTags = 20,
  tagColor = 'rgba(99,102,241,0.15)',
  tagTextColor = '#818CF8',
  tagBorder = 'rgba(99,102,241,0.3)',
}) {
  const [input, setInput] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)

  const filtered = input.length > 0
    ? suggestions.filter(s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s))
    : []

  function add(tag) {
    const trimmed = tag.trim()
    if (!trimmed || tags.includes(trimmed) || tags.length >= maxTags) return
    onChange([...tags, trimmed])
    setInput('')
    inputRef.current?.focus()
  }

  function remove(tag) {
    onChange(tags.filter(t => t !== tag))
  }

  function handleKey(e) {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault()
      add(input)
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      remove(tags[tags.length - 1])
    }
  }

  return (
    <div className="relative">
      <div
        className="flex flex-wrap gap-1.5 p-2 rounded-lg cursor-text"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${focused ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`,
          minHeight: 44,
          transition: 'border-color 0.15s',
          boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map(tag => (
          <span
            key={tag}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
            style={{ background: tagColor, color: tagTextColor, border: `1px solid ${tagBorder}` }}
          >
            {tag}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); remove(tag) }}
              className="hover:opacity-70 transition-opacity"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); setTimeout(() => setInput(''), 150) }}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 bg-transparent outline-none text-sm text-white placeholder-white/25"
          style={{ minWidth: 80 }}
        />
      </div>

      {/* Suggestions dropdown */}
      {focused && filtered.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-1 rounded-lg z-20 overflow-hidden"
          style={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
        >
          {filtered.slice(0, 8).map(s => (
            <button
              key={s}
              type="button"
              onMouseDown={() => add(s)}
              className="w-full text-left px-4 py-2 text-sm text-white/70 hover:bg-indigo-500/10 hover:text-white transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
