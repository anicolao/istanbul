import { describe, expect, it } from 'vitest';
import { readFirebaseConfig } from './firebase-config';

const complete = {
  VITE_FIREBASE_API_KEY: 'key',
  VITE_FIREBASE_AUTH_DOMAIN: 'istanbul-e2e.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'istanbul-e2e',
  VITE_FIREBASE_STORAGE_BUCKET: 'istanbul-e2e.firebasestorage.app',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '123',
  VITE_FIREBASE_APP_ID: 'app'
};

describe('readFirebaseConfig', () => {
  it('maps the public Vite environment', () => {
    expect(readFirebaseConfig(complete)).toEqual({
      apiKey: 'key',
      authDomain: 'istanbul-e2e.firebaseapp.com',
      projectId: 'istanbul-e2e',
      storageBucket: 'istanbul-e2e.firebasestorage.app',
      messagingSenderId: '123',
      appId: 'app'
    });
  });

  it('reports every missing variable', () => {
    expect(() => readFirebaseConfig({})).toThrow(
      'Missing Firebase configuration: VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, '
        + 'VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_STORAGE_BUCKET, '
        + 'VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID'
    );
  });
});
