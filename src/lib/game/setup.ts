import { bonusCards, demandTiles, mosqueTiles, playerColors, printedLayouts, type Good } from './manifests';
import { createRandom, rollDice, shuffle } from './random';
import type { LayoutKind, RoomProjection } from './protocol';
import { createRubyTracks } from './ruby-routes';

export interface SetupPlayer {
  uid: string;
  name: string;
  color: typeof playerColors[number];
  merchantPlace: number;
  assistantsCarried: number;
  assistantsByPlace: Record<number, number>;
  assistantsInSupply: number;
  familyPlace: number;
  goods: Record<Good, number>;
  capacity: number;
  extensions: number;
  lira: number;
  rubies: number;
  mosqueTileIds: string[];
  bonusHand: string[];
}

export interface GameSetup {
  epoch: number;
  seed: string;
  board: number[];
  governorPlace: number;
  smugglerPlace: number;
  neutralMerchants: Array<{ id: string; place: number }>;
  postOfficeLower: boolean[];
  largeDemand: string[];
  smallDemand: string[];
  mosqueStacks: Record<Good, string[]>;
  rubyTracks: {
    sultanIndex: number;
    sultanRubies: number;
    gemstonePrice: number;
    gemstoneRubies: number;
  };
  bonusDrawPile: string[];
  bonusDiscard: string[];
  supplies: {
    wheelbarrowExtensions: number;
    wainwrightRubies: number;
    smallMosqueRubies: number;
    greatMosqueRubies: number;
  };
  players: SetupPlayer[];
  startingSeat: number;
  turnSeat: number;
  turnNumber: number;
  phase: 'movement' | 'merchant-payment' | 'action' | 'family-action' | 'mosque-ability' | 'encounters' | 'turn-end' | 'final-bonus' | 'game-over';
  end: {
    target: number;
    triggeredByUid: string | null;
    triggeredTurn: number | null;
    finalTurnSeat: number;
    finalBonusSeatsCompleted: number[];
    rankings: Array<{
      uid: string;
      name: string;
      rank: number;
      rubies: number;
      lira: number;
      goods: number;
      bonusCards: number;
    }>;
    winnerUids: string[];
    ordinaryTurnCounts: number[];
  };
  pending: null | {
    kind: 'merchant-payment';
    recipientUids: string[];
    neutralMerchantIds: string[];
    total: number;
  } | {
    kind: 'family-action';
    destination: number;
  } | {
    kind: 'encounters';
    familyUids: string[];
    governor: 'available' | 'payment' | null;
    smuggler: boolean;
  } | {
    kind: 'warehouse-extra';
    actionPlace: number;
    familyAction: boolean;
  } | {
    kind: 'dice-adjust';
    actionPlace: 8 | 9;
    originalDice: [number, number];
    good?: Exclude<Good, 'jewelry'>;
    wager?: number;
    familyAction: boolean;
  };
  lastMovement: null | {
    playerUid: string;
    from: number;
    to: number;
    distance: number;
    assistantAction: import('./movement').AssistantAction;
    paymentTotal: number;
    paymentBlocked: boolean;
  };
  lastAction: null | {
    playerUid: string;
    place: number;
    kind: import('./actions').PlaceActionChoice['kind'];
    summary: string;
  };
  lastRoll: null | {
    playerUid: string;
    place: 8 | 9;
    dice: [number, number];
    declared?: number;
    reward: number;
  };
  encounterLog: Array<{
    kind: import('./encounters').EncounterChoice['kind'];
    summary: string;
    dice?: [number, number];
    destination?: number;
  }>;
  abilitiesUsedThisTurn: Good[];
  activeBonusEffects: Array<'long-move' | 'wild-small-market'>;
  bonusLog: Array<{ cardId: string; summary: string }>;
}

function pathDistance(board: number[], first: number, second: number) {
  const a = board.indexOf(first);
  const b = board.indexOf(second);
  return Math.abs(Math.floor(a / 4) - Math.floor(b / 4)) + Math.abs(a % 4 - b % 4);
}

function shuffleDemandStack(values: string[], random: ReturnType<typeof createRandom>): string[] {
  const pool = [...values];
  const result: string[] = [];
  let permutation = random.nextInt(720);
  for (let remaining = pool.length; remaining > 0; remaining -= 1) {
    const factorial = remaining <= 2 ? 1 : Array.from({ length: remaining - 1 }, (_, index) => index + 1).reduce((product, value) => product * value, 1);
    const index = Math.floor(permutation / factorial);
    permutation %= factorial;
    result.push(pool.splice(index, 1)[0]);
  }
  // Demand stacks formerly contained five tiles. Keep four setup-stream draws
  // per stack so adding the sixth printed face does not move seeded public NPCs.
  for (let draw = 1; draw < 4; draw += 1) random.nextInt(1);
  return result;
}

