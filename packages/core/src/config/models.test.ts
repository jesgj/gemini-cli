/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  resolveModel,
  resolveClassifierModel,
  getDisplayString,
  getBackendModelMappings,
  DEFAULT_HARNESS_MODEL,
} from './models.js';

// Harness tiers replace Gemini model constants.
const SMALL = 'small';
const MEDIUM = 'medium';
const LARGE = 'large';

describe('harness models', () => {
  it('exposes a default harness model', () => {
    expect(typeof DEFAULT_HARNESS_MODEL).toBe('string');
    expect(DEFAULT_HARNESS_MODEL.length).toBeGreaterThan(0);
  });

  it('resolveModel returns harness default for empty/auto', () => {
    expect(resolveModel('')).toBe(DEFAULT_HARNESS_MODEL);
    expect(resolveModel('auto')).toBe(DEFAULT_HARNESS_MODEL);
  });

  it('resolveModel preserves small/medium/large tiers', () => {
    expect(resolveModel(SMALL)).toContain('small');
    expect(resolveModel(MEDIUM)).toContain('medium');
    expect(resolveModel(LARGE)).toContain('large');
  });

  it('resolveModel preserves provider/model refs', () => {
    expect(resolveModel('local/coder')).toBe('local/coder');
  });

  it('resolveClassifierModel prefers alias when present', () => {
    expect(resolveClassifierModel(LARGE, SMALL)).toContain('small');
    expect(resolveClassifierModel(SMALL, '')).toContain('small');
  });

  it('getDisplayString returns input or default', () => {
    expect(getDisplayString(SMALL)).toBe(SMALL);
    expect(getDisplayString('')).toBe(DEFAULT_HARNESS_MODEL);
  });

  it('getBackendModelMappings returns empty map', () => {
    expect(getBackendModelMappings()).toEqual({});
  });
});
