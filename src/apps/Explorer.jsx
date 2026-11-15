import { useEffect, useMemo, useRef, useState } from 'react'
import { fs } from '../core/fs'
import { useFs } from '../core/hooks'
import { Icon, fileIcon } from '../icons'
import { fmtSize, ext, mimeKind } from '../core/util'
import { openNode } from '../components/Desktop'
import { useOS } from '../core/store'
import { dialog } from '../core/dialog'
import { uniqueName } from '../components/Desktop'

const QUICK = [
  ['Desktop', '/Users/Administrator/Desktop', 'computer'],
  ['Documents', '/Users/Administrator/Documents', 'folder'],
  ['Pictures', '/Users/Administrator/Pictures', 'image'],
  ['Music', '/Users/Administrator/Music', 'media'],
  ['Videos', '/Users/Administrator/Videos', 'media'],
  ['Downloads', '/Users/Administrator/Downloads', 'folder'],
]

export default function Explorer({ winId, path: initialPath = '/', title }) {
  const { dispatch } = useOS()
  const fsVersion = useFs()
  const [history, setHistory] = useState([initialPath])
  const [hIndex, setHIndex] = useState(0)
  const [selected, setSelected] = useState([])
  const [view, setView] = useState('icons')
  const [renaming, setRenaming] = useState(null)
  const [renameVal, setRenameVal] = useState('')
  const renameRef = useRef(null)

  const path = history[hIndex]
  const entries = useMemo(() => fs.list(path), [path, fsVersion])
  const isComputer = path === '/'
  const node = fs.get(path)

  const navigate = (p) => {
    if (p === path) return
    const next = [...history.slice(0, hIndex + 1), p]
    setHistory(next)
    setHIndex(next.length - 1)
    setSelected([])
  }
  const back = () => hIndex > 0 && setHIndex(hIndex - 1)
  const forward = () => hIndex < history.length - 1 && setHIndex(hIndex + 1)
  const up = () => navigate(path === '/' ? '/' : path.slice(0, path.lastIndexOf('/')) || '/')

  useEffect(() => {
    if (renaming) setTimeout(() => { renameRef.current?.focus(); renameRef.current?.select() }, 30)
  }, [renaming])

  useEffect(() => {
    const label = isComputer ? 'Computer' : node?.name || path
    dispatch({ type: 'SET_TITLE', id: winId, title: `${label} - Windows Explorer` })
  }, [path])

  const crumbs = path.split('/').filter(Boolean)

  const selPaths = selected.map((i) => `${path}/${entries[i]?.name}`).filter(Boolean)
  const single = selected.length === 1 ? entries[selected[0]] : null

  const openEntry = (entry) => {
    const p = `${path}/${entry.name}`
    if (entry.type === 'dir') navigate(p)
    else openNode(entry, p, dispatch)
  }

  const openWithNotepad = () => {
    const p = selPaths[0]
    const n = fs.get(p)
    if (n) openNode(n, p, dispatch)
  }

  const doDelete = async () => {
    for (const p of selPaths) fs.trash(p)
    setSelected([])
  }

  const doNewFolder = async () => {
    const name = await uniqueName(path, 'New folder')
    fs.mkdir(`${path}/${name}`)
    const entries2 = fs.list(path)
    const idx = entries2.findIndex((e) => e.name === name)
    setSelected(idx >= 0 ? [idx] : [])
    setRenaming(name)
    setRenameVal(name)
  }

  const doRename = async () => {
    if (!single) return
    setRenaming(single.name)
    setRenameVal(single.name)
  }

  const commitRename = () => {
    if (renaming && renameVal && renameVal !== renaming) fs.rename(`${path}/${renaming}`, renameVal)
    setRenaming(null)
  }

  const paste = () => {
    if (!fs.clipboardEmpty()) { fs.pasteInto(path); setSelected([]) }
  }

  const onKey = (e) => {
    if (renaming) return
    if (e.key === 'Delete' && selPaths.length) doDelete()
    if (e.key === 'F2' && single) doRename()
    if (e.key === 'Backspace') up()
    if (e.ctrlKey && e.key === 'a') { e.preventDefault(); setSelected(entries.map((_, i) => i)) }
    if (e.ctrlKey && e.key === 'c' && selPaths.length) fs.copyToClipboard(selPaths, false)
    if (e.ctrlKey && e.key === 'x' && selPaths.length) fs.copyToClipboard(selPaths, true)
    if (e.ctrlKey && e.key === 'v') paste()
    if (e.ctrlKey && e.key === 'n') { e.preventDefault(); doNewFolder() }
  }

  const itemMenu = (e, entry, idx) => {
    e.preventDefault()
    e.stopPropagation()
    if (!selected.includes(idx)) setSelected([idx])
    const p = `${path}/${entry.name}`
    openCtxMenu(e, [
      { label: 'Open', action: () => openEntry(entry) },
      entry.type === 'file' && mimeKind(entry.mime, entry.name) === 'text' ? { label: 'Open with Notepad', action: openWithNotepad } : null,
      { sep: true },
      { label: 'Copy', disabled: false, action: () => fs.copyToClipboard([p], false) },
      { label: 'Cut', action: () => fs.copyToClipboard([p], true) },
      { label: 'Rename', action: doRename },
      { label: 'Delete', action: doDelete },
      { sep: true },
      { label: 'Properties', action: () => showProps(entry, p, dialog) },
    ].filter(Boolean))
  }

  const bgMenu = (e) => {
    e.preventDefault()
    openCtxMenu(e, [
      { label: 'New Folder', icon: '＋', action: doNewFolder },
      { label: 'New Text Document', icon: '📄', action: async () => {
          const name = await uniqueName(path, 'New Text Document.txt')
          fs.writeFile(`${path}/${name}`, '')
        } },
      { sep: true },
      { label: 'Paste', disabled: fs.clipboardEmpty(), action: paste },
      { label: `View: ${view === 'icons' ? 'Large icons' : 'Details'}`, icon: view === 'icons' ? '▦' : '☰', action: () => setView(view === 'icons' ? 'details' : 'icons') },
      { label: 'Refresh', icon: '↻', action: () => {} },
    ])
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 outline-none" tabIndex={0} onKeyDown={onKey}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-gradient-to-b from-[#f6fafd] to-[#e8eff5] border-b border-[#d4dde4]">
        <ToolbarBtn label="Back" disabled={hIndex === 0} onClick={back}><Icon name="back" size={22} /></ToolbarBtn>
        <ToolbarBtn label="Forward" disabled={hIndex >= history.length - 1} onClick={forward}><Icon name="forward" size={22} /></ToolbarBtn>
        <div className="w-px h-5 bg-[#d4dde4] mx-1" />
        <ToolbarBtn label="Up" disabled={isComputer} onClick={up}><Icon name="up" size={22} /></ToolbarBtn>
        {/* Address bar */}
        <div className="field flex-1 flex items-center gap-1 min-w-0 mx-1 !py-0.5">
          <Icon name="drive" size={14} />
          <button className="hover:underline" onClick={() => navigate('/')}>C:</button>
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center min-w-0">
              <span className="text-[#93a9ba] px-0.5">›</span>
              <button className="hover:underline truncate" onClick={() => navigate('/' + crumbs.slice(0, i + 1).join('/'))}>{c}</button>
            </span>
          ))}
        </div>
        <ToolbarBtn label="View" onClick={() => setView(view === 'icons' ? 'details' : 'icons')}>
          <svg viewBox="0 0 24 24" width="18" height="18">{view === 'icons'
            ? <><rect x="3" y="3" width="7" height="7" fill="#5d7484" /><rect x="13" y="3" width="7" height="7" fill="#5d7484" /><rect x="3" y="13" width="7" height="7" fill="#5d7484" /><rect x="13" y="13" width="7" height="7" fill="#5d7484" /></>
            : <><rect x="3" y="4" width="18" height="3" fill="#5d7484" /><rect x="3" y="10" width="18" height="3" fill="#5d7484" /><rect x="3" y="16" width="18" height="3" fill="#5d7484" /></>}</svg>
        </ToolbarBtn>
      </div>

      {/* Body */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <div className="w-40 flex-none border-r border-[#d4dde4] bg-gradient-to-b from-[#f3f7fa] to-[#e9eef3] p-1.5 overflow-y-auto">
          <SidebarHead>Favorites</SidebarHead>
          {QUICK.map(([label, p, icon]) => (
            <SidebarItem key={p} icon={icon} label={label} active={path === p} onClick={() => navigate(p)} />
          ))}
          <SidebarHead>Computer</SidebarHead>
          <SidebarItem icon="drive" label="Local Disk (C:)" active={path === '/'} onClick={() => navigate('/')} />
          <SidebarItem icon="recycle" label="Recycle Bin" onClick={() => dispatch({ type: 'OPEN_APP', appId: 'recyclebin' })} />
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto min-w-0"
          onContextMenu={bgMenu}
          onClick={(e) => { if (e.target === e.currentTarget) setSelected([]) }}
        >
          {isComputer ? (
            <ComputerView onOpen={navigate} fsVersion={fsVersion} />
          ) : view === 'icons' ? (
            <div className="grid gap-1 p-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(96px,1fr))' }}>
              {entries.map((n, i) => (
                <EntryIcon key={n.id} node={n} selected={selected.includes(i)} renaming={renaming === n.name}
                  onClick={(e) => setSelected(e.ctrlKey || e.metaKey ? (selected.includes(i) ? selected.filter((x) => x !== i) : [...selected, i]) : [i])}
                  onOpen={() => openEntry(n)} onMenu={(e) => itemMenu(e, n, i)}
                  renameRef={renameRef} renameVal={renameVal} setRenameVal={setRenameVal} commitRename={commitRename} cancelRename={() => setRenaming(null)}
                />
              ))}
              {entries.length === 0 && <EmptyHint>This folder is empty.</EmptyHint>}
            </div>
          ) : (
            <DetailsView entries={entries} selected={selected} setSelected={setSelected} onOpen={openEntry} onMenu={itemMenu} />
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex-none flex items-center gap-4 px-3 py-1 bg-gradient-to-b from-[#f6fafd] to-[#e8eff5] border-t border-[#d4dde4] text-[11px] text-[#4a5b68]">
        <span>{entries.length} item{entries.length === 1 ? '' : 's'}</span>
        {selected.length > 0 && <span>{selected.length} selected</span>}
        {single && single.type === 'file' && <span>{fmtSize((single.content || '').length)}</span>}
      </div>
    </div>
  )
}

import { openCtx } from '../components/ContextMenu'
const openCtxMenu = (e, items) => openCtx({ x: e.clientX, y: e.clientY, items })

function showProps(node, path, dialogApi) {
  dialogApi.confirm({
    title: `${node.name} Properties`,
    message: [
      `Type: ${node.type === 'dir' ? 'File folder' : node.mime || 'File'}`,
      `Location: ${path}`,
      node.type === 'file' ? `Size: ${fmtSize((node.content || '').length)}` : null,
      `Modified: ${new Date(node.modified).toLocaleString()}`,
    ].filter(Boolean).join('\n'),
    okText: 'OK', cancelText: 'Close',
  })
}

function ToolbarBtn({ children, onClick, disabled, label }) {
  return (
    <button
      className={`w-7 h-7 rounded flex items-center justify-center ${disabled ? 'opacity-40' : 'hover:bg-[#dcebfa] active:bg-[#c9e2f7]'}`}
      onClick={onClick} disabled={disabled} title={label} aria-label={label}
    >{children}</button>
  )
}
function SidebarHead({ children }) {
  return <div className="text-[11px] font-semibold text-[#5d7484] px-2 pt-2 pb-1">{children}</div>
}
function SidebarItem({ icon, label, active, onClick }) {
  return (
    <div className={`list-row rounded px-2 py-1 flex items-center gap-1.5 text-[12px] ${active ? 'selected' : ''}`} onClick={onClick}>
      <Icon name={icon} size={16} /><span className="truncate">{label}</span>
    </div>
  )
}
function EmptyHint({ children }) {
  return <div className="col-span-full text-[#93a9ba] text-[12px] p-3">{children}</div>
}

function EntryIcon({ node, selected, renaming, onClick, onOpen, onMenu, renameRef, renameVal, setRenameVal, commitRename, cancelRename }) {
  return (
    <div
      className={`flex flex-col items-center gap-1 p-1.5 rounded cursor-default ${selected ? 'selected list-row' : 'list-row'}`}
      onClick={onClick}
      onDoubleClick={onOpen}
      onContextMenu={onMenu}
    >
      <Icon name={fileIcon(node)} size={40} />
      {renaming ? (
        <input
          ref={renameRef}
          className="field w-full !px-1 text-[11px]"
          value={renameVal}
          onChange={(e) => setRenameVal(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') cancelRename() }}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="text-[11px] text-center break-all leading-tight line-clamp-2">{node.name}</span>
      )}
    </div>
  )
}

function DetailsView({ entries, selected, setSelected, onOpen, onMenu }) {
  const [sort, setSort] = useState('name')
  const sorted = [...entries].sort((a, b) => {
    if (sort === 'name') return a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1
    if (sort === 'modified') return b.modified - a.modified
    if (sort === 'size') return (a.content?.length || 0) - (b.content?.length || 0)
    return 0
  })
  const Th = ({ k, w, children }) => (
    <th className={`text-left font-normal px-2 py-1 border-b border-[#d4dde4] cursor-pointer hover:bg-[#e8f2fb] ${w || ''}`} onClick={() => setSort(k)}>{children}{sort === k ? ' ▾' : ''}</th>
  )
  return (
    <table className="w-full text-[12px]">
      <thead className="sticky top-0 bg-gradient-to-b from-[#f6fafd] to-[#e8eff5]">
        <tr><Th k="name">Name</Th><Th k="modified" w="w-40">Date modified</Th><Th k="type" w="w-28">Type</Th><Th k="size" w="w-20">Size</Th></tr>
      </thead>
      <tbody>
        {sorted.map((n) => {
          const idx = entries.indexOf(n)
          const kind = n.type === 'dir' ? 'File folder' : (n.mime || ext(n.name).toUpperCase() + ' file')
          return (
            <tr key={n.id} className={`list-row cursor-default ${selected.includes(idx) ? 'selected' : ''}`}
              onClick={(e) => setSelected(e.ctrlKey || e.metaKey ? (selected.includes(idx) ? selected.filter((x) => x !== idx) : [...selected, idx]) : [idx])}
              onDoubleClick={() => onOpen(n)}
              onContextMenu={(e) => onMenu(e, n, idx)}
            >
              <td className="px-2 py-1 flex items-center gap-2"><Icon name={fileIcon(n)} size={18} /><span className="truncate">{n.name}</span></td>
              <td className="px-2 py-1">{new Date(n.modified).toLocaleString()}</td>
              <td className="px-2 py-1">{kind}</td>
              <td className="px-2 py-1">{n.type === 'file' ? fmtSize((n.content || '').length) : ''}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function ComputerView({ onOpen, fsVersion }) {
  const drives = [
    { name: 'Local Disk (C:)', path: '/', icon: 'drive', size: '4,294,967,295 KB free' },
  ]
  const folders = [
    { name: 'Program Files', path: '/Program Files' },
    { name: 'Users', path: '/Users' },
    { name: 'Windows', path: '/Windows' },
    { name: 'Temp', path: '/Temp' },
    { name: '$Recycle.Bin', path: '/$Recycle.Bin' },
  ]
  return (
    <div className="p-3">
      <div className="text-[11px] font-semibold text-[#5d7484] mb-1.5">Hard Disk Drives (1)</div>
      <div className="flex gap-2 mb-3">
        {drives.map((d) => (
          <div key={d.path} className="list-row rounded p-2 flex items-center gap-2 w-64" onDoubleClick={() => onOpen(d.path)}>
            <Icon name={d.icon} size={40} />
            <div className="min-w-0">
              <div className="text-[12px] truncate">{d.name}</div>
              <div className="text-[10px] text-[#7f95a6]">{d.size}</div>
              <div className="h-1.5 mt-1 rounded bg-[#dfe6ec] overflow-hidden"><div className="h-full w-[3%] bg-[#3aa757]" /></div>
            </div>
          </div>
        ))}
      </div>
      <div className="text-[11px] font-semibold text-[#5d7484] mb-1.5">Folders</div>
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px,1fr))' }}>
        {folders.map((f) => (
          <div key={f.path} className="list-row rounded p-2 flex items-center gap-2" onDoubleClick={() => onOpen(f.path)}>
            <Icon name="folder" size={32} /><span className="text-[12px] truncate">{f.name}</span>
          </div>
        ))}
      </div>
      <span className="hidden">{fsVersion}</span>
    </div>
  )
}
