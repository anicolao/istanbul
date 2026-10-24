import { describe, expect, it } from 'vitest';
import { bonusCards } from './manifests';
import { isBonusChoice } from './bonus';
import { applyBonus, applyEvent } from './reducer';
import { createSetup, type GameSetup } from './setup';
import { manifestVersions, reducerVersion, rulesEdition, schemaVersion, type CanonicalEvent, type ReplayProjection, type RoomProjection } from './protocol';

function room(): RoomProjection {
  return { roomCode: 'BONUS', hostUid: 'host', status: 'playing', maxPlayers: 2, layout: 'short-path', mode: 'personal-screens', seats: [{ uid: 'host', name: 'Ada', ready: true }, { uid: 'guest', name: 'Bora', ready: true }] };
}

function event(cardId: string, choice: Record<string, unknown>): CanonicalEvent {
  return { id: 'host-000006', actorUid: 'host', clientSeq: '000006', createdAt: 6, manifestVersions: { ...manifestVersions }, payload: { cardId, choice }, reducerVersion, rulesEdition, schemaVersion, type: 'bonus/played' };
}

function fixture(effect: string): [ReplayProjection, GameSetup, string] {
  const game = createSetup(room(), `bonus-${effect}`);
  game.turnSeat = 0;
  const cardId = bonusCards.find((card) => card.effect === effect)!.id;
  const deckIndex = game.bonusDrawPile.indexOf(cardId);
  if (deckIndex >= 0) game.bonusDrawPile.splice(deckIndex, 1);
  for (const player of game.players) player.bonusHand = [];
  game.players[0].bonusHand = [cardId];
  return [{ room: room(), game, acceptedEventIds: [], diagnostics: [], undo: null, undoLog: [], gameLog: [] }, game, cardId];
}

