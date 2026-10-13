/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Telemetry no-op stub: all log functions intentionally do nothing.
// Signatures accept anything so existing call sites keep compiling.

export function logCliConfiguration(..._args: any[]): void {}
export function logUserPrompt(..._args: any[]): void {}
export function logToolCall(..._args: any[]): void {}
export function logToolOutputTruncated(..._args: any[]): void {}
export function logToolOutputMasking(..._args: any[]): void {}
export function logFileOperation(..._args: any[]): void {}
export function logApiRequest(..._args: any[]): void {}
export function logFlashFallback(..._args: any[]): void {}
export function logRipgrepFallback(..._args: any[]): void {}
export function logApiError(..._args: any[]): void {}
export function logApiResponse(..._args: any[]): void {}
export function logLoopDetected(..._args: any[]): void {}
export function logLoopDetectionDisabled(..._args: any[]): void {}
export function logNextSpeakerCheck(..._args: any[]): void {}
export function logSlashCommand(..._args: any[]): void {}
export function logRewind(..._args: any[]): void {}
export function logIdeConnection(..._args: any[]): void {}
export function logConversationFinishedEvent(..._args: any[]): void {}
export function logChatCompression(..._args: any[]): void {}
export function logMalformedJsonResponse(..._args: any[]): void {}
export function logInvalidChunk(..._args: any[]): void {}
export function logNetworkRetryAttempt(..._args: any[]): void {}
export function logContentRetry(..._args: any[]): void {}
export function logContentRetryFailure(..._args: any[]): void {}
export function logModelRouting(..._args: any[]): void {}
export function logModelSlashCommand(..._args: any[]): void {}
export async function logExtensionInstallEvent(
  ..._args: any[]
): Promise<void> {}
export async function logExtensionUninstall(
  ..._args: any[]
): Promise<void> {}
export async function logExtensionUpdateEvent(
  ..._args: any[]
): Promise<void> {}
export async function logExtensionEnable(..._args: any[]): Promise<void> {}
export async function logExtensionDisable(
  ..._args: any[]
): Promise<void> {}
export function logEditStrategy(..._args: any[]): void {}
export function logEditCorrectionEvent(..._args: any[]): void {}
export function logAgentStart(..._args: any[]): void {}
export function logAgentFinish(..._args: any[]): void {}
export function logRecoveryAttempt(..._args: any[]): void {}
export function logWebFetchFallbackAttempt(..._args: any[]): void {}
export function logLlmLoopCheck(..._args: any[]): void {}
export function logApprovalModeSwitch(..._args: any[]): void {}
export function logApprovalModeDuration(..._args: any[]): void {}
export function logPlanExecution(..._args: any[]): void {}
export function logHookCall(..._args: any[]): void {}
export function logStartupStats(..._args: any[]): void {}
export function logKeychainAvailability(..._args: any[]): void {}
export function logTokenStorageInitialization(..._args: any[]): void {}
export function logOnboardingStart(..._args: any[]): void {}
export function logOnboardingSuccess(..._args: any[]): void {}
export function logBillingEvent(..._args: any[]): void {}
export function logBrowserAgentConnection(..._args: any[]): void {}
export function logBrowserAgentVisionStatus(..._args: any[]): void {}
export function logBrowserAgentTaskOutcome(..._args: any[]): void {}
export function logBrowserAgentCleanup(..._args: any[]): void {}
