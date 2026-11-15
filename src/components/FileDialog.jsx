import { useEffect, useState } from 'react'
import { fs } from '../core/fs'
import { useFs } from '../core/hooks'
import { Icon, fileIcon } from '../icons'

// mode: 'open' | 'save'
export function FileDialog({ mode = 'open', startPath = '/Users/Administrator/Documents', defaultName = '', accept, title, onPick, onClose }) {
  const fsVersion = useFs()
  const [path, setPath] = useState(startPath)
  const [name, setName] = useState(defaultName)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')

  const entries = fs.list(path)
    .filter((n) => n.type === 'dir' || !accept || accept.test(n.name))

  const crumbs = fs.normalize(path).split('/').filter(Boolean)

  const pick = () => {
    const full = fs.normalize(`${path}/${name}`)
    if (mode === 'save') {
      if (!name.trim()) { setError('Enter a file name.'); return }
      const existing = fs.get(full)
      if (existing && existing.type === 'dir') { setError('That name is a folder.'); return }
      onPick({ path: full, node: existing })
    } else {
      const node = fs.get(full)
      if (!node || node.type !== 'file') { setError('File not found.'); return }
      onPick({ path: full, node })
    }
  }

  const onKey = (e) => {
    if (e.key === 'Enter') pick()
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="fixed inset-0 z-[9600] flex items-center justify-center" onKeyDown={onKey}>
      <div className="absolute inset-0 bg-black/25" onClick={onClose} />
      <div className="relative win" style={{ width: 520, height: 420 }}>
        <div className="win-titlebar" style={{ cursor: 'default' }}>
          <div className="win-title">{title || (mode === 'save' ? 'Save As' : 'Open')}</div>
          <div className="win-controls">
            <button className="wc-btn wc-close" aria-label="Close" onClick={onClose}>
              <svg viewBox="0 0 10 10" width="10" height="10"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="#123" strokeWidth="1.4" /></svg>
            </button>
          </div>
        </div>
        <div className="win-body flex flex-row" data-fsv={fsVersion}>
          <div className="w-36 border-r border-[#d4dde4] bg-[#f6f9fb] p-1.5 flex flex-col gap-0.5 text-[12px]">
            {[['Desktop', '/Users/Administrator/Desktop'], ['Documents', '/Users/Administrator/Documents'], ['Pictures', '/Users/Administrator/Pictures'], ['Music', '/Users/Administrator/Music'], ['Computer', '/']].map(([label, p]) => (
              <div key={p} className={`list-row rounded px-2 py-1 flex items-center gap-1.5 ${path === p ? 'selected' : ''}`} onClick={() => { setPath(p); setSelected(null); setError('') }}>
                <Icon name={p === '/' ? 'drive' : p.includes('Pictures') ? 'image' : 'folder'} size={16} />{label}
              </div>
            ))}
          </div>
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[#d4dde4] text-[11px]">
              <Icon name="drive" size={14} />
              <span className="text-[#5d7484]">C:</span>
              {crumbs.map((c, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="text-[#93a9ba]">›</span>
                  <span className="cursor-pointer hover:underline" onClick={() => { setPath('/' + crumbs.slice(0, i + 1).join('/')); setSelected(null) }}>{c}</span>
                </span>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-1.5">
              <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(92px,1fr))' }}>
                {entries.map((n) => (
                  <div
                    key={n.id}
                    className={`flex flex-col items-center gap-1 p-1.5 rounded cursor-default ${selected === n.id ? 'selected list-row' : 'list-row'}`}
                    onClick={() => {
                      if (n.type === 'file') { setSelected(n.id); setName(n.name); setError('') }
                    }}
                    onDoubleClick={() => {
                      if (n.type === 'dir') { setPath(fs.normalize(`${path}/${n.name}`)); setSelected(null) }
                      else { setName(n.name); pick() }
                    }}
                  >
                    <Icon name={fileIcon(n)} size={34} />
                    <span className="text-[11px] text-center break-all leading-tight line-clamp-2">{n.name}</span>
                  </div>
                ))}
                {entries.length === 0 && <div className="text-[#93a9ba] text-[12px] p-2">This folder is empty.</div>}
              </div>
            </div>
            {mode === 'save' && (
              <div className="flex items-center gap-2 px-2 py-1.5 border-t border-[#d4dde4]">
                <span className="text-[12px]">Name:</span>
                <input className="field flex-1" value={name} onChange={(e) => { setName(e.target.value); setError('') }} autoFocus />
              </div>
            )}
            {error && <div className="text-[11px] text-[#c0392b] px-2 py-1">{error}</div>}
            <div className="flex justify-end gap-2 px-2 py-2 border-t border-[#d4dde4]">
              <button className="btn" onClick={onClose}>Cancel</button>
              <button className="btn btn-default" onClick={pick}>{mode === 'save' ? 'Save' : 'Open'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
