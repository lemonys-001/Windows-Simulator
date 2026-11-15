// Pure command engine for the Command Prompt. Operates on the fs module.
import { fs } from './fs'

const HELP_PAGES = {
  1: `For more information on a specific command, type HELP command-name
CD       Displays or changes the current directory.
CLS      Clears the screen.
COPY     Copies one file to another location.
DATE     Displays the current date.
DEL      Deletes one or more files.
DIR      Displays a list of files and subdirectories.
ECHO     Displays messages.
EXIT     Closes the command prompt.`,
  2: `MKDIR    Creates a directory.
MOVE     Moves a file to another folder.
PING     Pings a host (simulated).
REN      Renames a file.
START    Starts a program (notepad, calc, paint, explorer, snake...).
TASKLIST Displays running applications.
TIME     Displays the current time.
TREE     Displays a folder structure graphically.
TYPE     Displays the contents of a text file.
VER      Displays the Windows version. WHOAMI, IPCONFIG also work.`,
}

const APP_ALIASES = {
  notepad: 'notepad', calc: 'calc', calculator: 'calc', paint: 'paint', mspaint: 'paint',
  explorer: 'explorer', cmd: 'cmd', snake: 'snake', minesweeper: 'mines', mines: 'mines',
  taskmgr: 'taskmgr', taskmanager: 'taskmgr', control: 'settings', settings: 'settings',
  mediaplayer: 'media', wmplayer: 'media', iexplore: 'browser', browser: 'browser',
  stickynotes: 'sticky', notes: 'sticky', tasklist: 'taskmgr',
}

