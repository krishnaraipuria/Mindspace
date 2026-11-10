// Drawing, bounds and hit-testing helpers. All coordinates are world coordinates.
const FONT = '"Inter", system-ui, sans-serif'
const LINE_HEIGHT = 1.3

export const uid = () =>
  globalThis.crypto?.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)

export const fontSizeFor = (strokeWidth) => 14 + strokeWidth * 3
export const round = (n) => Math.round(n * 10) / 10

/* rough.js drawables are expensive to build; elements never change, so cache by id */
const cache = new Map()
export function pruneCache(liveIds) {
  for (const id of cache.keys()) if (!liveIds.has(id)) cache.delete(id)
}

function roughOpts(el) {
  return {
    stroke: el.color,
    strokeWidth: el.width,
    roughness: el.sketchy ? 1.6 : 0,
    bowing: el.sketchy ? 1.2 : 0,
    seed: el.seed || 1,
    fill: el.fill ? `${el.color}33` : undefined,
    fillStyle: 'solid',
  }
}

function build(gen, el) {
  const o = roughOpts(el)
  const lineOpts = { ...o, fill: undefined }
  if (el.type === 'rect') return [gen.rectangle(el.x, el.y, el.w, el.h, o)]
  if (el.type === 'ellipse') return [gen.ellipse(el.x + el.w / 2, el.y + el.h / 2, el.w, el.h, o)]
  if (el.type === 'arrow') {
    const { x1, y1, x2, y2 } = el
    const a = Math.atan2(y2 - y1, x2 - x1)
    const L = Math.max(14, el.width * 4.5)
    const head = (s) => gen.line(x2, y2, x2 - L * Math.cos(a + s), y2 - L * Math.sin(a + s), lineOpts)
    return [gen.line(x1, y1, x2, y2, lineOpts), head(Math.PI / 7), head(-Math.PI / 7)]
  }
  return []
}

function drawPen(ctx, el) {
  const pts = el.points
  if (!pts?.length) return
  ctx.save()
  ctx.strokeStyle = ctx.fillStyle = el.color
  ctx.lineWidth = el.width
  ctx.lineCap = ctx.lineJoin = 'round'
  if (pts.length === 1) {
    ctx.beginPath()
    ctx.arc(pts[0][0], pts[0][1], el.width / 2, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.beginPath()
    ctx.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length - 1; i++) {
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2)
    }
    const last = pts[pts.length - 1]
    ctx.lineTo(last[0], last[1])
    ctx.stroke()
  }
  ctx.restore()
}

function drawText(ctx, el) {
  ctx.save()
  ctx.fillStyle = el.color
  ctx.font = `${el.fontSize}px ${FONT}`
  ctx.textBaseline = 'top'
  String(el.text).split('\n').forEach((line, i) => ctx.fillText(line, el.x, el.y + i * el.fontSize * LINE_HEIGHT))
  ctx.restore()
}

export function drawElement(ctx, rc, el, cached = true) {
  if (el.type === 'pen') return drawPen(ctx, el)
  if (el.type === 'text') return drawText(ctx, el)
  let drawables = cached ? cache.get(el.elementId) : null
  if (!drawables) {
    drawables = build(rc.generator, el)
    if (cached) cache.set(el.elementId, drawables)
  }
  drawables.forEach((d) => rc.draw(d))
}

/* ---------- bounds ---------- */

const measureCtx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null

export function getBounds(el) {
  if (el.type === 'pen') {
    const xs = el.points.map((p) => p[0])
    const ys = el.points.map((p) => p[1])
    const pad = el.width / 2
    return { x: Math.min(...xs) - pad, y: Math.min(...ys) - pad, w: Math.max(...xs) - Math.min(...xs) + el.width, h: Math.max(...ys) - Math.min(...ys) + el.width }
  }
  if (el.type === 'arrow') {
    return { x: Math.min(el.x1, el.x2), y: Math.min(el.y1, el.y2), w: Math.abs(el.x2 - el.x1), h: Math.abs(el.y2 - el.y1) }
  }
  if (el.type === 'text') {
    measureCtx.font = `${el.fontSize}px ${FONT}`
    const lines = String(el.text).split('\n')
    return { x: el.x, y: el.y, w: Math.max(...lines.map((l) => measureCtx.measureText(l).width)), h: lines.length * el.fontSize * LINE_HEIGHT }
  }
  return { x: el.x, y: el.y, w: el.w, h: el.h }
}

/* ---------- hit testing ---------- */

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len2 = dx * dx + dy * dy
  const t = len2 ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2)) : 0
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

function hit(el, px, py, tol) {
  const reach = (el.width || 0) / 2 + tol
  switch (el.type) {
    case 'pen': {
      const p = el.points
      if (p.length === 1) return Math.hypot(px - p[0][0], py - p[0][1]) <= reach
      for (let i = 0; i < p.length - 1; i++) {
        if (distToSegment(px, py, p[i][0], p[i][1], p[i + 1][0], p[i + 1][1]) <= reach) return true
      }
      return false
    }
    case 'arrow':
      return distToSegment(px, py, el.x1, el.y1, el.x2, el.y2) <= reach
    case 'rect': {
      const { x, y, w, h } = el
      if (el.fill && px >= x - tol && px <= x + w + tol && py >= y - tol && py <= y + h + tol) return true
      return (
        distToSegment(px, py, x, y, x + w, y) <= reach ||
        distToSegment(px, py, x + w, y, x + w, y + h) <= reach ||
        distToSegment(px, py, x + w, y + h, x, y + h) <= reach ||
        distToSegment(px, py, x, y + h, x, y) <= reach
      )
    }
    case 'ellipse': {
      const rx = Math.max(el.w / 2, 1)
      const ry = Math.max(el.h / 2, 1)
      const r = Math.hypot((px - (el.x + rx)) / rx, (py - (el.y + ry)) / ry)
      const t = reach / Math.min(rx, ry)
      return el.fill ? r <= 1 + t : Math.abs(r - 1) <= t
    }
    case 'text': {
      const b = getBounds(el)
      return px >= b.x - tol && px <= b.x + b.w + tol && py >= b.y - tol && py <= b.y + b.h + tol
    }
    default:
      return false
  }
}

export function hitTopmost(elements, px, py, tol) {
  for (let i = elements.length - 1; i >= 0; i--) if (hit(elements[i], px, py, tol)) return elements[i]
  return null
}
