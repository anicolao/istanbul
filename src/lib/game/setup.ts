import { bonusCards, demandTiles, mosqueTiles, playerColors, printedLayouts, type Good } from './manifests';
import { createRandom, rollDice, shuffle } from './random';
import type { LayoutKind, RoomProjection } from './protocol';

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
  seed: string;
  board: number[];
  governorPlace: number;
  smugglerPlace: number;
  neutralMerchants: Array<{ id: string; place: number }>;
  postOfficeLower: boolean[];
  largeDemand: string[];
  smallDemand: string[];
  mosqueStacks: Record<Good, string[]>;
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
  phase: 'movement' | 'merchant-payment' | 'action' | 'turn-end';
  pending: null | {
    kind: 'merchant-payment';
    recipientUids: string[];
    neutralMerchantIds: string[];
    total: number;
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
}

function pathDistance(board: number[], first: number, second: number) {
  const a = board.indexOf(first);
  const b = board.indexOf(second);
  return Math.abs(Math.floor(a / 4) - Math.floor(b / 4)) + Math.abs(a % 4 - b % 4);
}

export function createBoard(layout: LayoutKind, random: ReturnType<typeof createRandom>): number[] {
  if (layout !== 'random') return [...printedLayouts[layout]];
  for (;;) {
    const board = shuffle(Array.from({ length: 16 }, (_, index) => index + 1), random);
    if ([5, 6, 9, 10].includes(board.indexOf(7)) && pathDistance(board, 8, 9) >= 3) return board;
  }
}

export function createSetup(room: RoomProjection, seed: string): GameSetup {
  const random = createRandom(seed);
  const board = createBoard(room.layout, random);
  const startingSeat = random.nextInt(room.seats.length);
  const shuffledCards = shuffle(bonusCards.map(({ id }) => id), random);
  const playerCards = shuffledCards.slice(0, room.seats.length);
  const remainingCards = shuffledCards.slice(room.seats.length);
  const largeDemand = shuffle(demandTiles.filter(({ market }) => market === 'large').map(({ id }) => id), random);
  const smallDemand = shuffle(demandTiles.filter(({ market }) => market === 'small').map(({ id }) => id), random);
  const governorRoll = rollDice(random);
  const smugglerRoll = rollDice(random);
  const allowedRequirements = room.seats.length === 2 ? [2, 4] : room.seats.length === 3 ? [2, 3, 4] : [2, 3, 4, 5];
  const mosqueStacks = Object.fromEntries((['fabric', 'spice', 'fruit', 'jewelry'] as Good[]).map((good) => [
    good,
    mosqueTiles.filter(({ color, required }) => color === good && allowedRequirements.includes(required)).map(({ id }) => id)
  ])) as Record<Good, string[]>;
  const players = room.seats.map((seat, seatIndex): SetupPlayer => ({
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
    seed,
    board,
    governorPlace: governorRoll[0] + governorRoll[1],
    smugglerPlace: smugglerRoll[0] + smugglerRoll[1],
    neutralMerchants: room.seats.length === 2 ? [14, 15, 16].map((place, index) => ({ id: `neutral-${index + 1}`, place })) : [],
    postOfficeLower: [false, false, false, false],
    largeDemand,
    smallDemand,
    mosqueStacks,
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
    pending: null,
    lastMovement: null,
    lastAction: null
  };
}
