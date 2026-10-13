/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Telemetry no-op stub: spans are never created, the function runs directly.

import type { AttributeValue, SpanOptions } from '@opentelemetry/api';
import type { GeminiCliOperation } from './constants.js';

/**
 * Registry used to ensure that spans are properly ended when their associated
 * async objects are garbage collected.
 */
export const spanRegistry = new FinalizationRegistry((endSpan: () => void) => {
  try {
    endSpan();
  } catch {
    // No telemetry: ignore cleanup errors.
  }
});

/**
 * Truncates a value for inclusion in telemetry attributes.
 */
export function truncateForTelemetry(
  value: unknown,
  _maxLength = 10000,
): AttributeValue | undefined {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  return undefined;
}

/**
 * Metadata for a span.
 */
export interface SpanMetadata {
  /** The name of the span. */
  name: string;
  /** The input to the span. */
  input?: unknown;
  /** The output of the span. */
  output?: unknown;
  error?: unknown;
  /** Additional attributes for the span. */
  attributes: Record<string, AttributeValue>;
}

/**
 * Runs a function directly without creating an OpenTelemetry span.
 */
export async function runInDevTraceSpan<R>(
  _opts: SpanOptions & {
    operation: GeminiCliOperation;
    logPrompts?: boolean;
    sessionId: string;
    tracesEnabled?: boolean;
  },
  fn: ({ metadata }: { metadata: SpanMetadata }) => Promise<R>,
): Promise<R> {
  const metadata: SpanMetadata = { name: 'noop', attributes: {} };
  return fn({ metadata });
}
