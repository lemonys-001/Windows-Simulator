import { useEffect } from 'react'
import { useOS, OSProvider } from './core/store'
import { Window } from './components/Window'
import { Desktop } from './components/Desktop'
import { Taskbar } from './components/Taskbar'
import { StartMenu } from './components/StartMenu'
import { ContextMenuHost } from './components/ContextMenu'
import { AltTab } from './components/AltTab'
import { RunDialog } from './components/RunDialog'
import { Toasts } from './components/Toasts'
import { DialogHost } from './components/DialogHost'
import { BootScreen, LoginScreen, LockScreen, ShutdownScreen, RestartScreen, OffScreen } from './components/PowerScreens'
import { useShortcuts } from './components/useShortcuts'

function Shell() {
  const { state, dispatch } = useOS()
  useShortcuts()

  // Welcome toast on first login of a session
  useEffect(() => {
    if (state.phase !== 'desktop') return
    const t = setTimeout(() => dispatch({
      type: 'TOAST',
      toast: { title: 'Welcome to Windows 7 Simulator', body: 'Drag windows to the edges to snap them. Press Win+R to run an app.' },
    }), 900)
    return () => clearTimeout(t)
  }, [state.phase])

  // viewport lock for desktop phase
  useEffect(() => {
    const onResize = () => dispatch({ type: 'RESIZE_SYNC' })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [dispatch])

  if (state.phase === 'boot') return <BootScreen />
  if (state.phase === 'shutdown') return <ShutdownScreen />
  if (state.phase === 'restart') return <RestartScreen />
  if (state.phase === 'off') return <OffScreen />
  if (state.phase === 'login') return <LoginScreen />
  if (state.phase === 'lock') return <LockScreen />

  return (
    <div
      className={`fixed inset-0 ${state.settings.transparency ? '' : 'no-transparency'}`}
      style={{ '--accent': state.settings.accent }}
    >
      {state.windows.map((w) => <Window key={w.id} win={w} />)}
      <Desktop />
      {state.startOpen && <StartMenu />}
      <Taskbar />
      {state.runOpen && <RunDialog />}
      <AltTab />
      <ContextMenuHost />
      <Toasts />
      <DialogHost />
    </div>
  )
}

export default function App() {
  return (
    <OSProvider>
      <Shell />
    </OSProvider>
  )
}
