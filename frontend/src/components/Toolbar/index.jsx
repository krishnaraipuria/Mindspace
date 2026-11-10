import { TOOL_GROUPS } from './tools'

export default function Toolbar({ tool, setTool }) {
  return (
    <nav aria-label="Drawing tools" className="absolute top-1/2 left-3 z-10 flex -translate-y-1/2 flex-col rounded-2xl bg-tool p-1.5 shadow-pop sm:left-5">
      {TOOL_GROUPS.map((group, gi) => (
        <div key={gi} className={`flex flex-col gap-1 ${gi > 0 ? 'mt-1.5 border-t border-white/15 pt-1.5' : ''}`}>
          {group.map(({ id, label, key, Icon }) => (
            <button
              key={id}
              type="button"
              title={`${label} (${key.toUpperCase()})`}
              aria-label={label}
              aria-pressed={tool === id}
              onClick={() => setTool(id)}
              className={`grid size-10 place-items-center rounded-xl transition-colors ${
                tool === id ? 'bg-mint text-tool' : 'text-white hover:bg-white/10'
              }`}
            >
              <Icon />
            </button>
          ))}
        </div>
      ))}
    </nav>
  )
}
