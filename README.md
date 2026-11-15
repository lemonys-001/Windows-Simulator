# Windows 7 Simulator

A faithful Windows 7 desktop simulation that runs entirely in your browser — rebuilt from scratch with React + Vite + Tailwind.

**Live demo:** https://lemonys-001.github.io/Windows-Simulator/

*This project is a fan-made simulation for nostalgia and education. Not affiliated with, endorsed by, or connected to Microsoft in any way. Windows is a trademark of Microsoft Corporation.*

## What works

- **Boot → Login → Desktop** flow, with lock screen (Win+L), shutdown, restart and reset
- **Window manager** — drag, resize from any edge, maximize, minimize, snap to screen halves (Win+←/→), z-order, taskbar previews
- **Virtual filesystem** persisted to `localStorage` — files and folders survive reloads
- **Aero glass UI** — translucent windows, gradients, hover glow, wallpaper options (including custom images you upload)
- **Taskbar + Start menu** with search, **Alt+Tab** switcher, **Run** dialog (Win+R), right-click context menus everywhere
- **Recycle Bin** with restore, per-file "deleted from" tracking

## Apps

| App | Highlights |
| --- | --- |
| File Explorer | Address bar breadcrumbs, back/forward, new folder, rename, copy/cut/paste, delete to trash, search |
| Notepad | Open/save via real file dialogs, "Don't save" confirmation |
| Command Prompt | ~30 commands: `dir`, `cd`, `copy`, `move`, `del`, `type`, `mkdir`, `tree`, `echo >`, `start`, `ping`, `ipconfig`, `tasklist`, tab completion, `help` pages |
| Calculator | Standard + scientific modes (sqrt, x², 1/x, n!, xʸ, trig), memory keys, keyboard input |
| Paint | Freehand/line/rect/ellipse tools, colors, brush sizes, save to filesystem |
| Settings | Wallpaper picker + custom upload, theme accent colors, user name, system info |
| Task Manager | Live process list from open windows, End Task, CPU/RAM meters |
| Media Player | Playlist UI with simulated playback |
| Internet Explorer | Retro browser chrome with a built-in "web" |
| Photo Viewer | Views images from the filesystem, "Set as desktop background" |
| Sticky Notes | Draggable notes, persisted |
| Recycle Bin | Restore or permanently delete trashed items |
| Minesweeper | Full game with flags and timer |
| Snake | Arrow-key snake with score |
| About | System info |

## Keyboard shortcuts

| Keys | Action |
| --- | --- |
| `Win/Cmd+S` | Start menu |
| `Win/Cmd+E` | File Explorer |
| `Win/Cmd+R` | Run dialog |
| `Win/Cmd+L` | Lock |
| `Win/Cmd+D` | Show desktop |
| `Win/Cmd+←/→/↑/↓` | Snap window |
| `Alt+Tab` | Switch windows (hold Alt, press Tab) |
| `Alt+F4` | Close focused window |

## Development

```bash
npm install
npm run dev       # dev server
npm run test      # vitest unit tests (fs, cmd, calc engines)
npm run lint      # eslint
npm run build     # production build to dist/
```

The kernel is pure and testable: `src/core/fs.js` (virtual FS), `src/core/cmd.js` (command engine), `src/core/calcEngine.js` (calculator state machine) — see `src/core/*.test.js`.

## Deployment

GitHub Pages deploys automatically on push to `main` via `.github/workflows/deploy.yml` (base path `/Windows-Simulator/`).

## Tech stack

React 19, Vite 7, Tailwind CSS 4, Vitest 3. No other runtime dependencies.
