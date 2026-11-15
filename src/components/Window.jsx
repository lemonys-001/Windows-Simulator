import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { useOS } from '../core/store'
import { Icon } from '../icons'
import { APPS } from '../apps/registry'
import { clamp } from '../core/util'

const cache = new Map()
function getComponent(appId) {
  if (!cache.has(appId)) cache.set(appId, lazy(APPS[appId].load))
  return cache.get(appId)
}

const EDGES = [
  ['n', 'rz rz-n'], ['s', 'rz rz-s'], ['e', 'rz rz-e'], ['w', 'rz rz-w'],
  ['ne', 'rz rz-ne'], ['nw', 'rz rz-nw'], ['se', 'rz rz-se'], ['sw', 'rz rz-sw'],
]

export function Window({ win }) {
  const { state, dispatch, TASKBAR_H } = useOS()
  const AppBody = getComponent(win.appId)
  const meta = APPS[win.appId]
  const [loading, setLoading] = useState(true)
  const [closing, setClosing] = useState(false)
  const dragRef = useRef(null)
  const previewSide = useRef(null)
  const focused = state.focusId === win.id

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 350)
    return () => clearTimeout(t)
  }, [])

  const startDrag = (e) => {
    if (e.button !== 0) return
    e.preventDefault()
    dispatch({ type: 'FOCUS', id: win.id })
    const area = { w: window.innerWidth, h: window.innerHeight - TASKBAR_H }
    let rect = win.rect
    let grabRatio = null
    if (win.maximized) {
      // Undock: restore floating size under the cursor
      grabRatio = clamp((e.clientX - win.rect.x) / win.rect.w, 0.1, 0.9)
      const w = Math.min(meta.size?.w || 640, area.w)
      const h = Math.min(meta.size?.h || 480, area.h)
      rect = { x: e.clientX - w * grabRatio, y: Math.max(0, e.clientY - 15), w, h }
      dispatch({ type: 'MOVE', id: win.id, rect })
    } else if (win.snapped) {
      // Dragging out of a snap: restore previous rect proportionally
      const w = win.prevRect?.w || meta.size?.w || 640
      const h = win.prevRect?.h || meta.size?.h || 480
      rect = { x: e.clientX - w / 2, y: Math.max(0, e.clientY - 15), w, h }
      dispatch({ type: 'MOVE', id: win.id, rect })
    }
    dragRef.current = {
      startX: e.clientX, startY: e.clientY,
      origX: rect.x, origY: rect.y,
      moved: false, maximized: win.maximized,
    }
    const move = (ev) => {
      const d = dragRef.current
      if (!d) return
      const dx = ev.clientX - d.startX
      const dy = ev.clientY - d.startY
      if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true
      const nx = d.origX + dx
      const ny = clamp(d.origY + dy, 0, area.h - 28)
      dispatch({ type: 'MOVE', id: win.id, rect: { x: nx, y: ny, w: rect.w, h: rect.h } })
      // Aero snap preview
      let side = null
      if (ev.clientY <= 4) side = 'max'
      else if (ev.clientX <= 4) side = 'left'
      else if (ev.clientX >= window.innerWidth - 5) side = 'right'
      if (side !== previewSide.current) {
        previewSide.current = side
        dispatch({ type: 'DRAG_PREVIEW', side })
      }
    }
    const up = (ev) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      const side = previewSide.current
      previewSide.current = null
      dispatch({ type: 'DRAG_PREVIEW', side: null })
      if (side && dragRef.current?.moved) {
        dispatch({ type: 'SNAP', id: win.id, side })
      }
      dragRef.current = null
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const startResize = (e, dir) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    dispatch({ type: 'FOCUS', id: win.id })
    const start = { x: e.clientX, y: e.clientY }
    const orig = win.rect
    const area = { w: window.innerWidth, h: window.innerHeight - TASKBAR_H }
    const min = meta.min || { w: 320, h: 200 }
    const move = (ev) => {
      const dx = ev.clientX - start.x
      const dy = ev.clientY - start.y
      let { x, y, w, h } = orig
      if (dir.includes('e')) w = clamp(orig.w + dx, min.w, area.w - orig.x)
      if (dir.includes('s')) h = clamp(orig.h + dy, min.h, area.h - orig.y)
      if (dir.includes('w')) {
        w = clamp(orig.w - dx, min.w, orig.x + orig.w)
        x = orig.x + orig.w - w
      }
      if (dir.includes('n')) {
        h = clamp(orig.h - dy, min.h, orig.y + orig.h)
        y = orig.y + orig.h - h
      }
      dispatch({ type: 'RESIZE', id: win.id, rect: { x, y, w, h } })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const onClose = () => {
    setClosing(true)
    setTimeout(() => dispatch({ type: 'CLOSE', id: win.id }), 90)
  }

  const rect = win.maximized ? { x: 0, y: 0, w: '100%', h: '100%' } : win.rect
  const style = {
    left: typeof rect.x === 'number' ? rect.x : 0,
    top: typeof rect.y === 'number' ? rect.y : 0,
    width: typeof rect.w === 'number' ? rect.w : '100%',
    height: typeof rect.h === 'number' ? rect.h : '100%',
    zIndex: 100 + win.z,
    borderRadius: win.maximized ? 0 : undefined,
  }

  return (
    <div
      className={`win ${focused ? '' : 'inactive'} ${closing ? 'opacity-0 scale-[.98] transition-all duration-100' : 'animate-[winin_.14s_ease-out]'}`}
      style={style}
      role="dialog"
      aria-label={win.title}
      onPointerDown={() => { if (!focused) dispatch({ type: 'FOCUS', id: win.id }) }}
    >
      <style>{`@keyframes winin { from { transform: scale(.97); opacity: .5; } to { transform: none; opacity: 1; } }`}</style>
      <div
        className="win-titlebar"
        onPointerDown={startDrag}
        onDoubleClick={() => dispatch({ type: 'TOGGLE_MAX', id: win.id })}
        onContextMenu={(e) => {
          e.preventDefault()
          dispatch({
            type: 'CONTEXT',
            menu: {
              x: e.clientX, y: e.clientY,
              items: [
                { label: 'Restore', icon: 'refresh', disabled: !win.maximized, action: () => dispatch({ type: 'SNAP', id: win.id, side: 'restore' }) },
                { label: 'Minimize', action: () => dispatch({ type: 'MINIMIZE', id: win.id }) },
                { label: win.maximized ? 'Restore Down' : 'Maximize', action: () => dispatch({ type: 'TOGGLE_MAX', id: win.id }) },
                { sep: true },
                { label: 'Close', icon: 'close', action: onClose },
              ],
            },
          })
        }}
      >
        <div className="win-title">
          <Icon name={meta.icon} size={16} />
          <span className="truncate">{win.title}</span>
        </div>
        <div className="win-controls" onPointerDown={(e) => e.stopPropagation()}>
          <button className="wc-btn" aria-label="Minimize" onClick={() => dispatch({ type: 'MINIMIZE', id: win.id })}>
            <svg viewBox="0 0 10 10" width="10" height="10"><path d="M1 7.5h8" stroke="#123" strokeWidth="1.4" /></svg>
          </button>
          <button className="wc-btn" aria-label={win.maximized ? 'Restore' : 'Maximize'} onClick={() => dispatch({ type: 'TOGGLE_MAX', id: win.id })}>
            {win.maximized
              ? <svg viewBox="0 0 10 10" width="10" height="10"><rect x="0.5" y="2.5" width="6" height="6" fill="none" stroke="#123" strokeWidth="1.2" /><path d="M2.5 2.5V0.5h7v7h-2" fill="none" stroke="#123" strokeWidth="1.2" /></svg>
              : <svg viewBox="0 0 10 10" width="10" height="10"><rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="#123" strokeWidth="1.2" /><path d="M0.5 3h9" stroke="#123" strokeWidth="1.2" /></svg>}
          </button>
          <button className="wc-btn wc-close" aria-label="Close" onClick={onClose}>
            <svg viewBox="0 0 10 10" width="10" height="10"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="#123" strokeWidth="1.4" /></svg>
          </button>
        </div>
      </div>

      <div className="win-body">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#f0f4f8]">
            <svg viewBox="0 0 24 24" width="26" height="26" className="spin"><circle cx="12" cy="12" r="9" fill="none" stroke="#9db6c6" strokeOpacity=".3" strokeWidth="3" /><path d="M21 12a9 9 0 00-9-9" fill="none" stroke="#4f9cd9" strokeWidth="3" strokeLinecap="round" /></svg>
          </div>
        )}
        <Suspense fallback={null}>
          <AppBody winId={win.id} {...(win.props || {})} />
        </Suspense>
      </div>

      {!win.maximized && EDGES.map(([dir, cls]) => (
        <div key={dir} className={cls} onPointerDown={(e) => startResize(e, dir)} />
      ))}
    </div>
  )
}
