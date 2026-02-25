import { describe, it, expect } from 'vitest'
import { detectPitchYIN, freqToMidi, midiToNoteName } from './pitchService'

describe('pitchService', () => {
  describe('freqToMidi', () => {
    it('标准音 A4 (440Hz) 应该转换为 MIDI 69', () => {
      expect(freqToMidi(440)).toBe(69)
    })

    it('中央 C (约 261.63Hz) 应该转换为 MIDI 60', () => {
      expect(freqToMidi(261.63)).toBe(60)
    })

    it('高音 C (约 523.25Hz) 应该转换为 MIDI 72', () => {
      expect(freqToMidi(523.25)).toBe(72)
    })

    it('低频音 (约 130.81Hz) 应该转换为 MIDI 48', () => {
      expect(freqToMidi(130.81)).toBe(48)
    })

    it('频率越高 MIDI 值越大', () => {
      expect(freqToMidi(880)).toBeGreaterThan(freqToMidi(440))
      expect(freqToMidi(440)).toBeGreaterThan(freqToMidi(220))
    })
  })

  describe('midiToNoteName', () => {
    it('MIDI 60 应该返回 C4 (中央 C)', () => {
      expect(midiToNoteName(60)).toBe('C4')
    })

    it('MIDI 69 应该返回 A4 (标准音)', () => {
      expect(midiToNoteName(69)).toBe('A4')
    })

    it('MIDI 72 应该返回 C5', () => {
      expect(midiToNoteName(72)).toBe('C5')
    })

    it('MIDI 61 应该返回 C#4', () => {
      expect(midiToNoteName(61)).toBe('C#4')
    })

    it('MIDI 62 应该返回 D4', () => {
      expect(midiToNoteName(62)).toBe('D4')
    })

    it('MIDI 63 应该返回 D#4', () => {
      expect(midiToNoteName(63)).toBe('D#4')
    })

    it('MIDI 64 应该返回 E4', () => {
      expect(midiToNoteName(64)).toBe('E4')
    })

    it('MIDI 65 应该返回 F4', () => {
      expect(midiToNoteName(65)).toBe('F4')
    })

    it('MIDI 67 应该返回 G4', () => {
      expect(midiToNoteName(67)).toBe('G4')
    })

    it('MIDI 71 应该返回 B4', () => {
      expect(midiToNoteName(71)).toBe('B4')
    })

    it('低八度的 C 应该返回 C3', () => {
      expect(midiToNoteName(48)).toBe('C3')
    })

    it('高八度的 C 应该返回 C5', () => {
      expect(midiToNoteName(72)).toBe('C5')
    })
  })

  describe('detectPitchYIN', () => {
    it('应该能检测到标准音 440Hz', () => {
      // 创建一个 440Hz 的正弦波
      const sampleRate = 44100
      const frequency = 440
      const bufferSize = 2048
      const buffer = new Float32Array(bufferSize)

      for (let i = 0; i < bufferSize; i++) {
        buffer[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate)
      }

      const detectedFreq = detectPitchYIN(buffer, sampleRate)
      
      // 允许一定的误差范围 (±5Hz)
      expect(detectedFreq).toBeGreaterThan(435)
      expect(detectedFreq).toBeLessThan(445)
    })

    it('应该能检测到 261.63Hz (中央 C)', () => {
      const sampleRate = 44100
      const frequency = 261.63
      const bufferSize = 2048
      const buffer = new Float32Array(bufferSize)

      for (let i = 0; i < bufferSize; i++) {
        buffer[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate)
      }

      const detectedFreq = detectPitchYIN(buffer, sampleRate)
      
      expect(detectedFreq).toBeGreaterThan(255)
      expect(detectedFreq).toBeLessThan(270)
    })

    it('对于静音信号应该返回 null 或较低置信度', () => {
      const sampleRate = 44100
      const bufferSize = 2048
      const buffer = new Float32Array(bufferSize).fill(0)

      const detectedFreq = detectPitchYIN(buffer, sampleRate)
      
      // 静音应该无法检测到有效音高
      expect(detectedFreq).toBeNull()
    })

    it('对于噪声信号可能返回 null', () => {
      const sampleRate = 44100
      const bufferSize = 2048
      const buffer = new Float32Array(bufferSize)

      // 填充随机噪声
      for (let i = 0; i < bufferSize; i++) {
        buffer[i] = Math.random() * 2 - 1
      }

      const detectedFreq = detectPitchYIN(buffer, sampleRate)
      
      // 噪声可能无法检测到有效音高
      // 注意：YIN 算法有时可能从噪声中检测到虚假频率，这是正常的
      if (detectedFreq !== null) {
        // 如果检测到频率，应该不在正常音乐频率范围内
        expect(detectedFreq < 50 || detectedFreq > 2000).toBe(true)
      }
    })

    it('应该能检测到 523.25Hz (高音 C)', () => {
      const sampleRate = 44100
      const frequency = 523.25
      const bufferSize = 2048
      const buffer = new Float32Array(bufferSize)

      for (let i = 0; i < bufferSize; i++) {
        buffer[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate)
      }

      const detectedFreq = detectPitchYIN(buffer, sampleRate)
      
      expect(detectedFreq).toBeGreaterThan(510)
      expect(detectedFreq).toBeLessThan(540)
    })
  })

  describe('freqToMidi 和 midiToNoteName 的组合使用', () => {
    it('应该能正确转换 440Hz -> MIDI -> 音符名', () => {
      const midi = freqToMidi(440)
      const noteName = midiToNoteName(midi)
      expect(noteName).toBe('A4')
    })

    it('应该能正确转换 261.63Hz -> MIDI -> 音符名', () => {
      const midi = freqToMidi(261.63)
      const noteName = midiToNoteName(midi)
      expect(noteName).toBe('C4')
    })
  })
})
