import { createContext, useContext, useEffect, useReducer, useRef } from 'react'
import { APPS } from '../apps/registry'
import { clamp, uid } from './util'
import { fs } from './fs'

const SETTINGS_KEY = 'win7.settings.v2'
const SESSION_KEY = 'win7.session.v2'
const TASKBAR_H = 40

const DEFAULT_SETTINGS = {
  wallpaper: 'harmony',
  accent: '#57a3dc',
  use24h: false,
  showSeconds: false,
  transparency: true,
  pinned: ['explorer', 'browser', 'notepad', 'media'],
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}

const initial = () => ({
  phase: 'boot', // boot | login | desktop | lock | shutdown | restart | off
  windows: [],
  focusId: null,
  zTop: 10,
  startOpen: false,
  runOpen: false,
  contextMenu: null,
  altTab: null,
  snapPreview: null,
  toasts: [],
  settings: loadJSON(SETTINGS_KEY, DEFAULT_SETTINGS),
  restoreQueue: null, // session windows to reopen after entering desktop
})

function workarea(state) {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1280
  const h = typeof window !== 'undefined' ? window.innerHeight : 720
  return { w, h: h - TASKBAR_H }
}

function nextZ(state) {
  return { zTop: state.zTop + 1, z: state.zTop + 1 }
}

function topWindow(state, excludeId) {
  const list = state.windows.filter((w) => w.id !== excludeId)
  if (!list.length) return null
  return list.reduce((a, b) => (a.z > b.z ? a : b))
}

function clampRect(state, win, rect) {
  const area = workarea(state)
  const min = APPS[win.appId]?.min || { w: 320, h: 200 }
  return {
    x: clamp(rect.x, -rect.w + 80, area.w - 80),
    y: clamp(rect.y, 0, area.h - 30),
    w: clamp(rect.w, min.w, area.w),
    h: clamp(rect.h, min.h, area.h),
  }
}

function openApp(state, { appId, props = {}, title }) {
  const meta = APPS[appId]
  if (!meta) return state
  if (meta.singleton) {
    const existing = state.windows.find((w) => w.appId === appId)
    if (existing) {
      return focusWindow(state, existing.id, { unminimize: true, mergeProps: props })
    }
  }
  const area = workarea(state)
  const count = state.windows.length
  const w = Math.min(meta.size?.w || 640, area.w)
  const h = Math.min(meta.size?.h || 480, area.h)
  const x = clamp(60 + (count % 8) * 32, 0, area.w - w)
  const y = clamp(40 + (count % 8) * 28, 0, area.h - h)
  const { zTop, z } = nextZ(state)
  const win = {
    id: uid(), appId, props, z,
    title: title || meta.name,
    rect: { x, y, w, h },
    minimized: false, maximized: false, prevRect: null,
  }
  return {
    ...state,
    windows: [...state.windows, win],
    focusId: win.id,
    zTop,
    startOpen: false,
    runOpen: false,
  }
}

function focusWindow(state, id, { unminimize = true, mergeProps } = {}) {
  const { zTop, z } = nextZ(state)
  return {
    ...state,
    focusId: id,
    zTop,
    windows: state.windows.map((w) =>
      w.id === id
        ? { ...w, z, minimized: unminimize ? false : w.minimized, props: mergeProps ? { ...w.props, ...mergeProps } : w.props }
        : w),
  }
}

function closeWindow(state, id) {
  const windows = state.windows.filter((w) => w.id !== id)
  const top = topWindow({ ...state, windows }, null)
  return { ...state, windows, focusId: top ? top.id : null }
}

function minimize(state, id) {
  const windows = state.windows.map((w) => (w.id === id ? { ...w, minimized: true } : w))
  const top = topWindow({ ...state, windows }, id)
  return { ...state, windows, focusId: top && !top.minimized ? top.id : null }
}

function toggleMax(state, id) {
  const area = workarea(state)
  return {
    ...state,
    windows: state.windows.map((w) => {
      if (w.id !== id) return w
      if (w.maximized) {
        return { ...w, maximized: false, rect: w.prevRect || w.rect, prevRect: null }
      }
      return { ...w, maximized: true, prevRect: w.rect, rect: { x: 0, y: 0, w: area.w, h: area.h } }
    }),
  }
}

function snapWindow(state, id, side) {
  const area = workarea(state)
  const half = { w: Math.round(area.w / 2), h: area.h }
  return {
    ...state,
    snapPreview: null,
    windows: state.windows.map((w) => {
      if (w.id !== id) return w
      if (side === 'restore') {
        return { ...w, maximized: false, rect: w.prevRect || w.rect, prevRect: null }
      }
      if (side === 'max') {
        if (w.maximized) return { ...w, maximized: false, rect: w.prevRect || w.rect, prevRect: null }
        return { ...w, maximized: true, prevRect: w.rect, rect: { x: 0, y: 0, w: area.w, h: area.h } }
      }
      return {
        ...w, maximized: false, snapped: side,
        prevRect: w.maximized ? null : (w.prevRect || w.rect),
        rect: side === 'left'
          ? { x: 0, y: 0, ...half }
          : { x: area.w - half.w, y: 0, ...half },
      }
    }),
  }
}

function cycleWindows(state, dir = 1) {
  const sorted = [...state.windows].sort((a, b) => b.z - a.z)
  if (!sorted.length) return state
  if (!state.altTab) return { ...state, altTab: { list: sorted.map((w) => w.id), index: sorted.length > 1 ? 1 : 0 } }
  const n = state.altTab.list.length
  return { ...state, altTab: { ...state.altTab, index: (state.altTab.index + dir + n) % n } }
}

