import { canonicalSort, isCanonicalEvent, type CanonicalEvent } from './protocol';

const cacheVersion = 1;

interface ReplayCache {
  version: number;
  events: CanonicalEvent[];
}

export function replayCacheKey(roomCode: string) {
  return `istanbul:replay:${cacheVersion}:${roomCode}`;
}

export function readReplayCache(roomCode: string): CanonicalEvent[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(replayCacheKey(roomCode)) ?? 'null') as ReplayCache | null;
    if (!parsed || parsed.version !== cacheVersion || !Array.isArray(parsed.events)) return [];
    return canonicalSort(parsed.events.filter(isCanonicalEvent));
  } catch {
    return [];
  }
}

export function writeReplayCache(roomCode: string, events: CanonicalEvent[]) {
  const committed = canonicalSort(events.filter((event) => event.createdAt !== null));
  localStorage.setItem(replayCacheKey(roomCode), JSON.stringify({ version: cacheVersion, events: committed }));
}

export function mergeReplayEvents(...sources: CanonicalEvent[][]): CanonicalEvent[] {
  const remoteById = new Map(sources.at(-1)?.map((event) => [event.id, event]) ?? []);
  const merged = new Map<string, CanonicalEvent>();
  for (const event of sources.slice(0, -1).flat()) if (!remoteById.has(event.id)) merged.set(event.id, event);
  for (const event of remoteById.values()) merged.set(event.id, event);
  return canonicalSort([...merged.values()]);
}
