import { useEffect, useRef, useState } from 'react'
import { fs } from '../core/fs'
import { FileDialog } from '../components/FileDialog'
import { Icon } from '../icons'

const TOOLS = [
  ['pencil', 'Pencil', 'M3 17l3-6 8-8 3 3-8 8z'],
  ['brush', 'Brush', 'M6 14c4 0 4 4 8 4s6-3 4-8c-2-4-6-7-6-7s-8 4-6 11z'],
  ['eraser', 'Eraser', 'M4 15l7-7 6 6-7 7H7z'],
  ['line', 'Line', 'M4 18L18 4'],
  ['rect', 'Rectangle', 'M4 6h14v10H4z'],
  ['ellipse', 'Ellipse', 'M11 5c4 0 7 2.7 7 6s-3 6-7 6-7-2.7-7-6 3-6 7-6z'],
  ['fill', 'Fill', 'M6 3l8 8-6 6-8-8zM14 15c2 2 2 5 0 5s-2-3 0-5'],
]
const COLORS = [
  '#000000', '#7f7f7f', '#880015', '#ed1c24', '#ff7f27', '#fff200', '#22b14c', '#00a2e8',
  '#3f48cc', '#a349a4', '#ffffff', '#c3c3c3', '#b97a57', '#ffaec9', '#ffc90e', '#efe4b0',
  '#b5e61d', '#99d9ea', '#7092be', '#c8bfe7',
]

