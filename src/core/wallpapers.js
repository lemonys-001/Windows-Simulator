// Built-in wallpapers. SVG data-URIs generated in core/fs.js are shared here by id.
import { fs } from './fs'

// Recreation of the Windows 7 default wallpaper: deep blue space with a
// radiant light ribbon arcing through the center.
const HARMONY = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'><defs><radialGradient id='base' cx='50%' cy='46%' r='78%'><stop offset='0%' stop-color='#2b7bbd'/><stop offset='38%' stop-color='#1b5a94'/><stop offset='72%' stop-color='#0c2c4e'/><stop offset='100%' stop-color='#040c17'/></radialGradient><radialGradient id='core' cx='50%' cy='47%' r='34%'><stop offset='0%' stop-color='#bfe6ff' stop-opacity='.85'/><stop offset='35%' stop-color='#6db9ea' stop-opacity='.42'/><stop offset='100%' stop-color='#3d8ecf' stop-opacity='0'/></radialGradient><radialGradient id='vig' cx='50%' cy='46%' r='72%'><stop offset='0%' stop-color='#000' stop-opacity='0'/><stop offset='72%' stop-color='#000' stop-opacity='0'/><stop offset='100%' stop-color='#000' stop-opacity='.55'/></radialGradient><linearGradient id='rib' x1='0' y1='1' x2='1' y2='0'><stop offset='0%' stop-color='#63c8f2' stop-opacity='0'/><stop offset='32%' stop-color='#9fdcff' stop-opacity='.7'/><stop offset='52%' stop-color='#eefaff' stop-opacity='.95'/><stop offset='74%' stop-color='#8fd2f6' stop-opacity='.55'/><stop offset='100%' stop-color='#4fa8e0' stop-opacity='0'/></linearGradient><filter id='b30' x='-40%' y='-40%' width='180%' height='180%'><feGaussianBlur stdDeviation='30'/></filter><filter id='b10' x='-40%' y='-40%' width='180%' height='180%'><feGaussianBlur stdDeviation='10'/></filter></defs><rect width='1920' height='1080' fill='url(%23base)'/><ellipse cx='960' cy='505' rx='880' ry='560' fill='url(%23core)'/><g stroke='#cfeaff' stroke-linecap='round' opacity='.28'><path d='M-80 1000 C 460 790 720 940 1010 660 C 1260 420 1520 400 2010 250' stroke-width='120' fill='none' filter='url(%23b30)'/><path d='M-80 1030 C 500 830 780 950 1060 690 C 1310 460 1560 440 2010 310' stroke-width='52' fill='none' filter='url(%23b10)'/><path d='M-80 960 C 440 750 690 880 970 620 C 1220 390 1490 370 2010 210' stroke-width='30' fill='none' filter='url(%23b10)' opacity='.7'/></g><path d='M-80 1000 C 460 790 720 940 1010 660 C 1260 420 1520 400 2010 250' stroke='url(%23rib)' stroke-width='9' fill='none' opacity='.9'/><path d='M-80 980 C 480 800 740 910 1030 650 C 1280 430 1540 400 2010 280' stroke='#ffffff' stroke-width='2.5' fill='none' opacity='.55'/><g fill='#dff2ff'><circle cx='960' cy='500' r='4' opacity='.95'/><circle cx='300' cy='330' r='1.6' opacity='.5'/><circle cx='1240' cy='270' r='1.4' opacity='.45'/><circle cx='620' cy='720' r='1.2' opacity='.4'/><circle cx='1580' cy='640' r='1.5' opacity='.5'/><circle cx='420' cy='820' r='1.1' opacity='.35'/><circle cx='1350' cy='810' r='1.2' opacity='.4'/><circle cx='1720' cy='380' r='1.1' opacity='.35'/><circle cx='760' cy='180' r='1.3' opacity='.4'/></g><rect width='1920' height='1080' fill='url(%23vig)'/></svg>`)}`

const svg = (name) => {
  const n = fs.get(`/Users/Administrator/Pictures/${name}`)
  return n ? n.content : null
}

export const WALLPAPERS = [
  { id: 'harmony', name: 'Harmony', image: () => HARMONY, css: 'linear-gradient(160deg,#2a6296 0%,#1c4f7c 45%,#0a2137 100%)' },
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