export function runCommand(rawInput, { cwd, setCwd, dispatch, closeWindow, env }) {
  const input = String(rawInput).trim().replace(/^help-(\d+)$/i, 'help $1')
  const line = input.trim()
  const out = []
  const push = (s = '') => out.push(s)
  if (!line) return { output: [] }

  // support basic redirection for echo: echo hi > file.txt
  let redirect = null
  let m = line.match(/^(.*?)\s*>\s*(\S+)\s*$/)
  let work = line
  if (m && m[1].toLowerCase().startsWith('echo')) {
    work = m[1]
    redirect = resolvePath(cwd, m[2])
  }

  const [cmd, ...args] = work.split(/\s+/)
  const c = cmd.toLowerCase()
  const rest = args.join(' ')
  const capture = (s) => { redirect ? fs.writeFile(redirect, s) : push(s) }

  switch (c) {
    case 'help': {
      const page = args[0]
      if (page && /^-?\d+$/.test(page)) push(HELP_PAGES[parseInt(page)] || `Help page ${page} not found.`)
      else if (args[0]) push(`${args[0].toUpperCase()} is not supported in this simulation. Try HELP or HELP-2.`)
      else push(`For more information type HELP-1 or HELP-2.\nDIR CD CLS ECHO TYPE MKDIR RMDIR DEL COPY MOVE REN TREE\nVER DATE TIME WHOAMI IPCONFIG PING TASKLIST START EXIT COLOR TITLE`)
      break
    }
    case 'help-1': push(HELP_PAGES[1]); break
    case 'help-2': push(HELP_PAGES[2]); break
    case 'cls': return { output: [], clear: true }
    case 'echo': capture(rest); break
    case 'ver': push('Microsoft Windows [Version 6.1.7601] — Simulator Edition'); break
    case 'whoami': push('windows-sim\\administrator'); break
    case 'date': push('The current date is: ' + new Date().toLocaleDateString()); break
    case 'time': push('The current time is: ' + new Date().toLocaleTimeString()); break
    case 'cd': {
      if (!args[0]) { push(cwd); break }
      let target = args[0]
      if (target === '..') setCwd(parent(cwd))
      else if (target === '\\' || target === '/') setCwd('/')
      else {
        const p = resolvePath(cwd, target)
        const node = fs.get(p)
        if (node && node.type === 'dir') setCwd(p)
        else push('The system cannot find the path specified.')
      }
      break
    }
    case 'dir': {
      const p = args[0] ? resolvePath(cwd, args[0]) : cwd
      const node = fs.get(p)
      if (!node || node.type !== 'dir') { push('File Not Found'); break }
      push(` Directory of ${p}\n`)
      const items = fs.list(p)
      for (const n of items) {
        const d = new Date(n.modified)
        const stamp = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}  ${String(d.getHours() % 12 || 12).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
        if (n.type === 'dir') push(`${stamp}    <DIR>          ${n.name}`)
        else push(`${stamp}    ${String(n.content?.length || 0).padStart(14, ' ')} ${n.name}`)
      }
      const dirs = items.filter((n) => n.type === 'dir').length
      const files = items.length - dirs
      push(`\n      ${files} File(s)\n      ${dirs} Dir(s)   4,294,967,295 bytes free`)
      break
    }
    case 'type': {
      if (!args[0]) { push('Required parameter missing.'); break }
      const node = fs.get(resolvePath(cwd, args[0]))
      if (!node || node.type !== 'file') push('The system cannot find the file specified.')
      else if ((node.mime || '').startsWith('text') || /\.(txt|ini|md|log)$/i.test(node.name)) push(node.content || '(empty file)')
      else push(`Cannot display binary file "${node.name}".`)
      break
    }
    case 'mkdir': case 'md': {
      if (!args[0]) { push('Required parameter missing.'); break }
      const r = fs.mkdir(resolvePath(cwd, args[0]))
      if (r.error) push(r.error)
      break
    }
    case 'rmdir': case 'rd': {
      if (!args[0]) { push('Required parameter missing.'); break }
      const r = fs.deletePermanently(resolvePath(cwd, args[0]))
      if (r.error) push(r.error)
      break
    }
    case 'del': case 'erase': {
      if (!args[0]) { push('Required parameter missing.'); break }
      const r = fs.trash(resolvePath(cwd, args[0]))
      if (r.error) push(r.error)
      break
    }
    case 'copy': {
      const [a, b] = args
      if (!a || !b) { push('The syntax of the command is incorrect.'); break }
      const src = fs.get(resolvePath(cwd, a))
      if (!src || src.type !== 'file') { push('The system cannot find the file specified.'); break }
      let destPath = resolvePath(cwd, b)
      const destNode = fs.get(destPath)
      if (destNode?.type === 'dir') destPath = `${destPath}/${src.name}`
      const r = fs.writeFile(destPath, src.content, src.mime)
      if (r.error) push(r.error); else push('        1 file(s) copied.')
      break
    }
    case 'move': {
      const [a, b] = args
      if (!a || !b) { push('The syntax of the command is incorrect.'); break }
      const srcPath = resolvePath(cwd, a)
      const src = fs.get(srcPath)
      if (!src) { push('The system cannot find the file specified.'); break }
      let destPath = resolvePath(cwd, b)
      if (fs.isDir(destPath)) destPath = `${destPath}/${src.name}`
      const copy = fs.writeFile(destPath, src.content, src.mime)
      if (copy.error) { push(copy.error); break }
      fs.deletePermanently(srcPath)
      break
    }
    case 'ren': case 'rename': {
      const [a, b] = args
      if (!a || !b) { push('The syntax of the command is incorrect.'); break }
      const r = fs.rename(resolvePath(cwd, a), b)
      if (r.error) push(r.error)
      break
    }
    case 'tree': {
      const base = args[0] ? resolvePath(cwd, args[0]) : cwd
      const walk = (path, prefix = '') => {
        const items = fs.list(path)
        items.forEach((n, i) => {
          const last = i === items.length - 1
          push(`${prefix}${last ? '└──' : '├──'} ${n.name}`)
          if (n.type === 'dir') walk(`${path}/${n.name}`, prefix + (last ? '    ' : '│   '))
        })
      }
      push(base)
      walk(base)
      break
    }
    case 'tasklist': {
      push('Image name                   PID   Status')
      push('========================= ======= =========')
      const wins = env.windows || []
      wins.forEach((w, i) => push(`${(w.appId + '.exe').padEnd(25)} ${String(1000 + i * 4).padStart(7)} Running`))
      push('explorer.exe                728   Running')
      push('svchost.exe                 512   Running')
      break
    }
    case 'start': {
      const name = (args[0] || '').toLowerCase().replace('.exe', '')
      const appId = APP_ALIASES[name]
      if (appId) { dispatch({ type: 'OPEN_APP', appId }); break }
      if (args[0]) dispatch({ type: 'OPEN_APP', appId: 'notepad', props: { path: resolvePath(cwd, args[0]) } })
      break
    }
    case 'ping': {
      const host = args[0] || 'localhost'
      push(`Pinging ${host} with 32 bytes of data:`)
      for (let i = 0; i < 4; i++) push(`Reply from ${host}: bytes=32 time=${1 + Math.floor(Math.random() * 40)}ms TTL=118`)
      push(`\nPackets: Sent = 4, Received = 4, Lost = 0 (0% loss)`)
      break
    }
    case 'ipconfig': {
      push('Windows IP Configuration\n')
      push('Ethernet adapter Local Area Connection:')
      push('   IPv4 Address. . . . . . . . . . . : 192.168.1.42')
      push('   Subnet Mask . . . . . . . . . . . : 255.255.255.0')
      push('   Default Gateway . . . . . . . . . : 192.168.1.1')
      break
    }
    case 'color': {
      const map = { a: '#0f0', b: '#3ef7c9', c: '#f55', e: '#ff5', f: '#fff', '7': '#ddd' }
      if (args[0] && map[args[0][0]]) env.setColor?.(map[args[0][0]])
      break
    }
    case 'title': env.setTitle?.(rest || 'Command Prompt'); break
    case 'exit': closeWindow?.(); break
    default:
      push(`'${cmd}' is not recognized as an internal or external command,\noperable program or batch file.`)
  }
  return { output: out }
}

export function resolvePath(cwd, target) {
  target = String(target).replace(/\\/g, '/')
  if (/^[a-zA-Z]:\//.test(target)) return fs.normalize('/' + target.slice(2))
  if (target.startsWith('/')) return fs.normalize(target)
  return fs.normalize(`${cwd}/${target}`)
}

export function parent(p) {
  const i = p.lastIndexOf('/')
  return i <= 0 ? '/' : p.slice(0, i)
}

export function complete(cwd, fragment) {
  const dirPath = fragment.includes('/') ? resolvePath(cwd, parent(fragment)) : cwd
  const frag = fragment.split('/').pop().toLowerCase()
  const matches = fs.list(dirPath).filter((n) => n.name.toLowerCase().startsWith(frag))
  if (matches.length === 1) {
    const prefix = fragment.includes('/') ? fragment.slice(0, fragment.lastIndexOf('/') + 1) : ''
    return prefix + matches[0].name
  }
  return null
}