export default function Paint({ winId, path: initialPath }) {
  const canvasRef = useRef(null)
  const [tool, setTool] = useState('pencil')
  const [color, setColor] = useState('#000000')
  const [size, setSize] = useState(3)
  const [drawing, setDrawing] = useState(null)
  const undoStack = useRef([])
  const redoStack = useRef([])
  const [steps, setSteps] = useState(0)
  const [saveOpen, setSaveOpen] = useState(null)
  const W = 900
  const H = 620

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)
    if (initialPath) {
      const content = fs.readFile(initialPath)
      if (content && content.startsWith('data:image')) {
        const img = new Image()
        img.onload = () => ctx.drawImage(img, 0, 0)
        img.src = content
      }
    }
  }, [])

  const snapshot = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    undoStack.current.push(ctx.getImageData(0, 0, W, H))
    if (undoStack.current.length > 20) undoStack.current.shift()
    redoStack.current = []
    setSteps(undoStack.current.length)
  }

  const pos = (e) => {
    const r = canvasRef.current.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H }
  }

  const floodFill = (x, y, hex) => {
    const ctx = canvasRef.current.getContext('2d')
    const img = ctx.getImageData(0, 0, W, H)
    const data = img.data
    const idx = (x, y) => (y * W + x) * 4
    const target = data.slice(idx(Math.round(x), Math.round(y)), idx(Math.round(x), Math.round(y)) + 4)
    const rgb = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
    if (target[0] === rgb[0] && target[1] === rgb[1] && target[2] === rgb[2]) return
    const match = (i) => Math.abs(data[i] - target[0]) < 8 && Math.abs(data[i + 1] - target[1]) < 8 && Math.abs(data[i + 2] - target[2]) < 8
    const stack = [[Math.round(x), Math.round(y)]]
    while (stack.length) {
      const [cx, cy] = stack.pop()
      if (cx < 0 || cy < 0 || cx >= W || cy >= H) continue
      const i = idx(cx, cy)
      if (!match(i)) continue
      data[i] = rgb[0]; data[i + 1] = rgb[1]; data[i + 2] = rgb[2]; data[i + 3] = 255
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1])
    }
    ctx.putImageData(img, 0, 0)
  }

  const onDown = (e) => {
    if (e.button !== 0 && tool !== 'fill') return
    snapshot()
    const p = pos(e)
    if (tool === 'fill') { floodFill(p.x, p.y, color); return }
    setDrawing({ start: p, cur: p })
  }

  const onMove = (e) => {
    if (!drawing) return
    const p = pos(e)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = tool === 'eraser' ? size * 3 : size
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color
    ctx.fillStyle = color
    if (tool === 'pencil' || tool === 'brush' || tool === 'eraser') {
      ctx.beginPath()
      ctx.moveTo(drawing.cur.x, drawing.cur.y)
      ctx.lineTo(p.x, p.y)
      ctx.stroke()
      setDrawing({ ...drawing, cur: p })
    } else {
      // live shape preview: restore the saved snapshot each move
      const base = undoStack.current[undoStack.current.length - 1]
      if (base) ctx.putImageData(base, 0, 0)
      ctx.beginPath()
      if (tool === 'line') {
        ctx.moveTo(drawing.start.x, drawing.start.y)
        ctx.lineTo(p.x, p.y)
        ctx.stroke()
      } else if (tool === 'rect') {
        ctx.strokeRect(drawing.start.x, drawing.start.y, p.x - drawing.start.x, p.y - drawing.start.y)
      } else if (tool === 'ellipse') {
        ctx.ellipse((drawing.start.x + p.x) / 2, (drawing.start.y + p.y) / 2, Math.abs(p.x - drawing.start.x) / 2, Math.abs(p.y - drawing.start.y) / 2, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
    }
  }

  const onUp = () => setDrawing(null)

  const undo = () => {
    if (!undoStack.current.length) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    redoStack.current.push(ctx.getImageData(0, 0, W, H))
    ctx.putImageData(undoStack.current.pop(), 0, 0)
    setSteps(undoStack.current.length)
  }
  const redo = () => {
    if (!redoStack.current.length) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    undoStack.current.push(ctx.getImageData(0, 0, W, H))
    ctx.putImageData(redoStack.current.pop(), 0, 0)
    setSteps(undoStack.current.length)
  }
  const clearAll = () => { snapshot(); const ctx = canvasRef.current.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H) }

  const saveTo = ({ path }) => {
    const data = canvasRef.current.toDataURL('image/png')
    fs.writeFile(path, data, 'image/png')
    setSaveOpen(null)
  }
  const openFrom = ({ path, node }) => {
    const ctx = canvasRef.current.getContext('2d')
    snapshot()
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H)
    const img = new Image()
    img.onload = () => ctx.drawImage(img, 0, 0)
    img.src = node.content
    setSaveOpen(null)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Ribbon */}
      <div className="flex items-center gap-2 px-2 py-1.5 bg-gradient-to-b from-[#f6fafd] to-[#e8eff5] border-b border-[#d4dde4] flex-wrap">
        <div className="flex gap-0.5">
          {TOOLS.map(([id, label, d]) => (
            <button
              key={id}
              title={label}
              aria-label={label}
              className={`w-7 h-7 rounded flex items-center justify-center border ${tool === id ? 'bg-[#cfe4f5] border-[#9cc4e2]' : 'border-transparent hover:bg-[#e4effa]'}`}
              onClick={() => setTool(id)}
            >
              <svg viewBox="0 0 22 22" width="17" height="17"><path d={d} fill="none" stroke="#2e4457" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          ))}
        </div>
        <div className="w-px h-6 bg-[#d4dde4]" />
        <input type="range" min="1" max="30" value={size} onChange={(e) => setSize(+e.target.value)} className="w-20 accent-[var(--accent)]" title="Brush size" aria-label="Brush size" />
        <div className="flex items-center gap-1">
          <div className="w-5 h-5 rounded border-2 border-white shadow-[0_0_0_1px_#93a9ba]" style={{ background: color }} />
          <div className="grid grid-rows-2 grid-flow-col gap-[2px]">
            {COLORS.map((c) => (
              <button key={c} className={`w-3.5 h-3.5 rounded-[2px] border ${color === c ? 'border-[#2a6ea8] ring-1 ring-[#2a6ea8]' : 'border-[#aab8c4]'}`} style={{ background: c }} onClick={() => setColor(c)} aria-label={c} />
            ))}
          </div>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-6 h-6 cursor-pointer" title="Custom color" aria-label="Custom color" />
        </div>
        <div className="w-px h-6 bg-[#d4dde4]" />
        <button className="btn !px-2" onClick={undo} disabled={steps === 0} title="Undo (Ctrl+Z)">↶</button>
        <button className="btn !px-2" onClick={redo} title="Redo">↷</button>
        <button className="btn !px-2" onClick={clearAll}>Clear</button>
        <div className="ml-auto flex gap-1.5">
          <button className="btn !px-2" onClick={() => setSaveOpen('open')}>Open…</button>
          <button className="btn btn-default !px-2" onClick={() => setSaveOpen('save')}>Save</button>
        </div>
      </div>
      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-[#7f95a6] p-3 grid place-items-start" style={{ placeItems: 'center' }}>
        <div className="bg-white shadow-[0_2px_14px_rgba(0,0,0,.35)]">
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="max-w-full"
            style={{ width: W, maxWidth: '100%', touchAction: 'none', cursor: tool === 'fill' ? 'cell' : 'crosshair' }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerLeave={onUp}
          />
        </div>
      </div>
      <div className="flex-none px-3 py-1 text-[11px] text-[#4a5b68] bg-gradient-to-b from-[#f6fafd] to-[#e8eff5] border-t border-[#d4dde4]">
        {W} × {H}px — {tool} — saved images go to the C: drive
      </div>
      {saveOpen && (
        <FileDialog
          mode={saveOpen}
          startPath="/Users/Administrator/Pictures"
          defaultName={saveOpen === 'save' ? 'Untitled.png' : ''}
          accept={/\.(png|jpe?g|gif|svg|webp|bmp)$/i}
          title={saveOpen === 'save' ? 'Save Picture As' : 'Open Picture'}
          onPick={saveOpen === 'save' ? saveTo : openFrom}
          onClose={() => setSaveOpen(null)}
        />
      )}
    </div>
  )
}
