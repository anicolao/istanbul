import {
  collection,
  doc,
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
  subscribe(onEvents: (events: CanonicalEvent[]) => void, onError: (error: Error) => void): Unsubscribe;
}

export function createEventRepository(db: Firestore, roomCode: string, actorUid: string): EventRepository {
  const events = collection(db, 'games', roomCode, 'events');
  const sequenceKey = `istanbul:sequence:${roomCode}:${actorUid}`;

  return {
    async append(type, payload) {
      const previous = Number(localStorage.getItem(sequenceKey) ?? '0');
      const clientSeq = String(previous + 1).padStart(6, '0');
      localStorage.setItem(sequenceKey, String(previous + 1));
      const id = `${actorUid}-${clientSeq}`;
      await setDoc(doc(events, id), {
        actorUid,
        clientSeq,
        createdAt: serverTimestamp(),
        manifestVersions: { ...manifestVersions },
        payload,
        reducerVersion,
        rulesEdition,
        schemaVersion,
        type
      });
      return id;
    },
    subscribe(onEvents, onError) {
      return onSnapshot(
        events,
        (snapshot) => {
          onEvents(snapshot.docs.map((snapshotDocument) => {
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
          }));
        },
        (error) => onError(error)
      );
    }
  };
}
