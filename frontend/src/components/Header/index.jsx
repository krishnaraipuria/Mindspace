import { useNavigate } from 'react-router-dom'
import { useRoom } from '../../context/RoomContext'
import { copyText } from '../../lib/utils'
import UsersBar from '../UsersBar'
import SaveControl from '../SaveControl'
import { BackIcon, CloudIcon, CopyIcon, ShareIcon } from '../icons'

export default function Header() {
  const { session, members, status, isHost, leaveRoom, showToast } = useRoom()
  const navigate = useNavigate()

  const back = () => {
    const alone = members.length <= 1
    if (alone && !session.isSaved && !window.confirm('You are the only one here and this room is not saved. Leaving deletes the board. Leave anyway?')) return
    leaveRoom()
    navigate('/')
  }

  const copy = async (text, ok) => showToast((await copyText(text)) ? ok : 'Could not copy', 'info')

  const offline = status !== 'connected'
  const sub = offline ? 'Reconnecting…' : session.isSaved ? 'Saved' : 'Not saved'

  return (
    <header className="relative z-20 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-white px-3 sm:px-5">
      <button type="button" aria-label="Leave room" title="Leave room" onClick={back} className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-slate-50 hover:bg-slate-100">
        <BackIcon />
      </button>

      <div className="min-w-0">
        <div className="flex items-center gap-1">
          <h1 className="truncate text-[15px] font-semibold">
            Room <span className="font-mono">{session.roomId}</span>
          </h1>
          <button type="button" aria-label="Copy room ID" title="Copy room ID" onClick={() => copy(session.roomId, 'Room ID copied')} className="grid size-7 place-items-center rounded-md text-muted hover:bg-slate-100 hover:text-ink">
            <CopyIcon width={16} height={16} />
          </button>
        </div>
        <p className={`flex items-center gap-1 text-xs ${offline ? 'text-amber-600' : 'text-muted'}`}>
          <CloudIcon width={14} height={14} className={session.isSaved && !offline ? 'text-mint-dark' : ''} />
          {sub}
          {isHost && !offline && <span> · You are the host</span>}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <UsersBar />
        {isHost && <SaveControl />}
        <button
          type="button"
          onClick={() => copy(`${location.origin}/?room=${session.roomId}`, 'Invite link copied')}
          className="flex h-11 items-center gap-2 rounded-xl bg-primary px-3 text-sm font-semibold text-white hover:bg-primary-dark sm:px-5"
        >
          <span className="hidden sm:inline">Share</span> <ShareIcon width={16} height={16} />
        </button>
      </div>
    </header>
  )
}
