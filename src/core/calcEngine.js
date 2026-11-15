// Pure calculator engine: state transitions for a standard/scientific calculator.
export const initialCalc = {
  display: '0',
  acc: null,        // accumulated value
  op: null,         // pending operator
  waitingForOperand: false,
  memory: 0,
  lastOp: null,     // for repeated equals
  lastOperand: null,
  history: [],
}

const apply = (a, b, op) => {
  switch (op) {
    case '+': return a + b
    case '-': return a - b
    case '*': return a * b
    case '/': return b === 0 ? NaN : a / b
    case '^': return Math.pow(a, b)
    default: return b
  }
}

const fmt = (n) => {
  if (!isFinite(n)) return 'Cannot divide by zero'
  if (Math.abs(n) > 1e15 || (Math.abs(n) < 1e-10 && n !== 0)) return n.toExponential(9).replace(/\.?0+e/, 'e')
  const s = String(Math.round(n * 1e10) / 1e10)
  return s
}

export function pressCalc(state, key) {
  const s = { ...state, history: state.history }
  const num = parseFloat(s.display) || 0

  if (/^[0-9]$/.test(key)) {
    if (s.waitingForOperand || s.display === '0' && key !== '0') {
      s.display = key
      s.waitingForOperand = false
    } else if (s.display.length < 16) {
      s.display = s.display.replace('Cannot divide by zero', '0') + key
      if (s.display === '00') s.display = '0'
    }
    return s
  }
  if (key === '.') {
    if (s.waitingForOperand) { s.display = '0.'; s.waitingForOperand = false; return s }
    if (!s.display.includes('.')) s.display += '.'
    return s
  }

  if (key === 'C') return { ...initialCalc, memory: s.memory, history: s.history }
  if (key === 'CE') { s.display = '0'; s.waitingForOperand = true; return s }
  if (key === 'back') { s.display = s.display.length > 1 && !s.waitingForOperand ? s.display.slice(0, -1) : '0'; return s }

  if (key === 'neg') { s.display = s.display.startsWith('-') ? s.display.slice(1) : '-' + s.display; return s }

  if (key === '=') {
    if (s.lastOp && s.lastOperand != null) {
      const r = apply(num, s.lastOperand, s.lastOp)
      s.display = fmt(r)
      s.waitingForOperand = true
      s.op = null
      s.history = [...s.history, `${fmt(num)} ${s.lastOp} ${fmt(s.lastOperand)} = ${s.display}`].slice(-12)
      return s
    }
    if (s.op != null && s.acc != null) {
      const r = apply(s.acc, num, s.op)
      s.history = [...s.history, `${fmt(s.acc)} ${s.op} ${fmt(num)} = ${s.display}`].slice(-12)
      s.display = fmt(r)
      s.acc = null
      s.op = null
      s.lastOp = state.op
      s.lastOperand = num
      s.waitingForOperand = true
      return s
    }
    return s
  }

  if (['+', '-', '*', '/', '^'].includes(key)) {
    if (s.op != null && s.acc != null && !s.waitingForOperand) {
      const r = apply(s.acc, num, s.op)
      s.history = [...s.history, `${fmt(s.acc)} ${s.op} ${fmt(num)} = ${s.display}`].slice(-12)
      s.acc = r
      s.display = fmt(r)
    } else if (s.acc == null || s.op == null) {
      s.acc = num
    }
    s.op = key
    s.waitingForOperand = true
    s.lastOp = null
    s.lastOperand = null
    return s
  }

  // Unary ops (scientific)
  const unary = {
    sqrt: Math.sqrt, sin: (x) => Math.sin(x), cos: (x) => Math.cos(x), tan: (x) => Math.tan(x),
    log: (x) => Math.log10(x), ln: (x) => Math.log(x), inv: (x) => 1 / x,
    sqr: (x) => x * x, fact: (x) => {
      if (x < 0 || !Number.isInteger(x) || x > 170) return NaN
      let r = 1
      for (let i = 2; i <= x; i++) r *= i
      return r
    },
  }
  if (key in unary) {
    const r = unary[key](num)
    s.display = fmt(r)
    s.waitingForOperand = true
    return s
  }
  if (key === 'pi') { s.display = fmt(Math.PI); s.waitingForOperand = true; return s }
  if (key === 'e') { s.display = fmt(Math.E); s.waitingForOperand = true; return s }
  if (key === 'pct') { s.display = fmt(num / 100); s.waitingForOperand = true; return s }

  // Memory
  if (key === 'MC') { s.memory = 0; return s }
  if (key === 'MR') { s.display = fmt(s.memory); s.waitingForOperand = true; return s }
  if (key === 'M+') { s.memory += num; s.waitingForOperand = true; return s }
  if (key === 'M-') { s.memory -= num; s.waitingForOperand = true; return s }
  if (key === 'MS') { s.memory = num; s.waitingForOperand = true; return s }

  return s
}

export const CALC_KEYMAP = {
  Enter: '=', '=': '=', Backspace: 'back', Escape: 'C', Delete: 'CE',
}
