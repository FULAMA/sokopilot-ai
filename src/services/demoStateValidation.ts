import { DemoRepositoryState } from '../types/domain';

/**
 * Validate persisted demo data against the canonical seed shape.
 * This is a runtime guard, not a security boundary. Server-side validation
 * and database constraints are mandatory once real customer data is used.
 */
function matchesTemplate(value: unknown, template: unknown): boolean {
  if (template === null) return value === null;

  if (Array.isArray(template)) {
    return (
      Array.isArray(value) &&
      (template.length === 0 ||
        value.every((item) => matchesTemplate(item, template[0])))
    );
  }

  if (typeof template === 'string') return typeof value === 'string';
  if (typeof template === 'number') {
    return typeof value === 'number' && Number.isFinite(value);
  }
  if (typeof template === 'boolean') return typeof value === 'boolean';

  if (typeof template === 'object' && template !== null) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return false;
    }

    return Object.entries(template).every(([key, expected]) => {
      const record = value as Record<string, unknown>;
      const actual = record[key];

      // Optional properties in the TypeScript domain model are represented
      // by undefined in the seed and may be absent or strings when present.
      if (expected === undefined) {
        return actual === undefined || typeof actual === 'string';
      }

      return matchesTemplate(actual, expected);
    });
  }

  return value === template;
}

export function isValidDemoRepositoryState(
  value: unknown,
  canonicalSeed: DemoRepositoryState
): value is DemoRepositoryState {
  return matchesTemplate(value, canonicalSeed);
}
