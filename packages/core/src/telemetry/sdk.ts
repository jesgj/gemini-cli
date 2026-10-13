/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Telemetry no-op stub: the OpenTelemetry SDK is never started.

export function isTelemetrySdkInitialized(): boolean {
  return false;
}

export function bufferTelemetryEvent(
  _fn: () => void | Promise<void>,
): void {}

export async function initializeTelemetry(..._args: any[]): Promise<void> {}

export async function flushTelemetry(..._args: any[]): Promise<void> {}

export async function shutdownTelemetry(..._args: any[]): Promise<void> {}
