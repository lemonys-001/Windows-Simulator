import { useEffect, useState } from 'react'
import { fs } from '../core/fs'
import { useFs } from '../core/hooks'
import { openCtx } from '../components/ContextMenu'

const STORE = '/Users/Administrator/Desktop/Sticky Notes'
const COLORS = [
  ['#fff6a8', '#d9c95a'], ['#c9f2d0', '#5aa76a'], ['#cfe4fb', '#5a8ec2'], ['#fbd5cf', '#c26a5a'], ['#e8d9f7', '#9a6ac2'],
]

export default function StickyNotes() {
  const fsVersion = useFs()
  const notes = fs.get(STORE)?.children ? fs.list(STORE) : []
  const [active, setActive] = useState(null)

  useEffect(() => {
    if (!fs.get(STORE)) fs.mkdir(STORE)
  }, [])

  const addNote = () => {
    const name = `Note ${new Date().toLocaleTimeString().slice(0, 8).replaceAll(':', '.')}.note`
    fs.writeFile(`${STORE}/${name}`, '')
  }

  const del = async (n) => {
    fs.trash(`${STORE}/${n.name}`)
    setActive(null)
  }

  const menu = (e, n) => {
    e.preventDefault()
    openCtx({
      x: e.clientX, y: e.clientY,
      items: [{ label: 'Delete note', action: () => del(n) }],
    })
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#2d2a20]">
      <div className="flex items-center gap-2 px-3 py-2 bg-[#3a362a] text-[#e8e0c8]">
        <span className="text-[12px] font-semibold">Sticky Notes</span>
        <button className="ml-auto text-[18px] leading-none hover:text-white" onClick={addNote} title="New note" aria-label="New note">＋</button>
      </div>
      <div className="flex-1 overflow-y-auto p-2.5 grid gap-2.5 content-start" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))' }}>
        {notes.map((n, i) => {
          const [bg, edge] = COLORS[i % COLORS.length]
          return (
            <div
              key={n.id}
              className="rounded shadow-[0_3px_10px_rgba(0,0,0,.4)] p-2 flex flex-col min-h-[120px]"
              style={{ background: bg, border: `1px solid ${edge}` }}
              onContextMenu={(e) => menu(e, n)}
              onClick={() => setActive(n.id)}
            >
              <textarea
                className="flex-1 bg-transparent outline-none resize-none text-[12px] text-[#4a4433] leading-snug"
                style={{ fontFamily: 'Segoe Print, Comic Sans MS, cursive' }}
                defaultValue={n.content}
                onChange={(e) => fs.writeFile(`${STORE}/${n.name}`, e.target.value)}
                placeholder="Write something…"
                spellCheck={false}
              />
              <button
                className="self-end text-[11px] opacity-40 hover:opacity-90"
                onClick={(e) => { e.stopPropagation(); del(n) }}
                aria-label="Delete note"
                title="Delete"
              >✕</button>
            </div>
          )
        })}
        {notes.length === 0 && (
          <div className="col-span-full text-center text-[#9a917a] text-[12px] py-6">
            No notes yet — click ＋ to add one.
          </div>
        )}
      </div>
      <span className="hidden">{active}{fsVersion}</span>
    </div>
  )
}
