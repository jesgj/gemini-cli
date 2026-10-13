/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Minimal harness model surface (provider-neutral).
// Replaces Gemini-specific PREVIEW_/DEFAULT_/BASE_/LATEST_* constants and
// helpers with a single env-driven default plus generic ref parsing.

import { parseModelRef } from '../providers/types.js';

export const DEFAULT_HARNESS_MODEL =
  process.env['OWN_HARNESS_MODEL'] ?? 'local/coder';

export const DEFAULT_HARNESS_EMBEDDING_MODEL =
  process.env['OWN_HARNESS_EMBEDDING_MODEL'] ?? DEFAULT_HARNESS_MODEL;

export interface ModelResolutionContext {
  requestedModel?: string;
  releaseChannel?: string;
}

/**
 * Interface for the ModelConfigService to break circular dependencies.
 */
export interface IModelConfigService {
  getModelDefinition(modelId: string):
    | {
        tier?: string;
        family?: string;
        isPreview?: boolean;
        displayName?: string;
        features?: {
          thinking?: boolean;
          multimodalToolUse?: boolean;
        };
      }
    | undefined;

  resolveModelId(
    requestedModel: string,
    context?: ModelResolutionContext,
  ): string;

  resolveClassifierModelId(
    tier: string,
    requestedModel: string,
    context?: ModelResolutionContext,
  ): string;
}

/**
 * Interface defining the minimal configuration required for model capability checks.
 * This helps break circular dependencies between Config and models.ts.
 */
export interface ModelCapabilityContext {
  readonly modelConfigService: IModelConfigService;
  getExperimentalDynamicModelConfiguration(): boolean;
  hasLatestFlashGAAccess?(): boolean;
  hasLatestFlashLiteGAAccess?(): boolean;
  getHasAccessToPreviewModel?(): boolean;
}

export interface BackendMappingContext {
  hasLatestFlashGAAccess?: () => boolean;
  hasLatestFlashLiteGAAccess?: () => boolean;
}

/**
 * Harness has no backend-specific remapping. Always returns an empty map.
 * (Drops CCPA / Flash GA promotion mappings.)
 */
export function getBackendModelMappings(
  _context?: BackendMappingContext,
  _isCodeAssistBackend: boolean = true,
): Record<string, string> {
  return {};
}

function normalizeRequestedModel(requestedModel: unknown): string {
  if (Array.isArray(requestedModel)) {
    return String(requestedModel.at(-1) ?? '').trim() || '';
  }
  if (typeof requestedModel !== 'string') {
    return String(requestedModel ?? '').trim() || '';
  }
  return requestedModel.trim() || '';
}

/**
 * Generic resolver: validates/normalizes `provider/model#variant` refs via
 * providers/types parseModelRef, with fallback to the trimmed input (or the
 * harness default when empty). Extra args are ignored for call-site compat.
 */
export function resolveModel(
  requestedModel: string,
  ..._args: unknown[]
): string {
  const normalized = normalizeRequestedModel(requestedModel);
  if (!normalized) {
    return DEFAULT_HARNESS_MODEL;
  }
  if (normalized === 'auto') {
    return DEFAULT_HARNESS_MODEL;
  }
  try {
    const ref = parseModelRef(normalized);
    return `${ref.providerID}/${ref.model}${ref.variant ? `#${ref.variant}` : ''}`;
  } catch {
    return normalized;
  }
}

/**
 * Generic classifier resolver: resolves the classifier-selected alias when
 * present, otherwise falls back to the requested model.
 */
export function resolveClassifierModel(
  requestedModel: string,
  modelAlias: string,
  ..._args: unknown[]
): string {
  const alias =
    typeof modelAlias === 'string' ? modelAlias.trim() : String(modelAlias ?? '').trim();
  if (alias) {
    return resolveModel(alias);
  }
  return resolveModel(requestedModel);
}

export function getDisplayString(model: string, ..._args: unknown[]): string {
  return model || DEFAULT_HARNESS_MODEL;
}
