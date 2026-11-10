const base = {
  width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
}
const make = (children) => (props) => <svg {...base} {...props}>{children}</svg>

export const PointerIcon = make(<path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z" />)
export const PenIcon = make(<><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /><path d="m15 5 4 4" /></>)
export const SquareIcon = make(<rect width="18" height="18" x="3" y="3" rx="2" />)
export const CircleIcon = make(<circle cx="12" cy="12" r="10" />)
export const ArrowIcon = make(<><path d="M13 5h6v6" /><path d="M19 5 5 19" /></>)
export const TextIcon = make(<><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" x2="15" y1="20" y2="20" /><line x1="12" x2="12" y1="4" y2="20" /></>)
export const EraserIcon = make(<><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" /><path d="M22 21H7" /><path d="m5 11 9 9" /></>)
export const UndoIcon = make(<><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></>)
export const RedoIcon = make(<><path d="m15 14 5-5-5-5" /><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" /></>)
export const CopyIcon = make(<><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></>)
export const CheckIcon = make(<path d="M20 6 9 17l-5-5" />)
export const BackIcon = make(<><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></>)
export const ShareIcon = make(<><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" /></>)
export const CloudIcon = make(<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />)
export const KeyIcon = make(<><path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4" /><path d="m21 2-9.6 9.6" /><circle cx="7.5" cy="15.5" r="5.5" /></>)
export const PlusIcon = make(<><path d="M5 12h14" /><path d="M12 5v14" /></>)
export const MinusIcon = make(<path d="M5 12h14" />)
export const HelpIcon = make(<><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></>)
export const FilledSquareIcon = make(<rect x="4" y="4" width="16" height="16" rx="3" fill="currentColor" />)
export const SketchIcon = make(<path d="M3 17c3-9 6-9 8-4s4 4 10-6" />)

export function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#4468d4" />
      <path d="M7 21c3-9 6-9 8-4s4 4 10-6" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
