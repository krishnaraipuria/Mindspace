import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { socket } from '../lib/socket'
import { request } from '../lib/api'

const RoomContext = createContext(null)

export function useRoom() {
  const ctx = useContext(RoomContext)
  if (!ctx) throw new Error('useRoom must be used inside <RoomProvider>')
  return ctx
}

const USERNAME_KEY = 'mindspace:username'
const tokenKey = (roomId) => `mindspace:owner:${roomId}`
const lsGet = (k) => { try { return localStorage.getItem(k) } catch { return null } }
const lsSet = (k, v) => { try { localStorage.setItem(k, v) } catch { /* storage unavailable */ } }
const lsRemove = (k) => { try { localStorage.removeItem(k) } catch { /* storage unavailable */ } }
const ssGet = (k) => { try { return sessionStorage.getItem(k) } catch { return null } }
const ssSet = (k, v) => { try { sessionStorage.setItem(k, v) } catch { /* storage unavailable */ } }
const ownerToken = (roomId) => {
  const key = tokenKey(roomId)
  const current = ssGet(key)
  if (current) return current
  const legacy = lsGet(key)
  if (legacy) {
    ssSet(key, legacy)
    lsRemove(key)
  }
  return legacy
}

export const getSavedUsername = () => lsGet(USERNAME_KEY) || ''

const MAX_HISTORY = 100
const DRAFT_TTL = 2500

const normalizeMember = (m) => ({
  id: m.id || m._id || m.socketId,
  socketId: m.socketId,
  username: m.username,
  role: m.role,
})

const ackEmit = (event, payload) =>
  new Promise((resolve) => {
    socket.timeout(8000).emit(event, payload, (err, res) =>
      resolve(err ? { success: false, message: 'The server did not respond.' } : res),
    )
  })

