// Promise-based modal dialogs (confirm / prompt), rendered by DialogHost.
let current = null
const listeners = new Set()

function ask(kind, { title = '', message = '', value = '', okText = 'OK', cancelText = 'Cancel' } = {}) {
  return new Promise((resolve) => {
    current = { kind, title, message, value, okText, cancelText, resolve }
    listeners.forEach((l) => l())
  })
}

export const dialog = {
  confirm: (opts) => ask('confirm', opts),
  prompt: (opts) => ask('prompt', opts),
  close(result) {
    const c = current
    current = null
    listeners.forEach((l) => l())
    c?.resolve(result)
  },
  subscribe(l) { listeners.add(l); return () => listeners.delete(l) },
  getSnapshot() { return current },
}
