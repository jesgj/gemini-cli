/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenAICompatibleProvider } from './openaiCompatible.js';
import { parseModelRef, type LlmProvider } from './types.js';

export interface ProvidersFile {
  default?: string;
  providers?: Record<
    string,
    {
      name?: string;
      baseURL?: string;
      apiKey?: string;
      env?: string[];
      headers?: Record<string, string>;
    }
  >;
}

function resolveApiKey(
  entry: { apiKey?: string; env?: string[] },
  env: NodeJS.ProcessEnv,
): string | undefined {
  if (entry.apiKey) return entry.apiKey;
  for (const name of entry.env ?? []) {
    const v = env[name];
    if (v) return v;
  }
  return undefined;
}

export function loadProviders(
  file: ProvidersFile,
  env: NodeJS.ProcessEnv = process.env,
): { providers: Map<string, LlmProvider>; defaultModel: string } {
  const providers = new Map<string, LlmProvider>();
  for (const [id, entry] of Object.entries(file.providers ?? {})) {
    if (!entry.baseURL) continue;
    providers.set(
      id,
      new OpenAICompatibleProvider({
        id,
        baseURL: entry.baseURL,
        apiKey: resolveApiKey(entry, env),
        headers: entry.headers,
      }),
    );
  }
  // Back-compat: single Gemini backend becomes just one provider.
  if (providers.size === 0 && env['GEMINI_API_KEY']) {
    providers.set(
      'gemini',
      new OpenAICompatibleProvider({
        id: 'gemini',
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
        apiKey: env['GEMINI_API_KEY'],
      }),
    );
  }
  const defaultModel =
    file.default ?? (providers.has('gemini') ? 'gemini/gemini-2.5-flash' : '');
  if (defaultModel) parseModelRef(defaultModel);
  return { providers, defaultModel };
}
