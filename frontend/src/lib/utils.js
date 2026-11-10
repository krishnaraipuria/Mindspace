export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok
    } catch {
      return false
    }
  }
}

const AVATAR_COLORS = ['#3f63c7', '#2e9e7e', '#d9731f', '#7a4bc8', '#d23a45', '#1f8aa6', '#b03f86', '#6b7d1f']

export function colorForName(name = '') {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

export const initials = (name = '') => (name.trim()[0] || '?').toUpperCase()
