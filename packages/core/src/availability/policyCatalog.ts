/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  ModelPolicy,
  ModelPolicyActionMap,
  ModelPolicyChain,
  ModelPolicyStateMap,
} from './modelPolicy.js';

// actions and stateTransitions are optional when defining ModelPolicy
type PolicyConfig = Omit<ModelPolicy, 'actions' | 'stateTransitions'> & {
  actions?: ModelPolicyActionMap;
  stateTransitions?: ModelPolicyStateMap;
};

export interface ModelPolicyOptions {
  previewEnabled: boolean;
  isAutoSelection?: boolean;
  userTier?: string;
  useGemini31?: boolean;
  useLatestFlashLite?: boolean;
  useGemini31FlashLite?: boolean;
  useCustomToolModel?: boolean;
  useLatestFlash?: boolean;
  useGemini3_5Flash?: boolean;
}

/**
 * Own-harness generic tiers. Explicit tier env wins, else OWN_HARNESS_MODEL,
 * else local coder defaults. No Gemini / vendor defaults.
 */
export const HARNESS_SMALL_MODEL =
  process.env['OWN_HARNESS_SMALL_MODEL'] ||
  process.env['OWN_HARNESS_MODEL'] ||
  'local-small-coder';

export const HARNESS_MEDIUM_MODEL =
  process.env['OWN_HARNESS_MEDIUM_MODEL'] ||
  process.env['OWN_HARNESS_MODEL'] ||
  'local-medium-coder';

export const HARNESS_LARGE_MODEL =
  process.env['OWN_HARNESS_LARGE_MODEL'] ||
  process.env['OWN_HARNESS_MODEL'] ||
  'local-large-coder';

const DEFAULT_ACTIONS: ModelPolicyActionMap = {
  terminal: 'prompt',
  transient: 'prompt',
  not_found: 'prompt',
  unknown: 'prompt',
};

export const SILENT_ACTIONS: ModelPolicyActionMap = {
  terminal: 'silent',
  transient: 'silent',
  not_found: 'silent',
  unknown: 'silent',
};

const DEFAULT_STATE: ModelPolicyStateMap = {
  terminal: 'terminal',
  transient: 'terminal',
  not_found: 'terminal',
  unknown: 'terminal',
};

const AUTO_ROUTING_OVERRIDES = {
  maxAttempts: 3,
  actions: { ...DEFAULT_ACTIONS, transient: 'silent' } as ModelPolicyActionMap,
  stateTransitions: {
    ...DEFAULT_STATE,
    transient: 'sticky_retry',
  } as ModelPolicyStateMap,
};

/**
 * Returns the default ordered model policy chain for the user.
 * Generic tiers: large -> medium -> small (last resort).
 */
export function getModelPolicyChain(
  options: ModelPolicyOptions,
): ModelPolicyChain {
  const isAuto = options.isAutoSelection ?? false;

  return [
    definePolicy({
      model: HARNESS_LARGE_MODEL,
      ...(isAuto ? AUTO_ROUTING_OVERRIDES : {}),
    }),
    definePolicy({
      model: HARNESS_MEDIUM_MODEL,
      ...(isAuto ? AUTO_ROUTING_OVERRIDES : {}),
    }),
    definePolicy({
      model: HARNESS_SMALL_MODEL,
      isLastResort: true,
      maxAttempts: 10,
    }),
  ];
}

export function createSingleModelChain(model: string): ModelPolicyChain {
  return [definePolicy({ model, isLastResort: true })];
}

export function getFlashLitePolicyChain(): ModelPolicyChain {
  return [
    definePolicy({
      model: HARNESS_SMALL_MODEL,
      actions: SILENT_ACTIONS,
    }),
    definePolicy({
      model: HARNESS_MEDIUM_MODEL,
      actions: SILENT_ACTIONS,
    }),
    definePolicy({
      model: HARNESS_LARGE_MODEL,
      isLastResort: true,
      actions: SILENT_ACTIONS,
    }),
  ];
}

/**
 * Provides a default policy scaffold for models not present in the catalog.
 */
export function createDefaultPolicy(
  model: string,
  options?: { isLastResort?: boolean },
): ModelPolicy {
  return definePolicy({ model, isLastResort: options?.isLastResort });
}

export function validateModelPolicyChain(chain: ModelPolicyChain): void {
  if (chain.length === 0) {
    throw new Error('Model policy chain must include at least one model.');
  }
  const lastResortCount = chain.filter((policy) => policy.isLastResort).length;
  if (lastResortCount === 0) {
    throw new Error('Model policy chain must include an `isLastResort` model.');
  }
  if (lastResortCount > 1) {
    throw new Error('Model policy chain must only have one `isLastResort`.');
  }
}

/**
 * Helper to define a ModelPolicy with default actions and state transitions.
 * Ensures every policy is a fresh instance to avoid shared state.
 */
function definePolicy(config: PolicyConfig): ModelPolicy {
  return {
    model: config.model,
    isLastResort: config.isLastResort,
    maxAttempts: config.maxAttempts,
    actions: { ...DEFAULT_ACTIONS, ...(config.actions ?? {}) },
    stateTransitions: {
      ...DEFAULT_STATE,
      ...(config.stateTransitions ?? {}),
    },
  };
}
