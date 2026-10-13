/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import type {
  CountTokensParameters,
  EmbedContentParameters,
  GenerateContentParameters,
  GenerateContentResponse,
} from '@google/genai';
import { LlmRole } from '../telemetry/llmRole.js';
import { OpenAICompatibleProvider } from './openaiCompatible.js';
import {
  ProviderContentGenerator,
  toChatRequest,
} from './contentGeneratorAdapter.js';

function buildRequest(): GenerateContentParameters {
  return {
    model: 'test/coder',
    contents: [
      { role: 'user', parts: [{ text: 'hello' }] },
      {
        role: 'model',
        parts: [
          { text: 'working' },
          {
            functionCall: {
              name: 'read_file',
              args: { path: 'a.txt' },
              id: 'call_1',
            },
          },
        ],
      },
      {
        role: 'user',
        parts: [
          {
            functionResponse: {
              name: 'read_file',
              response: { output: 'file contents' },
              id: 'call_1',
            },
          },
        ],
      },
      { role: 'user', parts: [{ text: 'now do X' }] },
    ],
    config: {
      systemInstruction: 'You are a coder.',
      tools: [
        {
          functionDeclarations: [
            {
              name: 'read_file',
              description: 'Read a file',
              parametersJsonSchema: {
                type: 'object',
                properties: { path: { type: 'string' } },
              },
            },
          ],
        },
      ],
    },
  };
}

describe('ProviderContentGenerator', () => {
  it('converts history, system instruction, and tools to a ChatRequest', () => {
    const chat = toChatRequest(buildRequest(), 'coder');
    expect(chat.model).toBe('coder');
    expect(chat.messages[0]).toEqual({
      role: 'system',
      content: 'You are a coder.',
    });
    expect(chat.messages[1]).toEqual({ role: 'user', content: 'hello' });
    expect(chat.messages[2]).toEqual({
      role: 'assistant',
      content: 'working',
      toolCalls: [
        {
          id: 'call_1',
          name: 'read_file',
          arguments: JSON.stringify({ path: 'a.txt' }),
        },
      ],
    });
    expect(chat.messages[3]).toEqual({
      role: 'tool',
      content: 'file contents',
      toolCallId: 'call_1',
    });
    expect(chat.messages[4]).toEqual({ role: 'user', content: 'now do X' });
    expect(chat.tools).toEqual([
      {
        name: 'read_file',
        description: 'Read a file',
        parameters: {
          type: 'object',
          properties: { path: { type: 'string' } },
        },
      },
    ]);
  });

  it('round-trips tool calls through stubbed fetch', async () => {
    const seen: Array<{ url: string; body: Record<string, unknown> }> = [];
    const orig = globalThis.fetch;
    // @ts-expect-error test stub
    globalThis.fetch = async (url: string, init: { body: string }) => {
      seen.push({ url, body: JSON.parse(init.body) as Record<string, unknown> });
      return {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'done',
                tool_calls: [
                  {
                    id: 'call_2',
                    function: {
                      name: 'write_file',
                      arguments: JSON.stringify({ path: 'b.txt' }),
                    },
                  },
                ],
              },
            },
          ],
          usage: { prompt_tokens: 5, completion_tokens: 7 },
        }),
      };
    };
    try {
      const providers = new Map([
        [
          'test',
          new OpenAICompatibleProvider({
            id: 'test',
            baseURL: 'http://harness/v1',
          }),
        ],
      ]);
      const adapter = new ProviderContentGenerator(providers, 'test/coder');
      const response = await adapter.generateContent(
        buildRequest(),
        'prompt-1',
        LlmRole.MAIN,
      );
      expect(seen).toHaveLength(1);
      expect(seen[0].url).toBe('http://harness/v1/chat/completions');
      const body = seen[0].body;
      expect(body['model']).toBe('coder');
      expect(body).toHaveProperty('tools');
      expect(body).toHaveProperty('messages');
      const parts = response.candidates?.[0]?.content?.parts ?? [];
      expect(parts).toContainEqual({ text: 'done' });
      expect(parts).toContainEqual({
        functionCall: {
          name: 'write_file',
          args: { path: 'b.txt' },
          id: 'call_2',
        },
      });
      expect(response.usageMetadata?.promptTokenCount).toBe(5);
      expect(response.usageMetadata?.candidatesTokenCount).toBe(7);
    } finally {
      globalThis.fetch = orig;
    }
  });

  it('yields a single chunk from generateContentStream', async () => {
    const orig = globalThis.fetch;
    // @ts-expect-error test stub
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'streamed' } }],
      }),
    });
    try {
      const providers = new Map([
        [
          'test',
          new OpenAICompatibleProvider({
            id: 'test',
            baseURL: 'http://harness/v1',
          }),
        ],
      ]);
      const adapter = new ProviderContentGenerator(providers, 'test/coder');
      const stream = await adapter.generateContentStream(
        {
          model: 'test/coder',
          contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
        },
        'prompt-2',
        LlmRole.MAIN,
      );
      const chunks: GenerateContentResponse[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      expect(chunks).toHaveLength(1);
      expect(chunks[0].candidates?.[0]?.content?.parts).toContainEqual({
        text: 'streamed',
      });
    } finally {
      globalThis.fetch = orig;
    }
  });

  it('estimates countTokens and rejects embedContent', async () => {
    const adapter = new ProviderContentGenerator(new Map(), 'test/coder');
    const count = await adapter.countTokens({
      model: 'test/coder',
      contents: [{ role: 'user', parts: [{ text: 'hello world' }] }],
    } as CountTokensParameters);
    expect(count.totalTokens).toBeGreaterThan(0);
    await expect(
      adapter.embedContent({
        model: 'test/coder',
        contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
      } as EmbedContentParameters),
    ).rejects.toThrow('embedContent is not supported');
  });
});
