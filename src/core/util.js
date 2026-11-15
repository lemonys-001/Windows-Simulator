export const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export const fmtSize = (bytes) => {
  if (bytes == null) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export const pad2 = (n) => String(n).padStart(2, '0')

export const fmtTime = (d, { use24h, showSeconds }) => {
  let h = d.getHours()
  let suffix = ''
  if (!use24h) {
    suffix = h < 12 ? ' AM' : ' PM'
    h = h % 12 || 12
  }
  const base = `${use24h ? pad2(h) : h}:${pad2(d.getMinutes())}`
  return base + (showSeconds ? `:${pad2(d.getSeconds())}` : '') + suffix
}

export const fmtDate = (d) =>
  `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}/${d.getFullYear()}`

export const fmtLongDate = (d) =>
  d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

export const mimeKind = (mime = '', name = '') => {
  const m = mime.split('/')[0]
  if (m === 'image') return 'image'
  if (m === 'audio') return 'audio'
  if (m === 'video') return 'video'
  if (m === 'text') return 'text'
  if (/\.(txt|ini|md|log|js|css|html)$/i.test(name)) return 'text'
  if (/\.(png|jpe?g|gif|svg|webp|bmp)$/i.test(name)) return 'image'
  if (/\.(wav|mp3|ogg|flac)$/i.test(name)) return 'audio'
  if (/\.(mp4|webm|mov)$/i.test(name)) return 'video'
  return 'file'
}

export const ext = (name) => {
  const i = name.lastIndexOf('.')
  return i > 0 ? name.slice(i + 1).toLowerCase() : ''
}
