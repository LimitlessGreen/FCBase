import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/component-registry', () => ({
  getComponentImageResolver: () => undefined,
}));

import { componentMetadataIds } from '@/lib/components/metadata';

import { compareModuleRegistry } from './registry';

describe('compareModuleRegistry', () => {
  it('includes a compare module for every registered component', () => {
    for (const id of componentMetadataIds) {
      const module = compareModuleRegistry[id as keyof typeof compareModuleRegistry];
      expect(module, `Missing compare module for component "${id}"`).toBeDefined();
    }
  });
});
