import { useSyncExternalStore, useState, useEffect, useRef } from 'react'
import { dialog } from '../core/dialog'

export function DialogHost() {
  const spec = useSyncExternalStore(dialog.subscribe, dialog.getSnapshot)
  const [value, setValue] = useState('')
  const inputRef = useRef(null)
  useEffect(() => {
    if (spec) {
      setValue(spec.value || '')
      if (spec.kind === 'prompt') setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select() }, 20)
    }
  }, [spec])
  if (!spec) return null

  const ok = () => dialog.close(spec.kind === 'prompt' ? value : true)
  const cancel = () => dialog.close(spec.kind === 'prompt' ? null : false)
  const onKey = (e) => {
    if (e.key === 'Enter') ok()
    if (e.key === 'Escape') cancel()
  }

  return (
    <div className="fixed inset-0 z-[9500] flex items-center justify-center" onKeyDown={onKey}>
      <div className="absolute inset-0 bg-black/25" onClick={cancel} />
      <div className="relative win" style={{ width: 380 }}>
        <div className="win-titlebar" style={{ cursor: 'default' }}>
          <div className="win-title">{spec.title || 'Windows'}</div>
        </div>
        <div className="win-body p-4 gap-3">
          <div className="leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{spec.message}</div>
          {spec.kind === 'prompt' && (
            <input ref={inputRef} className="field w-full" value={value} onChange={(e) => setValue(e.target.value)} />
          )}
          <div className="flex justify-end gap-2 mt-2">
            <button className="btn" onClick={cancel} autoFocus={spec.kind !== 'prompt'}>{spec.cancelText}</button>
            <button className="btn btn-default" onClick={ok}>{spec.okText}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
