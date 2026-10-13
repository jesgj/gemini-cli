/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Telemetry no-op stub: metrics are never recorded.

export enum FileOperation {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
}

export enum PerformanceMetricType {
  STARTUP = 'startup',
  MEMORY = 'memory',
  CPU = 'cpu',
  TOOL_EXECUTION = 'tool_execution',
  API_REQUEST = 'api_request',
  TOKEN_EFFICIENCY = 'token_efficiency',
}

export enum MemoryMetricType {
  HEAP_USED = 'heap_used',
  HEAP_TOTAL = 'heap_total',
  EXTERNAL = 'external',
  RSS = 'rss',
}

export enum ToolExecutionPhase {
  VALIDATION = 'validation',
  PREPARATION = 'preparation',
  EXECUTION = 'execution',
  RESULT_PROCESSING = 'result_processing',
}

export enum ApiRequestPhase {
  REQUEST_PREPARATION = 'request_preparation',
  NETWORK_LATENCY = 'network_latency',
  RESPONSE_PROCESSING = 'response_processing',
  TOKEN_PROCESSING = 'token_processing',
}

export enum GenAiOperationName {
  GENERATE_CONTENT = 'generate_content',
}

export enum GenAiProviderName {
  GCP_GEN_AI = 'gcp.gen_ai',
  GCP_VERTEX_AI = 'gcp.vertex_ai',
}

export enum GenAiTokenType {
  INPUT = 'input',
  OUTPUT = 'output',
}

export function initializeMetrics(..._args: any[]): void {}
export function recordChatCompressionMetrics(..._args: any[]): void {}
export function recordToolCallMetrics(..._args: any[]): void {}
export function recordCustomTokenUsageMetrics(..._args: any[]): void {}
export function recordCustomApiResponseMetrics(..._args: any[]): void {}
export function recordApiErrorMetrics(..._args: any[]): void {}
export function recordFileOperationMetric(..._args: any[]): void {}
export function recordLinesChanged(..._args: any[]): void {}
export function recordOnboardingStart(..._args: any[]): void {}
export function recordOnboardingSuccess(..._args: any[]): void {}
export function recordFlickerFrame(..._args: any[]): void {}
export function recordExitFail(..._args: any[]): void {}
export function recordPlanExecution(..._args: any[]): void {}
export function recordSlowRender(..._args: any[]): void {}
export function recordInvalidChunk(..._args: any[]): void {}
export function recordRetryAttemptMetrics(..._args: any[]): void {}
export function recordContentRetry(..._args: any[]): void {}
export function recordContentRetryFailure(..._args: any[]): void {}
export function recordModelSlashCommand(..._args: any[]): void {}
export function recordModelRoutingMetrics(..._args: any[]): void {}
export function recordAgentRunMetrics(..._args: any[]): void {}
export function recordRecoveryAttemptMetrics(..._args: any[]): void {}
export function recordGenAiClientTokenUsage(..._args: any[]): void {}
export function recordGenAiClientOperationDuration(
  ..._args: any[]
): void {}
export function recordStartupPerformance(..._args: any[]): void {}
export function recordMemoryUsage(..._args: any[]): void {}
export function recordCpuUsage(..._args: any[]): void {}
export function recordEventLoopDelay(..._args: any[]): void {}
export function recordToolQueueDepth(..._args: any[]): void {}
export function recordToolExecutionBreakdown(..._args: any[]): void {}
export function recordTokenEfficiency(..._args: any[]): void {}
export function recordApiRequestBreakdown(..._args: any[]): void {}
export function recordPerformanceScore(..._args: any[]): void {}
export function recordPerformanceRegression(..._args: any[]): void {}
export function recordBaselineComparison(..._args: any[]): void {}
export function isPerformanceMonitoringActive(): boolean {
  return false;
}
export function recordTokenUsageMetrics(..._args: any[]): void {}
export function recordApiResponseMetrics(..._args: any[]): void {}
export function recordHookCallMetrics(..._args: any[]): void {}
export function recordKeychainAvailability(..._args: any[]): void {}
export function recordTokenStorageInitialization(..._args: any[]): void {}
export function recordOverageOptionSelected(..._args: any[]): void {}
export function recordCreditPurchaseClick(..._args: any[]): void {}
export function recordBrowserAgentConnection(..._args: any[]): void {}
export function recordBrowserAgentToolDiscovery(..._args: any[]): void {}
export function recordBrowserAgentVisionStatus(..._args: any[]): void {}
export function recordBrowserAgentTaskOutcome(..._args: any[]): void {}
export function recordBrowserAgentCleanup(..._args: any[]): void {}

export function getConventionAttributes(event: {
  model: string;
  auth_type?: string;
}): {
  'gen_ai.operation.name': GenAiOperationName;
  'gen_ai.provider.name': GenAiProviderName;
  'gen_ai.request.model': string;
  'gen_ai.response.model': string;
} {
  return {
    'gen_ai.operation.name': GenAiOperationName.GENERATE_CONTENT,
    'gen_ai.provider.name': GenAiProviderName.GCP_GEN_AI,
    'gen_ai.request.model': event.model,
    'gen_ai.response.model': event.model,
  };
}
