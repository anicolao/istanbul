import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Firestore } from 'firebase/firestore';
import { resetVolatileStorageForTests } from '$lib/browser-storage';

const firestore = vi.hoisted(() => ({
  setDoc: vi.fn<() => Promise<void>>()
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({ kind: 'collection' })),
  doc: vi.fn(() => ({ kind: 'document' })),
  getDoc: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => ({ kind: 'server-timestamp' })),
  setDoc: firestore.setDoc
}));

import { createEventRepository } from './repository';

describe('event repository browser persistence', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    resetVolatileStorageForTests();
    firestore.setDoc.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  it('serializes overlapping writes instead of leaving a pending event', async () => {
    const repository = createEventRepository({} as Firestore, 'ROOM', 'player');
    const results = await Promise.all([repository.append('turn/moved', {}), repository.append('turn/ended', {}), repository.append('turn/moved', {})]);
    expect(results).toEqual(['player-000001', 'player-000002', 'player-000003']);
    expect(repository.pendingId()).toBeNull();
  });

  it('continues Firebase gameplay writes when localStorage rejects every write', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    });
    const repository = createEventRepository({} as Firestore, 'ROOM', 'player');

    await expect(repository.append('turn/ended', {})).resolves.toBe('player-000001');
    await expect(repository.append('turn/ended', {})).resolves.toBe('player-000002');
    expect(firestore.setDoc).toHaveBeenCalledTimes(2);
    expect(repository.pendingId()).toBeNull();
  });
});
