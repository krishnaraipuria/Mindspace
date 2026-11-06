export default function CreateRoomForm({ busy }) {
  return (
    <>
      <p className="text-sm leading-relaxed text-muted">
        You become the host. Share the room ID and anyone can draw with you.
      </p>
      <button type="submit" disabled={busy} className="h-11 w-full rounded-xl bg-primary font-semibold text-white hover:bg-primary-dark disabled:opacity-60">
        {busy ? 'Creating…' : 'Create room'}
      </button>
    </>
  )
}
