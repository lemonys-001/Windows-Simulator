import { useId } from 'react'

// Original, hand-drawn SVG icon set with a Windows 7 (Aero) flavor.
const art = {
  folder: (g) => (
    <>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd77d" /><stop offset="1" stopColor="#e8a33d" />
        </linearGradient>
      </defs>
      <path d="M4 12c0-2.2 1.3-4 3.5-4H18l4 5h18.5c2.2 0 3.5 1.8 3.5 4v19c0 2.2-1.8 4-4 4H8c-2.2 0-4-1.8-4-4z" fill={`url(#${g})`} stroke="#b57917" strokeWidth="1.5" />
      <path d="M4 18h40v18c0 2.2-1.8 4-4 4H8c-2.2 0-4-1.8-4-4z" fill="#ffe9b8" stroke="#c98d2a" strokeWidth="1.2" opacity=".9" />
    </>
  ),
  folderOpen: (g) => (
    <>
      <path d="M4 12c0-2.2 1.3-4 3.5-4H18l4 5h18.5c2.2 0 3.5 1.8 3.5 4v19c0 2.2-1.8 4-4 4H8c-2.2 0-4-1.8-4-4z" fill="#e8a33d" stroke="#b57917" strokeWidth="1.5" />
      <path d="M8 18h40l-5 21c-.5 1.8-2 3-3.8 3H6c-2.2 0-3.6-1.9-3-4z" fill="#ffe9b8" stroke="#c98d2a" strokeWidth="1.2" />
    </>
  ),
  computer: (g) => (
    <>
      <defs><linearGradient id={g} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5aa7dd" /><stop offset="1" stopColor="#1d4e78" /></linearGradient></defs>
      <rect x="5" y="8" width="38" height="26" rx="3" fill="#d7e4ee" stroke="#6b7f90" strokeWidth="1.5" />
      <rect x="8" y="11" width="32" height="20" rx="1.5" fill={`url(#${g})`} />
      <path d="M20 34h8l2 6H18z" fill="#c3d2dd" stroke="#6b7f90" strokeWidth="1.2" />
      <rect x="12" y="40" width="24" height="3" rx="1.5" fill="#aebfc9" stroke="#6b7f90" strokeWidth="1" />
      <path d="M11 14h12l-4 6H11z" fill="#ffffff" opacity=".25" />
    </>
  ),
  notepad: (g) => (
    <>
      <rect x="9" y="5" width="30" height="38" rx="2.5" fill="#fdfdf8" stroke="#8fa3b3" strokeWidth="1.5" />
      <rect x="9" y="5" width="30" height="7" rx="2.5" fill="#4f9cd9" stroke="#33749f" strokeWidth="1" />
      <path d="M14 18h20M14 23h20M14 28h20M14 33h13" stroke="#9db6c6" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  cmd: (g) => (
    <>
      <rect x="5" y="8" width="38" height="32" rx="3" fill="#101314" stroke="#3c4a52" strokeWidth="1.5" />
      <rect x="5" y="8" width="38" height="6" rx="3" fill="#2b3a42" />
      <path d="M11 22l5 4-5 4" stroke="#e8f4ff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 30h12" stroke="#e8f4ff" strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  calc: (g) => (
    <>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#eef2f6" stroke="#7f95a6" strokeWidth="1.5" />
      <rect x="12" y="8" width="24" height="9" rx="2" fill="#31465a" />
      <text x="33" y="15.5" textAnchor="end" fontSize="6" fill="#cfe6ff" fontFamily="monospace">42</text>
      {[0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => (
        <rect key={`${r}${c}`} x={12 + c * 6.5} y={20 + r * 6} width="5.4" height="5" rx="1.2" fill={c === 3 ? '#f0a24b' : '#ffffff'} stroke="#b7c6d2" strokeWidth=".8" />
      )))}
    </>
  ),
  paint: (g) => (
    <>
      <path d="M24 5C13 5 5 12.6 5 22c0 5.4 4.6 8.4 9 8.4 3 0 3.6 1.5 2.6 3.4-1.5 2.9.6 9.2 7.4 9.2C34.4 43 43 34.6 43 22 43 12.6 35 5 24 5z" fill="#f3f6f8" stroke="#7f95a6" strokeWidth="1.5" />
      <circle cx="15" cy="17" r="3.2" fill="#e74c3c" /><circle cx="24" cy="13" r="3.2" fill="#f1c40f" />
      <circle cx="33" cy="17" r="3.2" fill="#2ecc71" /><circle cx="35" cy="26" r="3.2" fill="#3498db" />
      <circle cx="24" cy="33" r="3.2" fill="#9b59b6" />
    </>
  ),
  settings: (g) => (
    <>
      <defs><linearGradient id={g} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#cfd9e2" /><stop offset="1" stopColor="#8fa3b3" /></linearGradient></defs>
      <path d="M24 8a16 16 0 013.9.5l1 4.3a11.7 11.7 0 013.4 2l4.2-1.3a16 16 0 013.8 6.7l-3.2 3a12 12 0 010 4l3.2 3a16 16 0 01-3.8 6.7l-4.2-1.3a11.7 11.7 0 01-3.4 2l-1 4.3A16 16 0 0124 40a16 16 0 01-3.9-.5l-1-4.3a11.7 11.7 0 01-3.4-2l-4.2 1.3a16 16 0 01-3.8-6.7l3.2-3a12 12 0 010-4l-3.2-3a16 16 0 013.8-6.7l4.2 1.3a11.7 11.7 0 013.4-2l1-4.3A16 16 0 0124 8z" fill={`url(#${g})`} stroke="#5d7484" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="6.5" fill="#eef2f6" stroke="#5d7484" strokeWidth="1.5" />
    </>
  ),
  chart: (g) => (
    <>
      <rect x="6" y="6" width="36" height="36" rx="3" fill="#f4f7f9" stroke="#7f95a6" strokeWidth="1.5" />
      <path d="M11 35v-8M18 35V17M25 35V23M32 35V11" stroke="#3aa757" strokeWidth="4" strokeLinecap="round" />
      <path d="M36 12l-3-5-3 5" fill="none" stroke="#2f7d43" strokeWidth="2" />
    </>
  ),
  media: (g) => (
    <>
      <circle cx="24" cy="24" r="18" fill="#eaf2f8" stroke="#7f95a6" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="14" fill={`url(#${g})`} />
      <defs><radialGradient id={g} cx=".4" cy=".3" r=".9"><stop offset="0" stopColor="#7cc0ec" /><stop offset="1" stopColor="#2a5d8f" /></radialGradient></defs>
      <path d="M20 17.5l11 6.5-11 6.5z" fill="#fff" />
    </>
  ),
  ie: (g) => (
    <>
      <defs><linearGradient id={g} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8fd0f0" /><stop offset="1" stopColor="#2a6ea8" /></linearGradient></defs>
      <circle cx="24" cy="24" r="16" fill={`url(#${g})`} stroke="#1d4e78" strokeWidth="1.5" />
      <ellipse cx="24" cy="24" rx="16" ry="6.4" fill="none" stroke="#eaf6ff" strokeWidth="2" opacity=".85" />
      <path d="M12 33c8 6 20 5 26-2" stroke="#f5b942" strokeWidth="3.4" fill="none" strokeLinecap="round" />
    </>
  ),
  game: (g) => (
    <>
      <defs><linearGradient id={g} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7ed37e" /><stop offset="1" stopColor="#2f8f43" /></linearGradient></defs>
      <rect x="5" y="5" width="38" height="38" rx="4" fill="#16351f" stroke="#0c2113" strokeWidth="1.5" />
      <path d="M14 12h20a4 4 0 014 4v4h-8v-2H18v14h4v8h-8a4 4 0 01-4-4V16a4 4 0 014-4z" fill={`url(#${g})`} />
      <circle cx="34" cy="34" r="4.5" fill="#ffd24d" stroke="#c98d2a" strokeWidth="1.2" />
    </>
  ),
  bomb: () => (
    <>
      <circle cx="22" cy="26" r="13" fill="#2e3a44" stroke="#141b20" strokeWidth="1.5" />
      <circle cx="17" cy="21" r="4" fill="#5d7484" opacity=".8" />
      <path d="M30 15l4-4M36 15l3-1M29 9l1-3" stroke="#c98d2a" strokeWidth="2" strokeLinecap="round" />
      <path d="M33 12l3-3" stroke="#ff9d3b" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  image: (g) => (
    <>
      <defs><linearGradient id={g} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9ad3f5" /><stop offset="1" stopColor="#3d84c6" /></linearGradient></defs>
      <rect x="5" y="9" width="38" height="30" rx="3" fill="#f6fafc" stroke="#7f95a6" strokeWidth="1.5" />
      <rect x="8" y="12" width="32" height="24" fill={`url(#${g})`} />
      <circle cx="16" cy="19" r="3" fill="#fff8c9" />
      <path d="M8 36l10-11 7 8 6-5 9 8z" fill="#2f7d43" opacity=".85" />
    </>
  ),
  note: () => (
    <>
      <rect x="7" y="7" width="34" height="34" rx="2" fill="#fff6a8" stroke="#d9c95a" strokeWidth="1.5" />
      <path d="M13 17h22M13 24h22M13 31h14" stroke="#b8a93e" strokeWidth="2" strokeLinecap="round" />
      <path d="M33 41l8-8H33z" fill="#e8dd77" stroke="#c4b74a" strokeWidth="1" />
    </>
  ),
  recycle: (g) => (
    <>
      <defs><linearGradient id={g} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d7e9f5" /><stop offset="1" stopColor="#9dbcd4" /></linearGradient></defs>
      <path d="M12 14h24l-2.4 26a4 4 0 01-4 3.6H18.4a4 4 0 01-4-3.6z" fill={`url(#${g})`} stroke="#5d7484" strokeWidth="1.5" />
      <ellipse cx="24" cy="12" rx="12" ry="3.4" fill="#eef4f8" stroke="#5d7484" strokeWidth="1.5" />
      <path d="M19 22l-2 15M29 22l2 15M24 22v15" stroke="#7fa3bd" strokeWidth="1.6" />
      <path d="M28 4l4 5-6 1z" fill="#3aa757" />
    </>
  ),
  recycleFull: (g) => (
    <>
      <path d="M12 14h24l-2.4 26a4 4 0 01-4 3.6H18.4a4 4 0 01-4-3.6z" fill={`url(#${g})`} stroke="#5d7484" strokeWidth="1.5" />
      <defs><linearGradient id={g} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d7e9f5" /><stop offset="1" stopColor="#9dbcd4" /></linearGradient></defs>
      <ellipse cx="24" cy="12" rx="12" ry="3.4" fill="#eef4f8" stroke="#5d7484" strokeWidth="1.5" />
      <path d="M16 12c2-6 6-8 8-4s6 2 8-2" fill="none" stroke="#e74c3c" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M19 22l-2 15M29 22l2 15M24 22v15" stroke="#7fa3bd" strokeWidth="1.6" />
    </>
  ),
  info: () => (
    <>
      <circle cx="24" cy="24" r="18" fill="#eaf2f8" stroke="#4f9cd9" strokeWidth="1.6" />
      <circle cx="24" cy="15" r="2.6" fill="#2a6ea8" />
      <path d="M24 22v13" stroke="#2a6ea8" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  textfile: () => (
    <>
      <path d="M12 5h16l8 8v30H12z" fill="#fbfbf6" stroke="#8fa3b3" strokeWidth="1.5" />
      <path d="M28 5l8 8h-8z" fill="#dde7ee" stroke="#8fa3b3" strokeWidth="1" />
      <path d="M17 20h14M17 25h14M17 30h9" stroke="#9db6c6" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  genericfile: () => (
    <>
      <path d="M12 5h16l8 8v30H12z" fill="#f2f5f7" stroke="#8fa3b3" strokeWidth="1.5" />
      <path d="M28 5l8 8h-8z" fill="#dde7ee" stroke="#8fa3b3" strokeWidth="1" />
    </>
  ),
  audiofile: () => (
    <>
      <path d="M12 5h16l8 8v30H12z" fill="#eef4fb" stroke="#6f93b8" strokeWidth="1.5" />
      <path d="M28 5l8 8h-8z" fill="#d9e5f2" stroke="#6f93b8" strokeWidth="1" />
      <path d="M22 32v-10l8-2v10" stroke="#4f9cd9" strokeWidth="2" fill="none" strokeLinejoin="round" />
      <circle cx="20" cy="32" r="2.6" fill="#4f9cd9" /><circle cx="28" cy="30" r="2.6" fill="#4f9cd9" />
    </>
  ),
  videofile: () => (
    <>
      <path d="M12 5h16l8 8v30H12z" fill="#f0f5f0" stroke="#7f95a6" strokeWidth="1.5" />
      <path d="M28 5l8 8h-8z" fill="#ddeee2" stroke="#7f95a6" strokeWidth="1" />
      <path d="M20 22l9 5-9 5z" fill="#3aa757" />
    </>
  ),
  user: (g) => (
    <>
      <defs><linearGradient id={g} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9ec9ea" /><stop offset="1" stopColor="#4f88b8" /></linearGradient></defs>
      <circle cx="24" cy="17" r="8" fill={`url(#${g})`} stroke="#33678f" strokeWidth="1.4" />
      <path d="M8 42c2-10 8-14 16-14s14 4 16 14z" fill={`url(#${g})`} stroke="#33678f" strokeWidth="1.4" />
    </>
  ),
  start: () => (
    <>
      <circle cx="24" cy="24" r="21" fill="#2a5b8f" stroke="#173a5e" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="21" fill="url(#orbShine)" />
      <defs><radialGradient id="orbShine" cx=".35" cy=".25" r=".95"><stop offset="0" stopColor="#8fc6ee" stopOpacity=".85" /><stop offset=".55" stopColor="#4f9cd9" stopOpacity=".25" /><stop offset="1" stopColor="#0e2c49" stopOpacity=".45" /></radialGradient></defs>
      <path d="M12 22.2l8.6-1.7v7.3l-8.6-.9zM22.2 20.2l8.8-1.7v8.9l-8.8-.7zM12 24.6l8.6.9v7.6L12 30.9zM22.2 28.4l8.8.7v9.4l-8.8-1.9z" fill="#eaf6ff" opacity=".92" transform="translate(0 -1.5)" />
    </>
  ),
  network: () => (
    <>
      <path d="M24 10c9 0 17 4 20 9-5-3-12-5-20-5s-15 2-20 5c3-5 11-9 20-9z" fill="#5f7686" />
      <path d="M24 20c5.5 0 10.5 2 13.5 5-4-1.5-8.5-2.3-13.5-2.3S14.5 23.5 10.5 25c3-3 8-5 13.5-5z" fill="#5f7686" />
      <path d="M24 30c2.5 0 5 1 6.5 2.5-2-.8-4.2-1.2-6.5-1.2s-4.5.4-6.5 1.2c1.5-1.5 4-2.5 6.5-2.5z" fill="#5f7686" />
      <circle cx="24" cy="37" r="3" fill="#3aa757" />
    </>
  ),
  volume: () => (
    <>
      <path d="M8 19h7l9-8v26l-9-8H8z" fill="#5f7686" />
      <path d="M28 18c3 3 3 9 0 12M32 14c5 5 5 15 0 20" stroke="#5f7686" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </>
  ),
  flag: () => (
    <>
      <path d="M10 8v34" stroke="#5f7686" strokeWidth="3" strokeLinecap="round" />
      <path d="M12 9h26l-5 7 5 7H12z" fill="#f0c04b" stroke="#c9962b" strokeWidth="1.4" />
    </>
  ),
  drive: (g) => (
    <>
      <defs><linearGradient id={g} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e8eef3" /><stop offset="1" stopColor="#aebfc9" /></linearGradient></defs>
      <rect x="5" y="16" width="38" height="17" rx="3" fill={`url(#${g})`} stroke="#6b7f90" strokeWidth="1.5" />
      <circle cx="37" cy="24.5" r="2.4" fill="#3aa757" />
      <rect x="9" y="21" width="18" height="2.4" rx="1.2" fill="#8fa3b3" />
      <rect x="9" y="26" width="12" height="2.4" rx="1.2" fill="#c3d2dd" />
    </>
  ),
  power: () => (
    <>
      <circle cx="24" cy="24" r="17" fill="none" stroke="#e8f4ff" strokeWidth="3" strokeDasharray="76 22" strokeLinecap="round" transform="rotate(120 24 24)" />
      <path d="M24 10v12" stroke="#e8f4ff" strokeWidth="3.4" strokeLinecap="round" />
    </>
  ),
  search: () => (
    <><circle cx="21" cy="21" r="11" fill="none" stroke="currentColor" strokeWidth="3" /><path d="M30 30l9 9" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" /></>
  ),
  back: () => <><circle cx="24" cy="24" r="17" fill="#dff0fb" stroke="#4f9cd9" strokeWidth="2" /><path d="M28 15l-9 9 9 9" fill="none" stroke="#2a6ea8" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" /></>,
  forward: () => <><circle cx="24" cy="24" r="17" fill="#dff0fb" stroke="#4f9cd9" strokeWidth="2" /><path d="M20 15l9 9-9 9" fill="none" stroke="#2a6ea8" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" /></>,
  up: () => <><circle cx="24" cy="24" r="17" fill="#dff0fb" stroke="#4f9cd9" strokeWidth="2" /><path d="M15 28l9-9 9 9" fill="none" stroke="#2a6ea8" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" /></>,
  refresh: () => <><path d="M38 24a14 14 0 11-4-10" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" /><path d="M38 8v8h-8" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></>,
  trash: () => <><path d="M10 12h28M20 12V8h8v4M14 12l2 28h16l2-28" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /><path d="M20 18l1 16M28 18l-1 16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></>,
  save: () => <><path d="M8 8h26l6 6v26H8z" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" /><path d="M14 8h14v10H14zM14 28h20v12H14z" fill="none" stroke="currentColor" strokeWidth="2.2" /></>,
  newFolder: () => <><path d="M6 12c0-2 1.2-3.4 3-3.4h8l3 4h15c1.8 0 3 1.5 3 3.4v18c0 1.9-1.5 3.4-3.4 3.4H9.4C7.5 37.4 6 35.9 6 34z" fill="#e8a33d" stroke="#b57917" strokeWidth="2" /><path d="M30 26v12M24 32h12" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" /></>,
  newFile: () => <><path d="M12 5h16l8 8v30H12z" fill="#fbfbf6" stroke="#8fa3b3" strokeWidth="2" /><path d="M28 5l8 8h-8z" fill="#dde7ee" stroke="#8fa3b3" strokeWidth="1" /><path d="M24 22v14M17 29h14" stroke="#4f9cd9" strokeWidth="3" strokeLinecap="round" /></>,
  play: () => <><path d="M15 10l22 14-22 14z" fill="currentColor" /></>,
  pause: () => <><rect x="13" y="10" width="7" height="28" fill="currentColor" /><rect x="28" y="10" width="7" height="28" fill="currentColor" /></>,
  zoomIn: () => <><circle cx="21" cy="21" r="11" fill="none" stroke="currentColor" strokeWidth="3" /><path d="M16 21h10M21 16v10M30 30l9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></>,
  zoomOut: () => <><circle cx="21" cy="21" r="11" fill="none" stroke="currentColor" strokeWidth="3" /><path d="M16 21h10M30 30l9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></>,
  rotate: () => <><path d="M36 22a12 12 0 11-3-8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /><path d="M36 8v8h-8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></>,
  shield: () => <><path d="M24 5l15 5v12c0 10-6.5 17.5-15 21-8.5-3.5-15-11-15-21V10z" fill="#eaf2f8" stroke="#4f9cd9" strokeWidth="2" /><path d="M17 24l5 5 9-10" fill="none" stroke="#3aa757" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" /></>,
}

export function Icon({ name, size = 24, className, style }) {
  const rawId = useId()
  const g = 'ig' + rawId.replace(/[^a-zA-Z0-9]/g, '')
  const draw = art[name] || art.genericfile
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} style={style} aria-hidden="true">
      {draw(g, size)}
    </svg>
  )
}

// File-type -> icon name
export function fileIcon(node) {
  if (!node) return 'genericfile'
  if (node.type === 'dir') return 'folder'
  const mime = node.mime || ''
  if (mime.startsWith('image/') || /\.(png|jpe?g|gif|svg|webp|bmp)$/i.test(node.name)) return 'image'
  if (mime.startsWith('audio/') || /\.(wav|mp3|ogg|flac)$/i.test(node.name)) return 'audiofile'
  if (mime.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(node.name)) return 'videofile'
  if (mime.startsWith('text/') || /\.(txt|ini|md|log|js|css|html)$/i.test(node.name)) return 'textfile'
  return 'genericfile'
}
