import { useEffect, useRef, useState } from 'react'
import { runCommand, complete, resolvePath, parent } from '../core/cmd'
import { useOS } from '../core/store'
import { fmtLongDate } from '../core/util'

export default function CommandPrompt({ winId }) {
  const { state, dispatch } = useOS()
  const [cwd, setCwd] = useState('/Users/Administrator')
  const [lines, setLines] = useState([])
  const [value, setValue] = useState('')
  const [history, setHistory] = useState([])
  const [hIdx, setHIdx] = useState(-1)
  const [color, setColor] = useState('#e8f4ff')
  const bodyRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const d = new Date()
    setLines([
      '',
      `Microsoft Windows [Version 6.1.7601]`,
      `Copyright (c) 2009 Microsoft Corporation. All rights reserved. (simulated)`,
      '',
      `Started ${fmtLongDate(d)} at ${d.toLocaleTimeString()}`,
      `Type HELP for commands, HELP-2 for more.`,
      '',
    ])
  }, [])

  useEffect(() => {
    bodyRef.current?.scrollTo(0, bodyRef.current.scrollHeight)
  }, [lines])

  useEffect(() => { inputRef.current?.focus() }, [])

  const submit = () => {
    const input = value
    setValue('')
    const out = runCommand(input, {
      cwd,
      setCwd,
      dispatch,
      closeWindow: () => dispatch({ type: 'CLOSE', id: winId }),
      env: {
        windows: state.windows,
        setColor,
        setTitle: (t) => dispatch({ type: 'SET_TITLE', id: winId, title: t }),
      },
    })
    setHistory((h) => (input.trim() ? [...h, input.trim()] : h))
    setHIdx(-1)
    setLines((l) => {
      let next = out.clear ? [] : [...l]
      if (!out.clear) next.push(`${cwd}> ${input}`)
      return [...next, ...out.output]
    })
  }

  const onKey = (e) => {
    if (e.key === 'Enter') { submit(); return }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const idx = hIdx < 0 ? history.length - 1 : Math.max(0, hIdx - 1)
      if (history[idx] != null) { setHIdx(idx); setValue(history[idx]) }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (hIdx < 0) return
      const idx = hIdx + 1
      if (idx >= history.length) { setHIdx(-1); setValue('') } else { setHIdx(idx); setValue(history[idx]) }
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      const frag = value.split(/\s+/).pop()
      const c = complete(cwd, frag)
      if (c) setValue(value.slice(0, value.length - frag.length) + c)
      return
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault()
      setLines([])
    }
  }

  return (
    <div
      className="flex-1 flex flex-col min-h-0 cursor-text"
      style={{ background: '#0b0f0d', color }}
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={bodyRef} className="flex-1 overflow-y-auto px-2 py-1.5 font-mono text-[13px] leading-[1.35] whitespace-pre-wrap break-all" style={{ fontFamily: 'Consolas, "Lucida Console", monospace' }}>
        {lines.map((l, i) => <div key={i}>{l || ' '}</div>)}
      </div>
      <div className="flex-none flex items-center px-2 pb-1.5 font-mono text-[13px]" style={{ fontFamily: 'Consolas, "Lucida Console", monospace' }}>
        <span className="whitespace-pre">{cwd}&gt;&nbsp;</span>
        <input
          ref={inputRef}
          className="flex-1 bg-transparent outline-none border-none font-mono text-[13px] min-w-0"
          style={{ color, fontFamily: 'inherit', caretColor: color }}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKey}
          spellCheck={false}
          autoComplete="off"
          aria-label="Command input"
        />
      </div>
    </div>
  )
}

export { resolvePath, parent }
