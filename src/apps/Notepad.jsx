import { useEffect, useRef, useState } from 'react'
import { fs } from '../core/fs'
import { useOS } from '../core/store'
import { FileDialog } from '../components/FileDialog'
import { dialog } from '../core/dialog'

export default function Notepad({ winId, path: initialPath }) {
  const { dispatch } = useOS()
  const [path, setPath] = useState(initialPath || null)
  const [text, setText] = useState(() => (initialPath ? fs.readFile(initialPath) ?? '' : ''))
  const [dirty, setDirty] = useState(false)
  const [wordWrap, setWordWrap] = useState(true)
  const [fontSize, setFontSize] = useState(13)
  const [menu, setMenu] = useState(null)
  const [dialogMode, setDialogMode] = useState(null) // 'open' | 'save'
  const areaRef = useRef(null)
  const [cursor, setCursor] = useState({ line: 1, col: 1 })

  useEffect(() => {
    if (path) {
      const name = path.slice(path.lastIndexOf('/') + 1)
      dispatch({ type: 'SET_TITLE', id: winId, title: `${dirty ? '*' : ''}${name} - Notepad` })
    }
  }, [path, dirty, dispatch, winId])

  const save = (as = false) => {
    if (!path || as) { setDialogMode('save'); return true }
    fs.writeFile(path, text)
    setDirty(false)
    return true
  }

  const closeApp = async () => {
    if (dirty) {
      const r = await dialog.confirm({
        title: 'Notepad',
        message: `Do you want to save changes to ${path ? path.slice(path.lastIndexOf('/') + 1) : 'Untitled'}?`,
        okText: 'Save', cancelText: "Don't save",
      })
      if (r === true) { if (!save()) return }
      else if (r === null) return
    }
    dispatch({ type: 'CLOSE', id: winId })
  }

  const onMenu = (m) => setMenu(menu === m ? null : m)

  const updateCursor = () => {
    const el = areaRef.current
    if (!el) return
    const upto = el.value.slice(0, el.selectionStart)
    const lines = upto.split('\n')
    setCursor({ line: lines.length, col: lines[lines.length - 1].length + 1 })
  }

  const items = {
    file: [
      { label: 'New', onClick: () => { setText(''); setPath(null); setDirty(false) } },
      { label: 'Open…', onClick: () => setDialogMode('open') },
      { label: 'Save', onClick: () => save() },
      { label: 'Save As…', onClick: () => save(true) },
      { sep: true },
      { label: 'Exit', onClick: closeApp },
    ],
    edit: [
      { label: 'Select All', onClick: () => areaRef.current?.select() },
      { label: 'Time/Date', onClick: () => setText((t) => t + new Date().toLocaleString()) },
    ],
    format: [
      { label: 'Word Wrap', checked: wordWrap, onClick: () => setWordWrap(!wordWrap) },
      { label: `Font size: ${fontSize}`, onClick: () => setFontSize(fontSize >= 20 ? 12 : fontSize + 2) },
    ],
    help: [
      { label: 'About Notepad', onClick: () => dialog.confirm({ title: 'About Notepad', message: 'Notepad — part of Windows 7 Simulator.\nSaves files to the virtual C: drive.', cancelText: 'Close' }) },
    ],
  }

  return (
    <div className="flex-1 flex flex-col min-h-0" onClick={() => setMenu(null)} tabIndex={0}
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 's') { e.preventDefault(); save(e.shiftKey) }
      }}
    >
      <div className="flex items-center gap-0 px-1 py-0.5 bg-gradient-to-b from-[#f6fafd] to-[#eaf1f7] border-b border-[#d4dde4] text-[12px]">
        {Object.entries(items).map(([k, list]) => (
          <div key={k} className="relative" onClick={(e) => { e.stopPropagation(); onMenu(k) }}>
            <div className={`menubar-item capitalize ${menu === k ? 'open' : ''}`}>{k === 'file' ? 'File' : k}</div>
            {menu === k && (
              <div className="ctx !absolute left-0 top-full" style={{ position: 'absolute' }}>
                {list.map((it, i) => it.sep ? <div key={i} className="ctx-sep" /> : (
                  <div key={i} className="ctx-item" onClick={(e) => { e.stopPropagation(); setMenu(null); it.onClick?.() }}>
                    {it.checked && <span className="w-3 text-[#2a6ea8]">✓</span>}
                    <span>{it.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <textarea
        ref={areaRef}
        className="flex-1 w-full resize-none outline-none p-2 bg-white text-[#1c2b36] leading-relaxed"
        style={{ fontSize, whiteSpace: wordWrap ? 'pre-wrap' : 'pre', overflowX: wordWrap ? 'hidden' : 'auto', fontFamily: 'Consolas, monospace' }}
        value={text}
        spellCheck={false}
        onChange={(e) => { setText(e.target.value); setDirty(true); updateCursor() }}
        onKeyUp={updateCursor}
        onClick={updateCursor}
      />
      <div className="flex-none flex items-center gap-4 px-3 py-0.5 bg-gradient-to-b from-[#f6fafd] to-[#eaf1f7] border-t border-[#d4dde4] text-[11px] text-[#4a5b68]">
        <span className="ml-auto">Ln {cursor.line}, Col {cursor.col}</span>
        <span>{text.length} chars</span>
        <span>UTF-8</span>
      </div>

      {dialogMode && (
        <FileDialog
          mode={dialogMode}
          startPath={path ? path.slice(0, path.lastIndexOf('/')) : '/Users/Administrator/Documents'}
          defaultName={path?.slice(path.lastIndexOf('/') + 1) || 'Untitled.txt'}
          accept={/\.(txt|md|log|ini)$/i}
          title={dialogMode === 'save' ? 'Save As' : 'Open'}
          onPick={({ path: p }) => {
            if (dialogMode === 'open') {
              setPath(p); setText(fs.readFile(p) ?? ''); setDirty(false)
            } else {
              fs.writeFile(p, text)
              setPath(p); setDirty(false)
            }
            setDialogMode(null)
          }}
          onClose={() => setDialogMode(null)}
        />
      )}
    </div>
  )
}
