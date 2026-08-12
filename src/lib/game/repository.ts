import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Firestore,
  type Timestamp,
  type Unsubscribe
} from 'firebase/firestore';
import { manifestVersions, reducerVersion, rulesEdition, schemaVersion, type CanonicalEvent } from './protocol';

export interface EventRepository {
  append(type: string, payload: Record<string, unknown>): Promise<string>;
  retryPending(): Promise<string | null>;
  pendingId(): string | null;
  subscribe(onEvents: (events: CanonicalEvent[]) => void, onError: (error: Error) => void): Unsubscribe;
}

interface PendingWrite {
  id: string;
  data: Omit<CanonicalEvent, 'id' | 'createdAt'>;
}

export function createEventRepository(db: Firestore, roomCode: string, actorUid: string): EventRepository {
  const events = collection(db, 'games', roomCode, 'events');
  const sequenceKey = `istanbul:sequence:${roomCode}:${actorUid}`;
  const pendingKey = `istanbul:pending:${roomCode}:${actorUid}`;
  let activeWrite: Promise<string> | null = null;

  function clonePayload(payload: Record<string, unknown>) {
    return JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
  }

  function readPending(): PendingWrite | null {
    try { return JSON.parse(localStorage.getItem(pendingKey) ?? 'null') as PendingWrite | null; } catch { return null; }
  }

  async function send(pending: PendingWrite) {
    const eventDocument = doc(events, pending.id);
    try {
      await setDoc(eventDocument, { ...pending.data, createdAt: serverTimestamp() });
    } catch (error) {
      const committed = await getDoc(eventDocument);
      const data = committed.data();
      const sameWrite = committed.exists()
        && data?.actorUid === pending.data.actorUid
        && data?.clientSeq === pending.data.clientSeq
        && data?.type === pending.data.type
        && JSON.stringify(data?.payload) === JSON.stringify(pending.data.payload)
        && data?.schemaVersion === pending.data.schemaVersion
        && data?.reducerVersion === pending.data.reducerVersion
        && data?.rulesEdition === pending.data.rulesEdition
        && JSON.stringify(data?.manifestVersions) === JSON.stringify(pending.data.manifestVersions);
      if (!sameWrite) throw error;
    }
    localStorage.removeItem(pendingKey);
    return pending.id;
  }

  async function append(type: string, payload: Record<string, unknown>) {
    if (activeWrite) await activeWrite;
    const existing = readPending();
    if (existing) {
      throw new Error(`Pending event ${existing.id} must be retried before a new action`);
    }
    const previous = Number(localStorage.getItem(sequenceKey) ?? '0');
    const clientSeq = String(previous + 1).padStart(6, '0');
    localStorage.setItem(sequenceKey, String(previous + 1));
    const id = `${actorUid}-${clientSeq}`;
    const pending: PendingWrite = { id, data: {
      actorUid,
      clientSeq,
      manifestVersions: { ...manifestVersions },
      payload: clonePayload(payload),
      reducerVersion,
      rulesEdition,
      schemaVersion,
      type
    } };
    localStorage.setItem(pendingKey, JSON.stringify(pending));
    activeWrite = send(pending);
    try { return await activeWrite; } finally { activeWrite = null; }
  }

  return {
    append,
    retryPending() { const pending = readPending(); return pending ? send(pending) : Promise.resolve(null); },
    pendingId() { return readPending()?.id ?? null; },
    subscribe(onEvents, onError) {
      return onSnapshot(
        events,
        (snapshot) => {
          const mapped = snapshot.docs.map((snapshotDocument) => {
            const data = snapshotDocument.data();
            const timestamp = data.createdAt as Timestamp | null;
            return {
              id: snapshotDocument.id,
              actorUid: data.actorUid,
              clientSeq: data.clientSeq,
              createdAt: timestamp?.toMillis() ?? null,
              manifestVersions: data.manifestVersions,
              payload: data.payload,
              reducerVersion: data.reducerVersion,
              rulesEdition: data.rulesEdition,
              schemaVersion: data.schemaVersion,
              type: data.type
            };
          });
          onEvents(mapped);
        },
        (error) => onError(error)
      );
    }
  };
}
