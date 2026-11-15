import { useEffect, useState } from 'react'
import { useOS } from '../core/store'

const LOGO = (
  <svg viewBox="0 0 48 48" width="86" height="86">
    <path d="M8 21l14-2.6v-9L8 12.6zM24.6 17.8L40 15v13.2l-15.4-1.2zM8 22.8l14 1.2v10.6L8 32.4zM24.6 25.4L40 26.6V40l-15.4-2.6z" fill="#eaf6ff" transform="translate(0 2)" />
  </svg>
)

export function BootScreen() {
  const { dispatch } = useOS()
  useEffect(() => {
    const t = setTimeout(() => dispatch({ type: 'BOOT_DONE' }), 2600)
    return () => clearTimeout(t)
  }, [dispatch])
  return (
    <div className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-between py-24" role="img" aria-label="Boot screen">
      <div />
      <div className="flex flex-col items-center gap-10">
        {LOGO}
        <div className="boot-bar"><div /></div>
      </div>
      <div className="text-[#9fb7a8] text-[13px] tracking-wide">Starting Windows<span className="ml-2">®</span> Simulator</div>
    </div>
  )
}

export function LoginScreen() {
  const { state, dispatch } = useOS()
  const [leaving, setLeaving] = useState(false)
  const go = () => {
    setLeaving(true)
    setTimeout(() => dispatch({ type: 'LOGIN' }), 650)
  }
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Enter') go() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return (
    <div
      className={`fixed inset-0 z-[10000] flex items-center justify-center transition-opacity duration-700 ${leaving ? 'opacity-0' : 'opacity-100'}`}
      style={{ background: 'linear-gradient(160deg,#2a6296 0%,#1c4f7c 45%,#0a2137 100%)' }}
    >
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#082033]/80 to-transparent pointer-events-none" />
      <div className="relative flex flex-col items-center gap-3" role="form" aria-label="Login">
        <div className="w-28 h-28 rounded-md border-2 border-[#cfe6ff]/70 bg-[#4f88b8]/30 backdrop-blur flex items-center justify-center shadow-[0_0_30px_rgba(140,200,255,.25)]">
          <svg viewBox="0 0 48 48" width="84" height="84">
            <circle cx="24" cy="17" r="8" fill="#cfe6ff" opacity=".9" />
            <path d="M8 42c2-10 8-14 16-14s14 4 16 14z" fill="#cfe6ff" opacity=".9" />
          </svg>
        </div>
        <div className="text-white text-xl">Administrator</div>
        {leaving ? (
          <div className="text-[#cfe6ff] text-sm mt-2 flex items-center gap-2">
            <svg viewBox="0 0 24 24" width="16" height="16" className="spin"><circle cx="12" cy="12" r="9" fill="none" stroke="#cfe6ff" strokeOpacity=".3" strokeWidth="3" /><path d="M21 12a9 9 0 00-9-9" fill="none" stroke="#cfe6ff" strokeWidth="3" strokeLinecap="round" /></svg>
            Welcome
          </div>
        ) : (
          <button className="btn mt-3 px-6" onClick={go}>Log in</button>
        )}
      </div>
      <button
        className="absolute bottom-4 right-5 text-[#cfe6ff]/80 hover:text-white"
        onClick={() => dispatch({ type: 'SHUTDOWN' })}
        title="Shut down"
        aria-label="Shut down"
      >
        <svg viewBox="0 0 48 48" width="26" height="26"><circle cx="24" cy="24" r="17" fill="none" stroke="#cfe6ff" strokeWidth="3" strokeDasharray="76 22" strokeLinecap="round" transform="rotate(120 24 24)" /><path d="M24 10v12" stroke="#cfe6ff" strokeWidth="3.4" strokeLinecap="round" /></svg>
      </button>
      <div className="absolute bottom-4 left-5 text-[#cfe6ff]/60 text-[11px]">Windows 7 Simulator — press Enter to log in</div>
    </div>
  )
}

