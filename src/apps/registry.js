// App registry: metadata only. Components load lazily so the shell boots fast.
export const APPS = {
  explorer: {
    id: 'explorer', name: 'Windows Explorer', icon: 'folder', pinned: true,
    size: { w: 820, h: 540 }, min: { w: 480, h: 320 },
    load: () => import('./Explorer.jsx'),
  },
  notepad: {
    id: 'notepad', name: 'Notepad', icon: 'notepad', pinned: true,
    size: { w: 640, h: 480 }, min: { w: 320, h: 220 },
    load: () => import('./Notepad.jsx'),
  },
  cmd: {
    id: 'cmd', name: 'Command Prompt', icon: 'cmd',
    size: { w: 680, h: 420 }, min: { w: 380, h: 200 },
    load: () => import('./CommandPrompt.jsx'),
  },
  calc: {
    id: 'calc', name: 'Calculator', icon: 'calc', singleton: true,
    size: { w: 340, h: 500 }, min: { w: 280, h: 380 },
    load: () => import('./Calculator.jsx'),
  },
  paint: {
    id: 'paint', name: 'Paint', icon: 'paint',
    size: { w: 860, h: 600 }, min: { w: 560, h: 420 },
    load: () => import('./Paint.jsx'),
  },
  settings: {
    id: 'settings', name: 'Control Panel', icon: 'settings', singleton: true,
    size: { w: 780, h: 540 }, min: { w: 480, h: 340 },
    load: () => import('./Settings.jsx'),
  },
  taskmgr: {
    id: 'taskmgr', name: 'Task Manager', icon: 'chart', singleton: true,
    size: { w: 560, h: 460 }, min: { w: 420, h: 320 },
    load: () => import('./TaskManager.jsx'),
  },
  media: {
    id: 'media', name: 'Media Player', icon: 'media', pinned: true,
    size: { w: 720, h: 500 }, min: { w: 420, h: 320 },
    load: () => import('./MediaPlayer.jsx'),
  },
  browser: {
    id: 'browser', name: 'Internet Explorer', icon: 'ie', pinned: true,
    size: { w: 900, h: 600 }, min: { w: 420, h: 320 },
    load: () => import('./Browser.jsx'),
  },
  snake: {
    id: 'snake', name: 'Snake', icon: 'game',
    size: { w: 520, h: 580 }, min: { w: 480, h: 540 },
    load: () => import('./Snake.jsx'),
  },
  mines: {
    id: 'mines', name: 'Minesweeper', icon: 'bomb',
    size: { w: 420, h: 500 }, min: { w: 380, h: 460 },
    load: () => import('./Minesweeper.jsx'),
  },
  photo: {
    id: 'photo', name: 'Photo Viewer', icon: 'image',
    size: { w: 760, h: 560 }, min: { w: 400, h: 300 },
    load: () => import('./PhotoViewer.jsx'),
  },
  sticky: {
    id: 'sticky', name: 'Sticky Notes', icon: 'note',
    size: { w: 420, h: 480 }, min: { w: 300, h: 300 },
    load: () => import('./StickyNotes.jsx'),
  },
  recyclebin: {
    id: 'recyclebin', name: 'Recycle Bin', icon: 'recycle', singleton: true,
    size: { w: 680, h: 440 }, min: { w: 400, h: 300 },
    load: () => import('./RecycleBin.jsx'),
  },
  about: {
    id: 'about', name: 'About Windows', icon: 'info', singleton: true,
    size: { w: 500, h: 400 }, min: { w: 400, h: 340 },
    load: () => import('./About.jsx'),
  },
}

export const appById = (id) => APPS[id]
export const appList = Object.values(APPS)
