import { useEffect, useRef, useState } from 'react'
import { useOS } from '../core/store'
import { appList } from '../apps/registry'

export function RunDialog() {
  const { dispatch } = useOS()
  const [value, setValue] = useState('')
  const inputRef = useRef(null)
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 30) }, [])

  const run = () => {
    const cmd = value.trim().toLowerCase().replace(/\.(exe|lnk)$/, '')
    const app = appList.find((a) => a.id === cmd || a.name.toLowerCase().includes(cmd) && cmd.length > 2)
    if (app) dispatch({ type: 'OPEN_APP', appId: app.id })
    else dispatch({ type: 'TOAST', toast: { title: 'Run', body: `Windows cannot find '${value}'. Check the name and try again.` } })
    dispatch({ type: 'RUN', open: false })
  }

  return (
    <div className="fixed inset-0 z-[9400] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/10" onClick={() => dispatch({ type: 'RUN', open: false })} />
      <div className="relative win" style={{ width: 420 }}>
        <div className="win-titlebar">
          <div className="win-title">Run</div>
          <div className="win-controls">
            <button className="wc-btn wc-close" aria-label="Close" onClick={() => dispatch({ type: 'RUN', open: false })}>
              <svg viewBox="0 0 10 10" width="10" height="10"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="#123" strokeWidth="1.4" /></svg>
            </button>
          </div>
        </div>
        <div className="win-body p-4 gap-3">
          <div className="flex gap-3">
            <svg viewBox="0 0 48 48" width="34" height="34"><path d="M8 21l14-2.6v-9L8 12.6zM24.6 17.8L40 15v13.2l-15.4-1.2zM8 22.8l14 1.2v10.6L8 32.4zM24.6 25.4L40 26.6V40l-15.4-2.6z" fill="#4f9cd9" transform="translate(0 2)" /></svg>
            <div className="text-[12px] leading-snug pt-1">Type the name of a program, and Windows will open it for you. Try <b>notepad</b>, <b>calc</b>, <b>cmd</b>, <b>snake</b>…</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px]">Open:</span>
            <input
              ref={inputRef}
              className="field flex-1"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') run(); if (e.key === 'Escape') dispatch({ type: 'RUN', open: false }) }}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn" onClick={() => dispatch({ type: 'RUN', open: false })}>Cancel</button>
            <button className="btn btn-default" onClick={run}>OK</button>
          </div>
        </div>
      </div>
    </div>
  )
}
