import { useEffect, useRef, useState } from 'react'

const GRID = 20
const CELL = 24
const KEY_SCORE = 'win7.snake.high'

export default function Snake() {
  const canvasRef = useRef(null)
  const [score, setScore] = useState(0)
  const [high, setHigh] = useState(() => +localStorage.getItem(KEY_SCORE) || 0)
  const [state, setState] = useState('ready') // ready | run | pause | over
  const gameRef = useRef({
    snake: [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }],
    dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 },
    food: { x: 14, y: 10 }, speed: 150, acc: 0, last: 0,
  })

  useEffect(() => {
    const onKey = (e) => {
      const g = gameRef.current
      const dirs = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] }
      const key = e.key.startsWith('Arrow') ? e.key : e.key.toLowerCase()
      if (dirs[key]) {
        e.preventDefault()
        const [x, y] = dirs[key]
        if (g.snake.length > 1 && g.dir.x === -x && g.dir.y === -y) return // no 180° turns
        g.nextDir = { x, y }
        if (state === 'ready') start()
      }
      if (e.key === ' ') { e.preventDefault(); state === 'run' ? setState('pause') : state === 'pause' ? setState('run') : start() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state])

  useEffect(() => {
    if (state !== 'run') { draw(); return }
    let raf
    const loop = (t) => {
      const g = gameRef.current
      if (!g.last) g.last = t
      g.acc += t - g.last
      g.last = t
      if (g.acc >= g.speed) {
        g.acc = 0
        g.dir = g.nextDir
        const head = { x: g.snake[0].x + g.dir.x, y: g.snake[0].y + g.dir.y }
        if (head.x < 0 || head.y < 0 || head.x >= GRID || head.y >= GRID || g.snake.some((s) => s.x === head.x && s.y === head.y)) {
          setState('over')
          if (score > high) { setHigh(score); localStorage.setItem(KEY_SCORE, String(score)) }
          draw()
          return
        }
        g.snake.unshift(head)
        if (head.x === g.food.x && head.y === g.food.y) {
          setScore((s) => s + 10)
          g.speed = Math.max(70, g.speed - 4)
          do { g.food = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) } }
          while (g.snake.some((s) => s.x === g.food.x && s.y === g.food.y))
        } else {
          g.snake.pop()
        }
      }
      draw()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [state, score, high])

  const start = () => {
    gameRef.current = {
      snake: [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }],
      dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 },
      food: { x: 14, y: 10 }, speed: 150, acc: 0, last: 0,
    }
    setScore(0)
    setState('run')
  }

  const draw = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const g = gameRef.current
    ctx.fillStyle = '#10241a'
    ctx.fillRect(0, 0, GRID * CELL, GRID * CELL)
    ctx.strokeStyle = 'rgba(255,255,255,.05)'
    for (let i = 1; i < GRID; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, GRID * CELL); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(GRID * CELL, i * CELL); ctx.stroke()
    }
    // food
    ctx.fillStyle = '#ffd24d'
    ctx.beginPath()
    ctx.arc(g.food.x * CELL + CELL / 2, g.food.y * CELL + CELL / 2, CELL / 2 - 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#c98d2a'
    ctx.stroke()
    // snake
    g.snake.forEach((s, i) => {
      const r = Math.round(126 - (i / g.snake.length) * 60)
      ctx.fillStyle = i === 0 ? '#7ed37e' : `rgb(${r},${Math.round(211 - i * 4)},${Math.min(255, r + 2)})`
      ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2)
    })
    // eye on head
    const h = g.snake[0]
    ctx.fillStyle = '#10241a'
    ctx.beginPath()
    ctx.arc(h.x * CELL + CELL / 2 + g.dir.x * 5, h.y * CELL + CELL / 2 + g.dir.y * 5, 2.4, 0, Math.PI * 2)
    ctx.fill()
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-[#16351f] to-[#0b1d12] p-3">
      <div className="flex w-full max-w-[480px] justify-between text-[#cfe6ff] text-[13px] px-1">
        <span>Score: <b className="text-[#ffd24d]">{score}</b></span>
        <span>High: <b className="text-[#7ed37e]">{high}</b></span>
        <span className="text-[11px] text-[#8fbfa0]">Arrows / WASD · Space to pause</span>
      </div>
      <div className="relative">
        <canvas ref={canvasRef} width={GRID * CELL} height={GRID * CELL} className="rounded border-2 border-[#0c2113] shadow-[0_4px_20px_rgba(0,0,0,.5)]" />
        {state !== 'run' && (
          <div className="absolute inset-0 grid place-items-center bg-black/55 rounded">
            <div className="text-center text-[#cfe6ff]">
              <div className="text-[20px] font-semibold mb-1">{state === 'ready' ? 'Snake' : state === 'over' ? 'Game Over' : 'Paused'}</div>
              {state === 'over' && <div className="text-[12px] mb-2">You scored {score}</div>}
              <button className="btn" onClick={() => (state === 'pause' ? setState('run') : start())}>
                {state === 'ready' ? 'Start' : state === 'over' ? 'Play again' : 'Resume'}
              </button>
              {state === 'ready' && <div className="text-[11px] mt-2 text-[#8fbfa0]">or press an arrow key</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
