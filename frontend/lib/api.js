import { API_BASE } from './config'


export async function request(method,path,{body, socketId, ownershipToken}={}){
  const headers = { 'Content-Type': 'application/json', 'socket-id': socketId || '' }
  if (ownershipToken) headers['ownership-token'] = ownershipToken

  let res
  try {
    res = await fetch(`${API_BASE}${path}`, { method, headers, body: JSON.stringify(body || {}) })
  } catch {
    throw new Error('Cannot reach the server. Please check your internet connection or try again later.')
  }
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) {
    const err = new Error(json?.message || `Request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return json.data
}