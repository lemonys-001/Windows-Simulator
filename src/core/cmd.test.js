import { describe, it, expect, beforeEach } from 'vitest'

class MemStorage {
  constructor() { this.map = new Map() }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null }
  setItem(k, v) { this.map.set(k, String(v)) }
  removeItem(k) { this.map.delete(k) }
  clear() { this.map.clear() }
}
Object.defineProperty(globalThis, 'localStorage', { value: new MemStorage(), configurable: true, writable: true })

let fs, runCommand, resolvePath
beforeEach(async () => {
  localStorage.clear()
  ;({ fs } = await import('./fs'))
  fs.reset()
  ;({ runCommand, resolvePath } = await import('./cmd'))
})

const mk = (cwd, setCwd = () => {}, dispatch = () => {}, env = {}) =>
  (input) => runCommand(input, { cwd, setCwd, dispatch, closeWindow: () => {}, env })

describe('command engine', () => {
  it('echo prints', () => {
    expect(mk('/')( 'echo hello world').output).toEqual(['hello world'])
  })

  it('echo redirects to a file', () => {
    mk('/Users/Administrator')('echo hi > notes2.txt')
    expect(fs.readFile('/Users/Administrator/notes2.txt')).toBe('hi')
  })

  it('unknown command errors like Windows', () => {
    const { output } = mk('/')( 'foobar')
    expect(output.join(' ')).toMatch(/is not recognized as an internal or external command/)
  })

  it('dir lists directory contents with sizes', () => {
    const { output } = mk('/Users/Administrator')('dir')
    const joined = output.join('\n')
    expect(joined).toMatch(/<DIR>\s+Documents/)
    expect(joined).toMatch(/File\(s\)/)
  })

  it('cd navigates and validates', () => {
    let cwd = '/Users/Administrator'
    const setCwd = (p) => { cwd = p }
    mk(cwd, setCwd)('cd Documents')
    expect(cwd).toBe('/Users/Administrator/Documents')
    runCommand('cd ..', { cwd, setCwd, dispatch: () => {}, env: {} })
    expect(cwd).toBe('/Users/Administrator')
    expect(mk('/')( 'cd nowhere').output.join(' ')).toMatch(/cannot find the path/)
  })

  it('mkdir + del round trip via recycle bin', () => {
    const C = mk('/Users/Administrator')
    C('mkdir Projects')
    expect(fs.isDir('/Users/Administrator/Projects')).toBe(true)
    C('del Projects')
    expect(fs.listTrash()).toHaveLength(1)
  })

  it('type shows text file contents', () => {
    fs.writeFile('/Users/Administrator/Documents/t.txt', 'line1\nline2')
    const { output } = mk('/')( 'type /Users/Administrator/Documents/t.txt')
    expect(output.join('\n')).toBe('line1\nline2')
  })

  it('copy duplicates a file', () => {
    fs.writeFile('/Users/Administrator/Documents/src.txt', 'data')
    mk('/Users/Administrator/Documents')('copy src.txt dst.txt')
    expect(fs.readFile('/Users/Administrator/Documents/dst.txt')).toBe('data')
  })

  it('move relocates a file', () => {
    fs.writeFile('/Users/Administrator/Documents/mv.txt', 'data')
    mk('/Users/Administrator/Documents')('move mv.txt /Users/Administrator/Desktop')
    expect(fs.get('/Users/Administrator/Documents/mv.txt')).toBeNull()
    expect(fs.readFile('/Users/Administrator/Desktop/mv.txt')).toBe('data')
  })

  it('ren renames', () => {
    fs.writeFile('/Users/Administrator/Documents/old.txt', 'x')
    mk('/Users/Administrator/Documents')('ren old.txt new.txt')
    expect(fs.get('/Users/Administrator/Documents/new.txt')).toBeTruthy()
  })

  it('tree prints structure', () => {
    const { output } = mk('/Windows')('tree')
    const joined = output.join('\n')
    expect(joined).toMatch(/System32/)
    expect(joined).toMatch(/└──|├──/)
  })

  it('tasklist shows open windows', () => {
    const env = { windows: [{ appId: 'notepad' }, { appId: 'snake' }] }
    const { output } = mk('/', () => {}, () => {}, env)( 'tasklist')
    expect(output.join('\n')).toMatch(/notepad\.exe/)
    expect(output.join('\n')).toMatch(/snake\.exe/)
  })

  it('start dispatches apps', () => {
    const opened = []
    const dispatch = (a) => opened.push(a)
    mk('/', () => {}, dispatch, {})('start notepad')
    expect(opened).toEqual([{ type: 'OPEN_APP', appId: 'notepad' }])
  })

  it('ping simulates replies', () => {
    const { output } = mk('/')( 'ping example.com')
    const joined = output.join('\n')
    expect(joined).toMatch(/Reply from example\.com/)
    expect(joined).toMatch(/Lost = 0/)
  })

  it('cls clears output', () => {
    expect(mk('/')( 'cls').clear).toBe(true)
  })

  it('exit closes the window', () => {
    let closed = false
    const res = runCommand('exit', { cwd: '/', setCwd: () => {}, dispatch: () => {}, closeWindow: () => { closed = true }, env: {} })
    expect(closed).toBe(true)
    expect(res.output).toEqual([])
  })

  it('help pages work', () => {
    expect(mk('/')( 'help-1').output.join(' ')).toMatch(/CD/)
    expect(mk('/')( 'help-2').output.join(' ')).toMatch(/TREE/)
    expect(mk('/')( 'help-9').output.join(' ')).toMatch(/not found/)
  })

  it('resolvePath handles absolute, drive-relative and relative paths', () => {
    expect(resolvePath('/Users/Administrator', 'Documents')).toBe('/Users/Administrator/Documents')
    expect(resolvePath('/Users/Administrator', '/Windows')).toBe('/Windows')
    expect(resolvePath('/Users/Administrator', 'C:\\Windows')).toBe('/Windows')
    expect(resolvePath('/Users/Administrator', 'a/b/../c')).toBe('/Users/Administrator/a/c')
  })
})
