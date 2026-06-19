import { useEffect, useRef } from 'react'

const R = 22
const C = 2 * Math.PI * R // ≈ 138.2

function scoreColor(score) {
  if (score >= 70) return '#10B981'  // emerald
  if (score >= 40) return '#F59E0B'  // amber
  return '#EF4444'                   // red
}

export default function MatchScoreRing({ score = 0, size = 64 }) {
  const circleRef = useRef(null)
  const offset = C - (score / 100) * C

  useEffect(() => {
    if (!circleRef.current) return
    // Animate from full offset to target
    circleRef.current.style.strokeDashoffset = C
    const raf = requestAnimationFrame(() => {
      circleRef.current.style.transition = 'stroke-dashoffset 0.9s ease-out'
      circleRef.current.style.strokeDashoffset = offset
    })
    return () => cancelAnimationFrame(raf)
  }, [score, offset])

  const color = scoreColor(score)
  const cx = size / 2
  const cy = size / 2

  return (
    <div className="flex flex-col items-center gap-0.5" title={`Match: ${score}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={R}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={5}
        />
        {/* Progress */}
        <circle
          ref={circleRef}
          cx={cx} cy={cy} r={R}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C}
          style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
        />
      </svg>
      {/* Label below ring */}
      <span className="text-[11px] font-semibold" style={{ color, marginTop: -size * 0.08 }}>
        {/* Absolute center the score inside the ring using negative margin trick */}
      </span>
      {/* Center number — overlay using absolute */}
      <style>{`
        .ring-wrap { position: relative; display: inline-block; }
        .ring-wrap .ring-label {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; font-family: 'Space Grotesk', sans-serif;
        }
      `}</style>
    </div>
  )
}

// Wrapper with centered label
export function MatchRing({ score = 0, size = 64 }) {
  const circleRef = useRef(null)
  const offset = C - (score / 100) * C
  const color = scoreColor(score)
  const cx = size / 2
  const cy = size / 2

  useEffect(() => {
    if (!circleRef.current) return
    circleRef.current.style.strokeDashoffset = C
    const id = setTimeout(() => {
      if (circleRef.current) {
        circleRef.current.style.transition = 'stroke-dashoffset 0.9s ease-out'
        circleRef.current.style.strokeDashoffset = offset
      }
    }, 60)
    return () => clearTimeout(id)
  }, [score, offset])

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={5} />
        <circle
          ref={circleRef}
          cx={cx} cy={cy} r={R}
          fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C}
          style={{ filter: `drop-shadow(0 0 4px ${color}60)` }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1 }}>
          {score}
        </span>
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>%</span>
      </div>
    </div>
  )
}
