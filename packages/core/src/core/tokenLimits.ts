/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { DEFAULT_HARNESS_MODEL } from '../config/models.js';

type Model = string;
type TokenCount = number;

export const DEFAULT_TOKEN_LIMIT = 1_048_576;
export const GEMMA_4_TOKEN_LIMIT = 256_000;

export function tokenLimit(model: Model): TokenCount {
  // Harness tiers share a single large context window.
  switch (model) {
    case DEFAULT_HARNESS_MODEL:
    case 'local/coder':
    case 'local-small-coder':
    case 'local-medium-coder':
    case 'local-large-coder':
    case 'local-small':
    case 'small':
    case 'medium':
    case 'large':
      return 1_048_576;
    default:
      return DEFAULT_TOKEN_LIMIT;
  }
}