export function LockScreen() {
  const { dispatch } = useOS()
  useEffect(() => {
    const onKey = () => dispatch({ type: 'UNLOCK' })
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch])
  return (
    <div
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center cursor-pointer backdrop-blur-sm"
      style={{ background: 'linear-gradient(160deg,#2a6296 0%,#1c4f7c 45%,#0a2137 100%)' }}
      onClick={() => dispatch({ type: 'UNLOCK' })}
      role="button" aria-label="Click to unlock"
    >
      <div className="w-24 h-24 rounded-md border-2 border-[#cfe6ff]/70 bg-[#4f88b8]/30 flex items-center justify-center">
        <svg viewBox="0 0 48 48" width="70" height="70"><circle cx="24" cy="17" r="8" fill="#cfe6ff" opacity=".9" /><path d="M8 42c2-10 8-14 16-14s14 4 16 14z" fill="#cfe6ff" opacity=".9" /></svg>
      </div>
      <div className="text-white text-xl mt-3">Administrator</div>
      <div className="text-[#cfe6ff]/70 text-sm mt-8">Locked — click or press any key to log back in</div>
    </div>
  )
}

export function ShutdownScreen() {
  const { dispatch } = useOS()
  useEffect(() => {
    const t = setTimeout(() => dispatch({ type: 'POWER_OFF' }), 2400)
    return () => clearTimeout(t)
  }, [dispatch])
  return (
    <div className="fixed inset-0 z-[10000] bg-[#0a2137] flex flex-col items-center justify-center gap-6">
      <svg viewBox="0 0 48 48" width="60" height="60" className="spin"><circle cx="24" cy="24" r="18" fill="none" stroke="#8fc6ee" strokeOpacity=".25" strokeWidth="3" /><path d="M42 24a18 18 0 00-18-18" fill="none" stroke="#8fc6ee" strokeWidth="3" strokeLinecap="round" /></svg>
      <div className="text-[#cfe6ff] text-lg">Shutting down...</div>
    </div>
  )
}

export function RestartScreen() {
  const { dispatch } = useOS()
  useEffect(() => {
    const t = setTimeout(() => dispatch({ type: 'BACK_TO_BOOT' }), 2200)
    return () => clearTimeout(t)
  }, [dispatch])
  return (
    <div className="fixed inset-0 z-[10000] bg-[#0a2137] flex flex-col items-center justify-center gap-6">
      <svg viewBox="0 0 48 48" width="60" height="60" className="spin"><circle cx="24" cy="24" r="18" fill="none" stroke="#8fc6ee" strokeOpacity=".25" strokeWidth="3" /><path d="M42 24a18 18 0 00-18-18" fill="none" stroke="#8fc6ee" strokeWidth="3" strokeLinecap="round" /></svg>
      <div className="text-[#cfe6ff] text-lg">Restarting...</div>
    </div>
  )
}

export function OffScreen() {
  const { dispatch } = useOS()
  return (
    <div className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center gap-4">
      <button
        className="w-20 h-20 rounded-full flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity"
        style={{ background: 'radial-gradient(circle at 50% 30%, #1d4e78, #0a2137)', border: '1px solid #2f7ab8' }}
        onClick={() => dispatch({ type: 'BACK_TO_BOOT' })}
        aria-label="Power on"
        title="Power on"
      >
        <svg viewBox="0 0 48 48" width="34" height="34"><circle cx="24" cy="24" r="17" fill="none" stroke="#cfe6ff" strokeWidth="3" strokeDasharray="76 22" strokeLinecap="round" transform="rotate(120 24 24)" /><path d="M24 10v12" stroke="#cfe6ff" strokeWidth="3.4" strokeLinecap="round" /></svg>
      </button>
      <div className="text-[#5f7686] text-xs">The computer is off — click the power button</div>
    </div>
  )
}
