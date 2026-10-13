/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ModelConfigServiceConfig } from '../services/modelConfigService.js';
import { DEFAULT_HARNESS_MODEL } from './models.js';

// Minimal harness defaults: 3 generic sizes (small/medium/large) sharing
// base/chat-base aliases. Uses `reasoningEffort` string instead of
// ThinkingLevel / thinkingBudget (no @google/genai import).
export const DEFAULT_MODEL_CONFIGS: ModelConfigServiceConfig = {
  aliases: {
    base: {
      modelConfig: {
        generateContentConfig: {
          temperature: 0,
          topP: 1,
        },
      },
    },
    'chat-base': {
      extends: 'base',
      modelConfig: {
        generateContentConfig: {
          temperature: 1,
          topP: 0.95,
          topK: 64,
          reasoningEffort: 'medium',
        } as unknown as Record<string, unknown> as never,
      },
    },
    small: {
      extends: 'chat-base',
      modelConfig: {
        model: 'small',
        generateContentConfig: {
          reasoningEffort: 'low',
        } as unknown as Record<string, unknown> as never,
      },
    },
    medium: {
      extends: 'chat-base',
      modelConfig: {
        model: 'medium',
        generateContentConfig: {
          reasoningEffort: 'medium',
        } as unknown as Record<string, unknown> as never,
      },
    },
    large: {
      extends: 'chat-base',
      modelConfig: {
        model: DEFAULT_HARNESS_MODEL,
        generateContentConfig: {
          reasoningEffort: 'high',
        } as unknown as Record<string, unknown> as never,
      },
    },
    classifier: {
      extends: 'base',
      modelConfig: {
        model: 'small',
        generateContentConfig: {
          maxOutputTokens: 1024,
          reasoningEffort: 'low',
        } as unknown as Record<string, unknown> as never,
      },
    },
    'prompt-completion': {
      extends: 'base',
      modelConfig: {
        model: 'small',
        generateContentConfig: {
          temperature: 0.3,
          maxOutputTokens: 16000,
          reasoningEffort: 'low',
        } as unknown as Record<string, unknown> as never,
      },
    },
  },
  overrides: [
    {
      match: { model: 'chat-base', isRetry: true },
      modelConfig: {
        generateContentConfig: {
          temperature: 1,
        },
      },
    },
  ],
  modelDefinitions: {
    small: {
      tier: 'small',
      family: 'harness',
      isPreview: false,
      isVisible: true,
      features: { thinking: false, multimodalToolUse: false },
    },
    medium: {
      tier: 'medium',
      family: 'harness',
      isPreview: false,
      isVisible: true,
      features: { thinking: false, multimodalToolUse: false },
    },
    large: {
      displayName: DEFAULT_HARNESS_MODEL,
      tier: 'large',
      family: 'harness',
      isPreview: false,
      isVisible: true,
      features: { thinking: true, multimodalToolUse: false },
    },
    auto: {
      displayName: 'Auto',
      tier: 'auto',
      isPreview: false,
      isVisible: true,
      features: { thinking: true, multimodalToolUse: false },
    },
  },
  modelIdResolutions: {
    small: {
      default: 'small',
    },
    medium: {
      default: 'medium',
    },
    large: {
      default: DEFAULT_HARNESS_MODEL,
    },
    auto: {
      default: DEFAULT_HARNESS_MODEL,
    },
  },
  classifierIdResolutions: {
    small: {
      default: 'small',
    },
    large: {
      default: DEFAULT_HARNESS_MODEL,
    },
  },
  modelChains: {
    default: [
      {
        model: DEFAULT_HARNESS_MODEL,
        actions: {
          terminal: 'prompt',
          transient: 'prompt',
          not_found: 'prompt',
          unknown: 'prompt',
        },
        stateTransitions: {
          terminal: 'terminal',
          transient: 'sticky_retry',
          not_found: 'terminal',
          unknown: 'terminal',
        },
      },
      {
        model: 'small',
        isLastResort: true,
        maxAttempts: 10,
        actions: {
          terminal: 'prompt',
          transient: 'prompt',
          not_found: 'prompt',
          unknown: 'prompt',
        },
        stateTransitions: {
          terminal: 'terminal',
          transient: 'terminal',
          not_found: 'terminal',
          unknown: 'terminal',
        },
      },
    ],
    lite: [
      {
        model: 'small',
        actions: {
          terminal: 'silent',
          transient: 'silent',
          not_found: 'silent',
          unknown: 'silent',
        },
        stateTransitions: {
          terminal: 'terminal',
          transient: 'terminal',
          not_found: 'terminal',
          unknown: 'terminal',
        },
      },
      {
        model: DEFAULT_HARNESS_MODEL,
        isLastResort: true,
        actions: {
          terminal: 'silent',
          transient: 'silent',
          not_found: 'silent',
          unknown: 'silent',
        },
        stateTransitions: {
          terminal: 'terminal',
          transient: 'terminal',
          not_found: 'terminal',
          unknown: 'terminal',
        },
      },
    ],
  },
};
