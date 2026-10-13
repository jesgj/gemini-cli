/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  ChatRequest,
  ChatResponse,
  LlmProvider,
  ProviderConfig,
} from './types.js';

function toOpenAITools(tools: ChatRequest['tools']) {
  if (!tools?.length) return undefined;
  return tools.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description ?? '',
      parameters: t.parameters ?? { type: 'object', properties: {} },
    },
  }));
}

function toOpenAIMessages(messages: ChatRequest['messages']) {
  return messages.map((m) => {
    if (m.role === 'assistant' && m.toolCalls?.length) {
      return {
        role: 'assistant' as const,
        content: m.content ?? '',
        tool_calls: m.toolCalls.map((c) => ({
          id: c.id,
          type: 'function' as const,
          function: { name: c.name, arguments: c.arguments },
        })),
      };
    }
    if (m.role === 'tool') {
      return {
        role: 'tool' as const,
        content: m.content,
        tool_call_id: m.toolCallId ?? '',
      };
    }
    return { role: m.role as 'system' | 'user', content: m.content };
  });
}

export class OpenAICompatibleProvider implements LlmProvider {
  readonly id: string;
  private readonly baseURL: string;
  private readonly apiKey?: string;
  private readonly headers: Record<string, string>;

  constructor(config: ProviderConfig) {
    this.id = config.id;
    this.baseURL = config.baseURL.replace(/\/+$/, '');
    this.apiKey = config.apiKey;
    this.headers = config.headers ?? {};
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const res = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}),
        ...this.headers,
      },
      body: JSON.stringify({
        model: request.model,
        messages: toOpenAIMessages(request.messages),
        ...(request.tools?.length
          ? { tools: toOpenAITools(request.tools) }
          : {}),
        ...(request.maxTokens ? { max_tokens: request.maxTokens } : {}),
        ...(request.temperature !== undefined
          ? { temperature: request.temperature }
          : {}),
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(
        `Provider ${this.id} chat failed: ${res.status} ${text.slice(0, 500)}`,
      );
    }
    const json = (await res.json()) as {
      choices?: Array<{
        message?: {
          content?: string | null;
          tool_calls?: Array<{
            id: string;
            function: { name: string; arguments: string };
          }>;
        };
      }>;
      usage?: { prompt_tokens: number; completion_tokens: number };
    };
    const msg = json.choices?.[0]?.message;
    return {
      content: msg?.content ?? '',
      toolCalls: (msg?.tool_calls ?? []).map((c) => ({
        id: c.id,
        name: c.function.name,
        arguments: c.function.arguments,
      })),
      ...(json.usage
        ? {
            usage: {
              input: json.usage.prompt_tokens,
              output: json.usage.completion_tokens,
            },
          }
        : {}),
    };
  }
}
