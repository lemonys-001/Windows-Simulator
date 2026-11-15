// Built-in wallpapers. SVG data-URIs generated in core/fs.js are shared here by id.
import { fs } from './fs'

const svg = (name) => {
  const n = fs.get(`/Users/Administrator/Pictures/${name}`)
  return n ? n.content : null
}

export const WALLPAPERS = [
  { id: 'harmony', name: 'Harmony', css: 'linear-gradient(160deg,#2a6296 0%,#1c4f7c 45%,#0a2137 100%)' },
  { id: 'aurora', name: 'Aurora', image: () => svg('Aurora.svg') },
  { id: 'hills', name: 'Hills', image: () => svg('Hills.svg') },
  { id: 'night', name: 'Night', image: () => svg('Night.svg') },
  { id: 'slate', name: 'Slate', css: 'linear-gradient(145deg,#3d4654 0%,#232a35 60%,#12161d 100%)' },
  { id: 'ember', name: 'Ember', css: 'linear-gradient(160deg,#7c3f2a 0%,#54251a 55%,#1d0d09 100%)' },
]

export function wallpaperStyle(id) {
  if (id?.startsWith('custom:')) {
    // custom:<node-id> — find the picture anywhere under Pictures
    const wanted = id.slice(7)
    const find = (node) => {
      for (const child of Object.values(node.children || {})) {
        if (child.id === wanted) return child
        if (child.type === 'dir') { const r = find(child); if (r) return r }
      }
      return null
    }
    const pics = fs.get('/Users/Administrator/Pictures')
    const node = pics && find(pics)
    return node?.content
      ? { backgroundImage: `url("${node.content}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : wallpaperStyle('harmony')
  }
  const wp = WALLPAPERS.find((w) => w.id === id) || WALLPAPERS[0]
  if (wp.css) return { backgroundImage: wp.css }
  const img = wp.image()
  return img
    ? { backgroundImage: `url("${img}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundImage: wp.css || WALLPAPERS[0].css }
}
