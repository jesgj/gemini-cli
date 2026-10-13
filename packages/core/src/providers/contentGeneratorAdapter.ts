/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FinishReason,
  GenerateContentResponse,
  type Content,
  type CountTokensParameters,
  type CountTokensResponse,
  type EmbedContentParameters,
  type EmbedContentResponse,
  type FunctionDeclaration,
  type GenerateContentConfig,
  type GenerateContentParameters,
  type Part,
  type Tool,
} from '@google/genai';
import type { ContentGenerator } from '../core/contentGenerator.js';
import type { LlmRole } from '../telemetry/llmRole.js';
import { estimateTokenCountSync } from '../utils/tokenCalculation.js';
import {
  parseModelRef,
  type ChatMessage,
  type ChatRequest,
  type ChatResponse,
  type ChatToolFunction,
  type LlmProvider,
} from './types.js';

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value ?? {});
  } catch {
    return '{}';
  }
}

function normalizeContents(
  contents: GenerateContentParameters['contents'],
): Content[] {
  if (typeof contents === 'string') {
    return [{ role: 'user', parts: [{ text: contents }] }];
  }
  if (Array.isArray(contents)) {
    if (contents.length === 0) {
      return [];
    }
    const first = contents[0] as unknown;
    if (typeof first === 'string') {
      return [
        {
          role: 'user',
          parts: (contents as unknown[]).map((c) =>
            typeof c === 'string' ? { text: c } : (c as Part),
          ),
        },
      ];
    }
    if (typeof first === 'object' && first !== null) {
      const record = first as Record<string, unknown>;
      if ('parts' in record || 'role' in record) {
        return contents as Content[];
      }
    }
    return [{ role: 'user', parts: contents as Part[] }];
  }
  if (typeof contents === 'object' && contents !== null) {
    const record = contents as Record<string, unknown>;
    if ('parts' in record || 'role' in record) {
      return [contents as Content];
    }
    return [{ role: 'user', parts: [contents as Part] }];
  }
  return [];
}

function systemInstructionToText(
  systemInstruction: GenerateContentConfig['systemInstruction'],
): string | undefined {
  if (!systemInstruction) {
    return undefined;
  }
  if (typeof systemInstruction === 'string') {
    return systemInstruction;
  }
  if (Array.isArray(systemInstruction)) {
    const text = (systemInstruction as unknown[])
      .map((p) => (typeof p === 'string' ? p : (p as Part).text ?? ''))
      .join('');
    return text.trim() ? text : undefined;
  }
  const obj = systemInstruction as Content | Part;
  if ('parts' in obj && Array.isArray((obj as Content).parts)) {
    const text = ((obj as Content).parts ?? [])
      .map((p) => p.text ?? '')
      .join('');
    return text.trim() ? text : undefined;
  }
  if ('text' in obj && typeof (obj as Part).text === 'string') {
    return (obj as Part).text as string;
  }
  return undefined;
}

function declarationToChatTool(
  fd: FunctionDeclaration,
): ChatToolFunction | undefined {
  if (!fd?.name) {
    return undefined;
  }
  const parameters = (fd.parametersJsonSchema ?? fd.parameters ?? {
    type: 'object',
    properties: {},
  }) as Record<string, unknown>;
  return {
    name: fd.name,
    description: fd.description ?? '',
    parameters,
  };
}

export function toChatTools(
  tools: GenerateContentConfig['tools'],
): ChatToolFunction[] | undefined {
  if (!tools) {
    return undefined;
  }
  const list = (Array.isArray(tools) ? tools : [tools]) as Tool[];
  const out: ChatToolFunction[] = [];
  for (const tool of list) {
    if (!tool || typeof tool !== 'object') {
      continue;
    }
    if (
      'functionDeclarations' in tool &&
      Array.isArray(tool.functionDeclarations)
    ) {
      for (const fd of tool.functionDeclarations ?? []) {
        const mapped = declarationToChatTool(fd);
        if (mapped) {
          out.push(mapped);
        }
      }
    } else if ('name' in tool) {
      const mapped = declarationToChatTool(
        tool as unknown as FunctionDeclaration,
      );
      if (mapped) {
        out.push(mapped);
      }
    }
  }
  return out.length > 0 ? out : undefined;
}

function functionResponseToText(fr: NonNullable<Part['functionResponse']>): string {
  const response = fr.response as unknown;
  if (typeof response === 'string') {
    return response;
  }
  if (response && typeof response === 'object') {
    const record = response as Record<string, unknown>;
    const output = record['output'];
    if (typeof output === 'string') {
      return output;
    }
    return safeStringify(response);
  }
  return '';
}

function fallbackPartText(part: Part): string {
  if (typeof part.text === 'string' && part.text) {
    return part.text;
  }
  if (part.functionCall || part.functionResponse) {
    return '';
  }
  if ('inlineData' in part || 'fileData' in part) {
    return '[media]';
  }
  const keys = Object.keys(part).filter(
    (k) => k !== 'thought' && k !== 'thoughtSignature',
  );
  if (keys.length === 0) {
    return '';
  }
  return safeStringify(part);
}

