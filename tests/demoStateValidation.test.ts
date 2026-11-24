import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoSeed } from '../src/data/demoSeed';
import { isValidDemoRepositoryState } from '../src/services/demoStateValidation';

test('accepts the canonical demo repository state', () => {
  const seed = createDemoSeed();
  assert.equal(isValidDemoRepositoryState(seed, seed), true);
});

test('rejects a state with a missing required collection', () => {
  const seed = createDemoSeed();
  const invalid = { ...seed, followUps: undefined };
  assert.equal(isValidDemoRepositoryState(invalid, seed), false);
});

test('rejects malformed nested lead records', () => {
  const seed = createDemoSeed();
  const invalid = {
    ...seed,
    leads: [{ ...seed.leads[0], expectedValue: 'not-a-number' }],
  };
  assert.equal(isValidDemoRepositoryState(invalid, seed), false);
});

test('rejects non-finite numeric values', () => {
  const seed = createDemoSeed();
  const invalid = {
    ...seed,
    settings: { ...seed.settings, usdToCdfRate: Number.NaN },
  };
  assert.equal(isValidDemoRepositoryState(invalid, seed), false);
});

test('accepts optional fields being absent', () => {
  const seed = createDemoSeed();
  const lead = { ...seed.leads[0] };
  delete lead.lossReason;
  const candidate = { ...seed, leads: [lead, ...seed.leads.slice(1)] };
  assert.equal(isValidDemoRepositoryState(candidate, seed), true);
});


test('rejects an unknown lead stage', () => {
  const seed = createDemoSeed();
  const invalid = {
    ...seed,
    leads: [{ ...seed.leads[0], stage: 'Archived' }, ...seed.leads.slice(1)],
  };
  assert.equal(isValidDemoRepositoryState(invalid, seed), false);
});

test('rejects duplicate identifiers in a collection', () => {
  const seed = createDemoSeed();
  const invalid = {
    ...seed,
    leads: [seed.leads[0], { ...seed.leads[1], id: seed.leads[0].id }, ...seed.leads.slice(2)],
  };
  assert.equal(isValidDemoRepositoryState(invalid, seed), false);
});

test('rejects impossible calendar dates', () => {
  const seed = createDemoSeed();
  const invalid = {
    ...seed,
    leads: [{ ...seed.leads[0], nextFollowUpDate: '2026-02-31' }, ...seed.leads.slice(1)],
  };
  assert.equal(isValidDemoRepositoryState(invalid, seed), false);
});

test('rejects negative monetary values', () => {
  const seed = createDemoSeed();
  const invalid = {
    ...seed,
    offers: [{ ...seed.offers[0], price: -1 }, ...seed.offers.slice(1)],
  };
  assert.equal(isValidDemoRepositoryState(invalid, seed), false);
});


test('rejects automation records with invalid enabled flags', () => {
  const seed = createDemoSeed();
  const invalid = {
    ...seed,
    automations: [{ ...seed.automations[0], enabled: 'yes' }, ...seed.automations.slice(1)],
  };
  assert.equal(isValidDemoRepositoryState(invalid, seed), false);
});

test('rejects integration records that claim an unsupported connection state', () => {
  const seed = createDemoSeed();
  const invalid = {
    ...seed,
    integrations: [{ ...seed.integrations[0], status: 'Connecté' }, ...seed.integrations.slice(1)],
  };
  assert.equal(isValidDemoRepositoryState(invalid, seed), false);
});

test('rejects follow-ups referencing an unknown lead', () => {
  const seed = createDemoSeed();
  const invalid = {
    ...seed,
    followUps: [{ ...seed.followUps[0], leadId: 'lead-missing' }, ...seed.followUps.slice(1)],
  };
  assert.equal(isValidDemoRepositoryState(invalid, seed), false);
});

test('rejects invalid automation audit timestamps', () => {
  const seed = createDemoSeed();
  const invalid = {
    ...seed,
    automationAudit: [{ ...seed.automationAudit[0], timestamp: 'yesterday' }],
  };
  assert.equal(isValidDemoRepositoryState(invalid, seed), false);
});

test('rejects source percentages that do not total 100 percent', () => {
  const seed = createDemoSeed();
  const invalid = {
    ...seed,
    baseline: {
      ...seed.baseline,
      sourcePercentages: seed.baseline.sourcePercentages.map((item, index) =>
        index === 0 ? { ...item, percentage: item.percentage - 10 } : item
      ),
    },
  };
  assert.equal(isValidDemoRepositoryState(invalid, seed), false);
});
