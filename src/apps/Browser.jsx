import { useEffect, useRef, useState } from 'react'
import { Icon } from '../icons'
import { useOS } from '../core/store'
import { fs } from '../core/fs'

// Curated in-simulator pages + attempt real URLs in an iframe (with fallback).
const HOME_TILES = [
  { title: 'Getting Started', body: 'Learn what this simulator can do', page: 'about' },
  { title: 'Games', body: 'Play Snake or Minesweeper', page: 'games' },
  { title: 'Search', body: 'Open a real web search', page: 'search' },
  { title: 'Wikipedia', body: 'The free encyclopedia', url: 'https://en.m.wikipedia.org/wiki/Windows_7' },
]

const PAGES = {
  home: () => <Home />,
  about: () => (
    <Page title="Getting Started">
      <p><b>Windows 7 Simulator</b> recreates the Windows 7 desktop in your browser: a real window manager with Aero Snap, a taskbar, Start menu, a virtual C: drive and a dozen apps.</p>
      <ul>
        <li>Drag windows to screen edges to snap them (Aero Snap).</li>
        <li>Alt+Tab switches windows. Win+R opens Run, Win+E opens Explorer.</li>
        <li>Save files in Notepad or Paint — they live in the virtual drive and survive reloads.</li>
        <li>Try <code>help</code> in the Command Prompt.</li>
      </ul>
      <p className="text-[11px] text-[#7f95a6]">Not affiliated with Microsoft. Built as a fan recreation for fun and education.</p>
    </Page>
  ),
  games: () => (
    <Page title="Games">
      <p>Games are regular apps — they open on your desktop:</p>
      <GameLinks />
    </Page>
  ),
  search: () => (
    <Page title="Search the Web">
      <p>Type a query and it opens in a real browser tab (outside the simulator, since most sites refuse to be framed):</p>
      <SearchBox />
    </Page>
  ),
}

function Home() {
  return (
    <Page title="Welcome to the Web">
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))' }}>
        {HOME_TILES.map((t) => <Tile key={t.title} tile={t} />)}
      </div>
      <p className="text-[11px] text-[#7f95a6] mt-3">Tip: type any address in the bar above. Sites that block embedding get a friendly fallback.</p>
    </Page>
  )
}
function Tile({ tile }) {
  const { dispatch } = useOS()
  const go = () => {
    if (tile.page === 'games') {
      dispatch({ type: 'OPEN_APP', appId: 'snake' })
      dispatch({ type: 'OPEN_APP', appId: 'mines' })
      return
    }
    if (tile.page) { setIePage(tile.page); return }
    if (tile.url) setIeUrl(tile.url)
  }
  return (
    <button className="text-left rounded border border-[#c2d0da] bg-gradient-to-b from-white to-[#eef4f9] p-3 hover:border-[#57a3dc] hover:shadow-[0_2px_10px_rgba(87,163,220,.35)]" onClick={go}>
      <div className="text-[13px] font-semibold text-[#2a6ea8]">{tile.title}</div>
      <div className="text-[11px] text-[#5d7484] mt-0.5">{tile.body}</div>
    </button>
  )
}
function GameLinks() {
  const { dispatch } = useOS()
  return (
    <div className="flex gap-2">
      <button className="btn" onClick={() => dispatch({ type: 'OPEN_APP', appId: 'snake' })}>Play Snake</button>
      <button className="btn" onClick={() => dispatch({ type: 'OPEN_APP', appId: 'mines' })}>Play Minesweeper</button>
    </div>
  )
}
function SearchBox() {
  const [q, setQ] = useState('')
  return (
    <div className="flex gap-2 mt-1">
      <input className="field flex-1" placeholder="Search query…" value={q} onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') window.open(`https://www.bing.com/search?q=${encodeURIComponent(q)}`, '_blank') }} />
      <button className="btn btn-default" onClick={() => window.open(`https://www.bing.com/search?q=${encodeURIComponent(q)}`, '_blank')}>Search</button>
    </div>
  )
}

function Page({ title, children }) {
  return (
    <div className="p-5 max-w-2xl">
      <h1 className="text-[18px] text-[#2a6ea8] mb-2" style={{ textShadow: '0 1px 0 #fff' }}>{title}</h1>
      <div className="text-[12px] leading-relaxed [&_p]:mb-2 [&_li]:mb-1 [&_ul]:list-disc [&_ul]:pl-5">{children}</div>
    </div>
  )
}