function commitAlt(state) {
  if (!state.altTab) return state
  const id = state.altTab.list[state.altTab.index]
  return focusWindow({ ...state, altTab: null }, id)
}

function minimizeAll(state) {
  const anyVisible = state.windows.some((w) => !w.minimized)
  return {
    ...state,
    windows: state.windows.map((w) => ({ ...w, minimized: anyVisible })),
    focusId: null,
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'BOOT_DONE': return { ...state, phase: 'login' }
    case 'LOGIN': {
      let saved = null
      try { saved = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') } catch { /* ignore */ }
      const windows = []
      let zTop = state.zTop
      if (saved?.windows?.length) {
        for (const meta of saved.windows) {
          if (!APPS[meta.appId]) continue
          const area = workarea(state)
          const w = { ...clampRect(state, { appId: meta.appId }, meta.rect), }
          windows.push({
            id: uid(), appId: meta.appId, props: meta.props || {}, title: meta.title || APPS[meta.appId].name,
            rect: w, minimized: !!meta.minimized, maximized: !!meta.maximized, prevRect: null, z: ++zTop,
          })
        }
      }
      const focusWin = [...windows].sort((a, b) => b.z - a.z)[0]
      return { ...state, phase: 'desktop', windows, zTop, focusId: focusWin ? focusWin.id : null }
    }
    case 'LOCK': return { ...state, phase: 'lock' }
    case 'UNLOCK': return { ...state, phase: 'desktop' }
    case 'SHUTDOWN': return { ...state, phase: 'shutdown', startOpen: false, runOpen: false }
    case 'POWER_OFF': return { ...state, phase: 'off' }
    case 'RESTART': return { ...state, phase: 'restart', startOpen: false, runOpen: false }
    case 'BACK_TO_BOOT': return { ...initial(), phase: 'boot' }

    case 'OPEN_APP': return openApp(state, action)
    case 'FOCUS': return focusWindow(state, action.id)
    case 'CLOSE': return closeWindow(state, action.id)
    case 'MINIMIZE': return minimize(state, action.id)
    case 'TASKBAR_CLICK': {
      const win = state.windows.find((w) => w.id === action.id)
      if (!win) return state
      if (win.minimized) return focusWindow(state, action.id)
      if (state.focusId === action.id) return minimize(state, action.id)
      return focusWindow(state, action.id)
    }
    case 'TOGGLE_MAX': return toggleMax(state, action.id)
    case 'SNAP': return snapWindow(state, action.id, action.side)
    case 'DRAG_PREVIEW': return { ...state, snapPreview: action.side }
    case 'MOVE': return {
      ...state,
      windows: state.windows.map((w) => (w.id === action.id ? { ...w, snapped: null, rect: { ...w.rect, ...clampRect(state, w, action.rect) }, maximized: false, prevRect: w.maximized ? null : (w.prevRect || w.rect) } : w)),
    }
    case 'RESIZE': return {
      ...state,
      windows: state.windows.map((w) => (w.id === action.id ? { ...w, rect: { ...w.rect, ...clampRect(state, w, action.rect) } } : w)),
    }
    case 'SET_TITLE': return {
      ...state,
      windows: state.windows.map((w) => (w.id === action.id ? { ...w, title: action.title } : w)),
    }

    case 'START': return { ...state, startOpen: action.open ?? !state.startOpen, runOpen: false, contextMenu: null }
    case 'RUN': return { ...state, runOpen: action.open ?? !state.runOpen, startOpen: false, contextMenu: null }
    case 'CONTEXT': return { ...state, contextMenu: action.menu, startOpen: false }
    case 'CLOSE_OVERLAYS': return { ...state, startOpen: false, runOpen: false, contextMenu: null, altTab: null, snapPreview: null }

    case 'ALT_NEXT': return cycleWindows(state, action.dir || 1)
    case 'ALT_COMMIT': return commitAlt(state)
    case 'ALT_CANCEL': return { ...state, altTab: null }
    case 'MINIMIZE_ALL': return minimizeAll(state)

    case 'TOAST': return { ...state, toasts: [...state.toasts.slice(-3), { id: uid(), ...action.toast }] }
    case 'TOAST_CLOSE': return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) }

    case 'SET_SETTING': {
      const settings = { ...state.settings, [action.key]: action.value }
      return { ...state, settings }
    }
    case 'RESET_ALL': {
      localStorage.removeItem(SETTINGS_KEY)
      localStorage.removeItem(SESSION_KEY)
      fs.reset()
      return { ...initial(), phase: 'restart' }
    }
    default: return state
  }
}

const OSContext = createContext(null)

export function OSProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initial)

  // Persist settings
  useEffect(() => {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings)) } catch { /* quota */ }
  }, [state.settings])

  // Persist open-window session (debounced)
  const sessionTimer = useRef()
  useEffect(() => {
    if (state.phase !== 'desktop') return
    clearTimeout(sessionTimer.current)
    sessionTimer.current = setTimeout(() => {
      const windows = state.windows.map((w) => ({
        appId: w.appId, props: w.props, title: w.title,
        rect: w.rect, minimized: w.minimized, maximized: w.maximized,
      }))
      try { localStorage.setItem(SESSION_KEY, JSON.stringify({ windows })) } catch { /* quota */ }
    }, 400)
    return () => clearTimeout(sessionTimer.current)
  }, [state.windows, state.phase])

  const value = { state, dispatch, TASKBAR_H }
  return <OSContext.Provider value={value}>{children}</OSContext.Provider>
}

export const useOS = () => useContext(OSContext)
