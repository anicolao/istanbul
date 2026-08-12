import { canonicalSort, isCanonicalEvent, type CanonicalEvent } from './protocol';

const cacheVersion = 1;

interface ReplayCache {
  version: number;
  events: CanonicalEvent[];
}

function cacheKey(roomCode: string) {
  return `istanbul:replay:${cacheVersion}:${roomCode}`;
}

export function readReplayCache(roomCode: string): CanonicalEvent[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(cacheKey(roomCode)) ?? 'null') as ReplayCache | null;
    if (!parsed || parsed.version !== cacheVersion || !Array.isArray(parsed.events)) return [];
    return canonicalSort(parsed.events.filter(isCanonicalEvent));
  } catch {
    return [];
  }
}

export function writeReplayCache(roomCode: string, events: CanonicalEvent[]) {
  const committed = canonicalSort(events.filter((event) => event.createdAt !== null));
  localStorage.setItem(cacheKey(roomCode), JSON.stringify({ version: cacheVersion, events: committed }));
}
