/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { OpenAICompatibleProvider } from './openaiCompatible.js';
import { loadProviders } from './registry.js';
import { parseModelRef } from './types.js';

describe('providers stepping stone', () => {
  it('parses provider/model#variant', () => {
    expect(parseModelRef('openai/gpt-5.2#high')).toEqual({
      providerID: 'openai',
      model: 'gpt-5.2',
      variant: 'high',
    });
    expect(parseModelRef('ollama/qwen3:8b')).toEqual({
      providerID: 'ollama',
      model: 'qwen3:8b',
    });
    expect(() => parseModelRef('nope')).toThrow();
  });

  it('loads providers from file + env', () => {
    const { providers, defaultModel } = loadProviders(
      {
        default: 'local/coder',
        providers: {
          local: {
            baseURL: 'http://127.0.0.1:1234/v1',
            env: ['LOCAL_API_KEY'],
          },
        },
      },
      { LOCAL_API_KEY: 'k' },
    );
    expect(defaultModel).toBe('local/coder');
    expect(providers.has('local')).toBe(true);
  });

  it('posts OpenAI chat shape', async () => {
    const seen: Array<{ url: string; body: unknown }> = [];
    const orig = globalThis.fetch;
    // @ts-expect-error test stub
    globalThis.fetch = async (url: string, init: { body: string }) => {
      seen.push({ url, body: JSON.parse(init.body) });
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'hi', tool_calls: [] } }],
          usage: { prompt_tokens: 1, completion_tokens: 1 },
        }),
      };
    };
    try {
      const p = new OpenAICompatibleProvider({
        id: 'local',
        baseURL: 'http://x/v1/',
        apiKey: 'k',
      });
      const out = await p.chat({
        model: 'coder',
        messages: [{ role: 'user', content: 'hi' }],
      });
      expect(out.content).toBe('hi');
      expect(seen[0].url).toBe('http://x/v1/chat/completions');
    } finally {
      globalThis.fetch = orig;
    }
  });
});