// communicate with the IE instance
let iePageSink = null
let ieUrlSink = null
const setIePage = (p) => iePageSink?.(p)
const setIeUrl = (u) => ieUrlSink?.(u)

export default function Browser({ url: initialUrl }) {
  const [page, setPage] = useState(initialUrl ? 'url' : 'home')
  const [url, setUrl] = useState(initialUrl || '')
  const [typed, setTyped] = useState(initialUrl || '')
  const [iframeFailed, setIframeFailed] = useState(false)
  const [history, setHistory] = useState([])
  const frameRef = useRef(null)
  const failTimer = useRef(null)

  useEffect(() => {
    iePageSink = (p) => { setPage(p); setUrl('') }
    ieUrlSink = (u) => { setPage('url'); setUrl(u); setTyped(u); setIframeFailed(false) }
    return () => { iePageSink = null; ieUrlSink = null }
  }, [])

  const go = (address) => {
    let a = address.trim()
    if (!a) return
    if (PAGES[a.toLowerCase()]) { setPage(a.toLowerCase()); setUrl(''); return }
    if (!/^https?:\/\//i.test(a)) {
      a = a.includes('.') && !a.includes(' ') ? `https://${a}` : `https://www.bing.com/search?q=${encodeURIComponent(a)}`
    }
    setIframeFailed(false)
    setPage('url')
    setUrl(a)
    setTyped(a)
    setHistory((h) => [...h, a].slice(-30))
    clearTimeout(failTimer.current)
    failTimer.current = setTimeout(() => setIframeFailed(true), 6000)
  }

  const renderPage = () => {
    if (page === 'url' && url) {
      return iframeFailed ? (
        <div className="p-6 text-center">
          <Icon name="ie" size={52} className="mx-auto mb-3 opacity-70" />
          <div className="text-[14px] font-semibold text-[#2a6ea8]">Most sites refuse to load inside a frame</div>
          <p className="text-[12px] text-[#5d7484] mt-2 max-w-md mx-auto leading-relaxed">
            That's a browser security rule (X-Frame-Options), not a bug in the simulator.
            You can open the address in a real tab instead.
          </p>
          <div className="mt-3 flex gap-2 justify-center">
            <button className="btn" onClick={() => setPage('home')}>Go Home</button>
            <button className="btn btn-default" onClick={() => window.open(url, '_blank')}>Open {new URL(url).hostname} in a new tab</button>
          </div>
        </div>
      ) : (
        <iframe ref={frameRef} src={url} title="IE content" className="flex-1 w-full border-0 bg-white" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
      )
    }
    const P = PAGES[page] || PAGES.home
    return <P />
  }

  const back = () => {
    if (history.length === 0) return
    const h = [...history]
    const last = h.pop()
    setHistory(h)
    setIframeFailed(false)
    setPage('url')
    setUrl(last)
    setTyped(last)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-1 px-2 py-1.5 bg-gradient-to-b from-[#f6fafd] to-[#e8eff5] border-b border-[#d4dde4]">
        <button className={`w-7 h-7 rounded flex items-center justify-center ${history.length ? 'hover:bg-[#dcebfa]' : 'opacity-40'}`} onClick={back} aria-label="Back"><Icon name="back" size={22} /></button>
        <div className="field flex-1 flex items-center gap-2 !py-0.5">
          <Icon name="ie" size={14} />
          <input
            className="flex-1 outline-none bg-transparent text-[12px]"
            value={typed}
            placeholder="Search or type a web address"
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') go(typed) }}
            aria-label="Address bar"
          />
        </div>
        <button className="btn !px-2.5 !py-0.5" onClick={() => go(typed)}>Go</button>
      </div>
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-white">
        {renderPage()}
      </div>
      <div className="flex-none px-3 py-1 text-[11px] text-[#4a5b68] bg-gradient-to-b from-[#f6fafd] to-[#e8eff5] border-t border-[#d4dde4] flex gap-4">
        <span>Internet | Protected Mode: <span className="text-[#3aa757]">Simulated</span></span>
        <span className="ml-auto truncate">{url && page === 'url' ? url : 'http://start.windows-sim/'}</span>
      </div>
    </div>
  )
}
