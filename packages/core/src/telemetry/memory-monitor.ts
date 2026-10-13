/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Telemetry no-op stub: memory monitoring is disabled. Export names are kept
// so existing imports keep resolving.

export interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  arrayBuffers: number;
  heapSizeLimit: number;
}

export interface ProcessMetrics {
  cpuUsage: NodeJS.CpuUsage;
  memoryUsage: NodeJS.MemoryUsage;
  uptime: number;
}

function emptySnapshot(): MemorySnapshot {
  return {
    timestamp: Date.now(),
    heapUsed: 0,
    heapTotal: 0,
    external: 0,
    rss: 0,
    arrayBuffers: 0,
    heapSizeLimit: 0,
  };
}

export class MemoryMonitor {
  start(..._args: any[]): void {}

  stop(..._args: any[]): void {}

  takeSnapshot(_context: string, ..._args: any[]): MemorySnapshot {
    return emptySnapshot();
  }

  getCurrentMemoryUsage(): MemorySnapshot {
    return emptySnapshot();
  }

  getMemoryGrowth(): Partial<MemorySnapshot> | null {
    return null;
  }

  getHeapStatistics(): Record<string, number> {
    return {};
  }

  getHeapSpaceStatistics(): Array<Record<string, unknown>> {
    return [];
  }

  getProcessMetrics(): ProcessMetrics {
    return {
      cpuUsage: { user: 0, system: 0 },
      memoryUsage: {
        rss: 0,
        heapTotal: 0,
        heapUsed: 0,
        external: 0,
        arrayBuffers: 0,
      },
      uptime: 0,
    };
  }

  recordComponentMemoryUsage(..._args: any[]): MemorySnapshot {
    return emptySnapshot();
  }

  checkMemoryThreshold(..._args: any[]): boolean {
    return false;
  }

  getMemoryUsageSummary(): {
    heapUsedMB: number;
    heapTotalMB: number;
    externalMB: number;
    rssMB: number;
    heapSizeLimitMB: number;
  } {
    return {
      heapUsedMB: 0,
      heapTotalMB: 0,
      externalMB: 0,
      rssMB: 0,
      heapSizeLimitMB: 0,
    };
  }

  setEnhancedMonitoring(..._args: any[]): void {}

  getHighWaterMarkStats(): Record<string, number> {
    return {};
  }

  getRateLimitingStats(): {
    totalMetrics: number;
    oldestRecord: number;
    newestRecord: number;
    averageInterval: number;
  } {
    return {
      totalMetrics: 0,
      oldestRecord: 0,
      newestRecord: 0,
      averageInterval: 0,
    };
  }

  forceRecordMemory(..._args: any[]): MemorySnapshot {
    return emptySnapshot();
  }

  resetHighWaterMarks(): void {}

  captureHeapSnapshot(): string | null {
    return null;
  }

  destroy(): void {}
}

export function initializeMemoryMonitor(): MemoryMonitor {
  return new MemoryMonitor();
}

export function getMemoryMonitor(): MemoryMonitor | null {
  return null;
}

export function recordCurrentMemoryUsage(
  _config: unknown,
  _context: string,
): MemorySnapshot {
  return emptySnapshot();
}

export function startGlobalMemoryMonitoring(..._args: any[]): void {}

export function stopGlobalMemoryMonitoring(..._args: any[]): void {}

export function _resetGlobalMemoryMonitorForTests(): void {}
