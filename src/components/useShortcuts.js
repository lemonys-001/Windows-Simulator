import { useEffect } from 'react'
import { useOS } from '../core/store'
import { appList } from '../apps/registry'

// Global keyboard shortcuts, Win7 flavor.
export function useShortcuts() {
  const { state, dispatch, TASKBAR_H } = useOS()

  useEffect(() => {
    if (state.phase !== 'desktop' && state.phase !== 'lock') return

    const isTyping = (t) => t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable

    const onKeyDown = (e) => {
      const win = state.windows.find((w) => w.id === state.focusId)
      const meta = e.metaKey // Win key on Windows, Cmd on Mac

      if (e.altKey && e.key === 'Tab') {
        e.preventDefault()
        dispatch({ type: 'ALT_NEXT', dir: e.shiftKey ? -1 : 1 })
        return
      }
      if (e.altKey && e.key === 'F4') {
        e.preventDefault()
        if (win) dispatch({ type: 'CLOSE', id: win.id })
        return
      }
      if (meta && !e.repeat) {
        switch (e.key.toLowerCase()) {
          case 's': // Start (Cmd+S hijack avoided when typing)
            if (!isTyping(e.target)) { e.preventDefault(); dispatch({ type: 'START' }) }
            break
          case 'e': e.preventDefault(); dispatch({ type: 'OPEN_APP', appId: 'explorer', props: { path: '/Users/Administrator/Documents' } }); break
          case 'r': e.preventDefault(); dispatch({ type: 'RUN', open: true }); break
          case 'l': e.preventDefault(); dispatch({ type: 'LOCK' }); break
          case 'd': e.preventDefault(); dispatch({ type: 'MINIMIZE_ALL' }); break
          case 'arrowleft': if (win) { e.preventDefault(); dispatch({ type: 'SNAP', id: win.id, side: 'left' }) } break
          case 'arrowright': if (win) { e.preventDefault(); dispatch({ type: 'SNAP', id: win.id, side: 'right' }) } break
          case 'arrowup': if (win) { e.preventDefault(); dispatch({ type: 'SNAP', id: win.id, side: 'max' }) } break
          case 'arrowdown': if (win) { e.preventDefault(); dispatch({ type: 'SNAP', id: win.id, side: 'restore' }) } break
        }
        return
      }
      // Plain Escape closes overlays
      if (e.key === 'Escape' && (state.startOpen || state.runOpen || state.contextMenu || state.altTab)) {
        dispatch({ type: 'CLOSE_OVERLAYS' })
      }
    }

    const onKeyUp = (e) => {
      if (e.key === 'Meta' && state.altTab) {
        e.preventDefault()
        dispatch({ type: 'ALT_COMMIT' })
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp) }
  }, [state.phase, state.windows, state.focusId, state.startOpen, state.runOpen, state.contextMenu, state.altTab, dispatch])

  // On desktop, clicking anywhere closes overlays (except where handled)
  useEffect(() => {
    if (state.phase !== 'desktop') return
    const close = (e) => {
      if (e.target.closest?.('.start-menu') || e.target.closest?.('.tb-start') || e.target.closest?.('.flyout')) return
      if (state.startOpen || state.runOpen) dispatch({ type: 'CLOSE_OVERLAYS' })
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [state.phase, state.startOpen, state.runOpen, dispatch])

  // unused placeholder to keep TASKBAR_H referenced
  void TASKBAR_H
  void appList
}
