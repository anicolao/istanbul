import { describe, expect, it } from "vitest";
import { replayEvents } from "./reducer";
import { arrivalAction } from "./direct-actions";
import { createGalleryGame } from "./gallery-fixture";
import {
  manifestVersions,
  reducerVersion,
  rulesEdition,
  schemaVersion,
  type CanonicalEvent,
} from "./protocol";
function event(
  n: number,
  type: string,
  payload: Record<string, unknown>,
  actorUid = "table",
): CanonicalEvent {
  return {
    id: `${actorUid}-${String(n).padStart(6, "0")}`,
    actorUid,
    clientSeq: String(n).padStart(6, "0"),
    createdAt: n,
    type,
    payload,
    manifestVersions: { ...manifestVersions },
    reducerVersion,
    rulesEdition,
    schemaVersion,
  };
}
const setup = [
  event(1, "game/created", {
    roomCode: "TABLE",
    maxPlayers: 5,
    layout: "number-order",
    mode: "shared-table",
    tabletopOwned: true,
  }),
  event(2, "player/joined", { name: "Ada", tablePosition: 1 }, "ada"),
  event(3, "player/joined", { name: "Bora", tablePosition: 6 }, "bora"),
  event(4, "player/ready", { ready: true }, "ada"),
  event(5, "player/ready", { ready: true }, "bora"),
  event(6, "game/started", { seed: "direct-arrivals" }),
];
describe("direct tabletop arrivals", () => {
  it("transfers a lost tabletop session without changing the game or allowing a spectator takeover", () => {
    const before = replayEvents(setup);
    const bad = replayEvents([...setup, event(7, "table/host-transferred", { hostUid: "new-table" }, "stranger")]);
    expect(bad.room?.hostUid).toBe("table");
    expect(bad.diagnostics.at(-1)?.reason).toBe("host-only");
    const transfer = event(7, "table/host-transferred", { hostUid: "new-table" });
    const restored = replayEvents([...setup, transfer]);
    expect(restored.room?.hostUid).toBe("new-table");
    expect(restored.game).toEqual(before.game);
    const moved = replayEvents([...setup, transfer, event(8, "turn/moved", { destination: 3, assistantAction: "drop", directAction: true }, "new-table")]);
    expect(moved.diagnostics).toEqual([]);
    expect(moved.game?.players[moved.game.turnSeat].merchantPlace).toBe(3);
  });
  it("treats archived repair markers as inert without affecting the restored turn", () => {
    const before = replayEvents(setup);
    const after = replayEvents([...setup, event(7, "action/archived", { reason: "Requested repair" })]);
    expect(after.game).toEqual(before.game);
    expect(after.diagnostics).toEqual([]);
  });
  it("fills on arrival and rolls movement and goods back together", () => {
    const before = replayEvents(setup);
    expect(before.diagnostics).toEqual([]);
    const move = event(7, "turn/moved", {
      destination: 3,
      assistantAction: "drop",
      directAction: true,
    });
    const after = replayEvents([...setup, move]);
    expect(after.diagnostics).toEqual([]);
    const player = after.game!.players[after.game!.turnSeat];
    expect(player.goods.spice).toBe(player.capacity);
    expect(after.game!.phase).not.toBe("action");
    const undone = replayEvents([
      ...setup,
      move,
      event(8, "action/undone", { targetEventId: move.id }),
    ]);
    expect(undone.diagnostics).toEqual([]);
    expect(undone.game).toEqual(before.game);
    expect(replayEvents([...setup, move]).game).toEqual(after.game);
  });
  it("preserves older explicit-action events", () => {
    const after = replayEvents([
      ...setup,
      event(7, "turn/moved", { destination: 3, assistantAction: "drop" }),
    ]);
    expect(after.game?.phase).toBe("action");
    expect(after.game?.players[after.game.turnSeat].goods.spice).toBe(0);
  });
  it("never automatically rolls, draws, chooses goods, or buys an unaffordable upgrade", () => {
    const game = createGalleryGame();
    game.phase = "action";
    for (const place of [6, 7, 8, 9, 10, 11, 12, 14, 15]) {
      game.players[game.turnSeat].merchantPlace = place;
      expect(arrivalAction(game)).toBeNull();
    }
    game.players[game.turnSeat].merchantPlace = 1;
    game.players[game.turnSeat].lira = 0;
    expect(arrivalAction(game)).toBeNull();
  });
  it("uses the family destination for automatic fills", () => {
    const game = createGalleryGame();
    game.phase = "family-action";
    game.pending = { kind: "family-action", destination: 4 };
    expect(arrivalAction(game)).toEqual({
      kind: "warehouse-fill",
      good: "fruit",
    });
  });
  it("records private draws before a discard, blocks rewinding, and requires payment", () => {
    const events = [
      ...setup,
      event(7, "turn/moved", {
        destination: 6,
        assistantAction: "drop",
        directAction: true,
      }),
    ];
    let state = replayEvents(events);
    let n = 8;
    if (state.game!.pending?.kind === "merchant-payment") {
      const p = state.game!.pending;
      events.push(
        event(n++, "turn/merchant-paid", {
          recipientUids: p.recipientUids,
          neutralMerchantIds: p.neutralMerchantIds,
        }),
      );
      state = replayEvents(events);
    }
    const owner = state.game!.players[state.game!.turnSeat].uid;
    const before = state.game!.players[state.game!.turnSeat].bonusHand.length;
    events.push(
      event(
        n++,
        "place/action-taken",
        { choice: { kind: "caravansary-draw", drawSources: ["deck", "deck"] } },
        owner,
      ),
    );
    state = replayEvents(events);
    expect(state.diagnostics).toEqual([]);
    expect(state.game!.pending?.kind).toBe("caravansary-discard");
    expect(state.game!.players[state.game!.turnSeat].bonusHand).toHaveLength(
      before + 2,
    );
    expect(state.undo?.blockedReason).toBe("Bonus cards were revealed");
    const premature = replayEvents([
      ...events,
      event(n, "turn/ended", { directAction: true }),
    ]);
    expect(premature.diagnostics.at(-1)?.reason).toBe(
      "caravansary-discard-required",
    );
    expect(premature.game).toEqual(state.game);
    const id = state.game!.players[state.game!.turnSeat].bonusHand.at(-1)!;
    events.push(
      event(
        n++,
        "place/action-taken",
        { choice: { kind: "caravansary-discard", discardCardId: id } },
        owner,
      ),
    );
    state = replayEvents(events);
    expect(state.diagnostics).toEqual([]);
    expect(state.game!.players[state.game!.turnSeat].bonusHand).toHaveLength(
      before + 1,
    );
    expect(state.game!.bonusDiscard.at(-1)).toBe(id);
    expect(state.game!.pending?.kind).not.toBe("caravansary-discard");
  });
});
