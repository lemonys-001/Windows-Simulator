// Global context menu service: openCtx({x, y, items}) renders ContextMenuHost.
const listeners = new Set()
let menu = null
let version = 0

export function openCtx(m) {
  menu = m
  version++
  listeners.forEach((l) => l())
}
export function closeCtx() {
  if (!menu) return
  menu = null
  version++
  listeners.forEach((l) => l())
}
const getSnapshot = () => menu
function subscribe(l) { listeners.add(l); return () => listeners.delete(l) }

import { useSyncExternalStore, useEffect } from 'react'

export function ContextMenuHost() {
  const m = useSyncExternalStore(subscribe, getSnapshot)
  useEffect(() => {
    if (!m) return
    const close = () => closeCtx()
    const onKey = (e) => { if (e.key === 'Escape') closeCtx() }
    // Defer so the pointerdown that opened the menu doesn't immediately close it
    const t = setTimeout(() => {
      window.addEventListener('pointerdown', close)
      window.addEventListener('blur', close)
    }, 0)
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener('pointerdown', close)
      window.removeEventListener('blur', close)
      window.removeEventListener('keydown', onKey)
    }
  }, [m])

  if (!m) return null
  const items = m.items || []
  const style = {
    left: Math.min(m.x, window.innerWidth - 215),
    top: Math.min(m.y, window.innerHeight - items.length * 27 - 16),
  }
  return (
    <div className="ctx" style={style} role="menu" onContextMenu={(e) => e.stopPropagation()}>
      {items.map((it, i) => it.sep ? <div key={i} className="ctx-sep" /> : (
        <div
          key={i}
          className={`ctx-item ${it.disabled ? 'disabled' : ''}`}
          onClick={() => { if (!it.disabled) { closeCtx(); it.action?.() } }}
          role="menuitem"
        >
          {it.icon ? <span className="w-4 flex justify-center text-[#2a6ea8]">{it.icon}</span> : <span className="w-4" />}
          <span>{it.label}</span>
          {it.checked && <span className="ml-auto pl-4 text-[#2a6ea8]">✓</span>}
        </div>
      ))}
    </div>
  )
}
