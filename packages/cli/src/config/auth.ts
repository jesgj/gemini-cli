/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthType, loadApiKey } from '@google/gemini-cli-core';
import { loadEnvironment, loadSettings } from './settings.js';

// Minimal harness: OAuth (LOGIN_WITH_GOOGLE), ADC (COMPUTE_ADC) and legacy
// Cloud Shell auth were removed. Only env-key auth (USE_GEMINI via
// GEMINI_API_KEY, USE_VERTEX_AI via GOOGLE_API_KEY) and custom gateways
// (GATEWAY via OWN_HARNESS_BASE_URL / OPENAI_BASE_URL) are supported.
const REMOVED_AUTH_TYPES: string[] = [
  AuthType.LOGIN_WITH_GOOGLE,
  AuthType.COMPUTE_ADC,
  AuthType.LEGACY_CLOUD_SHELL,
];

export async function validateAuthMethod(
  authMethod: string,
): Promise<string | null> {
  loadEnvironment(loadSettings().merged, process.cwd());
  if (REMOVED_AUTH_TYPES.includes(authMethod)) {
    return (
      `Authentication method "${authMethod}" was removed in the minimal harness.\n` +
      'Use an API key instead: set GEMINI_API_KEY (or GOOGLE_API_KEY) and select "Use Gemini API Key".\n' +
      'For a custom gateway, set OWN_HARNESS_BASE_URL (or OPENAI_BASE_URL).'
    );
  }

  if (authMethod === AuthType.USE_GEMINI) {
    const key =
      process.env['GEMINI_API_KEY'] ||
      process.env['OWN_HARNESS_API_KEY'] ||
      process.env['OPENAI_API_KEY'] ||
      (await loadApiKey());
    if (!key) {
      return (
        'When using Gemini API, you must specify the GEMINI_API_KEY environment variable.\n' +
        'Update your environment and try again (no reload needed if using .env)!'
      );
    }
    return null;
  }

  if (authMethod === AuthType.USE_VERTEX_AI) {
    const hasVertexProjectLocationConfig =
      !!process.env['GOOGLE_CLOUD_PROJECT'] &&
      !!process.env['GOOGLE_CLOUD_LOCATION'];
    const hasGoogleApiKey = !!process.env['GOOGLE_API_KEY'];
    if (!hasVertexProjectLocationConfig && !hasGoogleApiKey) {
      return (
        'When using Vertex AI, you must specify either:\n' +
        '• GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION environment variables.\n' +
        '• GOOGLE_API_KEY environment variable (if using express mode).\n' +
        'Update your environment and try again (no reload needed if using .env)!'
      );
    }
    return null;
  }

  if (authMethod === AuthType.GATEWAY) {
    const baseUrl =
      process.env['OWN_HARNESS_BASE_URL'] ||
      process.env['OPENAI_BASE_URL'] ||
      process.env['GOOGLE_GEMINI_BASE_URL'];
    if (!baseUrl) {
      return (
        'When using a custom gateway, you must specify the OWN_HARNESS_BASE_URL (or OPENAI_BASE_URL) environment variable.\n' +
        'Update your environment and try again (no reload needed if using .env)!'
      );
    }
    return null;
  }

  return 'Invalid auth method selected.';
}
