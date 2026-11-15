import { useState } from 'react'
import { useOS } from '../core/store'
import { WALLPAPERS, wallpaperStyle } from '../core/wallpapers'
import { fs } from '../core/fs'
import { useFs } from '../core/hooks'
import { dialog } from '../core/dialog'
import { Icon } from '../icons'
import { openNode } from '../components/Desktop'

const SECTIONS = [
  ['personalize', 'Personalization', 'paint'],
  ['clock', 'Clock, Language, and Region', 'info'],
  ['system', 'System and Security', 'shield'],
  ['network', 'Network and Internet', 'network'],
]

const ACCENTS = ['#57a3dc', '#3aa757', '#e67e22', '#c0392b', '#8e44ad', '#16a085', '#f1c40f', '#5d6d7e']

export default function Settings({ section: initialSection }) {
  const { state, dispatch } = useOS()
  const [section, setSection] = useState(initialSection || 'personalize')
  const fsVersion = useFs()
  const s = state.settings

  const pics = fs.list('/Users/Administrator/Pictures').filter((n) => (n.mime || '').startsWith('image') || /\.(svg|png|jpe?g|webp)$/i.test(n.name))

  return (
    <div className="flex-1 flex min-h-0">
      <div className="w-48 flex-none bg-gradient-to-b from-[#f3f7fa] to-[#e9eef3] border-r border-[#d4dde4] p-2">
        <div className="text-[13px] font-semibold px-1 pb-1.5">Control Panel</div>
        {SECTIONS.map(([id, label, icon]) => (
          <div key={id} className={`list-row rounded px-2 py-1.5 flex items-center gap-2 text-[12px] ${section === id ? 'selected' : ''}`} onClick={() => setSection(id)}>
            <Icon name={icon} size={18} /><span className="truncate">{label.split(',')[0]}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 min-w-0">
        {section === 'personalize' && (
          <div>
            <h2 className="text-[15px] font-semibold mb-1">Change the visuals and sounds on your computer</h2>
            <p className="text-[11px] text-[#5d7484] mb-3">Click a background to apply it. Custom images from your Pictures folder work too.</p>
            <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))' }}>
              {WALLPAPERS.map((w) => (
                <button
                  key={w.id}
                  className={`rounded overflow-hidden border-2 text-left ${s.wallpaper === w.id ? 'border-[var(--accent)]' : 'border-transparent'}`}
                  style={{ ...wallpaperStyle(w.id), height: 92, boxShadow: '0 1px 4px rgba(0,0,0,.3)' }}
                  onClick={() => dispatch({ type: 'SET_SETTING', key: 'wallpaper', value: w.id })}
                  title={w.name}
                >
                  <span className="block bg-black/35 text-white text-[11px] px-2 py-0.5">{w.name}</span>
                </button>
              ))}
            </div>
            {pics.length > 0 && (
              <>
                <div className="text-[12px] font-semibold mb-1.5">From Pictures</div>
                <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px,1fr))' }}>
                  {pics.map((n) => (
                    <div
                      key={n.id}
                      className={`rounded overflow-hidden border-2 ${s.wallpaper === `custom:${n.id}` ? 'border-[var(--accent)]' : 'border-[#c2d0da]'}`}
                      style={{ height: 80, background: `url("${(n.content || '').slice(0, 10) === 'data:image' ? n.content : ''}") center/cover no-repeat` }}
                      onClick={() => dispatch({ type: 'SET_SETTING', key: 'wallpaper', value: `custom:${n.id}` })}
                      title={n.name}
                    >
                      <span className="block bg-black/40 text-white text-[10px] px-1.5 py-0.5 truncate">{n.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="text-[12px] font-semibold mb-1.5">Window color (accent)</div>
            <div className="flex gap-2 mb-3 flex-wrap">
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  className={`w-9 h-9 rounded border-2 ${s.accent === c ? 'border-[#2a5d8f] ring-2 ring-[#57a3dc55]' : 'border-[#93a9ba]'}`}
                  style={{ background: c }}
                  onClick={() => dispatch({ type: 'SET_SETTING', key: 'accent', value: c })}
                  aria-label={`Accent ${c}`}
                />
              ))}
            </div>
            <label className="flex items-center gap-2 text-[12px] cursor-pointer">
              <input type="checkbox" checked={s.transparency} onChange={() => dispatch({ type: 'SET_SETTING', key: 'transparency', value: !s.transparency })} />
              Enable transparency (Aero glass)
            </label>
          </div>
        )}

        {section === 'clock' && (
          <div className="max-w-sm">
            <h2 className="text-[15px] font-semibold mb-3">Date and Time</h2>
            <div className="field mb-3 flex items-center gap-2" style={{ height: 42 }}>
              <Icon name="info" size={20} />
              <span className="text-[13px]">{new Date().toLocaleString()}</span>
            </div>
            <label className="flex items-center gap-2 text-[12px] mb-1.5 cursor-pointer">
              <input type="checkbox" checked={s.use24h} onChange={() => dispatch({ type: 'SET_SETTING', key: 'use24h', value: !s.use24h })} />
              Use 24-hour clock
            </label>
            <label className="flex items-center gap-2 text-[12px] mb-3 cursor-pointer">
              <input type="checkbox" checked={s.showSeconds} onChange={() => dispatch({ type: 'SET_SETTING', key: 'showSeconds', value: !s.showSeconds })} />
              Show seconds in the taskbar clock
            </label>
            <p className="text-[11px] text-[#5d7484]">Time comes from your device, so it is always accurate here.</p>
          </div>
        )}

        {section === 'system' && (
          <div className="max-w-md">
            <h2 className="text-[15px] font-semibold mb-3">System</h2>
            <div className="field mb-3" style={{ padding: 10 }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon name="computer" size={28} />
                <div>
                  <div className="text-[13px] font-semibold">Windows 7 Ultimate — Simulator Edition</div>
                  <div className="text-[11px] text-[#5d7484]">React + Vite + Tailwind build, running in your browser</div>
                </div>
              </div>
              <SysInfo />
            </div>
            <button
              className="btn"
              onClick={async () => {
                const ok = await dialog.confirm({
                  title: 'Reset Windows',
                  message: 'This wipes the virtual C: drive, settings, and session data.\nEverything you saved in the simulator will be lost.\n\nContinue?',
                  okText: 'Reset', cancelText: 'Cancel',
                })
                if (ok) dispatch({ type: 'RESET_ALL' })
              }}
            >
              Reset this simulator (factory settings)
            </button>
          </div>
        )}

        {section === 'network' && (
          <div className="max-w-md">
            <h2 className="text-[15px] font-semibold mb-3">Network and Internet</h2>
            <div className="field flex items-center gap-2 mb-3" style={{ padding: 10 }}>
              <Icon name="network" size={24} />
              <div>
                <div className="text-[12px] font-semibold">Simulated connection</div>
                <div className="text-[11px] text-[#5d7484]">192.168.1.42 — gateway 192.168.1.1</div>
              </div>
            </div>
            <p className="text-[11px] text-[#5d7484]">The simulated network feeds the Command Prompt's <code>ping</code> and <code>ipconfig</code>. Real browsing is handled by Internet Explorer.</p>
          </div>
        )}
        <span className="hidden">{fsVersion}</span>
      </div>
    </div>
  )
}

function SysInfo() {
  const nav = navigator
  const rows = [
    ['Processor', nav.hardwareConcurrency ? `${nav.hardwareConcurrency}-core (simulated @ 2.40 GHz)` : 'Unknown'],
    ['Memory', nav.deviceMemory ? `${nav.deviceMemory} GB (approx)` : '4 GB (simulated)'],
    ['Screen', `${screen.width} × ${screen.height}`],
    ['Browser engine', nav.userAgent.includes('Firefox') ? 'Gecko' : nav.userAgent.includes('Safari') && !nav.userAgent.includes('Chrome') ? 'WebKit' : 'Blink'],
    ['Language', nav.language],
  ]
  return (
    <table className="text-[11px] w-full">
      <tbody>{rows.map(([k, v]) => (
        <tr key={k}><td className="text-[#5d7484] pr-3 py-0.5 align-top">{k}:</td><td className="py-0.5">{v}</td></tr>
      ))}</tbody>
    </table>
  )
}
