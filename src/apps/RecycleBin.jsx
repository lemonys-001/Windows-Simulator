import { useMemo } from 'react'
import { fs } from '../core/fs'
import { useFs } from '../core/hooks'
import { Icon, fileIcon } from '../icons'
import { fmtSize } from '../core/util'
import { useOS } from '../core/store'
import { dialog } from '../core/dialog'
import { openNode } from '../components/Desktop'

export default function RecycleBin() {
  const { dispatch } = useOS()
  const fsVersion = useFs()
  const items = useMemo(() => fs.listTrash(), [fsVersion])

  const restore = (key) => {
    const r = fs.restore(key)
    if (r.error) dispatch({ type: 'TOAST', toast: { title: 'Recycle Bin', body: r.error } })
  }

  const empty = async () => {
    if (!items.length) return
    const ok = await dialog.confirm({
      title: 'Delete Multiple Items',
      message: `Are you sure you want to permanently delete these ${items.length} item(s)?`,
      okText: 'Yes', cancelText: 'No',
    })
    if (ok) fs.emptyTrash()
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-2 px-2 py-1.5 bg-gradient-to-b from-[#f6fafd] to-[#e8eff5] border-b border-[#d4dde4]">
        <Icon name="recycle" size={20} />
        <span className="text-[12px]">Recycle Bin — {items.length} item(s)</span>
        <button className="btn ml-auto !py-0.5" disabled={!items.length} onClick={empty}>Empty the Recycle Bin</button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))' }}>
          {items.map(([key, node]) => (
            <div
              key={key}
              className="list-row rounded p-2 flex flex-col items-center gap-1 text-center"
              onDoubleClick={() => restore(key)}
              onContextMenu={(e) => {
                e.preventDefault()
                import('../components/ContextMenu').then((m) => m.openCtx({
                  x: e.clientX, y: e.clientY,
                  items: [
                    { label: 'Restore', action: () => restore(key) },
                    { label: 'Delete permanently', action: () => fs.deletePermanently(`/$Recycle.Bin/${key}`) },
                  ],
                }))
              }}
              title={`${node.name}\nDeleted from ${node.deletedFrom}\n(Double-click to restore, right-click for more)`}
            >
              <Icon name={fileIcon(node)} size={38} />
              <span className="text-[11px] break-all line-clamp-2">{node.name}</span>
              <span className="text-[10px] text-[#93a9ba]">{node.type === 'file' ? fmtSize((node.content || '').length) : 'Folder'}</span>
            </div>
          ))}
          {items.length === 0 && (
            <div className="col-span-full text-center text-[#93a9ba] text-[12px] py-8">
              The Recycle Bin is empty. Files you delete from Explorer land here — nothing is truly lost until you empty it.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
