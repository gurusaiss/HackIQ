import { initializeApp, getApps } from 'firebase/app'
import {
  getFirestore, doc, getDoc, setDoc, collection,
  getDocs, updateDoc, deleteDoc, query, orderBy,
} from 'firebase/firestore'

const USER_ID = 'local-user'
const LS_PROFILE = 'ciq_profile'
const LS_SAVED = 'ciq_saved'

function lsGet(key) { try { return JSON.parse(localStorage.getItem(key)) } catch { return null } }
function lsSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)) } catch {} }

let _db = null
function getDb() {
  if (_db) return _db
  if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) return null
  const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      })
  _db = getFirestore(app)
  return _db
}

export async function getProfile() {
  const db = getDb()
  if (db) {
    const snap = await getDoc(doc(db, 'profiles', USER_ID))
    return snap.exists() ? snap.data() : null
  }
  return lsGet(LS_PROFILE)
}

export async function saveProfile(profile) {
  const payload = { ...profile, id: USER_ID, updated_at: new Date().toISOString() }
  const db = getDb()
  if (db) {
    await setDoc(doc(db, 'profiles', USER_ID), payload)
    return payload
  }
  lsSet(LS_PROFILE, payload)
  return payload
}

export async function getSavedCompetitions() {
  const db = getDb()
  if (db) {
    const snap = await getDocs(query(collection(db, 'saved_competitions'), orderBy('saved_at', 'desc')))
    return snap.docs.map(d => ({ ...d.data(), id: d.id }))
  }
  return lsGet(LS_SAVED) || []
}

export async function saveCompetition(competitionData) {
  const id = competitionData.id || (Date.now().toString(36) + Math.random().toString(36).slice(2))
  const item = {
    competition_data: competitionData,
    status: 'Bookmarked',
    saved_at: new Date().toISOString(),
  }
  const db = getDb()
  if (db) {
    await setDoc(doc(db, 'saved_competitions', id), item)
    return { id, ...item }
  }
  const existing = lsGet(LS_SAVED) || []
  lsSet(LS_SAVED, [{ id, ...item }, ...existing])
  return { id, ...item }
}

export async function updateCompetitionStatus(id, status) {
  const db = getDb()
  if (db) {
    await updateDoc(doc(db, 'saved_competitions', id), { status })
    return
  }
  const existing = lsGet(LS_SAVED) || []
  lsSet(LS_SAVED, existing.map(c => c.id === id ? { ...c, status } : c))
}

export async function removeCompetition(id) {
  const db = getDb()
  if (db) {
    await deleteDoc(doc(db, 'saved_competitions', id))
    return
  }
  const existing = lsGet(LS_SAVED) || []
  lsSet(LS_SAVED, existing.filter(c => c.id !== id))
}
