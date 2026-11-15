import { useOS } from '../core/store'
import { Icon } from '../icons'
import { APPS } from '../apps/registry'

export function AltTab() {
  const { state } = useOS()
  if (!state.altTab) return null
  const { list, index } = state.altTab
  return (
    <div className="fixed inset-0 z-[9800] flex items-center justify-center pointer-events-none">
      <div className="glass rounded-lg px-4 py-3 flex gap-2 max-w-[90vw] overflow-x-auto">
        {list.map((id, i) => {
          const win = state.windows.find((w) => w.id === id)
          if (!win) return null
          return (
            <div
              key={id}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded ${i === index ? 'bg-white/60 shadow-[0_0_0_2px_var(--accent)]' : 'bg-white/20'}`}
              style={{ minWidth: 88 }}
            >
              <Icon name={APPS[win.appId].icon} size={40} />
              <span className="text-[11px] text-center max-w-[110px] truncate">{win.title}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
