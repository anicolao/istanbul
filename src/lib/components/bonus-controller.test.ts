// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import BonusController from './BonusController.svelte';
import { fixture } from '../../routes/dev/animations/scenarios';

for (const embedded of [false, true]) {
  describe(embedded ? 'web hand' : 'private tabletop phone', () => {
    it('renders the assistant map instead of a location dropdown', async () => {
      const { state } = fixture('bonus-return-assistant-1', 2, 'personal-screens', 6);
      const noop = () => {};
      const { body } = render(BonusController, { props: {
        game: state.game!, userUid: state.game!.players[0].uid,
        selectedBonus: 'bonus-return-assistant-1', embedded,
        onInspectBonus: noop, onPlayBonus: noop, onTakePrivateAction: noop,
        onResolvePrivateEncounter: noop, onUndo: noop, onRollback: noop,
        undo: null, undoLog: [], gameLog: []
      } });
      expect(body).toContain('Choose an assistant to return');
      expect(body).toContain('Return assistant from Fruit Warehouse (1 available)');
      expect(body).toContain('Return assistant from Fabric Warehouse (1 available)');
      expect(body).not.toContain('<select');
      expect(body).not.toContain('Return selected assistant');
    });
  });
}
