import { io } from 'socket.io-client'
import { API_URL } from './config'

// One socket for the whole app. The backend ties every room member to a socket id,
// so leaving a room = disconnect + reconnect (new id).
export const socket = io(API_URL, { autoConnect: true })
