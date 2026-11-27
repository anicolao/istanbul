import type { RoomProjection } from './protocol';

export interface GameLaunch { mode: 'create' | 'join'; table: string; name: string }

/** Launcher names are preferences; only Firebase Auth can identify a seat. */
export function readLaunch(search: string): GameLaunch | null {
  const params = new URLSearchParams(search);
  const mode = params.get('launch');
  if (mode === null) return null;
  if (mode !== 'create' && mode !== 'join') throw new Error('This invitation needs a create or join instruction.');
  const table = (params.get('table') ?? '').toUpperCase();
  const name = (params.get('name') ?? '').trim();
  if (!/^[A-F0-9]{8}$/.test(table)) throw new Error('This invitation needs an eight-character table code.');
  if (!name || name.length > 24) throw new Error('This invitation needs a merchant name of up to 24 characters.');
  return { mode, table, name };
}

export function launchAction(launch: GameLaunch, room: RoomProjection | null, uid: string): 'create' | 'join' | 'waiting' | 'seated' {
  if (room?.seats.some(seat => seat.uid === uid && !seat.left)) return 'seated';
  if (launch.mode === 'create') {
    if (room) throw new Error('This table already exists. Start a new table in Gameroom.');
    return 'create';
  }
  if (!room) return 'waiting';
  if (room.status !== 'lobby') throw new Error('This game has already started. Ask your friends to invite you to the next game.');
  if (room.tabletopOwned) throw new Error('Join this tabletop using its seat invitation.');
  if (room.seats.length >= room.maxPlayers) throw new Error('This table is full.');
  if (room.seats.some(seat => seat.uid === uid)) throw new Error('You have already left this table. Start a new table in Gameroom.');
  return 'join';
}
