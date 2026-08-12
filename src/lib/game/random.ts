export interface RandomSource { nextInt(maxExclusive: number): number; }

export function createRandom(seed: string): RandomSource {
  let state = 2166136261;
  for (const character of seed) {
    state ^= character.charCodeAt(0);
    state = Math.imul(state, 16777619);
  }
  if (state === 0) state = 0x9e3779b9;
  return {
    nextInt(maxExclusive: number) {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return (state >>> 0) % maxExclusive;
    }
  };
}

export function shuffle<T>(values: T[], random: RandomSource): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = random.nextInt(index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function rollDice(random: RandomSource): [number, number] {
  return [random.nextInt(6) + 1, random.nextInt(6) + 1];
}
