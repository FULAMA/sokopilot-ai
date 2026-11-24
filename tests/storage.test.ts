import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoSeed } from '../src/data/demoSeed';
import { loadRepositoryState, saveRepositoryState } from '../src/services/storage';
import { isValidDemoRepositoryState } from '../src/services/demoStateValidation';

const STORAGE_KEY = 'sokopilot_revenue_hub_demo_v1';
const CORRUPT_BACKUP_KEY = 'sokopilot_revenue_hub_demo_corrupt_backup_v1';

function installLocalStorage(initial: Record<string, string> = {}, failWrites = false) {
  const values = new Map(Object.entries(initial));
  const storage = {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      if (failWrites) throw new Error('Storage unavailable');
      values.set(key, value);
    },
    removeItem(key: string) {
      values.delete(key);
    },
  };

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storage,
  });

  return values;
}

test('backs up syntactically invalid JSON before restoring the demo seed', () => {
  const raw = '{"leads": invalid-json';
  const values = installLocalStorage({ [STORAGE_KEY]: raw });

  const state = loadRepositoryState();

  assert.equal(values.get(CORRUPT_BACKUP_KEY), raw);
  assert.deepEqual(JSON.parse(values.get(STORAGE_KEY) ?? 'null'), state);
  assert.equal(isValidDemoRepositoryState(state, createDemoSeed()), true);
});

test('backs up structurally invalid JSON before restoring the demo seed', () => {
  const raw = JSON.stringify({ version: 1, leads: 'not-an-array' });
  const values = installLocalStorage({ [STORAGE_KEY]: raw });

  const state = loadRepositoryState();

  assert.equal(values.get(CORRUPT_BACKUP_KEY), raw);
  assert.deepEqual(JSON.parse(values.get(STORAGE_KEY) ?? 'null'), state);
  assert.equal(isValidDemoRepositoryState(state, createDemoSeed()), true);
});

test('returns false when saving fails because browser storage is unavailable', () => {
  installLocalStorage({}, true);

  assert.equal(saveRepositoryState(createDemoSeed()), false);
});
