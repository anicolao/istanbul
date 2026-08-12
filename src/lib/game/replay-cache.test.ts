import { describe, expect, it } from 'vitest';
import { mergeReplayEvents } from './replay-cache';
import { manifestVersions, reducerVersion, rulesEdition, schemaVersion, type CanonicalEvent } from './protocol';

const event = (id: string, createdAt: number | null): CanonicalEvent => ({ id, actorUid: id.split('-000')[0], clientSeq: id.slice(-6), createdAt, manifestVersions: { ...manifestVersions }, payload: {}, reducerVersion, rulesEdition, schemaVersion, type: 'turn/ended' });

describe('recovery merge', () => {
  it('keeps cached history, adds cursor events, and replaces pending timestamps', () => {
    expect(mergeReplayEvents([event('a-000001', 1), event('a-000002', null)], [event('a-000002', 2), event('b-000001', 3)]).map(({ id, createdAt }) => [id, createdAt])).toEqual([
      ['a-000001', 1], ['a-000002', 2], ['b-000001', 3]
    ]);
  });

  it('lets the authoritative cursor replace an optimistic same-ID payload', () => {
    const optimistic = event('a-000001', null);
    optimistic.payload = { choice: { wildGoods: [] } };
    const committed = event('a-000001', 1);
    committed.payload = { choice: { wildGoods: ['spice'] } };
    expect(mergeReplayEvents([optimistic], [committed])).toEqual([committed]);
  });
});
