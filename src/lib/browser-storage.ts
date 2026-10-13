const replayCachePrefix = 'istanbul:replay:';
const volatileStorage = new Map<string, string>();
const memoryOnlyKeys = new Set<string>();

function browserStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function removeReplayCaches(storage: Storage, retainedKey: string) {
  try {
    const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index))
      .filter((key): key is string => Boolean(key?.startsWith(replayCachePrefix) && key !== retainedKey));
    for (const key of keys) storage.removeItem(key);
  } catch {
    // Storage can be disabled entirely. The in-memory fallback remains available.
  }
}

export function getStoredValue(key: string): string | null {
  if (memoryOnlyKeys.has(key)) return volatileStorage.get(key) ?? null;
  try {
    const storage = browserStorage();
    return storage ? storage.getItem(key) : volatileStorage.get(key) ?? null;
  } catch {
    return volatileStorage.get(key) ?? null;
  }
}

export function setStoredValue(key: string, value: string): boolean {
  volatileStorage.set(key, value);
  memoryOnlyKeys.add(key);
  const storage = browserStorage();
  if (!storage) return false;

  try {
    storage.setItem(key, value);
    memoryOnlyKeys.delete(key);
    return true;
  } catch {
    removeReplayCaches(storage, key);
  }

  try {
    storage.setItem(key, value);
    memoryOnlyKeys.delete(key);
    return true;
  } catch {
    if (key.startsWith(replayCachePrefix)) {
      try {
        storage.removeItem(key);
        storage.setItem(key, value);
        memoryOnlyKeys.delete(key);
        return true;
      } catch {
        // The latest value is still available in memory for this session.
      }
    }
    return false;
  }
}

export function removeStoredValue(key: string) {
  volatileStorage.delete(key);
  memoryOnlyKeys.add(key);
  try {
    browserStorage()?.removeItem(key);
    memoryOnlyKeys.delete(key);
  } catch {
    // Persistent storage is optional; removing the in-memory value is sufficient.
  }
}

export function resetVolatileStorageForTests() {
  volatileStorage.clear();
  memoryOnlyKeys.clear();
}
