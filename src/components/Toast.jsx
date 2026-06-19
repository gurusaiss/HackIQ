import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { useToast } from '../hooks/useToast'

const icons = {
  success: <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />,
  error: <XCircle size={16} className="text-red-400 flex-shrink-0" />,
  info: <Info size={16} className="text-indigo-400 flex-shrink-0" />,
}

const borders = {
  success: 'border-emerald-500/30',
  error: 'border-red-500/30',
  info: 'border-indigo-500/30',
}

export default function Toast() {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${borders[t.type] || borders.info} animate-toast-in pointer-events-auto`}
          style={{ background: '#1a2235', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', minWidth: '280px', maxWidth: '360px' }}
        >
          {icons[t.type] || icons.info}
          <span className="flex-1 text-sm text-white/90 font-medium">{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="text-white/30 hover:text-white/70 transition-colors">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
