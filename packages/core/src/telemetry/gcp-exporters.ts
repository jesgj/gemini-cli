/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Telemetry no-op stub: GCP exporters do nothing. Export names are kept so
// existing imports keep resolving.

export class GcpTraceExporter {
  constructor(..._args: any[]) {}

  async forceFlush(): Promise<void> {}
}

export class GcpMetricExporter {
  constructor(..._args: any[]) {}

  export(..._args: any[]): void {}
}

export class GcpLogExporter {
  constructor(..._args: any[]) {}

  export(..._args: any[]): void {}

  async forceFlush(): Promise<void> {}

  async shutdown(): Promise<void> {}
}
