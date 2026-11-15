import { useEffect, useMemo, useRef, useState } from 'react'
import { fs } from '../core/fs'
import { useFs } from '../core/hooks'
import { Icon, fileIcon } from '../icons'
import { fmtLongDate, fmtSize } from '../core/util'

export default function MediaPlayer({ path: initialPath }) {
  const fsVersion = useFs()
  const [track, setTrack] = useState(initialPath || null)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const mediaRef = useRef(null)

  const library = useMemo(() => {
    const scan = (p) => fs.list(p).filter((n) => {
      const mime = n.mime || ''
      return mime.startsWith('audio/') || mime.startsWith('video/') || /\.(wav|mp3|ogg|flac|mp4|webm)$/i.test(n.name)
    })
    return [...scan('/Users/Administrator/Music'), ...scan('/Users/Administrator/Videos')]
  }, [fsVersion])

  useEffect(() => {
    if (!track && library.length) setTrack(`/Users/Administrator/Music/${library[0].name}`)
  }, [library])

  useEffect(() => {
    const el = mediaRef.current
    if (el) el.volume = volume
  }, [volume, track])

  const node = track ? fs.get(track) : null
  const isVideo = (node?.mime || '').startsWith('video/') || /\.(mp4|webm)$/i.test(node?.name || '')

  const toggle = () => {
    const el = mediaRef.current
    if (!el) return
    if (playing) el.pause()
    else el.play()
  }

  const fmt = (s) => {
    if (!isFinite(s)) return '0:00'
    const m = Math.floor(s / 60)
    return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
  }

  return (
    <div className="flex-1 flex min-h-0">
      <div className="w-44 flex-none border-r border-[#d4dde4] bg-gradient-to-b from-[#f3f7fa] to-[#e9eef3] p-1.5 overflow-y-auto">
        <div className="text-[11px] font-semibold text-[#5d7484] px-2 pt-1 pb-1">Library ({library.length})</div>
        {library.map((n) => {
          const p = (n.mime?.startsWith('video') || /\.(mp4|webm)$/i.test(n.name))
            ? `/Users/Administrator/Videos/${n.name}` : `/Users/Administrator/Music/${n.name}`
          return (
            <div key={n.id} className={`list-row rounded px-2 py-1 flex items-center gap-1.5 text-[12px] ${track === p ? 'selected' : ''}`} onClick={() => { setTrack(p); setPlaying(false); setProgress(0) }}>
              <Icon name={fileIcon(n)} size={16} /><span className="truncate">{n.name}</span>
            </div>
          )
        })}
        <label className="list-row rounded px-2 py-1 flex items-center gap-1.5 text-[12px] mt-2 cursor-pointer">
          <Icon name="newFile" size={16} /><span>Import file…</span>
          <input type="file" accept="audio/*,video/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) setTrack(URL.createObjectURL(f))
          }} />
        </label>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-[#1b2733] text-[#cfe6ff]">
        <div className="flex-1 grid place-items-center min-h-0 relative">
          {node ? (isVideo ? (
            <video ref={mediaRef} src={node.content} className="max-w-full max-h-full" controls
              onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
              onTimeUpdate={(e) => setProgress(e.target.currentTime)}
              onLoadedMetadata={(e) => setDuration(e.target.duration)} />
          ) : (
            <div className="w-full max-w-md flex flex-col items-center gap-4">
              <div className="w-28 h-28 rounded-full bg-[#2a5d8f] border-4 border-[#5f9ecb] grid place-items-center shadow-[0_0_40px_rgba(87,163,220,.4)]">
                <Icon name="media" size={64} />
              </div>
              <div className="text-center">
                <div className="text-[15px] font-semibold truncate">{node?.name}</div>
                <div className="text-[11px] text-[#7fa3bd]">{fmtLongDate(new Date(node?.modified || Date.now()))} · {fmtSize((node?.content || '').length)}</div>
              </div>
              <audio ref={mediaRef} src={node.content} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
                onTimeUpdate={(e) => setProgress(e.target.currentTime)} onLoadedMetadata={(e) => setDuration(e.target.duration)} />
            </div>
          )) : (
            <div className="text-center text-[#7fa3bd]">
              <Icon name="media" size={56} className="mx-auto mb-2 opacity-60" />
              <div className="text-[13px]">Pick something from the library</div>
            </div>
          )}
        </div>
        {/* Transport */}
        <div className="flex-none px-4 py-3 bg-gradient-to-b from-[#24384c] to-[#16222e] border-t border-black/40">
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-full bg-[#3d5a75] hover:bg-[#4f74a0] grid place-items-center" onClick={toggle} disabled={!node} aria-label={playing ? 'Pause' : 'Play'}>
              <Icon name={playing ? 'pause' : 'play'} size={16} className="text-white" style={{ color: '#fff' }} />
            </button>
            <span className="text-[11px] w-10 text-right tabular-nums">{fmt(progress)}</span>
            <div
              className="flex-1 h-1.5 rounded-full bg-[#0f1a24] cursor-pointer relative"
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect()
                const t = ((e.clientX - r.left) / r.width) * duration
                if (mediaRef.current && isFinite(t)) mediaRef.current.currentTime = t
              }}
            >
              <div className="h-full rounded-full bg-[#57a3dc]" style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} />
            </div>
            <span className="text-[11px] w-10 tabular-nums">{fmt(duration)}</span>
            <Icon name="volume" size={16} />
            <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(+e.target.value)} className="w-20 accent-[#57a3dc]" aria-label="Volume" />
          </div>
        </div>
      </div>
    </div>
  )
}
