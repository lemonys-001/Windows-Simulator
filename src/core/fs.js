// Virtual filesystem with localStorage persistence.
// Tree of nodes: dir { name, type:'dir', children:{}, created, modified }
//                 file { name, type:'file', content, mime, created, modified }
// Immutable updates: every mutation replaces the tree and bumps a version.

const KEY = 'win7fs.v2'
let tree = null
let version = 0
const listeners = new Set()

const now = () => Date.now()
const uid = () => Math.random().toString(36).slice(2, 10)

function dir(name, children = {}) {
  return { id: uid(), name, type: 'dir', children, created: now(), modified: now() }
}
function file(name, content = '', mime = 'text/plain') {
  return { id: uid(), name, type: 'file', content, mime, created: now(), modified: now() }
}

function normalize(path) {
  const parts = []
  for (const seg of String(path).split('/')) {
    if (!seg || seg === '.') continue
    if (seg === '..') parts.pop()
    else parts.push(seg)
  }
  return '/' + parts.join('/')
}

function splitPath(path) {
  const p = normalize(path)
  if (p === '/') return { parentPath: null, name: 'C:', node: tree }
  const idx = p.lastIndexOf('/')
  const parentPath = idx <= 0 ? '/' : p.slice(0, idx)
  const name = p.slice(idx + 1)
  return { parentPath, name }
}

function getNode(path) {
  const p = normalize(path)
  if (p === '/') return tree
  let node = tree
  for (const seg of p.slice(1).split('/')) {
    if (!node || node.type !== 'dir') return null
    node = node.children[seg]
  }
  return node || null
}

function update(mutator) {
  // swap in the clone first so mutator's getNode() reads the new tree
  tree = structuredClone(tree)
  mutator(tree)
  version++
  persist()
  listeners.forEach((l) => l())
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(tree))
  } catch (e) {
    console.warn('FS persist failed', e)
  }
}

function seedChime() {
  // Tiny generated WAV (2s, 22.05kHz mono) so Media Player has bundled content without binary assets.
  const sr = 22050, secs = 2
  const n = sr * secs
  const buf = new ArrayBuffer(44 + n * 2)
  const dv = new DataView(buf)
  const w = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)) }
  w(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt ')
  dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true)
  dv.setUint32(24, sr, true); dv.setUint32(28, sr * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true)
  w(36, 'data'); dv.setUint32(40, n * 2, true)
  for (let i = 0; i < n; i++) {
    const t = i / sr
    const env = Math.exp(-t * 2.2)
    const v = Math.sin(2 * Math.PI * (440 + 110 * Math.sin(t * 2))) * env * 0.5
    dv.setInt16(44 + i * 2, v * 32767, true)
  }
  let bin = ''
  const bytes = new Uint8Array(buf)
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode(...bytes.subarray(i, i + chunk))
  return 'data:audio/wav;base64,' + btoa(bin)
}

const WALLPAPER_SVGS = [
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'><defs><radialGradient id='g' cx='50%' cy='38%' r='85%'><stop offset='0%' stop-color='#3b7db8'/><stop offset='55%' stop-color='#1c4f7c'/><stop offset='100%' stop-color='#0a2137'/></radialGradient><linearGradient id='r' x1='0' y1='0' x2='1' y2='0'><stop offset='0%' stop-color='#7fd4ff' stop-opacity='0'/><stop offset='50%' stop-color='#bfeaff' stop-opacity='.55'/><stop offset='100%' stop-color='#7fd4ff' stop-opacity='0'/></linearGradient></defs><rect width='1920' height='1080' fill='url(%23g)' opacity='0'/><rect width='1920' height='1080' fill='#14405f'/><ellipse cx='960' cy='420' rx='1400' ry='700' fill='url(%23g)'/><path d='M0 760 C 480 640 820 860 1200 720 C 1500 610 1750 700 1920 640 L1920 1080 L0 1080 Z' fill='url(%23r)' opacity='.25'/><path d='M0 820 C 520 700 900 930 1280 780 C 1560 670 1780 760 1920 700 L1920 1080 L0 1080 Z' fill='#0c2d45' opacity='.8'/><path d='M0 900 C 600 780 1000 1000 1400 860 C 1650 770 1820 840 1920 800 L1920 1080 L0 1080 Z' fill='#082033'/></svg>`)}`,
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'><rect width='1920' height='1080' fill='#1e2a1e'/><g opacity='.9'><circle cx='1400' cy='340' r='260' fill='#9fd57f' opacity='.25'/><circle cx='1400' cy='340' r='190' fill='#b7e694' opacity='.3'/><circle cx='1400' cy='340' r='120' fill='#d3f2b8' opacity='.35'/></g><path d='M0 840 C 400 760 700 900 1100 800 C 1450 715 1700 820 1920 760 L1920 1080 L0 1080Z' fill='#16240f'/><path d='M0 920 C 500 830 900 980 1300 880 C 1600 805 1800 880 1920 840 L1920 1080 L0 1080Z' fill='#0d1a08'/></svg>`)}`,
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'><defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='#0b1230'/><stop offset='100%' stop-color='#2a1e55'/></linearGradient></defs><rect width='1920' height='1080' fill='url(%23s)'/><g fill='#cfe0ff'><circle cx='200' cy='120' r='2'/><circle cx='500' cy='200' r='1.6'/><circle cx='820' cy='90' r='2.2'/><circle cx='1100' cy='260' r='1.4'/><circle cx='1400' cy='140' r='2'/><circle cx='1700' cy='300' r='1.6'/><circle cx='960' cy='180' r='1.2'/></g><path d='M960 560 L 1060 760 L 860 760 Z' fill='#6f7bd8' opacity='.5'/><path d='M0 980 L 480 700 L 900 940 L 1320 660 L 1920 900 L 1920 1080 L 0 1080 Z' fill='#241c4a'/></svg>`)}`,
]

