/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as path from 'node:path';
import * as fs from 'node:fs';
import { homedir, GEMINI_DIR } from '../utils/paths.js';
import { WhisperTranscriptionProvider } from './whisperTranscriptionProvider.js';
import type { TranscriptionProvider } from './transcriptionProvider.js';

export class TranscriptionFactory {
  static createProvider(
    voiceConfig: { backend?: string; whisperModel?: string } | undefined,
    _apiKey?: string,
  ): TranscriptionProvider {
    // Own-harness: whisper is the only backend. 'gemini-live' is no longer
    // supported and resolves to whisper for backwards compatibility.
    const modelsDir = path.join(homedir(), GEMINI_DIR, 'whisper_models');
    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir, { recursive: true });
    }

    const modelName = voiceConfig?.whisperModel ?? 'ggml-base.en.bin';
    const modelPath = path.join(modelsDir, modelName);

    return new WhisperTranscriptionProvider({
      modelPath,
      threads: 4,
      step: 0,
      length: 5000,
    });
  }
}
