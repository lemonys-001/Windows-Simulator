import { useEffect, useMemo, useState } from 'react'
import { useOS } from '../core/store'
import { Icon } from '../icons'
import { APPS } from '../apps/registry'
import { fs } from '../core/fs'
import { useFs } from '../core/hooks'
import { fmtTime, fmtDate, pad2 } from '../core/util'
import { openCtx } from './ContextMenu'

export function Taskbar() {
  const { state, dispatch } = useOS()
  const fsVersion = useFs()
  const [now, setNow] = useState(new Date())
  const [flyout, setFlyout] = useState(null) // 'clock' | 'network' | 'volume' | 'action'

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const trashFull = useMemo(() => fs.listTrash().length > 0, [fsVersion])

  const pinned = state.settings.pinned || []
  const windows = [...state.windows].sort((a, b) => a.appId.localeCompare(b.appId) || a.id.localeCompare(b.id))
  const tasks = []
  const byApp = new Map()
  for (const w of windows) {
    if (!byApp.has(w.appId)) {
      const meta = APPS[w.appId]
      const task = {
        appId: w.appId, name: meta.name, icon: meta.icon,
        windows: [], active: false, minimized: true,
      }
      byApp.set(w.appId, task)
      if (!pinned.includes(w.appId) || windows.some((x) => x.appId === w.appId)) tasks.push(task)
      else tasks.push(task)
    }
    const task = byApp.get(w.appId)
    task.windows.push(w)
    if (state.focusId === w.id && !w.minimized) { task.active = true; task.minimized = false }
    if (!w.minimized) task.minimized = false
  }
  // Pinned apps with no open windows
  for (const appId of pinned) {
    if (!byApp.has(appId)) {
      const meta = APPS[appId]
      const task = { appId, name: meta.name, icon: meta.icon, windows: [], active: false, minimized: true }
      byApp.set(appId, task)
      tasks.push(task)
    }
  }
  const ordered = []
  for (const appId of pinned) { const t = byApp.get(appId); if (t) ordered.push(t) }
  for (const t of tasks) if (!pinned.includes(t.appId)) ordered.push(t)

  const clickTask = (task) => {
    const wins = task.windows
    if (!wins.length) { dispatch({ type: 'OPEN_APP', appId: task.appId }); return }
    if (wins.length === 1) { dispatch({ type: 'TASKBAR_CLICK', id: wins[0].id }); return }
    // multiple: cycle focus among them
    const focusedIdx = wins.findIndex((w) => w.id === state.focusId)
    const next = wins[(focusedIdx + 1) % wins.length]
    dispatch({ type: 'FOCUS', id: next.id })
  }

  const taskMenu = (e, task) => {
    e.preventDefault()
    const items = task.windows.length
      ? [
          ...task.windows.map((w) => ({ label: w.title, checked: state.focusId === w.id && !w.minimized, action: () => dispatch({ type: 'TASKBAR_CLICK', id: w.id }) })),
          { sep: true },
        ]
      : []
    items.push({ label: task.windows.length ? 'Close all windows' : 'Open', icon: task.windows.length ? '✕' : '▶', action: () => {
      if (task.windows.length) task.windows.forEach((w) => dispatch({ type: 'CLOSE', id: w.id }))
      else dispatch({ type: 'OPEN_APP', appId: task.appId })
    } })
    openCtx({ x: e.clientX, y: e.clientY - 10 - items.length * 27, items })
  }

  const clockMenu = (e) => {
    e.preventDefault()
    openCtx({
      x: e.clientX - 180, y: e.clientY - 80,
      items: [
        { label: 'Adjust date/time', action: () => dispatch({ type: 'OPEN_APP', appId: 'settings', props: { section: 'clock' } }) },
      ],
    })
  }

  return (
    <div className="taskbar glass-dark" role="toolbar" aria-label="Taskbar">
      <button
        className={`tb-start ${state.startOpen ? 'open' : ''}`}
        onClick={() => dispatch({ type: 'START' })}
        aria-label="Start"
        title="Start"
      >
        <Icon name="start" size={40} />
      </button>

      {ordered.map((task) => (
        <button
          key={task.appId}
          className={`tb-btn ${task.active ? 'active' : ''} ${task.minimized ? 'minimized' : ''} ${task.windows.length ? '' : 'pinned'}`}
          onClick={() => clickTask(task)}
          onContextMenu={(e) => taskMenu(e, task)}
          aria-label={task.name}
          title={task.name}
        >
          <Icon name={task.icon} size={22} />
          <span className="text-[11px]">{task.name}</span>
        </button>
      ))}

      <div className="tray">
        <button className="tray-btn" onClick={() => setFlyout(flyout === 'action' ? null : 'action')} title="Action Center" aria-label="Action Center">
          <Icon name="flag" size={16} />
        </button>
        <button className="tray-btn" onClick={() => setFlyout(flyout === 'network' ? null : 'network')} title="Network" aria-label="Network">
          <Icon name="network" size={16} />
        </button>
        <button className="tray-btn" onClick={() => setFlyout(flyout === 'volume' ? null : 'volume')} title="Volume" aria-label="Volume">
          <Icon name="volume" size={16} />
        </button>
        <button
          className="tray-btn text-[11px] text-[#eaf4fc] text-right leading-tight px-2"
          onClick={() => setFlyout(flyout === 'clock' ? null : 'clock')}
          onContextMenu={clockMenu}
          aria-label="Clock"
        >
          <div>{fmtTime(now, state.settings)}</div>
          <div>{fmtDate(now)}</div>
        </button>
      </div>
      <button
        className="show-desktop"
        onClick={() => dispatch({ type: 'MINIMIZE_ALL' })}
        title="Show desktop"
        aria-label="Show desktop"
      />

      {flyout === 'clock' && <ClockFlyout now={now} onClose={() => setFlyout(null)} />}
      {flyout === 'network' && (
        <Flyout onClose={() => setFlyout(null)} width={240}>
          <div className="font-semibold mb-2">Not connected</div>
          {['LEMON-NET (5G)', 'HomeWiFi', 'CoffeeShop_Free'].map((n) => (
            <div key={n} className="list-row rounded px-2 py-1.5 flex items-center gap-2 text-[12px]">
              <Icon name="network" size={16} />{n}
              <span className="ml-auto text-[10px] text-[#7f95a6]">Secured</span>
            </div>
          ))}
        </Flyout>
      )}
      {flyout === 'volume' && (
        <Flyout onClose={() => setFlyout(null)} width={200}>
          <div className="flex items-center gap-2">
            <Icon name="volume" size={20} />
            <input type="range" defaultValue="72" className="flex-1 accent-[var(--accent)]" aria-label="Volume" />
          </div>
          <div className="text-[11px] text-[#5d7484] mt-1">Speakers (High Definition Audio)</div>
        </Flyout>
      )}
      {flyout === 'action' && (
        <Flyout onClose={() => setFlyout(null)} width={280}>
          <div className="font-semibold mb-1">Action Center</div>
          <div className="text-[11px] text-[#3aa757] mb-2">✓ No issues found. This is a simulation, after all.</div>
          <div className="list-row rounded px-2 py-1.5 text-[12px]" onClick={() => { setFlyout(null); dispatch({ type: 'OPEN_APP', appId: 'about' }) }}>
            <b>View computer information</b>
          </div>
        </Flyout>
      )}
      <span className="hidden">{trashFull ? 'f' : ''}</span>
    </div>
  )
}

