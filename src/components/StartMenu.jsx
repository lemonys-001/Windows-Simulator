import { useEffect, useMemo, useRef, useState } from 'react'
import { useOS } from '../core/store'
import { Icon } from '../icons'
import { APPS, appList } from '../apps/registry'
import { fs } from '../core/fs'
import { useFs } from '../core/hooks'
import { fileIcon } from '../icons'
import { openNode } from './Desktop'

export function StartMenu() {
  const { state, dispatch } = useOS()
  const fsVersion = useFs()
  const [query, setQuery] = useState('')
  const [allPrograms, setAllPrograms] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    if (state.startOpen) {
      setQuery('')
      setAllPrograms(false)
      setTimeout(() => searchRef.current?.focus(), 30)
    }
  }, [state.startOpen])

  useEffect(() => {
    if (!state.startOpen) return
    const close = (e) => {
      if (!e.target.closest?.('.start-menu') && !e.target.closest?.('.tb-start')) dispatch({ type: 'START', open: false })
    }
    const onKey = (e) => {
      if (e.key === 'Escape') dispatch({ type: 'START', open: false })
      if (e.key === 'Enter' && searchRef.current === document.activeElement) {
        const first = results[0]
        if (first) launch(first)
      }
    }
    const t = setTimeout(() => document.addEventListener('pointerdown', close), 0)
    window.addEventListener('keydown', onKey)
    return () => { clearTimeout(t); document.removeEventListener('pointerdown', close); window.removeEventListener('keydown', onKey) }
  }, [state.startOpen, dispatch])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null
    const apps = appList.filter((a) => a.name.toLowerCase().includes(q))
      .map((a) => ({ kind: 'app', id: a.id, name: a.name, icon: a.icon }))
    const files = fs.search(q).map((r) => ({ kind: 'file', path: r.path, name: r.node.name, node: r.node }))
    return [...apps, ...files].slice(0, 14)
  }, [query, fsVersion])

  const launch = (r) => {
    if (r.kind === 'app') dispatch({ type: 'OPEN_APP', appId: r.id })
    else openNode(r.node, r.path, dispatch)
    dispatch({ type: 'START', open: false })
  }

  const pinnedApps = ['browser', 'notepad', 'media', 'paint', 'calc', 'cmd']
  const otherApps = appList.filter((a) => !pinnedApps.includes(a.id) && a.id !== 'about' && a.id !== 'recyclebin')
  const pinnedList = pinnedApps.map((id) => APPS[id]).filter(Boolean)

  const openApp = (id) => {
    dispatch({ type: 'OPEN_APP', appId: id })
    dispatch({ type: 'START', open: false })
  }

  return (
    <div className="start-menu glass" role="menu" aria-label="Start menu">
      <div className="sm-left">
        <div className="flex-1 overflow-y-auto pt-1.5 px-1.5 min-h-0">
          {results ? (
            <div className="px-1">
              {results.length === 0 && <div className="text-[#7f95a6] px-2 py-3">No matches for “{query}”</div>}
              {results.map((r, i) => (
                <div key={i} className="sm-item" onClick={() => launch(r)}>
                  <Icon name={r.kind === 'app' ? r.icon : fileIcon(r.node)} size={24} />
                  <div className="min-w-0">
                    <div className="truncate text-[12px]">{r.name}</div>
                    <div className="text-[10px] text-[#7f95a6] truncate">{r.kind === 'app' ? 'Program' : r.path}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : allPrograms ? (
            <div className="px-1">
              <div className="sm-item" onClick={() => setAllPrograms(false)}>
                <span className="w-6 text-[#2a6ea8]">◀</span><span className="text-[12px] font-semibold">Back</span>
              </div>
              {appList.filter((a) => a.id !== 'about').map((a) => (
                <div key={a.id} className="sm-item" onClick={() => openApp(a.id)}>
                  <Icon name={a.icon} size={24} /><span className="text-[12px]">{a.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-1">
              {pinnedList.map((a) => (
                <div key={a.id} className="sm-item" onClick={() => openApp(a.id)}>
                  <Icon name={a.icon} size={26} /><span className="text-[12px]">{a.name}</span>
                </div>
              ))}
              <div className="ctx-sep my-1.5" />
              <div className="sm-item" onClick={() => setAllPrograms(true)}>
                <span className="w-[26px] flex justify-center text-[#2a6ea8] font-bold">▶</span>
                <span className="text-[12px] font-semibold">All Programs</span>
              </div>
              <div className="sm-item" onClick={() => openApp('sticky')}>
                <Icon name="note" size={26} /><span className="text-[12px]">Sticky Notes</span>
              </div>
              {otherApps.slice(0, 3).map((a) => (
                <div key={a.id} className="sm-item" onClick={() => openApp(a.id)}>
                  <Icon name={a.icon} size={26} /><span className="text-[12px]">{a.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="sm-searchwrap">
          <input
            ref={searchRef}
            className="field w-full"
            placeholder="Search programs and files"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search"
          />
        </div>
      </div>

      <div className="sm-right">
        <div className="flex justify-center pb-2">
          <div className="w-16 h-16 rounded border border-[#cfe6ff]/60 bg-[#4f88b8]/40 flex items-center justify-center">
            <svg viewBox="0 0 48 48" width="52" height="52"><circle cx="24" cy="17" r="8" fill="#cfe6ff" opacity=".9" /><path d="M8 42c2-10 8-14 16-14s14 4 16 14z" fill="#cfe6ff" opacity=".9" /></svg>
          </div>
        </div>
        <div className="sm-item !text-[#eaf4fc]" onClick={() => openApp('explorer')}>
          <Icon name="folder" size={20} /><span className="text-[12px]">Documents</span>
        </div>
        <div className="sm-item !text-[#eaf4fc]" onClick={() => openApp('photo')}>
          <Icon name="image" size={20} /><span className="text-[12px]">Pictures</span>
        </div>
        <div className="sm-item !text-[#eaf4fc]" onClick={() => openApp('media')}>
          <Icon name="media" size={20} /><span className="text-[12px]">Music</span>
        </div>
        <div className="sm-item !text-[#eaf4fc]" onClick={() => { dispatch({ type: 'OPEN_APP', appId: 'explorer', props: { path: '/' }, title: 'Computer' }); dispatch({ type: 'START', open: false }) }}>
          <Icon name="computer" size={20} /><span className="text-[12px]">Computer</span>
        </div>
        <div className="sm-item !text-[#eaf4fc]" onClick={() => openApp('settings')}>
          <Icon name="settings" size={20} /><span className="text-[12px]">Control Panel</span>
        </div>
        <div className="sm-item !text-[#eaf4fc]" onClick={() => openApp('about')}>
          <Icon name="info" size={20} /><span className="text-[12px]">About Windows</span>
        </div>

        <div className="sm-power mt-auto">
          <div className="flex justify-end gap-1 items-center">
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20"
              title="Shut down"
              aria-label="Shut down"
              onClick={() => dispatch({ type: 'SHUTDOWN' })}
            >
              <Icon name="power" size={18} />
            </button>
            <button
              className="text-[#eaf4fc] text-[11px] px-2 py-1.5 rounded hover:bg-white/20 flex items-center gap-1"
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect()
                import('./ContextMenu').then((m) => m.openCtx({
                  x: r.left - 90, y: r.top - 110,
                  items: [
                    { label: 'Switch user', disabled: true },
                    { label: 'Log off', action: () => dispatch({ type: 'LOCK' }) },
                    { label: 'Lock', action: () => dispatch({ type: 'LOCK' }) },
                    { label: 'Restart', action: () => dispatch({ type: 'RESTART' }) },
                    { label: 'Sleep', disabled: true },
                  ],
                }))
              }}
            >
              ▶
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
