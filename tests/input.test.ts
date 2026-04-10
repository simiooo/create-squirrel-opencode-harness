import { describe, it, expect } from 'vitest';
import { resolveInput } from '../src/input.js';

describe('Input Resolution', () => {
  describe('Priority handling', () => {
    it('should prioritize positional argument over --model option', async () => {
      const result = await resolveInput({
        positionalModel: 'from-positional',
        model: 'from-option'
      });
      expect(result).toBe('from-positional');
    });

    it('should prioritize --model option over --stdin', async () => {
      const result = await resolveInput({
        model: 'from-option',
        stdin: true
      });
      expect(result).toBe('from-option');
    });

    // Note: Test for empty input is skipped because it triggers interactive mode
    // which causes test timeouts in non-TTY environments
  });

  describe('Model Validation', () => {
    it('should accept various model identifier formats', async () => {
      const formats = [
        'fireworks-ai/accounts/fireworks/routers/kimi-k2p5-turbo',
        'openai/gpt-4',
        'anthropic/claude-3-sonnet',
        'custom-model',
        'vendor/model/version'
      ];

      for (const format of formats) {
        const result = await resolveInput({ positionalModel: format });
        expect(result).toBe(format);
      }
    });
  });
});
