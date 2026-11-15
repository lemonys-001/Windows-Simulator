import { useEffect, useMemo, useState } from 'react'
import { fs } from '../core/fs'
import { useFs } from '../core/hooks'
import { useOS } from '../core/store'
import { Icon } from '../icons'
import { openCtx } from '../components/ContextMenu'

export default function PhotoViewer({ path: initialPath }) {
  const { dispatch } = useOS()
  const fsVersion = useFs()
  const pics = useMemo(() => fs.list('/Users/Administrator/Pictures').filter((n) => (n.mime || '').startsWith('image') || /\.(svg|png|jpe?g|webp|gif)$/i.test(n.name)), [fsVersion])
  const [idx, setIdx] = useState(() => {
    if (!initialPath) return 0
    const i = pics.findIndex((n) => `/Users/Administrator/Pictures/${n.name}` === initialPath)
    return i >= 0 ? i : 0
  })
  const [zoom, setZoom] = useState(1)
  const [rot, setRot] = useState(0)

  const node = pics[idx]

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(pics.length - 1, i + 1))
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(0, i - 1))
      if (e.ctrlKey && (e.key === '=' || e.key === '+')) { e.preventDefault(); setZoom((z) => Math.min(4, z + 0.25)) }
      if (e.ctrlKey && e.key === '-') { e.preventDefault(); setZoom((z) => Math.max(0.25, z - 0.25)) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pics.length])

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 grid place-items-center min-h-0 bg-[#24303c] overflow-hidden relative">
        {node ? (
          <img
            src={node.content}
            alt={node.name}
            className="max-w-full max-h-full transition-transform duration-150 select-none"
            style={{ transform: `scale(${zoom}) rotate(${rot}deg)` }}
            draggable={false}
          />
        ) : (
          <div className="text-[#7fa3bd] text-center">
            <Icon name="image" size={52} className="mx-auto mb-2 opacity-60" />
            <div className="text-[13px]">No pictures in ~/Pictures yet.<br />Paint something and save it!</div>
          </div>
        )}
        {node && (
          <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[11px] text-[#9dbcd4] px-1 pointer-events-none">
            <span>{idx + 1} of {pics.length}</span>
            <span className="truncate">{node.name}</span>
          </div>
        )}
      </div>
      <div className="flex-none flex items-center justify-center gap-1 px-2 py-1.5 bg-gradient-to-b from-[#f6fafd] to-[#e8eff5] border-t border-[#d4dde4]">
        <button className="btn !px-2" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} aria-label="Previous">◀</button>
        <button className="btn !px-2" onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))} title="Zoom out"><Icon name="zoomOut" size={15} /></button>
        <span className="text-[11px] w-10 text-center">{Math.round(zoom * 100)}%</span>
        <button className="btn !px-2" onClick={() => setZoom((z) => Math.min(4, z + 0.25))} title="Zoom in"><Icon name="zoomIn" size={15} /></button>
        <button className="btn !px-2" onClick={() => setRot((r) => (r + 90) % 360)} title="Rotate"><Icon name="rotate" size={15} /></button>
        <button className="btn !px-2" onClick={() => { setZoom(1); setRot(0) }}>Fit</button>
        <button className="btn !px-2" onClick={() => setIdx((i) => Math.min(pics.length - 1, i + 1))} disabled={idx >= pics.length - 1} aria-label="Next">▶</button>
        <span className="w-px h-5 bg-[#d4dde4] mx-1" />
        <button
          className="btn !px-2"
          onClick={async () => {
            if (!node) return
            const m = await import('../components/ContextMenu')
            openCtx({
              x: window.innerWidth / 2 - 90, y: window.innerHeight / 2,
              items: [
                { label: 'Open in Paint', action: () => dispatch({ type: 'OPEN_APP', appId: 'paint', props: { path: `/Users/Administrator/Pictures/${node.name}` } }) },
                { label: 'Set as wallpaper', action: () => dispatch({ type: 'SET_SETTING', key: 'wallpaper', value: `custom:${node.id}` }) },
                { label: 'Delete', action: async () => { await fs.trash(`/Users/Administrator/Pictures/${node.name}`); setIdx(0) } },
              ],
            })
          }}
        >☰ Menu</button>
      </div>
    </div>
  )
}
