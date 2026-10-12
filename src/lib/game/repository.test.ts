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
