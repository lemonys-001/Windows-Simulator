import { useEffect } from 'react'
import { useOS } from '../core/store'

export function Toasts() {
  const { state, dispatch, TASKBAR_H } = useOS()
  return (
    <div className="fixed right-3 z-[8500] flex flex-col gap-2" style={{ bottom: TASKBAR_H + 10 }}>
      {state.toasts.map((t) => <Toast key={t.id} toast={t} dispatch={dispatch} />)}
    </div>
  )
}

function Toast({ toast, dispatch }) {
  useEffect(() => {
    const t = setTimeout(() => dispatch({ type: 'TOAST_CLOSE', id: toast.id }), 4500)
    return () => clearTimeout(t)
  }, [toast.id, dispatch])
  return (
    <div className="toast" role="status">
      <div className="flex items-start gap-2">
        <svg viewBox="0 0 48 48" width="18" height="18" className="flex-none mt-0.5"><path d="M8 21l14-2.6v-9L8 12.6zM24.6 17.8L40 15v13.2l-15.4-1.2zM8 22.8l14 1.2v10.6L8 32.4zM24.6 25.4L40 26.6V40l-15.4-2.6z" fill="#4f9cd9" transform="translate(0 2)" /></svg>
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-semibold">{toast.title}</div>
          <div className="text-[11px] text-[#4a5b68] leading-snug">{toast.body}</div>
        </div>
        <button className="text-[#7f95a6] hover:text-[#2a6ea8] text-sm leading-none" aria-label="Dismiss" onClick={() => dispatch({ type: 'TOAST_CLOSE', id: toast.id })}>✕</button>
      </div>
    </div>
  )
}
