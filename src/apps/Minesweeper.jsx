import { useEffect, useRef, useState } from 'react'

const LEVELS = {
  beginner: { w: 9, h: 9, mines: 10 },
  intermediate: { w: 16, h: 16, mines: 40 },
  expert: { w: 22, h: 16, mines: 70 },
}
const NUM_COLORS = ['', '#2a6ea8', '#3aa757', '#c0392b', '#7d3cc9', '#b7950b', '#16a085', '#5d6d7e', '#7f8c8d']

function build(level) {
  const { w, h, mines } = LEVELS[level]
  const cells = Array.from({ length: w * h }, () => ({ mine: false, open: false, flag: false, n: 0 }))
  let placed = 0
  while (placed < mines) {
    const i = Math.floor(Math.random() * cells.length)
    if (!cells[i].mine) { cells[i].mine = true; placed++ }
  }
  for (let i = 0; i < cells.length; i++) {
    if (cells[i].mine) continue
    cells[i].n = neighbors(i, w, h).filter((j) => cells[j].mine).length
  }
  return cells
}
function neighbors(i, w, h) {
  const x = i % w, y = Math.floor(i / w)
  const out = []
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dy) continue
    const nx = x + dx, ny = y + dy
    if (nx >= 0 && ny >= 0 && nx < w && ny < h) out.push(ny * w + nx)
  }
  return out
}

export default function Minesweeper() {
  const [level, setLevel] = useState('beginner')
  const [cells, setCells] = useState(() => build('beginner'))
  const [status, setStatus] = useState('ready') // ready | run | won | lost
  const [time, setTime] = useState(0)
  const timer = useRef(null)

  const { w, h, mines } = LEVELS[level]
  const flags = cells.filter((c) => c.flag).length

  useEffect(() => {
    if (status === 'run') {
      timer.current = setInterval(() => setTime((t) => Math.min(999, t + 1)), 1000)
      return () => clearInterval(timer.current)
    }
  }, [status])

  const reset = (lvl = level) => {
    setLevel(lvl)
    setCells(build(lvl))
    setStatus('ready')
    setTime(0)
    clearInterval(timer.current)
  }

  const openAt = (list, i) => {
    const stack = [i]
    while (stack.length) {
      const j = stack.pop()
      const c = list[j]
      if (c.open || c.flag) continue
      c.open = true
      if (c.n === 0 && !c.mine) neighbors(j, w, h).forEach((k) => { if (!list[k].open) stack.push(k) })
    }
  }

  const click = (i) => {
    if (status === 'won' || status === 'lost') return
    let list = cells.map((c) => ({ ...c }))
    if (status === 'ready') setStatus('run')
    if (list[i].flag) return
    if (list[i].mine) {
      list.forEach((c) => { if (c.mine) c.open = true })
      setCells(list)
      setStatus('lost')
      clearInterval(timer.current)
      return
    }
    openAt(list, i)
    setCells(list)
    const safe = list.filter((c) => !c.mine)
    if (safe.every((c) => c.open)) {
      setStatus('won')
      clearInterval(timer.current)
    }
  }

  const flag = (e, i) => {
    e.preventDefault()
    if (status === 'won' || status === 'lost') return
    if (status === 'ready') setStatus('run')
    setCells((cs) => cs.map((c, j) => (j === i && !c.open ? { ...c, flag: !c.flag } : c)))
  }

  const face = status === 'lost' ? '😵' : status === 'won' ? '😎' : '🙂'

  return (
    <div className="flex-1 flex flex-col items-center bg-gradient-to-b from-[#e9eef3] to-[#cfdbe4] p-3 gap-2 overflow-auto">
      <div className="flex items-center gap-3">
        <select className="field !py-0.5 text-[12px]" value={level} onChange={(e) => reset(e.target.value)} aria-label="Difficulty">
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="expert">Expert</option>
        </select>
      </div>
      <div className="rounded border-2 border-[#93a9ba] bg-[#d4dde4] p-2 shadow-inner">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="bg-[#111] text-[#f33] font-mono px-2 py-0.5 rounded tabular-nums text-[15px]">{String(Math.max(0, mines - flags)).padStart(3, '0')}</span>
          <button className="w-8 h-8 rounded bg-gradient-to-b from-[#f6fafd] to-[#d4dde4] border border-[#93a9ba] text-[16px]" onClick={() => reset()} title="New game">{face}</button>
          <span className="bg-[#111] text-[#f33] font-mono px-2 py-0.5 rounded tabular-nums text-[15px]">{String(time).padStart(3, '0')}</span>
        </div>
        <div
          className="grid gap-[2px]"
          style={{ gridTemplateColumns: `repeat(${w}, 24px)` }}
          role="grid"
        >
          {cells.map((c, i) => (
            <button
              key={i}
              className={`w-6 h-6 text-[13px] font-bold flex items-center justify-center rounded-[2px] ${
                c.open
                  ? c.mine ? 'bg-[#e74c3c]' : 'bg-[#e9eef3] border border-[#d4dde4]'
                  : 'bg-gradient-to-b from-[#fdfefe] to-[#c6d2dc] border border-[#93a9ba] active:from-[#d4dde4]'
              }`}
              style={{ color: c.open && !c.mine && c.n ? NUM_COLORS[c.n] : undefined }}
              onClick={() => click(i)}
              onContextMenu={(e) => flag(e, i)}
              aria-label={c.open ? (c.mine ? 'Mine' : `${c.n}`) : 'Hidden cell'}
            >
              {c.open ? (c.mine ? '💥' : c.n || '') : c.flag ? '🚩' : ''}
            </button>
          ))}
        </div>
      </div>
      <div className="text-[11px] text-[#5d7484]">Left-click to open · Right-click to flag{status === 'lost' && ' — 💥 boom. Try again!'}</div>
      {status === 'won' && <div className="text-[13px] font-semibold text-[#3aa757]">Cleared in {time}s!</div>}
    </div>
  )
}
