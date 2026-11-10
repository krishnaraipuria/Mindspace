import { useEffect } from 'react'

/** Calls onDismiss on outside pointer press or Escape while `active`. */
export function useDismiss(ref, active, onDismiss) {
  useEffect(() => {
    if (!active) return
    const down = (e) => { if (!ref.current?.contains(e.target)) onDismiss() }
    const key = (e) => { if (e.key === 'Escape') onDismiss() }
    document.addEventListener('pointerdown', down)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('pointerdown', down)
      document.removeEventListener('keydown', key)
    }
  }, [ref, active, onDismiss])
}