function Flyout({ children, onClose, width = 240 }) {
  useEffect(() => {
    const close = (e) => { if (!e.target.closest?.('.flyout')) onClose() }
    const t = setTimeout(() => document.addEventListener('pointerdown', close), 0)
    return () => { clearTimeout(t); document.removeEventListener('pointerdown', close) }
  }, [onClose])
  return (
    <div
      className="flyout glass absolute right-2 bottom-[calc(var(--workarea)+6px)] rounded-md p-3 z-[5500] text-[#1c2b36]"
      style={{ width }}
    >
      {children}
    </div>
  )
}

function ClockFlyout({ now, onClose }) {
  const year = now.getFullYear()
  const month = now.getMonth()
  const first = new Date(year, month, 1).getDay()
  const days = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < first; i++) cells.push(null)
  for (let d = 1; d <= days; d++) cells.push(d)
  return (
    <Flyout onClose={onClose} width={260}>
      <div className="text-center text-[12px] font-semibold mb-1">
        {now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5 text-center text-[11px] text-[#5d7484]">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
        {cells.map((d, i) => (
          <div key={i} className={`py-0.5 rounded ${d === now.getDate() ? 'bg-[var(--accent)] text-white' : ''}`}>{d ?? ''}</div>
        ))}
      </div>
      <div className="text-center text-[12px] mt-1 border-t border-[#d4dde4] pt-1">
        {pad2(now.getHours())}:{pad2(now.getMinutes())} — {now.toLocaleTimeString()}
      </div>
    </Flyout>
  )
}