export function createBoard(layout: LayoutKind, random: ReturnType<typeof createRandom>): number[] {
  if (layout !== 'random') return [...printedLayouts[layout]];
  for (;;) {
    const board = shuffle(Array.from({ length: 16 }, (_, index) => index + 1), random);
    if ([5, 6, 9, 10].includes(board.indexOf(7)) && pathDistance(board, 8, 9) >= 3) return board;
  }
}

export function createSetup(room: RoomProjection, seed: string, epoch = 1): GameSetup {
  const random = createRandom(seed);
  const board = createBoard(room.layout, random);
  const orderedSeats = room.tabletopOwned
    ? [...room.seats].sort((left, right) => (left.tablePosition ?? 9) - (right.tablePosition ?? 9))
    : room.seats;
  const startingSeat = random.nextInt(orderedSeats.length);
  const shuffledCards = shuffle(bonusCards.map(({ id }) => id), random);
  const playerCards = shuffledCards.slice(0, orderedSeats.length);
  const remainingCards = shuffledCards.slice(orderedSeats.length);
  const largeDemand = shuffleDemandStack(demandTiles.filter(({ market }) => market === 'large').map(({ id }) => id), random);
  const smallDemand = shuffleDemandStack(demandTiles.filter(({ market }) => market === 'small').map(({ id }) => id), random);
  const governorRoll = rollDice(random);
  const smugglerRoll = rollDice(random);
  const allowedRequirements = room.seats.length === 2 ? [2, 4] : room.seats.length === 3 ? [2, 3, 4] : [2, 3, 4, 5];
  const mosqueStacks = Object.fromEntries((['fabric', 'spice', 'fruit', 'jewelry'] as Good[]).map((good) => [
    good,
    mosqueTiles.filter(({ color, required }) => color === good && allowedRequirements.includes(required)).map(({ id }) => id)
  ])) as Record<Good, string[]>;
  const players = orderedSeats.map((seat, seatIndex): SetupPlayer => ({
    uid: seat.uid,
    name: seat.name,
    color: playerColors[seatIndex],
    merchantPlace: 7,
    assistantsCarried: 4,
    assistantsByPlace: {},
    assistantsInSupply: 1,
    familyPlace: 12,
    goods: { fabric: 0, spice: 0, fruit: 0, jewelry: 0 },
    capacity: 2,
    extensions: 0,
    lira: 2 + ((seatIndex - startingSeat + room.seats.length) % room.seats.length),
    rubies: 0,
    mosqueTileIds: [],
    bonusHand: [playerCards[seatIndex]]
  }));

  return {
    epoch,
    seed,
    board,
    governorPlace: governorRoll[0] + governorRoll[1],
    smugglerPlace: smugglerRoll[0] + smugglerRoll[1],
    neutralMerchants: room.seats.length === 2 ? [14, 15, 16].map((place, index) => ({ id: `neutral-${index + 1}`, place })) : [],
    postOfficeLower: [false, false, false, false],
    largeDemand,
    smallDemand,
    mosqueStacks,
    rubyTracks: createRubyTracks(room.seats.length),
    bonusDrawPile: remainingCards,
    bonusDiscard: [],
    supplies: {
      wheelbarrowExtensions: room.seats.length * 3,
      wainwrightRubies: room.seats.length,
      smallMosqueRubies: Math.min(room.seats.length, 4),
      greatMosqueRubies: Math.min(room.seats.length, 4)
    },
    players,
    startingSeat,
    turnSeat: startingSeat,
    turnNumber: 1,
    phase: 'movement',
    end: {
      target: room.seats.length === 2 ? 6 : 5,
      triggeredByUid: null,
      triggeredTurn: null,
      finalTurnSeat: (startingSeat - 1 + room.seats.length) % room.seats.length,
      finalBonusSeatsCompleted: [],
      rankings: [],
      winnerUids: [],
      ordinaryTurnCounts: Array(room.seats.length).fill(0)
    },
    pending: null,
    lastMovement: null,
    lastAction: null,
    lastRoll: null,
    encounterLog: [],
    abilitiesUsedThisTurn: [],
    activeBonusEffects: [],
    bonusLog: []
  };
}