export function RoomProvider({ children }) {
  const [status, setStatus] = useState(socket.connected ? 'connected' : 'connecting')
  const [session, setSession] = useState(null) // { roomId, username, role, isSaved, savedKey }
  const [members, setMembers] = useState([])
  const [elements, setElements] = useState([])
  const [drafts, setDrafts] = useState({}) // in-progress strokes from other people
  const [toast, setToast] = useState(null)
  const [, setHistoryTick] = useState(0)

  const sessionRef = useRef(null)
  const sessionSocketRef = useRef(null)
  const elementsRef = useRef([])
  elementsRef.current = elements
  const undoRef = useRef([])
  const redoRef = useRef([])
  const inflightRef = useRef(null)
  const toastTimer = useRef(null)

  const bumpHistory = useCallback(() => setHistoryTick((t) => t + 1), [])
  const resetHistory = useCallback(() => {
    undoRef.current = []
    redoRef.current = []
    setHistoryTick((t) => t + 1)
  }, [])

  const showToast = useCallback((message, tone = 'info') => {
    clearTimeout(toastTimer.current)
    setToast({ message, tone, id: Date.now() })
    toastTimer.current = setTimeout(() => setToast(null), 2800)
  }, [])

  const waitConnected = useCallback(
    () =>
      new Promise((resolve, reject) => {
        if (socket.connected) return resolve()
        if (!socket.active) socket.connect()
        const onConnect = () => { clearTimeout(timer); resolve() }
        const timer = setTimeout(() => {
          socket.off('connect', onConnect)
          reject(new Error('Cannot reach the server. Check that the backend is running.'))
        }, 8000)
        socket.once('connect', onConnect)
      }),
    [],
  )

  /* ---------- joining / creating ---------- */

  const joinCore = useCallback(
    async (username, roomIdOrKey, { keepHistory = false } = {}) => {
      await waitConnected()
      const data = await request('POST', '/join-room', {
        body: { username, roomId: roomIdOrKey },
        socketId: socket.id,
        // Present only on the browser that created the room -> backend makes us host again.
        ownershipToken: ownerToken(roomIdOrKey),
      })
      // Backend returns { room, Admin } for the host and { room, member } for everyone else.
      const room = data.room
      const me = data.Admin || data.member
      const role = me?.role === 'admin' ? 'admin' : 'member'

      sessionRef.current = { roomId: room.roomId, username }
      sessionSocketRef.current = socket.id
      setSession({
        roomId: room.roomId,
        username,
        role,
        isSaved: !!room.isSaved,
        savedKey: role === 'admin' ? room.savedKey || null : null,
      })
      setElements(Array.isArray(room.elements) ? room.elements : [])
      setDrafts({})
      setMembers((prev) =>
        prev.length ? prev : [{ id: me?._id || socket.id, socketId: socket.id, username, role }],
      )
      if (!keepHistory) resetHistory()
      lsSet(USERNAME_KEY, username)
      return room.roomId
    },
    [waitConnected, resetHistory],
  )

  const createCore = useCallback(
    async (username) => {
      await waitConnected()
      const data = await request('POST', '/create-room', { body: { username }, socketId: socket.id })
      ssSet(tokenKey(data.roomId), data.ownershipToken)

      sessionRef.current = { roomId: data.roomId, username }
      sessionSocketRef.current = socket.id
      setSession({ roomId: data.roomId, username, role: 'admin', isSaved: false, savedKey: null })
      setElements([])
      setDrafts({})
      setMembers((prev) =>
        prev.length ? prev : [{ id: socket.id, socketId: socket.id, username, role: 'admin' }],
      )
      resetHistory()
      lsSet(USERNAME_KEY, username)
      return data.roomId
    },
    [waitConnected, resetHistory],
  )

  // Ignore duplicate calls while one is running (double click, React StrictMode).
  const runOnce = useCallback((fn) => {
    if (inflightRef.current) return inflightRef.current
    const p = Promise.resolve().then(fn).finally(() => { inflightRef.current = null })
    inflightRef.current = p
    return p
  }, [])

  const leaveRoom = useCallback(() => {
    if (!sessionRef.current) return
    sessionRef.current = null
    sessionSocketRef.current = null
    setSession(null)
    setMembers([])
    setElements([])
    setDrafts({})
    resetHistory()
    // The backend removes a member when their socket disconnects.
    socket.disconnect()
    socket.connect()
  }, [resetHistory])

  const createRoom = useCallback((username) => runOnce(() => createCore(username)), [runOnce, createCore])
  const joinRoom = useCallback(
    (username, roomIdOrKey) => runOnce(() => joinCore(username, roomIdOrKey)),
    [runOnce, joinCore],
  )

  // Used when /room/:id is opened directly (refresh, shared link).
  const resumeRoom = useCallback(
    (roomId) =>
      runOnce(async () => {
        const current = sessionRef.current
        if (current?.roomId === roomId) return roomId
        const name = lsGet(USERNAME_KEY)
        if (!name) throw new Error('Enter your name to join this room.')
        if (current) leaveRoom()
        return joinCore(name, roomId)
      }),
    [runOnce, joinCore, leaveRoom],
  )

  /* ---------- socket listeners ---------- */

  useEffect(() => {
    setStatus(socket.connected ? 'connected' : 'connecting')

    const rejoin = async (s) => {
      try {
        await joinCore(s.username, s.roomId, { keepHistory: true })
        showToast('Reconnected')
      } catch {
        sessionRef.current = null
        setSession(null)
        setMembers([])
        setElements([])
        showToast('This room closed while you were offline.', 'error')
      }
    }

    const onConnect = () => {
      setStatus('connected')
      const s = sessionRef.current
      // New socket id while we think we're in a room -> the server forgot us. Rejoin.
      if (s && sessionSocketRef.current !== socket.id) rejoin(s)
    }
    const onDown = () => setStatus('disconnected')
    const onAdded = (el) => {
      if (!el?.elementId) return
      setElements((prev) => (prev.some((e) => e.elementId === el.elementId) ? prev : [...prev, el]))
      setDrafts((prev) => {
        if (!(el.elementId in prev)) return prev
        const { [el.elementId]: _gone, ...rest } = prev
        return rest
      })
    }
    const onRemoved = (payload) => {
      const id = typeof payload === 'string' ? payload : payload?.elementId
      if (id) setElements((prev) => prev.filter((e) => e.elementId !== id))
    }
    const onMembers = (list) => setMembers(Array.isArray(list) ? list.map(normalizeMember) : [])
    const onSaveState = (p) =>
      setSession((cur) => (cur ? { ...cur, isSaved: !!p?.isSaved, savedKey: p?.isSaved ? cur.savedKey : null } : cur))
    const onDraft = (el) => {
      if (!el?.elementId) return
      setDrafts((prev) => ({ ...prev, [el.elementId]: { el, ts: Date.now() } }))
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDown)
    socket.on('connect_error', onDown)
    socket.on('elementAdded', onAdded)
    socket.on('elementRemoved', onRemoved)
    socket.on('room:members', onMembers)
    socket.on('room:saveState', onSaveState)
    socket.on('board:draft', onDraft)

    const sweep = setInterval(() => {
      setDrafts((prev) => {
        const now = Date.now()
        const keys = Object.keys(prev)
        const alive = keys.filter((k) => now - prev[k].ts < DRAFT_TTL)
        if (alive.length === keys.length) return prev
        return Object.fromEntries(alive.map((k) => [k, prev[k]]))
      })
    }, 1000)

    return () => {
      clearInterval(sweep)
      socket.off('connect', onConnect)
      socket.off('disconnect', onDown)
      socket.off('connect_error', onDown)
      socket.off('elementAdded', onAdded)
      socket.off('elementRemoved', onRemoved)
      socket.off('room:members', onMembers)
      socket.off('room:saveState', onSaveState)
      socket.off('board:draft', onDraft)
    }
  }, [joinCore, showToast])

  /* ---------- board actions ---------- */

  const pushHistory = useCallback(
    (op) => {
      undoRef.current.push(op)
      if (undoRef.current.length > MAX_HISTORY) undoRef.current.shift()
      redoRef.current = []
      bumpHistory()
    },
    [bumpHistory],
  )
  const dropHistory = useCallback(
    (id) => {
      undoRef.current = undoRef.current.filter((o) => o.el.elementId !== id)
      bumpHistory()
    },
    [bumpHistory],
  )

  const addElement = useCallback(
    async (el, { record = true } = {}) => {
      const s = sessionRef.current
      if (!s) return
      elementsRef.current = [...elementsRef.current, el]
      setElements((prev) => (prev.some((e) => e.elementId === el.elementId) ? prev : [...prev, el]))
      if (record) pushHistory({ kind: 'add', el })
      const res = await ackEmit('board:element:add', { roomId: s.roomId, element: el })
      if (!res?.success) {
        elementsRef.current = elementsRef.current.filter((e) => e.elementId !== el.elementId)
        setElements((prev) => prev.filter((e) => e.elementId !== el.elementId))
        dropHistory(el.elementId)
        showToast(res?.message || 'Could not save that change.', 'error')
      }
    },
    [pushHistory, dropHistory, showToast],
  )

  const removeElement = useCallback(
    async (id, { record = true } = {}) => {
      const s = sessionRef.current
      const el = elementsRef.current.find((e) => e.elementId === id)
      if (!s || !el) return
      elementsRef.current = elementsRef.current.filter((e) => e.elementId !== id)
      setElements((prev) => prev.filter((e) => e.elementId !== id))
      if (record) pushHistory({ kind: 'remove', el })
      const res = await ackEmit('board:element:remove', { roomId: s.roomId, element: { elementId: id } })
      if (!res?.success) {
        elementsRef.current = [...elementsRef.current, el]
        setElements((prev) => [...prev, el])
        dropHistory(id)
        showToast(res?.message || 'Could not erase that.', 'error')
      }
    },
    [pushHistory, dropHistory, showToast],
  )

  const applyOp = useCallback(
    (op, reverse) => {
      const shouldAdd = (op.kind === 'add') !== reverse
      return shouldAdd
        ? addElement(op.el, { record: false })
        : removeElement(op.el.elementId, { record: false })
    },
    [addElement, removeElement],
  )

  const undo = useCallback(() => {
    const op = undoRef.current.pop()
    if (!op) return
    redoRef.current.push(op)
    bumpHistory()
    applyOp(op, true)
  }, [applyOp, bumpHistory])

  const redo = useCallback(() => {
    const op = redoRef.current.pop()
    if (!op) return
    undoRef.current.push(op)
    bumpHistory()
    applyOp(op, false)
  }, [applyOp, bumpHistory])

  // Live preview of a stroke while it is being drawn (needs the optional `board:draft` relay).
  const sendDraft = useCallback((element) => {
    const s = sessionRef.current
    if (s) socket.volatile.emit('board:draft', { roomId: s.roomId, element })
  }, [])

  /* ---------- host actions ---------- */

  const saveRoom = useCallback(async () => {
    const s = sessionRef.current
    const token = s && ownerToken(s.roomId)
    if (!token) throw new Error('Only the host can save this room.')
    const data = await request('PATCH', '/save-room', {
      body: { roomId: s.roomId },
      socketId: socket.id,
      ownershipToken: token,
    })
    setSession((cur) => cur && { ...cur, isSaved: true, savedKey: data.savedKey })
    return data.savedKey
  }, [])

  const unsaveRoom = useCallback(async () => {
    const s = sessionRef.current
    const token = s && ownerToken(s.roomId)
    if (!token) throw new Error('Only the host can change this.')
    await request('DELETE', '/delete-room', {
      body: { roomId: s.roomId },
      socketId: socket.id,
      ownershipToken: token,
    })
    setSession((cur) => cur && { ...cur, isSaved: false, savedKey: null })
  }, [])

  const value = {
    status,
    session,
    isHost: session?.role === 'admin',
    members,
    elements,
    drafts,
    toast,
    showToast,
    createRoom,
    joinRoom,
    resumeRoom,
    leaveRoom,
    addElement,
    removeElement,
    sendDraft,
    undo,
    redo,
    canUndo: undoRef.current.length > 0,
    canRedo: redoRef.current.length > 0,
    saveRoom,
    unsaveRoom,
  }

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>
}
