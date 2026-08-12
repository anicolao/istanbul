import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment
} from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { readFile } from 'node:fs/promises';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

let environment: RulesTestEnvironment;

const eventData = (actorUid: string, overrides: Record<string, unknown> = {}) => ({
  actorUid,
  clientSeq: '000001',
  createdAt: serverTimestamp(),
  manifestVersions: { places: 1 },
  payload: { displayName: 'Ayla' },
  reducerVersion: 1,
  rulesEdition: 'istanbul-2014-base',
  schemaVersion: 1,
  type: 'game/created',
  ...overrides
});

describe('append-only game stream rules', () => {
  beforeAll(async () => {
    environment = await initializeTestEnvironment({
      projectId: 'istanbul-e2e',
      firestore: { rules: await readFile('firestore.rules', 'utf8') }
    });
  });

  beforeEach(async () => {
    await environment.clearFirestore();
  });

  afterAll(async () => {
    await environment.cleanup();
  });

  it('allows an attributed immutable event and authenticated read', async () => {
    const db = environment.authenticatedContext('merchant-a').firestore();
    const event = doc(db, 'games/room/events/merchant-a-000001');
    await assertSucceeds(setDoc(event, eventData('merchant-a')));
    await assertSucceeds(getDoc(event));
    await assertFails(updateDoc(event, { type: 'changed' }));
    await assertFails(deleteDoc(event));
  });

  it('denies unauthenticated access and false attribution', async () => {
    const anonymous = environment.unauthenticatedContext().firestore();
    const authenticated = environment.authenticatedContext('merchant-a').firestore();
    await assertFails(getDoc(doc(anonymous, 'games/room/events/merchant-a-000001')));
    await assertFails(
      setDoc(
        doc(authenticated, 'games/room/events/merchant-a-000001'),
        eventData('merchant-b')
      )
    );
  });

  it('denies malformed envelopes, mismatched IDs, and unrelated paths', async () => {
    const db = environment.authenticatedContext('merchant-a').firestore();
    await assertFails(
      setDoc(
        doc(db, 'games/room/events/merchant-a-000001'),
        eventData('merchant-a', { schemaVersion: 2 })
      )
    );
    await assertFails(
      setDoc(
        doc(db, 'games/room/events/merchant-a-999999'),
        eventData('merchant-a')
      )
    );
    await assertFails(setDoc(doc(db, 'games/room'), { owner: 'merchant-a' }));
  });
});
