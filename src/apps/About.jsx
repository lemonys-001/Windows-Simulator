import { useOS } from '../core/store'
import { fmtLongDate } from '../core/util'

export default function About() {
  const { state } = useOS()
  return (
    <div className="flex-1 flex min-h-0 bg-gradient-to-b from-[#f6fafd] to-[#e8eff5]">
      <div className="w-28 flex-none m-3 rounded bg-gradient-to-b from-[#2a6296] to-[#0a2137] grid place-items-center">
        <svg viewBox="0 0 48 48" width="64" height="64"><path d="M8 21l14-2.6v-9L8 12.6zM24.6 17.8L40 15v13.2l-15.4-1.2zM8 22.8l14 1.2v10.6L8 32.4zM24.6 25.4L40 26.6V40l-15.4-2.6z" fill="#eaf6ff" transform="translate(0 2)" /></svg>
      </div>
      <div className="flex-1 p-4 pr-5 min-w-0">
        <div className="text-[22px] text-[#2a6ea8]" style={{ textShadow: '0 1px 0 #fff' }}>Windows 7</div>
        <div className="text-[12px] text-[#4a5b68] mb-3">Ultimate — Simulator Edition</div>
        <table className="text-[11px] leading-relaxed">
          <tbody>
            <tr><td className="text-[#5d7484] pr-4 align-top">Build</td><td>6.1.7601 (React + Vite + Tailwind)</td></tr>
            <tr><td className="text-[#5d7484] pr-4 align-top">Licensed to</td><td>Administrator</td></tr>
            <tr><td className="text-[#5d7484] pr-4 align-top">Session started</td><td>{fmtLongDate(new Date())}</td></tr>
            <tr><td className="text-[#5d7484] pr-4 align-top">Windows open</td><td>{state.windows.length}</td></tr>
          </tbody>
        </table>
        <p className="text-[10px] text-[#7f95a6] mt-4 leading-relaxed">
          This is a fan-made desktop simulation built for fun and education.
          It is not affiliated with, endorsed by, or connected to Microsoft.
          Windows is a trademark of Microsoft Corporation.
        </p>
      </div>
    </div>
  )
}
