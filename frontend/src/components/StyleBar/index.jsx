import { useRoom } from '../../context/RoomContext'
import { FilledSquareIcon, SquareIcon, SketchIcon, UndoIcon, RedoIcon } from '../icons'

const COLORS = [
  ['Ink', '#1f2937'], ['Red', '#e5484d'], ['Orange', '#f0903c'], ['Yellow', '#e9b949'],
  ['Green', '#2e9e7e'], ['Blue', '#4468d4'], ['Purple', '#7a4bc8'],
]
const WIDTHS = [2, 4, 6, 10]

const Divider = () => <span aria-hidden="true" className="mx-1 h-6 w-px shrink-0 bg-white/15" />

const btn = (active) =>
  `grid size-9 shrink-0 place-items-center rounded-lg transition-colors ${active ? 'bg-mint text-tool' : 'text-white hover:bg-white/10'}`

export default function StyleBar({ tool, style, setStyle }) {
  const { undo, redo, canUndo, canRedo } = useRoom()
  const drawing = ['pen', 'rect', 'ellipse', 'arrow', 'text'].includes(tool)
  const closedShape = tool === 'rect' || tool === 'ellipse'
  const sketchable = closedShape || tool === 'arrow'
  const set = (patch) => setStyle((s) => ({ ...s, ...patch }))

  return (
    <div className="absolute bottom-4 left-1/2 z-10 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-2xl bg-tool p-1.5 shadow-pop sm:bottom-5">
      {drawing && (
        <>
          <div role="group" aria-label="Colour" className="flex items-center gap-1.5 px-1.5">
            {COLORS.map(([name, hex]) => (
              <button
                key={hex}
                type="button"
                title={name}
                aria-label={name}
                aria-pressed={style.color === hex}
                onClick={() => set({ color: hex })}
                style={{ backgroundColor: hex }}
                className={`size-6 shrink-0 rounded-full ring-offset-2 ring-offset-tool ${style.color === hex ? 'ring-2 ring-white' : 'ring-1 ring-white/30'}`}
              />
            ))}
          </div>
          <Divider />
          <div role="group" aria-label={tool === 'text' ? 'Text size' : 'Stroke width'} className="flex items-center gap-1">
            {WIDTHS.map((w) => (
              <button key={w} type="button" title={`${tool === 'text' ? 'Size' : 'Width'} ${w}`} aria-label={`${tool === 'text' ? 'Size' : 'Width'} ${w}`} aria-pressed={style.width === w} onClick={() => set({ width: w })} className={btn(style.width === w)}>
                <span className={`block rounded-full ${style.width === w ? 'bg-tool' : 'bg-white'}`} style={{ width: 16, height: w }} />
              </button>
            ))}
          </div>
        </>
      )}
      {closedShape && (
        <>
          <Divider />
          <button type="button" title="Outline" aria-label="Outline" aria-pressed={!style.fill} onClick={() => set({ fill: false })} className={btn(!style.fill)}><SquareIcon /></button>
          <button type="button" title="Filled" aria-label="Filled" aria-pressed={style.fill} onClick={() => set({ fill: true })} className={btn(style.fill)}><FilledSquareIcon /></button>
        </>
      )}
      {sketchable && (
        <>
          <Divider />
          <button type="button" title="Hand-drawn look" aria-label="Hand-drawn look" aria-pressed={style.sketchy} onClick={() => set({ sketchy: !style.sketchy })} className={btn(style.sketchy)}><SketchIcon /></button>
        </>
      )}
      {drawing && <Divider />}
      <button type="button" title="Undo (Ctrl+Z)" aria-label="Undo" disabled={!canUndo} onClick={undo} className={`${btn(false)} disabled:opacity-35 disabled:hover:bg-transparent`}><UndoIcon /></button>
      <button type="button" title="Redo (Ctrl+Shift+Z)" aria-label="Redo" disabled={!canRedo} onClick={redo} className={`${btn(false)} disabled:opacity-35 disabled:hover:bg-transparent`}><RedoIcon /></button>
    </div>
  )
}
