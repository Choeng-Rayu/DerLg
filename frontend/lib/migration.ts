export const STORAGE_SCHEMA_VERSION = 1

export function migrateStoredState<T extends Record<string, unknown>>(state: T) {
  return {
    __version: STORAGE_SCHEMA_VERSION,
    ...state,
  }
}
