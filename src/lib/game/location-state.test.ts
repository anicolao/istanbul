import { describe, expect, it } from 'vitest';
import { createSetup } from './setup';
import { locationStateSummary } from './location-state';
import type { RoomProjection } from './protocol';

const room: RoomProjection = {
  roomCode: 'STATE', hostUid: 'ada', status: 'lobby', maxPlayers: 2,
  layout: 'short-path', mode: 'shared-table', seats: [
    { uid: 'ada', name: 'Ada', ready: true },
    { uid: 'bora', name: 'Bora', ready: true }
  ]
};

describe('location state summaries', () => {
  it('gives every Place a distinct, non-empty board summary', () => {
    const game = createSetup(room, 'location-state');
    const summaries = Array.from({ length: 16 }, (_, index) => locationStateSummary(game, index + 1));
    expect(summaries.every((summary) => summary.length > 12)).toBe(true);
    expect(new Set(summaries)).toHaveLength(16);
  });

  it('projects mutable mail, card, demand, mosque, family, and ruby state', () => {
    const game = createSetup(room, 'location-state');
    game.postOfficeLower = [true, false, true, false];
    game.bonusDiscard.push(game.bonusDrawPile.shift()!);
    game.players[game.turnSeat].assistantsByPlace[2] = 2;
    game.players[game.turnSeat].familyPlace = 8;
    game.rubyTracks.gemstonePrice = 19;

    expect(locationStateSummary(game, 5)).toContain('1 spice, 2 Lira, 1 fruit, 2 Lira');
    expect(locationStateSummary(game, 6)).toMatch(/\d+ Bonus cards in draw pile; 1 in discard, topped by/);
    expect(locationStateSummary(game, 7)).toContain('recall 2 assistants');
    expect(locationStateSummary(game, 10)).toMatch(/Current Large Market demand: .+, .+, .+, .+, .+/);
    expect(locationStateSummary(game, 12)).toContain('Place 8');
    expect(locationStateSummary(game, 14)).toMatch(/required, pay 1; .*required, pay 1; 2 ruby rewards remain/);
    expect(locationStateSummary(game, 16)).toContain('19 Lira');
  });
});
