import { describe, expect, it } from 'vitest';
import { readLaunch, launchAction } from './launch';
import { isRoomCode, normalizeRoomCode, type RoomProjection } from './protocol';

const launch = { mode: 'create' as const, table: 'A1B2C3D4', name: 'Ada' };
const room: RoomProjection = { roomCode: launch.table, hostUid: 'host', status: 'lobby', maxPlayers: 5, mode: 'personal-screens', layout: 'short-path', seats: [{ uid: 'host', name: 'Ada', ready: false }] };

describe('Gameroom invitations', () => {
  it('reads the generic launch contract without trusting return URLs or names as identity', () => {
    expect(readLaunch('?table=a1b2c3d4&launch=create&name=%20Ada%20&returnTo=javascript:alert(1)')).toEqual(launch);
    expect(readLaunch('?room=BAZAR')).toBeNull();
    expect(launchAction({ ...launch, mode: 'join' }, room, 'another-ada')).toBe('join');
  });
  it.each(['?launch=bogus', '?launch=create&table=ABCDE&name=Ada', '?launch=join&table=A1B2C3D4', '?launch=create&table=../games&name=Ada', `?launch=create&table=A1B2C3D4&name=${'a'.repeat(25)}`])('rejects malformed invitations: %s', search => {
    expect(() => readLaunch(search)).toThrow();
  });
  it('waits for the host, resumes seated players, and never takes over an existing table', () => {
    expect(launchAction(launch, null, 'host')).toBe('create');
    expect(launchAction({ ...launch, mode: 'join' }, null, 'guest')).toBe('waiting');
    expect(launchAction(launch, room, 'host')).toBe('seated');
    expect(() => launchAction(launch, room, 'stranger')).toThrow('already exists');
    expect(() => launchAction({ ...launch, mode: 'join' }, { ...room, status: 'playing' }, 'guest')).toThrow('already started');
    expect(() => launchAction({ ...launch, mode: 'join' }, { ...room, maxPlayers: 1 }, 'guest')).toThrow('full');
  });
  it('preserves legacy and launcher codes without silently truncating invitations', () => {
    for (const code of ['BAZAR', 'A1B2C3D4']) expect(isRoomCode(code)).toBe(true);
    expect(normalizeRoomCode(' a1b2c3d4 ')).toBe('A1B2C3D4');
    for (const code of ['ABCDE1234', 'A1B2C3D!', '../ABCDE', 'ZZZZZZZZ']) expect(isRoomCode(normalizeRoomCode(code))).toBe(false);
  });
});
