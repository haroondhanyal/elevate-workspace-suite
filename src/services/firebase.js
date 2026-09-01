import { getApp, getApps, initializeApp } from 'firebase/app'
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage'
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean)
const app = hasFirebaseConfig ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null
const storage = app ? getStorage(app) : null
const firestore = app ? getFirestore(app) : null
const erpApiUrl = import.meta.env.VITE_ERP_API_URL?.replace(/\/$/, '')

export async function uploadVideoToStorage(file) {
  if (!storage) return null
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
  const fileRef = ref(storage, `rh98/videos/${Date.now()}-${safeName}`)
  const snapshot = await uploadBytes(fileRef, file, { contentType: file.type })
  return getDownloadURL(snapshot.ref)
}

export const isFirebaseConfigured = hasFirebaseConfig

async function requestErpApi(path, options = {}) {
  const response = await fetch(`${erpApiUrl}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}))
    const error = new Error(detail.detail || `ERP API request failed (${response.status})`)
    error.status = response.status
    throw error
  }
  return response.json()
}

// ERP data uses Firestore when Firebase environment variables are configured.
// Local storage keeps the app usable during development before Firebase is connected.
export async function loadErpData(key, fallback) {
  try {
    if (erpApiUrl) {
      try {
        const record = await requestErpApi(`/data/${encodeURIComponent(key)}`)
        return record.value
      } catch (error) {
        if (error.status !== 404) throw error
        return fallback
      }
    }
    if (firestore) {
      const snapshot = await getDoc(doc(firestore, 'erpData', key))
      return snapshot.exists() ? snapshot.data().value : fallback
    }
    const saved = localStorage.getItem(`elevate-erp-${key}`)
    return saved ? JSON.parse(saved) : fallback
  } catch (error) {
    console.warn(`Unable to load ERP data: ${key}`, error)
    return fallback
  }
}

export async function saveErpData(key, value) {
  try {
    if (erpApiUrl) {
      await requestErpApi(`/data/${encodeURIComponent(key)}`, {
        method: 'PUT',
        body: JSON.stringify({ value, actor: 'Raja Haroon' }),
      })
      return 'api'
    }
    if (firestore) {
      await setDoc(doc(firestore, 'erpData', key), { value, updatedAt: new Date().toISOString() })
      return 'firebase'
    }
    localStorage.setItem(`elevate-erp-${key}`, JSON.stringify(value))
    return 'local'
  } catch (error) {
    console.warn(`Unable to save ERP data: ${key}`, error)
    throw error
  }
}
