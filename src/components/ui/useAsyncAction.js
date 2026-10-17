import { useCallback, useRef, useState } from 'react'

export function useAsyncAction() {
  const pendingRef = useRef(false)
  const [pending, setPending] = useState(false)

  const run = useCallback(async (task) => {
    if (pendingRef.current) return
    pendingRef.current = true
    setPending(true)
    try {
      await task()
    } finally {
      pendingRef.current = false
      setPending(false)
    }
  }, [])

  return [pending, run]
}
