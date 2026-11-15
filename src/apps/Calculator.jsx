import { useEffect, useState } from 'react'
import { initialCalc, pressCalc, CALC_KEYMAP } from '../core/calcEngine'

const STD_ROWS = [
  ['MC', 'MR', 'MS', 'M+'],
  ['CE', 'C', 'back', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['neg', '0', '.', '='],
]
const SCI_ROWS = [
  ['sin', 'cos', 'tan', 'ln'],
  ['log', 'sqr', 'sqrt', 'inv'],
  ['^', 'fact', 'pct', 'pi'],
]

export default function Calculator() {
  const [state, setState] = useState(initialCalc)
  const [scientific, setScientific] = useState(false)

  const press = (k) => setState((s) => pressCalc(s, k))

  useEffect(() => {
    const onKey = (e) => {
      const target = e.target
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      let k = CALC_KEYMAP[e.key]
      if (!k) {
        if (/^[0-9]$/.test(e.key)) k = e.key
        else if (e.key === '.') k = '.'
        else if (e.key === '+') k = '+'
        else if (e.key === '-') k = '-'
        else if (e.key === '*' || e.key === 'x') k = '×'
        else if (e.key === '/') { e.preventDefault(); k = '÷' }
        else if (e.key === '%') k = 'pct'
      }
      if (k) { press(k) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const display = state.display
  const small = display.length > 12 ? Math.max(18, 34 - (display.length - 12) * 2) : 34
  const error = display.includes('Cannot')

  const Btn = ({ k, children, className = '' }) => (
    <button
      className={`btn !px-0 w-full h-9 text-[14px] flex items-center justify-center ${className}`}
      onClick={() => press(k)}
    >
      {children}
    </button>
  )
  const opSym = { '/': '÷', '*': '×', '-': '-', '+': '+', '^': '^' }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-[#f2f6f9] to-[#e3eaf1]">
      <div className="flex items-center px-2 pt-1">
        <button className="menubar-item text-[12px]" onClick={() => setScientific(!scientific)}>
          {scientific ? 'Standard' : 'Scientific'}
        </button>
        <span className="ml-auto text-[11px] text-[#5d7484]">{state.memory !== 0 ? `M: ${state.memory}` : ''}</span>
      </div>
      <div className="px-3 pt-1 pb-2">
        <div className="field !rounded-sm text-right font-semibold" style={{ fontSize: small, height: 52, paddingTop: 18 }} aria-live="polite">
          {error ? <span className="text-[#c0392b] text-[13px]">{display}</span> : display}
        </div>
        <div className="text-right text-[10px] text-[#7f95a6] h-3 truncate">{state.op ? `${state.acc ?? ''} ${opSym[state.op]}` : ''}</div>
      </div>
      <div className="px-3 pb-3 grid gap-1.5" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {(scientific ? SCI_ROWS : []).flat().map((k, i) => (
          <Btn key={`s${i}`} k={k}>{k === 'pi' ? 'π' : k === 'pct' ? '%' : k === 'inv' ? '1/x' : k}</Btn>
        ))}
        {scientific && <div className="col-span-4 h-px bg-[#cfdbe4]" />}
        {STD_ROWS.flat().map((k, i) => (
          <Btn key={i} k={k} className={k === '=' ? 'btn-default' : ''}>
            {k === '÷' ? '÷' : k === '×' ? '×' : k === 'back' ? '⌫' : k === 'neg' ? '±' : k}
          </Btn>
        ))}
      </div>
      <div className="px-3 pb-2 max-h-16 overflow-y-auto text-[10px] text-[#7f95a6] leading-relaxed">
        {state.history.slice(-3).map((h, i) => <div key={i}>{h}</div>)}
      </div>
    </div>
  )
}
