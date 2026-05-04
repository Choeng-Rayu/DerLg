import { openDB } from 'idb'

const DB_NAME = 'derlg-offline'
const STORE_NAME = 'queue'

export async function getOfflineDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
        })
      }
    },
  })
}

export async function enqueueOfflineAction(action: Record<string, unknown>) {
  const db = await getOfflineDb()
  await db.put(STORE_NAME, {
    ...action,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  })
}

export async function listOfflineActions() {
  const db = await getOfflineDb()
  return db.getAll(STORE_NAME)
}

export async function clearOfflineActions() {
  const db = await getOfflineDb()
  await db.clear(STORE_NAME)
}
