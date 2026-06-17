import { expect, test } from 'vitest';
import { state } from '../../src/state.js';

test('state initializes with default values', () => {
  expect(state.activeTab).toBe('voz');
  expect(state.activeAnchorSubtab).toBe('breathe');
  expect(state.lang).toBeDefined();
});
