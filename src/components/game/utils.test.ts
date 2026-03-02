import { describe, it, expect, vi, beforeEach } from 'vitest';
import { midiToJianpu, KEY_TO_MIDI, JUDGMENT_THRESHOLDS } from './utils';

describe('Game Utils', () => {
  describe('midiToJianpu', () => {
    it('should convert MIDI 60 (C4) to "1"', () => {
      expect(midiToJianpu(60)).toBe('1');
    });

    it('should convert MIDI 62 (D4) to "2"', () => {
      expect(midiToJianpu(62)).toBe('2');
    });

    it('should convert MIDI 64 (E4) to "3"', () => {
      expect(midiToJianpu(64)).toBe('3');
    });

    it('should convert MIDI 65 (F4) to "4"', () => {
      expect(midiToJianpu(65)).toBe('4');
    });

    it('should convert MIDI 67 (G4) to "5"', () => {
      expect(midiToJianpu(67)).toBe('5');
    });

    it('should convert MIDI 69 (A4) to "6"', () => {
      expect(midiToJianpu(69)).toBe('6');
    });

    it('should convert MIDI 71 (B4) to "7"', () => {
      expect(midiToJianpu(71)).toBe('7');
    });

    it('should convert MIDI 72 (C5) to "1" (uppercase for higher octave)', () => {
      expect(midiToJianpu(72)).toBe('1');
    });

    it('should convert MIDI 48 (C3) to "1" (lowercase for lower octave)', () => {
      expect(midiToJianpu(48)).toBe('1');
    });

    it('should handle invalid MIDI notes', () => {
      // MIDI 61 is C#4, which is not in the jianpuMap
      expect(midiToJianpu(61)).toBe('?');
    });
  });

  describe('KEY_TO_MIDI', () => {
    it('should map "z" key to MIDI 60 (C4)', () => {
      expect(KEY_TO_MIDI['z']).toBe(60);
    });

    it('should map "x" key to MIDI 62 (D4)', () => {
      expect(KEY_TO_MIDI['x']).toBe(62);
    });

    it('should map "c" key to MIDI 64 (E4)', () => {
      expect(KEY_TO_MIDI['c']).toBe(64);
    });

    it('should map "v" key to MIDI 65 (F4)', () => {
      expect(KEY_TO_MIDI['v']).toBe(65);
    });

    it('should map "b" key to MIDI 67 (G4)', () => {
      expect(KEY_TO_MIDI['b']).toBe(67);
    });

    it('should map "n" key to MIDI 69 (A4)', () => {
      expect(KEY_TO_MIDI['n']).toBe(69);
    });

    it('should map "m" key to MIDI 71 (B4)', () => {
      expect(KEY_TO_MIDI['m']).toBe(71);
    });

    it('should map "q" key to MIDI 72 (C5)', () => {
      expect(KEY_TO_MIDI['q']).toBe(72);
    });

    it('should include black key mappings', () => {
      expect(KEY_TO_MIDI['s']).toBe(61); // C#4
      expect(KEY_TO_MIDI['d']).toBe(63); // D#4
      expect(KEY_TO_MIDI['g']).toBe(66); // F#4
    });
  });

  describe('JUDGMENT_THRESHOLDS', () => {
    it('should have PERFECT threshold of 50', () => {
      expect(JUDGMENT_THRESHOLDS.PERFECT).toBe(50);
    });

    it('should have GOOD threshold of 80', () => {
      expect(JUDGMENT_THRESHOLDS.GOOD).toBe(80);
    });

    it('should have MISS threshold of 120', () => {
      expect(JUDGMENT_THRESHOLDS.MISS).toBe(120);
    });

    it('should have thresholds in correct order', () => {
      expect(JUDGMENT_THRESHOLDS.PERFECT < JUDGMENT_THRESHOLDS.GOOD).toBe(true);
      expect(JUDGMENT_THRESHOLDS.GOOD < JUDGMENT_THRESHOLDS.MISS).toBe(true);
    });
  });
});
