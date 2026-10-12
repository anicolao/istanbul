import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getStoredValue,
  removeStoredValue,
  resetVolatileStorageForTests,
  setStoredValue
} from './browser-storage';

describe('best-effort browser storage', () => {
  beforeEach(() => {
    localStorage.clear();
    resetVolatileStorageForTests();
  });

  afterEach(() => vi.restoreAllMocks());

  it('persists and removes values when localStorage is available', () => {
    expect(setStoredValue('istanbul:sequence:ROOM:user', '2')).toBe(true);
    expect(localStorage.getItem('istanbul:sequence:ROOM:user')).toBe('2');
    expect(getStoredValue('istanbul:sequence:ROOM:user')).toBe('2');

    removeStoredValue('istanbul:sequence:ROOM:user');
    expect(getStoredValue('istanbul:sequence:ROOM:user')).toBeNull();
  });

  it('keeps gameplay state in memory when every persistent write fails', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    });

    expect(setStoredValue('istanbul:pending:ROOM:user', '{"id":"event"}')).toBe(false);
    expect(getStoredValue('istanbul:pending:ROOM:user')).toBe('{"id":"event"}');
  });

  it('evicts replay caches before retrying a gameplay-critical write', () => {
    localStorage.setItem('istanbul:replay:1:OLD1', 'old');
    localStorage.setItem('istanbul:replay:1:OLD2', 'old');
    localStorage.setItem('another-app', 'untouched');
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (key.startsWith('istanbul:pending:') && localStorage.getItem('istanbul:replay:1:OLD1')) {
        throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      }
      originalSetItem.call(this, key, value);
    });

    expect(setStoredValue('istanbul:pending:ROOM:user', 'pending')).toBe(true);
    expect(localStorage.getItem('istanbul:pending:ROOM:user')).toBe('pending');
    expect(localStorage.getItem('istanbul:replay:1:OLD1')).toBeNull();
    expect(localStorage.getItem('istanbul:replay:1:OLD2')).toBeNull();
    expect(localStorage.getItem('another-app')).toBe('untouched');
  });
});
