import type { RoomProjection } from './protocol';

// Mobile/background tabs have a grace period; an explicit departure is immediate.
export const presenceLifetimeMs = 90_000;
export function rematchSeats(room: RoomProjection, epoch: number, now: number, requesterUid?: string) {
  return room.seats.filter(seat => {
    if (seat.left) return false;
    if (seat.bot || seat.uid === requesterUid) return true;
    const presence = room.presence?.[seat.uid];
    return presence?.epoch === epoch && presence.at >= now - presenceLifetimeMs;
  });
}
