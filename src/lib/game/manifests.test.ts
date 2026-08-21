import { describe, expect, it } from 'vitest';
import { bonusCards, demandTiles, mosqueTiles, places, printedLayouts } from './manifests';
import { createRandom } from './random';
import { createBoard, createSetup } from './setup';
import type { RoomProjection } from './protocol';

const room = (count: number): RoomProjection => ({
  roomCode: 'BAZAR', hostUid: 'p1', status: 'lobby', maxPlayers: count,
  layout: 'short-path', mode: 'personal-screens',
  seats: Array.from({ length: count }, (_, index) => ({ uid: `p${index + 1}`, name: `Player ${index + 1}`, ready: true }))
});

describe('base-game manifests and setup', () => {
  it('contains every stable finite component instance', () => {
    expect(places.map(({ id }) => id)).toEqual(Array.from({ length: 16 }, (_, index) => index + 1));
    expect(new Set(bonusCards.map(({ id }) => id)).size).toBe(26);
    expect(new Set(mosqueTiles.map(({ id }) => id)).size).toBe(16);
    expect(new Set(demandTiles.map(({ id }) => id)).size).toBe(12);
    expect(Object.values(printedLayouts).every((layout) => new Set(layout).size === 16)).toBe(true);
  });

  it('transcribes all six printed demand faces for each market', () => {
    expect(demandTiles.map(({ id, market, goods }) => ({ id, market, goods }))).toEqual([
      { id: 'demand-large-1', market: 'large', goods: ['jewelry', 'jewelry', 'jewelry', 'fabric', 'fruit'] },
      { id: 'demand-large-2', market: 'large', goods: ['fruit', 'jewelry', 'jewelry', 'fabric', 'fabric'] },
      { id: 'demand-large-3', market: 'large', goods: ['spice', 'jewelry', 'jewelry', 'fabric', 'fabric'] },
      { id: 'demand-large-4', market: 'large', goods: ['fabric', 'jewelry', 'jewelry', 'spice', 'fruit'] },
      { id: 'demand-large-5', market: 'large', goods: ['fabric', 'fabric', 'fabric', 'jewelry', 'jewelry'] },
      { id: 'demand-large-6', market: 'large', goods: ['jewelry', 'jewelry', 'jewelry', 'fabric', 'spice'] },
      { id: 'demand-small-1', market: 'small', goods: ['jewelry', 'fabric', 'spice', 'fruit', 'fruit'] },
      { id: 'demand-small-2', market: 'small', goods: ['fruit', 'fruit', 'fruit', 'fabric', 'spice'] },
      { id: 'demand-small-3', market: 'small', goods: ['spice', 'spice', 'spice', 'fabric', 'fruit'] },
      { id: 'demand-small-4', market: 'small', goods: ['jewelry', 'fruit', 'fruit', 'spice', 'spice'] },
      { id: 'demand-small-5', market: 'small', goods: ['fabric', 'fruit', 'fruit', 'spice', 'spice'] },
      { id: 'demand-small-6', market: 'small', goods: ['jewelry', 'fabric', 'fruit', 'spice', 'spice'] }
    ]);
  });

  it.each([2, 3, 4, 5])('conserves setup components for %i players', (count) => {
    const setup = createSetup(room(count), 'component-conservation-seed');
    expect(setup.players).toHaveLength(count);
    expect(setup.players.flatMap(({ bonusHand }) => bonusHand)).toHaveLength(count);
    expect(setup.bonusDrawPile).toHaveLength(26 - count);
    expect(setup.largeDemand).toHaveLength(6);
    expect(new Set(setup.largeDemand).size).toBe(6);
    expect(setup.smallDemand).toHaveLength(6);
    expect(new Set(setup.smallDemand).size).toBe(6);
    expect(setup.players.every(({ assistantsCarried, assistantsInSupply }) => assistantsCarried + assistantsInSupply === 5)).toBe(true);
    expect(setup.neutralMerchants).toHaveLength(count === 2 ? 3 : 0);
    expect(Object.values(setup.mosqueStacks).flat()).toHaveLength(count === 2 ? 8 : count === 3 ? 12 : 16);
    expect(setup.supplies).toEqual({
      wheelbarrowExtensions: count * 3,
      wainwrightRubies: count,
      smallMosqueRubies: Math.min(count, 4),
      greatMosqueRubies: Math.min(count, 4)
    });
    expect(setup.players.map(({ lira }) => lira).sort()).toEqual(Array.from({ length: count }, (_, index) => index + 2));
  });

  it('derives repeatable valid random layouts and consumes a stable random stream', () => {
    const first = createBoard('random', createRandom('valid-layout'));
    const second = createBoard('random', createRandom('valid-layout'));
    expect(first).toEqual(second);
    expect([5, 6, 9, 10]).toContain(first.indexOf(7));
    const distance = Math.abs(Math.floor(first.indexOf(8) / 4) - Math.floor(first.indexOf(9) / 4)) + Math.abs(first.indexOf(8) % 4 - first.indexOf(9) % 4);
    expect(distance).toBeGreaterThanOrEqual(3);
  });

  it('starts at one random occupied tabletop position and continues clockwise', () => {
    const tabletopRoom: RoomProjection = {
      roomCode: 'CLOCK', hostUid: 'table', tabletopOwned: true, status: 'lobby', maxPlayers: 5,
      layout: 'short-path', mode: 'shared-table',
      seats: [
        { uid: 'west', name: 'West', ready: true, tablePosition: 8 },
        { uid: 'north', name: 'North', ready: true, tablePosition: 2 },
        { uid: 'south-east', name: 'South East', ready: true, tablePosition: 5 }
      ]
    };
    const setup = createSetup(tabletopRoom, 'clockwise-table');
    const positions = setup.players.map((player) => tabletopRoom.seats.find(({ uid }) => uid === player.uid)!.tablePosition);
    const playOrder = Array.from({ length: setup.players.length }, (_, offset) => positions[(setup.startingSeat + offset) % positions.length]);

    expect(positions).toEqual([2, 5, 8]);
    expect([[2, 5, 8], [5, 8, 2], [8, 2, 5]]).toContainEqual(playOrder);
    expect(Array.from({ length: setup.players.length }, (_, offset) => setup.players[(setup.startingSeat + offset) % setup.players.length].lira)).toEqual([2, 3, 4]);
    expect(createSetup(tabletopRoom, 'clockwise-table').startingSeat).toBe(setup.startingSeat);
  });
});
