import { useEffect, useRef, useState } from 'react'
import { useOS } from '../core/store'
import { APPS } from '../apps/registry'
import { Icon } from '../icons'

const FAKE_PROCS = [
  ['System Idle Process', 0, 24],
  ['explorer.exe', 0.8, 62],
  ['svchost.exe', 0.3, 41],
  ['dwm.exe', 1.2, 88],
  ['SearchIndexer.exe', 0.2, 55],
  ['audiodg.exe', 0.4, 12],
]

export default function TaskManager() {
  const { state, dispatch } = useOS()
  const [tab, setTab] = useState('apps')
  const [cpuData, setCpuData] = useState(Array(60).fill(6))
  const tick = useRef(0)

  useEffect(() => {
    const t = setInterval(() => {
      tick.current += 1
      setCpuData((d) => {
        const load = 6 + state.windows.length * 7 + Math.random() * 14
        return [...d.slice(1), Math.min(96, load)]
      })
    }, 1000)
    return () => clearInterval(t)
  }, [state.windows.length])

  const apps = state.windows
  const cpuNow = Math.round(cpuData[cpuData.length - 1])
  const memPct = Math.min(90, 28 + state.windows.length * 6)

  const endTask = (id) => dispatch({ type: 'CLOSE', id })

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-0 px-1 pt-1 text-[12px] bg-gradient-to-b from-[#f6fafd] to-[#eaf1f7] border-b border-[#d4dde4]">
        {[['apps', 'Applications'], ['procs', 'Processes'], ['perf', 'Performance']].map(([k, label]) => (
          <div key={k} className={`menubar-item ${tab === k ? 'open' : ''}`} onClick={() => setTab(k)}>{label}</div>
        ))}
        <button className="btn ml-auto mr-2 my-1 !py-1" disabled={tab !== 'apps' || !state.focusId} onClick={() => state.focusId && endTask(state.focusId)}>End Task</button>
      </div>

      {tab === 'apps' && (
        <div className="flex-1 overflow-y-auto min-h-0">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left">
                <th className="px-2 py-1 font-normal border-b border-[#d4dde4]">Task</th>
                <th className="px-2 py-1 font-normal border-b border-[#d4dde4] w-24">Status</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((w) => (
                <tr key={w.id} className={`list-row cursor-default ${state.focusId === w.id ? 'selected' : ''}`} onClick={() => dispatch({ type: 'FOCUS', id: w.id })} onDoubleClick={() => endTask(w.id)}>
                  <td className="px-2 py-1.5 flex items-center gap-2"><Icon name={APPS[w.appId].icon} size={18} /><span className="truncate">{w.title}</span></td>
                  <td className="px-2 py-1.5">{w.minimized ? 'Not responding… just kidding — minimized' : 'Running'}</td>
                </tr>
              ))}
              {apps.length === 0 && <tr><td className="px-2 py-3 text-[#93a9ba]" colSpan={2}>No applications are running.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'procs' && (
        <div className="flex-1 overflow-y-auto min-h-0">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left">
                <th className="px-2 py-1 font-normal border-b border-[#d4dde4]">Image name</th>
                <th className="px-2 py-1 font-normal border-b border-[#d4dde4] w-16">PID</th>
                <th className="px-2 py-1 font-normal border-b border-[#d4dde4] w-16">CPU</th>
                <th className="px-2 py-1 font-normal border-b border-[#d4dde4] w-24">Memory</th>
              </tr>
            </thead>
            <tbody>
              {state.windows.map((w, i) => (
                <tr key={w.id} className="list-row" onDoubleClick={() => endTask(w.id)}>
                  <td className="px-2 py-1">{w.appId}.exe</td>
                  <td className="px-2 py-1">{1000 + i * 4}</td>
                  <td className="px-2 py-1">{(1 + (w.z % 7) * 0.4).toFixed(1)}%</td>
                  <td className="px-2 py-1">{40 + (w.z % 9) * 13} MB</td>
                </tr>
              ))}
              {FAKE_PROCS.map(([name, cpu, mem], i) => (
                <tr key={name} className="list-row">
                  <td className="px-2 py-1">{name}</td>
                  <td className="px-2 py-1">{400 + i * 37}</td>
                  <td className="px-2 py-1">{(cpu + Math.random()).toFixed(1)}%</td>
                  <td className="px-2 py-1">{mem} K</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'perf' && (
        <div className="flex-1 p-3 flex gap-3 min-h-0 overflow-hidden">
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <div className="text-[11px] text-[#5d7484]">CPU usage: <b className="text-[#1c2b36]">{cpuNow}%</b></div>
            <PerfChart data={cpuData} color="#2a6ea8" fill="rgba(42,110,168,.18)" height={150} />
            <div className="text-[11px] text-[#5d7484]">Physical memory usage: <b className="text-[#1c2b36]">{memPct}%</b></div>
            <div className="h-4 rounded bg-[#e4eaf0] border border-[#c2d0da] overflow-hidden">
              <div className="h-full bg-gradient-to-b from-[#7cc0ec] to-[#2a6ea8]" style={{ width: `${memPct}%`, transition: 'width .5s' }} />
            </div>
          </div>
          <div className="w-44 flex-none text-[11px] leading-relaxed">
            <div className="font-semibold mb-1">Physical Memory</div>
            <div>Total: 4,096 MB</div>
            <div>Used: {Math.round(4096 * memPct / 100)} MB</div>
            <div>Free: {4096 - Math.round(4096 * memPct / 100)} MB</div>
            <div className="font-semibold mt-2 mb-1">System</div>
            <div>Handles: {(12 + state.windows.length * 137).toLocaleString()}</div>
            <div>Threads: 624</div>
            <div>Processes: {FAKE_PROCS.length + state.windows.length}</div>
            <div>Up time: {new Date(tick.current * 1000 + 4 * 3600000).toISOString().slice(11, 19)}</div>
          </div>
        </div>
      )}
    </div>
  )
}

function PerfChart({ data, color, fill, height = 150 }) {
  const w = 100
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${100 - v}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} 100`} preserveAspectRatio="none" style={{ width: '100%', height }} className="rounded border border-[#c2d0da] bg-[#0d1b28]">
      {[20, 40, 60, 80].map((y) => <line key={y} x1="0" y1={y} x2={w} y2={y} stroke="#1d3a52" strokeWidth="0.4" />)}
      <polygon points={`0,100 ${points} ${w},100`} fill={fill} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
