import { useCallback, useEffect, useState } from 'react'
import { loadWorkspaceData, saveWorkspaceData } from '../services/auth'

export default function useWorkspaceCollection(key, initialValue) {
  const [data, setData] = useState(initialValue)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    loadWorkspaceData(key, initialValue)
      .then(value => { if (active) setData(value) })
      .catch(requestError => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [key, initialValue])

  const saveData = useCallback(async (next) => {
    setData(next)
    setError('')
    try { await saveWorkspaceData(key, next) }
    catch (requestError) { setError(requestError.message); return false }
    return true
  }, [key])

  return { data, setData, saveData, loading, error }
}
