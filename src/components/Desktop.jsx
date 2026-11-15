import { useEffect, useState, useCallback } from 'react'
import { useOS } from '../core/store'
import { fs } from '../core/fs'
import { useFs } from '../core/hooks'
import { Icon, fileIcon } from '../icons'
import { wallpaperStyle } from '../core/wallpapers'
import { openCtx } from './ContextMenu'
import { mimeKind } from '../core/util'

const DESKTOP_PATH = '/Users/Administrator/Desktop'

export function Desktop() {
  const { state, dispatch, TASKBAR_H } = useOS()
  const fsVersion = useFs()
  const [selected, setSelected] = useState(null)

  const desktopFiles = fs.list(DESKTOP_PATH)
  const icons = [
    { key: 'computer', label: 'Computer', icon: 'computer', open: () => dispatch({ type: 'OPEN_APP', appId: 'explorer', props: { path: '/' }, title: 'Computer' }) },
    { key: 'recycle', label: 'Recycle Bin', icon: fs.listTrash().length ? 'recycleFull' : 'recycle', open: () => dispatch({ type: 'OPEN_APP', appId: 'recyclebin' }) },
    { key: 'ie', label: 'Internet', icon: 'ie', open: () => dispatch({ type: 'OPEN_APP', appId: 'browser' }) },
    ...desktopFiles.map((n) => ({
      key: 'f:' + n.name, label: n.name, icon: fileIcon(n),
      open: () => openNode(n, `${DESKTOP_PATH}/${n.name}`, dispatch),
      path: `${DESKTOP_PATH}/${n.name}`,
      node: n,
    })),
  ]

  const desktopMenu = (e) => {
    e.preventDefault()
    openCtx({
      x: e.clientX, y: e.clientY,
      items: [
        { label: 'Refresh', icon: '↻', action: () => dispatch({ type: 'TOAST', toast: { title: 'Desktop', body: 'Refreshed.' } }) },
        { sep: true },
        { label: 'New Folder', icon: '＋', action: async () => {
            const name = await uniqueName(DESKTOP_PATH, 'New folder')
            fs.mkdir(`${DESKTOP_PATH}/${name}`)
          } },
        { label: 'New Text Document', icon: '📄', action: async () => {
            const name = await uniqueName(DESKTOP_PATH, 'New Text Document.txt')
            fs.writeFile(`${DESKTOP_PATH}/${name}`, '')
          } },
        { sep: true },
        { label: 'Screen resolution', disabled: true },
        { label: 'Gadgets', disabled: true },
        { label: 'Personalize', action: () => dispatch({ type: 'OPEN_APP', appId: 'settings', props: { section: 'personalize' } }) },
      ],
    })
  }

  const iconMenu = (e, ic) => {
    e.preventDefault()
    e.stopPropagation()
    const items = [{ label: 'Open', action: ic.open }]
    if (ic.node) {
      items.push(
        { sep: true },
        { label: 'Rename', action: async () => {
            const name = await import('../core/dialog').then((m) => m.dialog.prompt({ title: 'Rename', message: 'New name:', value: ic.node.name }))
            if (name && name !== ic.node.name) fs.rename(ic.path, name)
          } },
        { label: 'Delete', action: async () => { fs.trash(ic.path) } },
      )
    }
    openCtx({ x: e.clientX, y: e.clientY, items })
  }

  const onDesktopClick = () => setSelected(null)

  return (
    <div
      className="absolute inset-x-0 top-0 bg-cover bg-center"
      style={{ ...wallpaperStyle(state.settings.wallpaper), bottom: TASKBAR_H }}
      onContextMenu={desktopMenu}
      onClick={onDesktopClick}
      onPointerDown={onDesktopClick}
    >
      {state.snapPreview && <SnapPreview side={state.snapPreview} taskbar={TASKBAR_H} />}
      <div className="grid grid-flow-col content-start gap-1 p-2" style={{ gridTemplateRows: 'repeat(auto-fill, 86px)', maxHeight: `calc(100% - 8px)` }}>
        {icons.map((ic) => (
          <div
            key={ic.key}
            className={`desk-icon ${selected === ic.key ? 'selected' : ''}`}
            onClick={(e) => { e.stopPropagation(); setSelected(ic.key) }}
            onDoubleClick={ic.open}
            onContextMenu={(e) => iconMenu(e, ic)}
          >
            <Icon name={ic.icon} size={44} />
            <span>{ic.label}</span>
          </div>
        ))}
      </div>
      <span className="hidden">{fsVersion}</span>
    </div>
  )
}

function SnapPreview({ side, taskbar }) {
  const w = window.innerWidth, h = window.innerHeight - taskbar
  const style = side === 'max'
    ? { left: 6, top: 6, width: w - 12, height: h - 12 }
    : side === 'left'
      ? { left: 6, top: 6, width: w / 2 - 12, height: h - 12 }
      : { left: w / 2 + 6, top: 6, width: w / 2 - 12, height: h - 12 }
  return <div className="snap-preview" style={style} />
}

export function openNode(node, path, dispatch) {
  const kind = mimeKind(node.mime, node.name)
  if (node.type === 'dir') {
    dispatch({ type: 'OPEN_APP', appId: 'explorer', props: { path }, title: node.name })
  } else if (kind === 'image') {
    dispatch({ type: 'OPEN_APP', appId: 'photo', props: { path } })
  } else if (kind === 'audio' || kind === 'video') {
    dispatch({ type: 'OPEN_APP', appId: 'media', props: { path } })
  } else {
    dispatch({ type: 'OPEN_APP', appId: 'notepad', props: { path }, title: `${node.name} - Notepad` })
  }
}

async function uniqueName(dirPath, base) {
  const existing = new Set(fs.list(dirPath).map((n) => n.name.toLowerCase()))
  if (!existing.has(base.toLowerCase())) return base
  const stem = base.replace(/\.[^.]*$/, '')
  const extm = base.slice(stem.length)
  let i = 2
  while (existing.has(`${stem} (${i})${extm}`.toLowerCase())) i++
  return `${stem} (${i})${extm}`
}

export { uniqueName }
