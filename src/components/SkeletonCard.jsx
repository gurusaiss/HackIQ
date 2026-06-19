function Skel({ className = '', style = {} }) {
  return <div className={`skeleton ${className}`} style={style} />
}

function SkeletonCard() {
  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex gap-1.5">
          <Skel style={{ width: 80, height: 22 }} />
          <Skel style={{ width: 56, height: 22 }} />
        </div>
        <Skel style={{ width: 56, height: 56, borderRadius: '50%' }} />
      </div>
      <Skel className="mb-1" style={{ height: 18, width: '85%' }} />
      <Skel className="mb-3" style={{ height: 18, width: '60%' }} />
      <Skel style={{ height: 14, width: '95%', marginBottom: 6 }} />
      <Skel className="mb-4" style={{ height: 14, width: '78%' }} />
      <div className="flex gap-3 mb-3">
        <Skel style={{ width: 80, height: 20 }} />
        <Skel style={{ width: 70, height: 20 }} />
      </div>
      <div className="flex gap-1.5 mb-3">
        <Skel style={{ width: 56, height: 20 }} />
        <Skel style={{ width: 48, height: 20 }} />
        <Skel style={{ width: 64, height: 20 }} />
      </div>
      <div className="flex gap-2 mt-4">
        <Skel style={{ flex: '0 0 80px', height: 36 }} />
        <Skel style={{ flex: 1, height: 36 }} />
      </div>
    </div>
  )
}

export default function SkeletonGrid({ count = 6 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </>
  )
}
