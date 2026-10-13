/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Minimal provider-neutral types (OpenCode-style: provider/model#variant).

export interface ProviderConfig {
  id: string;
  name?: string;
  package?: string;
  baseURL: string;
  apiKey?: string;
  env?: string[];
  headers?: Record<string, string>;
}

export interface ModelRef {
  providerID: string;
  model: string;
  variant?: string;
}

export function parseModelRef(raw: string): ModelRef {
  const [providerAndModel, variant] = raw.split('#', 2);
  const slash = providerAndModel.indexOf('/');
  if (slash <= 0 || slash === providerAndModel.length - 1) {
    throw new Error(
      `Invalid model ref "${raw}". Expected "provider/model" with optional "#variant".`,
    );
  }
  return {
    providerID: providerAndModel.slice(0, slash),
    model: providerAndModel.slice(slash + 1),
    ...(variant ? { variant } : {}),
  };
}

export interface ChatToolFunction {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: string;
  }>;
  toolCallId?: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  tools?: ChatToolFunction[];
  maxTokens?: number;
  temperature?: number;
}

export interface ChatResponse {
  content: string;
  toolCalls: Array<{ id: string; name: string; arguments: string }>;
  usage?: { input: number; output: number };
}

export interface LlmProvider {
  readonly id: string;
  chat(request: ChatRequest): Promise<ChatResponse>;
}