export function contentsToMessages(contents: Content[]): ChatMessage[] {
  const messages: ChatMessage[] = [];
  for (const content of contents) {
    const parts = content.parts ?? [];
    const text = parts
      .filter((p) => typeof p.text === 'string' && p.text && !p.thought)
      .map((p) => p.text as string)
      .join('');
    if (content.role === 'model') {
      const calls = parts.filter((p) => p.functionCall?.name);
      if (calls.length > 0) {
        messages.push({
          role: 'assistant',
          content: text,
          toolCalls: calls.map((p) => {
            const fc = p.functionCall!;
            return {
              id: fc.id ?? fc.name ?? '',
              name: fc.name ?? 'unknown',
              arguments: safeStringify(fc.args ?? {}),
            };
          }),
        });
      } else if (text) {
        messages.push({ role: 'assistant', content: text });
      } else {
        const fallback = parts.map(fallbackPartText).join('').trim();
        if (fallback) {
          messages.push({ role: 'assistant', content: fallback });
        }
      }
    } else {
      const responses = parts.filter((p) => p.functionResponse?.name);
      if (responses.length > 0) {
        if (text) {
          messages.push({ role: 'user', content: text });
        }
        for (const p of responses) {
          const fr = p.functionResponse!;
          messages.push({
            role: 'tool',
            content: functionResponseToText(fr),
            toolCallId: fr.id ?? fr.name ?? '',
          });
        }
      } else if (text) {
        messages.push({ role: 'user', content: text });
      } else {
        const fallback = parts.map(fallbackPartText).join('').trim();
        messages.push({ role: 'user', content: fallback });
      }
    }
  }
  return messages;
}

export function toChatRequest(
  request: GenerateContentParameters,
  modelName: string,
): ChatRequest {
  const contents = normalizeContents(request.contents);
  const messages: ChatMessage[] = [];
  const system = systemInstructionToText(request.config?.systemInstruction);
  if (system) {
    messages.push({ role: 'system', content: system });
  }
  messages.push(...contentsToMessages(contents));
  const tools = toChatTools(request.config?.tools);
  return {
    model: modelName,
    messages,
    ...(tools ? { tools } : {}),
    ...(request.config?.maxOutputTokens
      ? { maxTokens: request.config.maxOutputTokens }
      : {}),
    ...(request.config?.temperature !== undefined
      ? { temperature: request.config.temperature }
      : {}),
  };
}

export function fromChatResponse(
  response: ChatResponse,
  modelName: string,
): GenerateContentResponse {
  const parts: Part[] = [];
  if (response.content) {
    parts.push({ text: response.content });
  }
  for (const tc of response.toolCalls ?? []) {
    let args: Record<string, unknown> = {};
    try {
      const parsed: unknown = JSON.parse(tc.arguments || '{}');
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        args = parsed as Record<string, unknown>;
      }
    } catch {
      args = {};
    }
    parts.push({
      functionCall: { name: tc.name, args, id: tc.id },
    });
  }
  const out = new GenerateContentResponse();
  out.candidates = [
    {
      index: 0,
      content: { role: 'model', parts },
      finishReason: FinishReason.STOP,
    },
  ];
  if (response.usage) {
    out.usageMetadata = {
      promptTokenCount: response.usage.input,
      candidatesTokenCount: response.usage.output,
      totalTokenCount: response.usage.input + response.usage.output,
    };
  }
  out.modelVersion = modelName;
  return out;
}

/**
 * Minimal provider-agnostic ContentGenerator for the own harness.
 *
 * Routes `provider/model#variant` refs to an {@link LlmProvider} map,
 * converts Gemini contents/tools to an OpenAI-compatible {@link ChatRequest},
 * and converts the single chat completion back to one
 * {@link GenerateContentResponse} chunk.
 */
export class ProviderContentGenerator implements ContentGenerator {
  constructor(
    private readonly providers: Map<string, LlmProvider>,
    private readonly defaultModelRef?: string,
  ) {}

  private resolve(requestModel: string): {
    provider: LlmProvider;
    modelName: string;
  } {
    const trimmed = (requestModel ?? '').trim();
    if (trimmed.includes('/')) {
      const ref = parseModelRef(trimmed);
      const provider = this.providers.get(ref.providerID);
      if (!provider) {
        throw new Error(
          `Unknown provider "${ref.providerID}" for model "${trimmed}". Known providers: ${[...this.providers.keys()].join(', ') || '(none)'}`,
        );
      }
      return { provider, modelName: ref.model };
    }
    if (this.defaultModelRef?.includes('/')) {
      const ref = parseModelRef(this.defaultModelRef);
      const provider = this.providers.get(ref.providerID);
      if (!provider) {
        throw new Error(
          `Unknown default provider "${ref.providerID}". Known providers: ${[...this.providers.keys()].join(', ') || '(none)'}`,
        );
      }
      return { provider, modelName: trimmed || ref.model };
    }
    if (this.providers.size === 1) {
      const provider = [...this.providers.values()][0];
      return { provider, modelName: trimmed };
    }
    throw new Error(
      `Cannot resolve model "${trimmed}": expected "provider/model[#variant]" and no default model is configured.`,
    );
  }

  async generateContent(
    request: GenerateContentParameters,
    _userPromptId: string,
    _role: LlmRole,
  ): Promise<GenerateContentResponse> {
    const { provider, modelName } = this.resolve(request.model);
    const chatResponse = await provider.chat(toChatRequest(request, modelName));
    return fromChatResponse(chatResponse, modelName);
  }

  async generateContentStream(
    request: GenerateContentParameters,
    userPromptId: string,
    role: LlmRole,
  ): Promise<AsyncGenerator<GenerateContentResponse>> {
    const response = await this.generateContent(request, userPromptId, role);
    async function* single(): AsyncGenerator<GenerateContentResponse> {
      yield response;
    }
    return single();
  }

  async countTokens(
    request: CountTokensParameters,
  ): Promise<CountTokensResponse> {
    const contents = normalizeContents(request.contents);
    const parts = contents.flatMap((c) => c.parts ?? []);
    const totalTokens = Math.ceil(estimateTokenCountSync(parts));
    return { totalTokens };
  }

  async embedContent(
    _request: EmbedContentParameters,
  ): Promise<EmbedContentResponse> {
    throw new Error(
      'embedContent is not supported by ProviderContentGenerator.',
    );
  }
}
