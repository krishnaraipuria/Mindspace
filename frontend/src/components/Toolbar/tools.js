import { PointerIcon, PenIcon, SquareIcon, CircleIcon, ArrowIcon, TextIcon, EraserIcon } from '../icons'

// Grouped like the design: a divider is drawn between groups.
export const TOOL_GROUPS = [
  [{ id: 'select', label: 'Select', key: 'v', Icon: PointerIcon }],
  [
    { id: 'pen', label: 'Pen', key: 'p', Icon: PenIcon },
    { id: 'rect', label: 'Rectangle', key: 'r', Icon: SquareIcon },
    { id: 'ellipse', label: 'Ellipse', key: 'o', Icon: CircleIcon },
    { id: 'arrow', label: 'Arrow', key: 'a', Icon: ArrowIcon },
    { id: 'text', label: 'Text', key: 't', Icon: TextIcon },
  ],
  [{ id: 'eraser', label: 'Eraser', key: 'e', Icon: EraserIcon }],
]

export const TOOL_KEYS = Object.fromEntries(TOOL_GROUPS.flat().map((t) => [t.key, t.id]))