describe('Bonus card timing contract', () => {
  it('preserves all ten effects and exact multiplicities', () => {
    expect(Object.fromEntries(Object.entries(Object.groupBy(bonusCards, ({ effect }) => effect)).map(([effect, cards]) => [effect, cards?.length]))).toEqual({
      'gain-good': 4,
      'gain-lira': 4,
      'repeat-sultan': 2,
      'repeat-post': 2,
      'repeat-gemstone': 2,
      'return-family': 2,
      stay: 2,
      'long-move': 4,
      'wild-small-market': 2,
      'return-assistant': 2
    });
  });

  it('validates every finite player choice and rejects malformed payloads', () => {
    expect([
      { kind: 'gain-good', good: 'jewelry' },
      { kind: 'gain-lira' },
      { kind: 'repeat-action', wildGoods: ['fabric'] },
      { kind: 'return-family', reward: 'bonus' },
      { kind: 'stay' },
      { kind: 'long-move' },
      { kind: 'wild-small-market' },
      { kind: 'return-assistant', place: 8 }
    ].every(isBonusChoice)).toBe(true);
    expect(isBonusChoice({ kind: 'gain-good', good: 'coffee' })).toBe(false);
    expect(isBonusChoice({ kind: 'return-assistant', place: 2.5 })).toBe(false);
    expect(isBonusChoice({ kind: 'repeat-action', wildGoods: ['coffee'] })).toBe(false);
  });

  it('resolves every immediate and movement effect at its official timing', () => {
    {
      const [state, game, card] = fixture('gain-good'); const player = game.players[0]; player.goods.jewelry = 1; game.phase = 'action';
      expect(applyBonus(state, event(card, { kind: 'gain-good', good: 'jewelry' }))).toBe(true);
      expect(player.goods.jewelry).toBe(2);
    }
    {
      const [state, game, card] = fixture('gain-lira'); const player = game.players[0]; const before = player.lira;
      expect(applyBonus(state, event(card, { kind: 'gain-lira' }))).toBe(true);
      expect(player.lira).toBe(before + 5);
    }
    {
      const [state, game, card] = fixture('return-family'); const player = game.players[0]; player.familyPlace = 4; const before = player.lira;
      expect(applyBonus(state, event(card, { kind: 'return-family', reward: 'lira' }))).toBe(true);
      expect(player).toMatchObject({ familyPlace: 12, lira: before + 3 });
    }
    {
      const [state, game, card] = fixture('return-assistant'); const player = game.players[0]; player.assistantsByPlace = { 8: 1 };
      expect(applyBonus(state, event(card, { kind: 'return-assistant', place: 8 }))).toBe(true);
      expect(player).toMatchObject({ assistantsCarried: 5, assistantsByPlace: {} });
    }
    {
      const [state, game, card] = fixture('long-move');
      expect(applyBonus(state, event(card, { kind: 'long-move' }))).toBe(true);
      expect(game.activeBonusEffects).toEqual(['long-move']);
    }
    {
      const [state, game, card] = fixture('stay'); const player = game.players[0]; player.merchantPlace = 8; player.assistantsCarried = 3; player.assistantsByPlace = { 8: 1 };
      expect(applyBonus(state, event(card, { kind: 'stay' }))).toBe(true);
      expect(player).toMatchObject({ assistantsCarried: 4, assistantsByPlace: {} });
      expect(game).toMatchObject({ phase: 'action', lastMovement: { from: 8, to: 8, distance: 0, assistantAction: 'pick-up' } });
      expect(game.bonusLog.at(-1)?.summary).toBe('Stayed at Place 8 and picked up 1 assistant.');
    }
    {
      const [state, game, card] = fixture('stay'); const player = game.players[0]; player.merchantPlace = 8; player.assistantsCarried = 4; player.assistantsByPlace = {};
      expect(applyBonus(state, event(card, { kind: 'stay' }))).toBe(true);
      expect(player).toMatchObject({ assistantsCarried: 3, assistantsByPlace: { 8: 1 } });
      expect(game).toMatchObject({ phase: 'action', lastMovement: { from: 8, to: 8, distance: 0, assistantAction: 'drop' } });
      expect(game.bonusLog.at(-1)?.summary).toBe('Stayed at Place 8 and left 1 assistant.');
    }
    {
      const [state, game, card] = fixture('wild-small-market'); game.phase = 'action'; game.players[0].merchantPlace = 11;
      expect(applyBonus(state, event(card, { kind: 'wild-small-market' }))).toBe(true);
      expect(game.activeBonusEffects).toEqual(['wild-small-market']);
    }
  });

  it('uses Flexible Demand for a family visit and completes the sale at the Small Market', () => {
    const [state, game, card] = fixture('wild-small-market');
    const player = game.players[0];
    game.phase = 'action';
    player.merchantPlace = 12;
    player.familyPlace = 12;
    player.goods = { fabric: 0, spice: 0, fruit: 0, jewelry: 3 };
    const action = (choice: Record<string, unknown>): CanonicalEvent => ({
      ...event(card, choice), type: 'place/action-taken', payload: { choice, directAction: true }
    });
    expect(applyEvent(state, action({ kind: 'police-send', destination: 11 }))).toBe(true);
    expect(game.phase).toBe('family-action');
    expect(applyBonus(state, event(card, { kind: 'wild-small-market' }))).toBe(true);
    const before = player.lira;
    expect(applyEvent(state, action({ kind: 'market-sell', slotIndexes: [0, 1, 2], wildGoods: ['jewelry', 'jewelry', 'jewelry'] }))).toBe(true);
    expect(player.lira).toBe(before + 9);
    expect(player.goods.jewelry).toBe(0);
    expect(game.activeBonusEffects).toEqual([]);
    expect(game.phase).toBe('turn-end');
    expect(player.merchantPlace).toBe(12);
  });

  it.each([10, 13])('rejects Flexible Demand during a family visit to Place %i', destination => {
    const [state, game, card] = fixture('wild-small-market');
    game.phase = 'family-action';
    game.pending = { kind: 'family-action', destination };
    game.players[0].merchantPlace = 11;
    expect(applyBonus(state, event(card, { kind: 'wild-small-market' }))).toBe(false);
    expect(game.players[0].bonusHand).toContain(card);
  });

  it.each(['movement', 'merchant-payment', 'encounters', 'turn-end'] as const)(
    'allows immediate cards during %s without advancing the turn', phase => {
      for (const kind of ['gain-good', 'gain-lira', 'return-family'] as const) {
        const [state, game, card] = fixture(kind);
        game.phase = phase;
        game.players[0].familyPlace = 4;
        game.players[0].goods.jewelry = 0;
        game.pending = phase === 'merchant-payment'
          ? { kind: 'merchant-payment', recipientUids: ['guest'], neutralMerchantIds: [], total: 2 }
          : phase === 'encounters' ? { kind: 'encounters', familyUids: [], governor: 'payment', smuggler: true } : null;
        const pending = structuredClone(game.pending);
        const choice = kind === 'gain-good' ? { kind, good: 'jewelry' }
          : kind === 'return-family' ? { kind, reward: 'lira' } : { kind };
        expect(applyBonus(state, event(card, choice))).toBe(true);
        expect(game.phase).toBe(phase);
        expect(game.pending).toEqual(pending);
        expect(game.players[0].bonusHand).not.toContain(card);
      }
    }
  );

  it('does not interrupt unfinished Place actions with a goods card', () => {
    const pendingStates: GameSetup['pending'][] = [
      { kind: 'dice-adjust', actionPlace: 8, originalDice: [2, 3], good: 'spice', familyAction: false },
      { kind: 'warehouse-extra', actionPlace: 2, familyAction: false },
      { kind: 'caravansary-discard', familyAction: false }
    ];
    for (const pending of pendingStates) {
      const [state, game, card] = fixture('gain-good');
      game.phase = pending?.kind === 'caravansary-discard' ? 'action' : 'mosque-ability';
      game.pending = pending;
      expect(applyBonus(state, event(card, { kind: 'gain-good', good: 'jewelry' }))).toBe(false);
      expect(game.players[0].bonusHand).toContain(card);
    }
  });

  it('still rejects immediate cards from another player or after the game ends', () => {
    for (const kind of ['gain-good', 'gain-lira', 'return-family'] as const) {
      const [state, game, card] = fixture(kind);
      game.players[0].familyPlace = 4;
      const choice = kind === 'gain-good' ? { kind, good: 'jewelry' }
        : kind === 'return-family' ? { kind, reward: 'lira' } : { kind };
      expect(applyBonus(state, { ...event(card, choice), actorUid: 'guest' })).toBe(false);
      game.phase = 'game-over';
      expect(applyBonus(state, event(card, choice))).toBe(false);
      expect(game.players[0].bonusHand).toContain(card);
    }
  });

  it('repeats only the immediately completed route at its newly exposed cost', () => {
    {
      const [state, game, card] = fixture('repeat-post'); const player = game.players[0]; game.phase = 'turn-end'; game.lastAction = { playerUid: player.uid, place: 5, kind: 'post-office-collect', summary: 'Collected once.' };
      expect(applyBonus(state, event(card, { kind: 'repeat-action' }))).toBe(true);
      expect(game.postOfficeLower).toEqual([true, false, false, false]);
      expect(game.lastAction.summary).toContain('Repeated Post Office');
    }
    {
      const [state, game, card] = fixture('repeat-gemstone'); const player = game.players[0]; game.phase = 'turn-end'; game.rubyTracks.gemstonePrice = 16; player.lira = 16; game.lastAction = { playerUid: player.uid, place: 16, kind: 'gemstone-buy', summary: 'Bought once.' };
      expect(applyBonus(state, event(card, { kind: 'repeat-action' }))).toBe(true);
      expect(player).toMatchObject({ lira: 0, rubies: 1 });
      expect(game.rubyTracks.gemstonePrice).toBe(17);
    }
    {
      const [state, game, card] = fixture('repeat-sultan'); const player = game.players[0]; game.phase = 'turn-end'; player.goods = { fabric: 2, spice: 2, fruit: 2, jewelry: 2 }; game.lastAction = { playerUid: player.uid, place: 13, kind: 'sultan-buy', summary: 'Bought once.' };
      expect(applyBonus(state, event(card, { kind: 'repeat-action', wildGoods: ['spice'] }))).toBe(true);
      expect(player.rubies).toBe(1);
      expect(game.rubyTracks.sultanIndex).toBe(6);
    }
  });

  it('rejects wrong timing and insufficient repeat payments without partial mutation', () => {
    const [state, game, card] = fixture('repeat-gemstone'); const player = game.players[0]; game.phase = 'turn-end'; player.lira = 0; game.lastAction = { playerUid: player.uid, place: 16, kind: 'gemstone-buy', summary: 'Bought once.' };
    const before = structuredClone(game);
    expect(applyBonus(state, event(card, { kind: 'repeat-action' }))).toBe(false);
    expect(game).toEqual(before);
    expect(state.diagnostics.map(({ reason }) => reason)).toEqual(['bonus-repeat-payment']);
  });

  it('rejects a zero-distance move when no normal assistant operation is possible', () => {
    const [state, game, card] = fixture('stay'); const player = game.players[0]; player.merchantPlace = 8; player.assistantsCarried = 0; player.assistantsByPlace = {};
    const before = structuredClone(game);
    expect(applyBonus(state, event(card, { kind: 'stay' }))).toBe(false);
    expect(game).toEqual(before);
    expect(state.diagnostics.map(({ reason }) => reason)).toEqual(['bonus-stay-unavailable']);
  });

  it('allows only direct-resource cards during the final Bonus window', () => {
    {
      const [state, game, card] = fixture('gain-lira'); const before = game.players[0].lira; game.phase = 'final-bonus';
      expect(applyBonus(state, event(card, { kind: 'gain-lira' }))).toBe(true);
      expect(game.players[0].lira).toBe(before + 5);
    }
    {
      const [state, game, card] = fixture('long-move'); game.phase = 'final-bonus'; const before = structuredClone(game);
      expect(applyBonus(state, event(card, { kind: 'long-move' }))).toBe(false);
      expect(game).toEqual(before);
      expect(state.diagnostics.map(({ reason }) => reason)).toEqual(['bonus-movement-unavailable']);
    }
  });
});
