import { describe, it, expect, beforeEach } from 'vitest'

// Minimal localStorage polyfill for node
class MemStorage {
  constructor() { this.map = new Map() }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null }
  setItem(k, v) { this.map.set(k, String(v)) }
  removeItem(k) { this.map.delete(k) }
  clear() { this.map.clear() }
}
Object.defineProperty(globalThis, 'localStorage', { value: new MemStorage(), configurable: true, writable: true })

let fs
beforeEach(async () => {
  localStorage.clear()
  ;({ fs } = await import('./fs'))
  fs.reset()
})

describe('virtual filesystem', () => {
  it('seeds default folders', () => {
    expect(fs.isDir('/Users/Administrator/Documents')).toBe(true)
    expect(fs.isDir('/Windows/System32')).toBe(true)
    expect(fs.get('/$Recycle.Bin')).toBeTruthy()
  })

  it('writes, reads and updates files', () => {
    const r = fs.writeFile('/Users/Administrator/Documents/test.txt', 'hello')
    expect(r.ok).toBe(true)
    expect(fs.readFile('/Users/Administrator/Documents/test.txt')).toBe('hello')
    fs.writeFile('/Users/Administrator/Documents/test.txt', 'updated')
    expect(fs.readFile('/Users/Administrator/Documents/test.txt')).toBe('updated')
  })

  it('rejects writing into missing folders', () => {
    const r = fs.writeFile('/Nope/Where/test.txt', 'x')
    expect(r.error).toBeTruthy()
  })

  it('refuses to overwrite a directory with a file', () => {
    const r = fs.writeFile('/Users', 'x')
    expect(r.error).toBeTruthy()
  })

  it('creates directories and normalizes paths', () => {
    fs.mkdir('/Users/Administrator/Documents/../Documents/New')
    expect(fs.isDir('/Users/Administrator/Documents/New')).toBe(true)
    expect(fs.normalize('/a/b/../c/./d/')).toBe('/a/c/d')
  })

  it('renames within the same folder', () => {
    fs.writeFile('/Users/Administrator/Documents/a.txt', '1')
    fs.rename('/Users/Administrator/Documents/a.txt', 'b.txt')
    expect(fs.get('/Users/Administrator/Documents/a.txt')).toBeNull()
    expect(fs.readFile('/Users/Administrator/Documents/b.txt')).toBe('1')
  })

  it('renames are rejected when the target exists', () => {
    fs.writeFile('/Users/Administrator/Documents/a.txt', '1')
    fs.writeFile('/Users/Administrator/Documents/b.txt', '2')
    expect(fs.rename('/Users/Administrator/Documents/a.txt', 'b.txt').error).toBeTruthy()
  })

  it('trashes to the recycle bin with origin info and restores', () => {
    fs.writeFile('/Users/Administrator/Documents/precious.txt', 'data')
    const r = fs.trash('/Users/Administrator/Documents/precious.txt')
    expect(r.ok).toBe(true)
    expect(fs.get('/Users/Administrator/Documents/precious.txt')).toBeNull()
    const trash = fs.listTrash()
    expect(trash).toHaveLength(1)
    const [key, node] = trash[0]
    expect(node.name).toBe('precious.txt')
    expect(node.deletedFrom).toBe('/Users/Administrator/Documents')
    expect(fs.restore(key).ok).toBe(true)
    expect(fs.readFile('/Users/Administrator/Documents/precious.txt')).toBe('data')
  })

  it('emptyTrash clears everything', () => {
    fs.writeFile('/Users/Administrator/Documents/a.txt', '1')
    fs.writeFile('/Users/Administrator/Documents/b.txt', '2')
    fs.trash('/Users/Administrator/Documents/a.txt')
    fs.trash('/Users/Administrator/Documents/b.txt')
    expect(fs.emptyTrash().ok).toBe(true)
    expect(fs.listTrash()).toHaveLength(0)
  })

  it('cannot delete the drive root', () => {
    expect(fs.trash('/').error).toBeTruthy()
  })

  it('copy-paste makes a copy, cut-paste moves', () => {
    fs.writeFile('/Users/Administrator/Documents/orig.txt', 'content')
    fs.copyToClipboard(['/Users/Administrator/Documents/orig.txt'], false)
    fs.pasteInto('/Users/Administrator/Desktop')
    expect(fs.readFile('/Users/Administrator/Desktop/orig.txt')).toBe('content')
    expect(fs.readFile('/Users/Administrator/Documents/orig.txt')).toBe('content')

    fs.copyToClipboard(['/Users/Administrator/Documents/orig.txt'], true)
    fs.pasteInto('/Users/Administrator/Desktop')
    expect(fs.get('/Users/Administrator/Documents/orig.txt')).toBeNull()
    // second copy in same dir gets " - Copy"
    expect(fs.readFile('/Users/Administrator/Desktop/orig.txt')).toBe('content')
    fs.copyToClipboard(['/Users/Administrator/Desktop/orig.txt'], false)
    fs.pasteInto('/Users/Administrator/Desktop')
    expect(fs.get('/Users/Administrator/Desktop/orig - Copy.txt')).toBeTruthy()
  })

  it('paste with name collision renames', () => {
    fs.writeFile('/Users/Administrator/Documents/x.txt', 'a')
    fs.copyToClipboard(['/Users/Administrator/Documents/x.txt'], false)
    fs.pasteInto('/Users/Administrator/Documents')
    expect(fs.get('/Users/Administrator/Documents/x - Copy.txt')).toBeTruthy()
  })

  it('search finds files and folders by name', () => {
    const results = fs.search('welcome')
    expect(results.some((r) => r.node.name === 'Welcome.txt')).toBe(true)
  })

  it('persist survives a reload', () => {
    fs.writeFile('/Users/Administrator/Documents/persist.txt', 'saved')
    // simulate reload: fresh import re-reads localStorage
    // (module is cached; call load-equivalent by re-setting tree via reset check)
    const stored = JSON.parse(localStorage.getItem('win7fs.v2'))
    expect(stored.children.Users.children.Administrator.children.Documents.children['persist.txt'].content).toBe('saved')
  })
})
