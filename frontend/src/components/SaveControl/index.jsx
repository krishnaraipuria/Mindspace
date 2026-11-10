import { useRef, useState } from 'react'
import { useRoom } from '../../context/RoomContext'
import { useDismiss } from '../../hooks/useDismiss'
import { copyText } from '../../lib/utils'
import { CloudIcon, KeyIcon, CopyIcon } from '../icons'

// Host only: save the room (gets a key) or unsave it.
export default function SaveControl() {
  const { session, saveRoom, unsaveRoom, showToast } = useRoom()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const ref = useRef(null)
  useDismiss(ref, open, () => setOpen(false))

  const run = async (fn, after) => {
    setBusy(true)
    try { await fn(); after?.() } catch (e) { showToast(e.message, 'error') } finally { setBusy(false) }
  }

  const copyKey = async () =>
    showToast((await copyText(session.savedKey)) ? 'Key copied' : 'Could not copy the key', 'info')

  return (
    <div ref={ref} className="relative">
      {session.isSaved ? (
        <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex h-11 items-center gap-2 rounded-xl border border-mint/50 bg-mint/10 px-3 text-sm font-medium text-mint-dark hover:bg-mint/20">
          <KeyIcon /> <span className="hidden sm:inline">Saved</span>
        </button>
      ) : (
        <button type="button" disabled={busy} onClick={() => run(saveRoom, () => setOpen(true))} className="flex h-11 items-center gap-2 rounded-xl border border-line bg-white px-3 text-sm font-medium hover:bg-slate-50 disabled:opacity-60">
          <CloudIcon /> <span className="hidden sm:inline">{busy ? 'Saving…' : 'Save room'}</span>
        </button>
      )}

      {open && session.isSaved && (
        <div role="dialog" aria-label="Saved key" className="absolute top-full right-0 z-30 mt-2 w-72 rounded-xl border border-line bg-white p-4 shadow-pop">
          <p className="text-sm font-semibold">Saved key</p>
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-line bg-slate-50 py-1.5 pr-1.5 pl-3">
            <code className="min-w-0 flex-1 truncate font-mono text-sm">{session.savedKey || 'Not available after reload'}</code>
            {session.savedKey && (
              <button type="button" aria-label="Copy key" onClick={copyKey} className="grid size-8 place-items-center rounded-md hover:bg-slate-200"><CopyIcon /></button>
            )}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            The board stays available after everyone leaves. Only the host sees this key.
          </p>
          <button type="button" disabled={busy} onClick={() => run(unsaveRoom, () => setOpen(false))} className="mt-3 text-sm font-medium text-red-600 hover:underline disabled:opacity-60">
            {busy ? 'Working…' : 'Unsave room'}
          </button>
        </div>
      )}
    </div>
  )
}
