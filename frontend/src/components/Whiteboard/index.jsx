import { useCallback, useEffect, useRef, useState } from 'react'
import rough from 'roughjs'
import { useRoom } from '../../context/RoomContext'
import { TOOL_KEYS } from '../Toolbar/tools'
import { MinusIcon, PlusIcon, HelpIcon } from '../icons'
import { drawElement, getBounds, hitTopmost, pruneCache, uid, fontSizeFor, round } from './draw'

const MIN_K = 0.1
const MAX_K = 4
const DRAFT_INTERVAL = 50
const MAX_DRAFT_POINTS = 600
const EDGE_PAN = 44
const EDGE_PAN_SPEED = 12

const CURSORS = { select: 'default', pen: 'crosshair', rect: 'crosshair', ellipse: 'crosshair', arrow: 'crosshair', text: 'text', eraser: 'cell' }

export default function Whiteboard({ tool, setTool, style }) {
  const { session, elements, drafts, addElement, removeElement, sendDraft, undo, redo } = useRoom()

  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const rcRef = useRef(null)
  const rafRef = useRef(0)
  const viewRef = useRef({ x: 0, y: 0, k: 1 })
  const gestureRef = useRef(null)
  const localDraftRef = useRef(null)
  const erasedRef = useRef(new Set())
  const spaceRef = useRef(false)
  const lastDraftSent = useRef(0)

  // Latest props/state for event handlers that must not be re-created.
  const elementsRef = useRef(elements)
  elementsRef.current = elements
  const draftsRef = useRef(drafts)
  draftsRef.current = drafts
  const toolRef = useRef(tool)
  toolRef.current = tool
  const styleRef = useRef(style)
  styleRef.current = style
  const usernameRef = useRef(session?.username)
  usernameRef.current = session?.username

  const [zoom, setZoom] = useState(100)
  const [selectedId, setSelectedId] = useState(null)
  const selectedRef = useRef(null)
  selectedRef.current = selectedId
  const [textBox, setTextBox] = useState(null)
  const [showHelp, setShowHelp] = useState(false)

  /* ---------- rendering ---------- */

  const render = useCallback(() => {
    rafRef.current = 0
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    const rc = rcRef.current
    if (!canvas || !rc) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const { x, y, k } = viewRef.current

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * x, dpr * y)

    const list = elementsRef.current
    const ids = new Set(list.map((e) => e.elementId))
    list.forEach((el) => drawElement(ctx, rc, el, true))
    Object.values(draftsRef.current).forEach(({ el }) => {
      if (!ids.has(el.elementId)) drawElement(ctx, rc, el, false)
    })
    if (localDraftRef.current) drawElement(ctx, rc, localDraftRef.current, false)

    const sel = selectedRef.current && list.find((e) => e.elementId === selectedRef.current)
    if (sel) {
      const b = getBounds(sel)
      const pad = 6 / k
      ctx.save()
      ctx.strokeStyle = '#4468d4'
      ctx.lineWidth = 1.5 / k
      ctx.setLineDash([6 / k, 4 / k])
      ctx.strokeRect(b.x - pad, b.y - pad, b.w + pad * 2, b.h + pad * 2)
      ctx.restore()
    }

    let grid = 24 * k
    while (grid < 12) grid *= 2
    wrap.style.backgroundSize = `${grid}px ${grid}px`
    wrap.style.backgroundPosition = `${x}px ${y}px`
  }, [])

  const requestRender = useCallback(() => {
    if (!rafRef.current) rafRef.current = requestAnimationFrame(render)
  }, [render])

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    rcRef.current = rough.canvas(canvas)
    const fit = () => {
      const r = wrap.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.max(1, Math.round(r.width * dpr))
      canvas.height = Math.max(1, Math.round(r.height * dpr))
      canvas.style.width = `${r.width}px`
      canvas.style.height = `${r.height}px`
      requestRender()
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(wrap)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
  }, [requestRender])

  useEffect(() => {
    pruneCache(new Set(elements.map((e) => e.elementId)))
  }, [elements])

  useEffect(() => { requestRender() }, [elements, drafts, selectedId, requestRender])

  /* ---------- cursor ---------- */

  const updateCursor = useCallback(() => {
    const c = canvasRef.current
    if (!c) return
    if (gestureRef.current?.mode === 'pan') c.style.cursor = 'grabbing'
    else if (spaceRef.current) c.style.cursor = 'grab'
    else c.style.cursor = CURSORS[toolRef.current] || 'default'
  }, [])
  useEffect(() => { updateCursor() }, [tool, updateCursor])

  /* ---------- zoom / pan ---------- */

  const zoomAt = useCallback(
    (sx, sy, factor) => {
      const v = viewRef.current
      const k = Math.min(MAX_K, Math.max(MIN_K, v.k * factor))
      const r = k / v.k
      v.x = sx - (sx - v.x) * r
      v.y = sy - (sy - v.y) * r
      v.k = k
      setZoom(Math.round(k * 100))
      requestRender()
    },
    [requestRender],
  )

  const zoomCenter = (factor) => {
    const r = wrapRef.current.getBoundingClientRect()
    zoomAt(r.width / 2, r.height / 2, factor)
  }

  const resetZoom = () => {
    const r = wrapRef.current.getBoundingClientRect()
    zoomAt(r.width / 2, r.height / 2, 1 / viewRef.current.k)
  }

  useEffect(() => {
    const el = wrapRef.current
    const onWheel = (e) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      if (e.ctrlKey || e.metaKey) {
        zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0125))
      } else {
        viewRef.current.x -= e.deltaX
        viewRef.current.y -= e.deltaY
        requestRender()
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoomAt, requestRender])

  /* ---------- keyboard ---------- */

  useEffect(() => {
    const onKeyDown = (e) => {
      const t = e.target
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return
      const mod = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()
      if (mod && key === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return }
      if (mod && key === 'y') { e.preventDefault(); redo(); return }
      if (mod || e.altKey) return
      if (e.code === 'Space' && t.tagName !== 'BUTTON') { e.preventDefault(); spaceRef.current = true; updateCursor(); return }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedRef.current) {
        e.preventDefault()
        removeElement(selectedRef.current)
        setSelectedId(null)
        return
      }
      if (e.key === 'Escape') { setSelectedId(null); return }
      if (TOOL_KEYS[key]) setTool(TOOL_KEYS[key])
    }
    const onKeyUp = (e) => {
      if (e.code === 'Space') { spaceRef.current = false; updateCursor() }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [undo, redo, removeElement, setTool, updateCursor])

  /* ---------- pointer handling ---------- */

  const toLocal = (e) => {
    const r = canvasRef.current.getBoundingClientRect()
    return { sx: e.clientX - r.left, sy: e.clientY - r.top }
  }
  const toWorld = (sx, sy) => {
    const { x, y, k } = viewRef.current
    return { wx: (sx - x) / k, wy: (sy - y) / k }
  }

  const baseElement = (type) => {
    const s = styleRef.current
    return {
      elementId: uid(),
      type,
      author: usernameRef.current,
      color: s.color,
      width: s.width,
      fill: (type === 'rect' || type === 'ellipse') && !!s.fill,
      sketchy: type !== 'pen' && type !== 'text' && !!s.sketchy,
      seed: Math.floor(Math.random() * 2 ** 31),
      createdAt: Date.now(),
    }
  }

  const eraseAt = (wx, wy) => {
    const pool = elementsRef.current.filter((e) => !erasedRef.current.has(e.elementId))
    const target = hitTopmost(pool, wx, wy, 8 / viewRef.current.k)
    if (target) {
      erasedRef.current.add(target.elementId)
      removeElement(target.elementId)
    }
  }

  const broadcastDraft = (d) => {
    const now = performance.now()
    if (now - lastDraftSent.current < DRAFT_INTERVAL) return
    if (d.type === 'pen' && d.points.length > MAX_DRAFT_POINTS) return
    lastDraftSent.current = now
    sendDraft(d)
  }

  const onPointerDown = (e) => {
    if (e.button !== 0 && e.button !== 1) return
    const { sx, sy } = toLocal(e)
    const { wx, wy } = toWorld(sx, sy)
    e.currentTarget.setPointerCapture(e.pointerId)
    const t = toolRef.current

    if (e.button === 1 || spaceRef.current) {
      gestureRef.current = { mode: 'pan', lx: sx, ly: sy }
      updateCursor()
      return
    }
    if (t === 'select') {
      const found = hitTopmost(elementsRef.current, wx, wy, 6 / viewRef.current.k)
      if (found) {
        setSelectedId(found.elementId)
        gestureRef.current = null
      } else {
        setSelectedId(null)
        gestureRef.current = { mode: 'pan', lx: sx, ly: sy }
        updateCursor()
      }
      return
    }
    if (t === 'text') { gestureRef.current = { mode: 'text', wx, wy }; return }
    if (t === 'eraser') {
      erasedRef.current = new Set()
      gestureRef.current = { mode: 'erase' }
      eraseAt(wx, wy)
      return
    }
    if (t === 'pen') {
      localDraftRef.current = { ...baseElement('pen'), points: [[round(wx), round(wy)]] }
      gestureRef.current = { mode: 'draw' }
    } else if (t === 'rect' || t === 'ellipse') {
      localDraftRef.current = { ...baseElement(t), x: wx, y: wy, w: 0, h: 0 }
      gestureRef.current = { mode: 'draw', ox: wx, oy: wy }
    } else if (t === 'arrow') {
      localDraftRef.current = { ...baseElement('arrow'), x1: wx, y1: wy, x2: wx, y2: wy }
      gestureRef.current = { mode: 'draw' }
    }
    requestRender()
  }

  const onPointerMove = (e) => {
    const g = gestureRef.current
    if (!g) return
    let { sx, sy } = toLocal(e)
    if (g.mode === 'draw') {
      const bounds = wrapRef.current.getBoundingClientRect()
      if (sx < EDGE_PAN) viewRef.current.x += EDGE_PAN_SPEED
      if (sx > bounds.width - EDGE_PAN) viewRef.current.x -= EDGE_PAN_SPEED
      if (sy < EDGE_PAN) viewRef.current.y += EDGE_PAN_SPEED
      if (sy > bounds.height - EDGE_PAN) viewRef.current.y -= EDGE_PAN_SPEED
      requestRender()
    }
    const { wx, wy } = toWorld(sx, sy)
    if (g.mode === 'pan') {
      viewRef.current.x += sx - g.lx
      viewRef.current.y += sy - g.ly
      g.lx = sx
      g.ly = sy
      requestRender()
      return
    }
    if (g.mode === 'erase') { eraseAt(wx, wy); return }
    const d = localDraftRef.current
    if (g.mode !== 'draw' || !d) return
    if (d.type === 'pen') {
      const last = d.points[d.points.length - 1]
      if (Math.hypot(wx - last[0], wy - last[1]) >= 1.5 / viewRef.current.k) d.points.push([round(wx), round(wy)])
    } else if (d.type === 'arrow') {
      d.x2 = wx
      d.y2 = wy
    } else {
      d.x = Math.min(g.ox, wx)
      d.y = Math.min(g.oy, wy)
      d.w = Math.abs(wx - g.ox)
      d.h = Math.abs(wy - g.oy)
    }
    broadcastDraft(d)
    requestRender()
  }

  const finishGesture = (commit) => {
    const g = gestureRef.current
    gestureRef.current = null
    updateCursor()
    if (!g) return
    if (g.mode === 'text') { if (commit) setTextBox({ wx: g.wx, wy: g.wy, ...viewRef.current }); return }
    if (g.mode !== 'draw') return

    const d = localDraftRef.current
    localDraftRef.current = null
    const k = viewRef.current.k
    if (commit && d) {
      let ok = true
      if (d.type === 'rect' || d.type === 'ellipse') {
        ok = Math.max(d.w, d.h) * k >= 4
        Object.assign(d, { x: round(d.x), y: round(d.y), w: round(d.w), h: round(d.h) })
      } else if (d.type === 'arrow') {
        ok = Math.hypot(d.x2 - d.x1, d.y2 - d.y1) * k >= 6
        Object.assign(d, { x1: round(d.x1), y1: round(d.y1), x2: round(d.x2), y2: round(d.y2) })
      }
      if (ok) addElement(d)
    }
    requestRender()
  }

  const commitText = (value) => {
    const s = styleRef.current
    addElement({
      ...baseElement('text'),
      x: round(textBox.wx),
      y: round(textBox.wy),
      text: value.slice(0, 500),
      fontSize: fontSizeFor(s.width),
    })
    setTextBox(null)
  }

  /* ---------- view ---------- */

  return (
    <div ref={wrapRef} className="dot-grid relative h-full w-full touch-none overflow-auto select-none">
      <canvas
        ref={canvasRef}
        aria-label="Whiteboard"
        className="absolute top-0 left-0 block touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => finishGesture(true)}
        onPointerCancel={() => finishGesture(false)}
      />

      {textBox && (
        <TextEditor
          key={`${textBox.wx}:${textBox.wy}`}
          box={textBox}
          color={style.color}
          fontSize={fontSizeFor(style.width)}
          onCommit={commitText}
          onCancel={() => setTextBox(null)}
        />
      )}

      <div className="absolute right-3 bottom-20 z-10 flex items-center gap-2 sm:right-5 sm:bottom-5">
        <div className="flex items-center rounded-xl border border-line bg-white p-1 shadow-pop">
          <button type="button" aria-label="Zoom out" onClick={() => zoomCenter(1 / 1.2)} className="grid size-9 place-items-center rounded-lg text-ink hover:bg-slate-100">
            <MinusIcon />
          </button>
          <button type="button" aria-label="Reset zoom to 100%" onClick={resetZoom} className="w-14 text-center text-sm font-medium tabular-nums hover:text-primary">
            {zoom}%
          </button>
          <button type="button" aria-label="Zoom in" onClick={() => zoomCenter(1.2)} className="grid size-9 place-items-center rounded-lg text-ink hover:bg-slate-100">
            <PlusIcon />
          </button>
        </div>
        <div className="relative">
          <button type="button" aria-label="Keyboard shortcuts" aria-expanded={showHelp} onClick={() => setShowHelp((v) => !v)} className="grid size-11 place-items-center rounded-xl border border-line bg-white shadow-pop hover:text-primary">
            <HelpIcon />
          </button>
          {showHelp && (
            <div role="dialog" aria-label="Shortcuts" className="absolute right-0 bottom-full mb-2 w-64 rounded-xl border border-line bg-white p-3 text-sm shadow-pop">
              <ul className="space-y-1.5 text-muted">
                <li><b className="font-medium text-ink">Pan</b> hold Space and drag</li>
                <li><b className="font-medium text-ink">Zoom</b> Ctrl / ⌘ + scroll</li>
                <li><b className="font-medium text-ink">Undo</b> Ctrl / ⌘ + Z</li>
                <li><b className="font-medium text-ink">Delete</b> select a shape, press Delete</li>
                <li><b className="font-medium text-ink">Tools</b> V P R O A T E</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TextEditor({ box, color, fontSize, onCommit, onCancel }) {
  const ref = useRef(null)
  const doneRef = useRef(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => ref.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [])

  const finish = (commit) => {
    if (doneRef.current) return
    doneRef.current = true
    const value = ref.current?.value.trim()
    if (commit && value) onCommit(value)
    else onCancel()
  }

  const autosize = (e) => {
    const el = e.target
    el.style.width = '0'
    el.style.width = `${Math.max(96, el.scrollWidth + 6)}px`
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  return (
    <textarea
      ref={ref}
      rows={1}
      wrap="off"
      aria-label="Text"
      placeholder="Type…"
      onInput={autosize}
      onBlur={() => finish(true)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') { e.preventDefault(); finish(false) }
        else if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); finish(true) }
      }}
      style={{
        left: box.wx * box.k + box.x,
        top: box.wy * box.k + box.y,
        color,
        fontSize: fontSize * box.k,
        lineHeight: 1.3,
        width: 96,
      }}
      className="absolute z-10 resize-none overflow-hidden rounded-sm border border-dashed border-primary bg-white/80 p-0 font-sans outline-none"
    />
  )
}