function seedTree() {
  const docs = dir('Documents', {
    'Welcome.txt': file('Welcome.txt',
`Welcome to Windows 7 Simulator!

Tips:
- Drag windows by their title bar; drag to the screen edges to snap them.
- Double-click a title bar to maximize. Right-click the desktop for options.
- Press the Windows key (or click the orb) for the Start menu.
- Try the Command Prompt: type "help" then "help-2".
- Files you save live in this virtual C: drive and survive reloads.`),
    'Notes.txt': file('Notes.txt', '- buy milk\n- water the fern\n- defragment the hard disk (again)'),
  })
  const pics = dir('Pictures', {
    'Aurora.svg': file('Aurora.svg', WALLPAPER_SVGS[0], 'image/svg+xml'),
    'Hills.svg': file('Hills.svg', WALLPAPER_SVGS[1], 'image/svg+xml'),
    'Night.svg': file('Night.svg', WALLPAPER_SVGS[2], 'image/svg+xml'),
  })
  const music = dir('Music', {
    'Chime.wav': file('Chime.wav', seedChime(), 'audio/wav'),
  })
  const videos = dir('Videos', {})
  const desktop = dir('Desktop', {})
  const downloads = dir('Downloads', {})
  const user = dir('Administrator', {
    Documents: docs, Pictures: pics, Music: music, Videos: videos, Desktop: desktop, Downloads: downloads,
  })
  return dir('C:', {
    Users: dir('Users', { Administrator: user, Public: dir('Public', {}) }),
    'Program Files': dir('Program Files', {
      'Windows Sim': dir('Windows Sim', {
        'readme.txt': file('readme.txt', 'Windows Simulator 2.0 — React edition.'),
      }),
    }),
    Windows: dir('Windows', {
      'System32': dir('System32', {
        'kernel32.dll': file('kernel32.dll', '', 'application/octet-stream'),
        'explorer.exe': file('explorer.exe', '', 'application/octet-stream'),
      }),
      'win.ini': file('win.ini', '[fonts]\n[extensions]\n'),
    }),
    Temp: dir('Temp', {}),
    '$Recycle.Bin': dir('$Recycle.Bin', {}),
  })
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      tree = JSON.parse(raw)
      return
    }
  } catch { /* fall through to seed */ }
  tree = seedTree()
  persist()
}

// ---- Public API (all synchronous; components subscribe via useFs) ----

export const fs = {
  subscribe(l) { listeners.add(l); return () => listeners.delete(l) },
  getSnapshot() { return version },
  getTree() { return tree },
  get(path) { return getNode(path) },
  list(path) {
    const n = getNode(path)
    if (!n || n.type !== 'dir') return []
    return Object.values(n.children).sort((a, b) =>
      a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1)
  },
  exists(path) { return !!getNode(path) },
  isDir(path) { const n = getNode(path); return !!n && n.type === 'dir' },
  normalize,
  splitPath,
  uid,
  file,
  dir,

  mkdir(path) {
    const { parentPath, name } = splitPath(path)
    const parent = getNode(parentPath)
    if (!parent || parent.type !== 'dir') return { error: 'Invalid path' }
    if (parent.children[name]) return { error: `"${name}" already exists` }
    update(() => {
      const p = getNode(parentPath) // clone has same structure
      p.children[name] = dir(name)
      p.modified = now()
    })
    return { ok: true }
  },

  writeFile(path, content, mime) {
    const { parentPath, name } = splitPath(path)
    const parent = getNode(parentPath)
    if (!parent || parent.type !== 'dir') return { error: 'Invalid path' }
    const existing = parent.children[name]
    if (existing && existing.type === 'dir') return { error: `"${name}" is a folder` }
    update(() => {
      const p = getNode(parentPath)
      if (existing) {
        const f = p.children[name]
        f.content = content
        if (mime) f.mime = mime
        f.modified = now()
      } else {
        p.children[name] = file(name, content, mime)
      }
      p.modified = now()
    })
    return { ok: true }
  },

  readFile(path) {
    const n = getNode(path)
    return n && n.type === 'file' ? n.content : null
  },

  rename(path, newName) {
    const { parentPath, name } = splitPath(path)
    if (!newName || newName === name) return { ok: true }
    const parent = getNode(parentPath)
    if (!parent || !parent.children[name]) return { error: 'Not found' }
    if (parent.children[newName]) return { error: `"${newName}" already exists` }
    update(() => {
      const p = getNode(parentPath)
      const node = p.children[name]
      delete p.children[name]
      node.name = newName
      node.modified = now()
      p.children[newName] = node
      p.modified = now()
    })
    return { ok: true }
  },

  // Move to Recycle Bin
  trash(path) {
    const { parentPath, name } = splitPath(path)
    if (normalize(path) === '/') return { error: 'Cannot delete drive' }
    const parent = getNode(parentPath)
    if (!parent || !parent.children[name]) return { error: 'Not found' }
    const node = structuredClone(parent.children[name])
    update(() => {
      const p = getNode(parentPath)
      delete p.children[name]
      p.modified = now()
      const trashNode = getNode('/$Recycle.Bin') || t.children['$Recycle.Bin']
      trashNode.children[`${name}.${node.id}`] = node
      trashNode.children[`${name}.${node.id}`].deletedFrom = normalize(parentPath)
      trashNode.children[`${name}.${node.id}`].deletedAt = now()
    })
    return { ok: true }
  },

  listTrash() {
    const t = getNode('/$Recycle.Bin')
    if (!t) return []
    return Object.entries(t.children).sort((a, b) => (b[1].deletedAt || 0) - (a[1].deletedAt || 0))
  },

  restore(entryKey) {
    const t = getNode('/$Recycle.Bin')
    const entry = t && t.children[entryKey]
    if (!entry) return { error: 'Not found' }
    const dest = entry.deletedFrom || '/Users/Administrator/Desktop'
    let target = getNode(dest)
    if (!target || target.type !== 'dir') { target = getNode('/Users/Administrator/Desktop') }
    if (target.children[entry.name]) return { error: `"${entry.name}" already exists at original location` }
    update(() => {
      const trashNode = getNode('/$Recycle.Bin')
      const node = trashNode.children[entryKey]
      delete trashNode.children[entryKey]
      delete node.deletedFrom
      delete node.deletedAt
      const dst = getNode(dest)
      dst.children[node.name] = node
      dst.modified = now()
    })
    return { ok: true }
  },

  emptyTrash() {
    update(() => { getNode('/$Recycle.Bin').children = {} })
    return { ok: true }
  },

  deletePermanently(path) {
    const { parentPath, name } = splitPath(path)
    const parent = getNode(parentPath)
    if (!parent || !parent.children[name]) return { error: 'Not found' }
    update(() => {
      const p = getNode(parentPath)
      delete p.children[name]
      p.modified = now()
    })
    return { ok: true }
  },

  // Clipboard ops (module-level clipboard)
  copyToClipboard(paths, cut = false) {
    clip = { paths: [...paths], cut }
  },
  clipboard: () => clip,
  clipboardEmpty: () => !clip || clip.paths.length === 0,
  pasteInto(destPath) {
    if (!clip || clip.paths.length === 0) return { error: 'Clipboard is empty' }
    const dest = getNode(destPath)
    if (!dest || dest.type !== 'dir') return { error: 'Invalid destination' }
    const errors = []
    const ops = clip.paths.map((src) => {
      const { parentPath, name } = splitPath(src)
      let node = structuredClone(getNode(src))
      let targetName = name
      const destNode = getNode(destPath)
      let i = 1
      while (destNode.children[targetName] && targetName === name) {
        const ext = name.lastIndexOf('.') > 0 ? name.slice(name.lastIndexOf('.')) : ''
        const base = ext ? name.slice(0, -ext.length) : name
        targetName = `${base} - Copy${i > 1 ? ` (${i})` : ''}${ext}`
        i++
      }
      if (clip.cut) {
        // validate source removal
        const srcParent = getNode(parentPath)
        if (!srcParent || !srcParent.children[name]) { errors.push(`${name}: source missing`); return null }
      }
      return { node, targetName, src, parentPath, name, destPath }
    }).filter(Boolean)
    if (ops.length) {
      update(() => {
        for (const op of ops) {
          const dst = getNode(op.destPath)
          dst.children[op.targetName] = op.node
          dst.modified = now()
          if (clip.cut) {
            const sp = getNode(op.parentPath)
            delete sp.children[op.name]
            sp.modified = now()
          }
        }
      })
    }
    if (clip.cut) clip = null
    return errors.length ? { error: errors.join('; ') } : { ok: true }
  },

  search(term) {
    const results = []
    const q = term.toLowerCase()
    const walk = (node, path) => {
      for (const child of Object.values(node.children || {})) {
        const p = normalize(`${path}/${child.name}`)
        if (child.name.toLowerCase().includes(q)) results.push({ node: child, path: p })
        if (child.type === 'dir') walk(child, p)
      }
    }
    if (tree) walk(tree, '/')
    return results.slice(0, 40)
  },

  reset() {
    tree = seedTree()
    persist()
    version++
    listeners.forEach((l) => l())
  },
}

let clip = null
load()
