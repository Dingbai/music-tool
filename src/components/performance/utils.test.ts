import { describe, it, expect, vi } from 'vitest';
import {
  detectCurrentPitch,
  isNoteHit,
  calculateAccuracy,
  calculateScore,
  formatDuration,
  extractTitleFromAbc,
} from './utils';
import { detectPitchYIN, freqToMidi, midiToNoteName } from '../../utils/pitchService';

// Mock pitch service
vi.mock('../../utils/pitchService', () => ({
  detectPitchYIN: vi.fn(),
  freqToMidi: vi.fn(),
  midiToNoteName: vi.fn(),
}));

describe('utils', () => {
  describe('isNoteHit', () => {
    it('完全匹配的音符应该命中', () => {
      expect(isNoteHit(60, 60)).toBe(true);
    });

    it('相差 1 个半音应该命中', () => {
      expect(isNoteHit(60, 61)).toBe(true);
      expect(isNoteHit(60, 59)).toBe(true);
    });

    it('相差 2 个半音应该不命中', () => {
      expect(isNoteHit(60, 62)).toBe(false);
      expect(isNoteHit(60, 58)).toBe(false);
    });

    it('可以使用自定义容差', () => {
      expect(isNoteHit(60, 62, 2)).toBe(true);
      expect(isNoteHit(60, 63, 2)).toBe(false);
    });
  });

  describe('calculateAccuracy', () => {
    it('应该计算准确率', () => {
      expect(calculateAccuracy(8, 10)).toBe(80);
    });

    it('全部命中应该是 100%', () => {
      expect(calculateAccuracy(10, 10)).toBe(100);
    });

    it('全部未命中应该是 0%', () => {
      expect(calculateAccuracy(0, 10)).toBe(0);
    });

    it('没有音符时应该是 0%', () => {
      expect(calculateAccuracy(0, 0)).toBe(0);
    });

    it('应该四舍五入', () => {
      expect(calculateAccuracy(7, 10)).toBe(70);
      expect(calculateAccuracy(1, 3)).toBe(33);
    });
  });

  describe('calculateScore', () => {
    it('应该计算基础得分', () => {
      // 80% 准确率，8 命中，2 未命中
      // baseScore = 80 * 10 = 800
      // hitBonus = 8 * 5 = 40
      // missPenalty = 2 * 2 = 4
      // total = 800 + 40 - 4 = 836
      expect(calculateScore(80, 8, 2)).toBe(836);
    });

    it('完美演奏应该得高分', () => {
      // 100% 准确率，10 命中，0 未命中
      // baseScore = 100 * 10 = 1000
      // hitBonus = 10 * 5 = 50
      // missPenalty = 0
      // total = 1050
      expect(calculateScore(100, 10, 0)).toBe(1050);
    });

    it('得分不应该为负数', () => {
      // 0% 准确率，0 命中，10 未命中
      // baseScore = 0
      // hitBonus = 0
      // missPenalty = 10 * 2 = 20
      // total = max(0, -20) = 0
      expect(calculateScore(0, 0, 10)).toBe(0);
    });

    it('应该四舍五入', () => {
      // 66% 准确率，6 命中，4 未命中
      // baseScore = 66 * 10 = 660
      // hitBonus = 6 * 5 = 30
      // missPenalty = 4 * 2 = 8
      // total = 682
      expect(calculateScore(66, 6, 4)).toBe(682);
    });
  });

  describe('formatDuration', () => {
    it('应该格式化秒数为 MM:SS', () => {
      expect(formatDuration(125)).toBe('2:05');
    });

    it('应该处理整分钟', () => {
      expect(formatDuration(180)).toBe('3:00');
    });

    it('应该处理少于 1 分钟', () => {
      expect(formatDuration(30)).toBe('0:30');
    });

    it('应该处理 0 秒', () => {
      expect(formatDuration(0)).toBe('0:00');
    });

    it('应该处理大数值', () => {
      expect(formatDuration(3661)).toBe('61:01');
    });
  });

  describe('extractTitleFromAbc', () => {
    it('应该从 ABC 文本提取曲名', () => {
      const abcText = `X:1
T:月亮代表我的心
M:4/4
L:1/8
K:C
CDEF GABc`;

      expect(extractTitleFromAbc(abcText)).toBe('月亮代表我的心');
    });

    it('应该去除曲名两边的空格', () => {
      const abcText = `X:1
T:  测试歌曲  
M:4/4
L:1/8
K:C
CDEF`;

      expect(extractTitleFromAbc(abcText)).toBe('测试歌曲');
    });

    it('没有曲名时应该返回默认值', () => {
      const abcText = `X:1
M:4/4
L:1/8
K:C
CDEF`;

      expect(extractTitleFromAbc(abcText)).toBe('练习曲目');
    });

    it('空字符串应该返回默认值', () => {
      expect(extractTitleFromAbc('')).toBe('练习曲目');
    });

    it('应该只提取第一行 T:标签', () => {
      const abcText = `X:1
T:第一首
T:第二首
M:4/4
K:C
CDEF`;

      expect(extractTitleFromAbc(abcText)).toBe('第一首');
    });
  });

  describe('detectCurrentPitch', () => {
    it('analyser 或 audioCtx 为 null 时应该返回 null', () => {
      expect(detectCurrentPitch(null, null)).toBe(null);
      expect(
        detectCurrentPitch({} as AnalyserNode, null)
      ).toBe(null);
      expect(
        detectCurrentPitch(null, {} as AudioContext)
      ).toBe(null);
    });

    it('应该检测音高并返回结果', () => {
      const mockAnalyser = {
        frequencyBinCount: 2048,
        getFloatTimeDomainData: vi.fn(),
      } as unknown as AnalyserNode;

      const mockAudioCtx = {
        sampleRate: 44100,
      } as AudioContext;

      vi.mocked(detectPitchYIN).mockReturnValue(440);
      vi.mocked(freqToMidi).mockReturnValue(69);
      vi.mocked(midiToNoteName).mockReturnValue('A4');

      const result = detectCurrentPitch(mockAnalyser, mockAudioCtx);

      expect(result).toEqual({
        freq: 440,
        midi: 69,
        noteName: 'A4',
      });

      expect(mockAnalyser.getFloatTimeDomainData).toHaveBeenCalled();
      expect(detectPitchYIN).toHaveBeenCalled();
      expect(freqToMidi).toHaveBeenCalledWith(440);
      expect(midiToNoteName).toHaveBeenCalledWith(69);
    });

    it('检测不到频率时应该返回 null', () => {
      const mockAnalyser = {
        frequencyBinCount: 2048,
        getFloatTimeDomainData: vi.fn(),
      } as unknown as AnalyserNode;

      const mockAudioCtx = {
        sampleRate: 44100,
      } as AudioContext;

      vi.mocked(detectPitchYIN).mockReturnValue(null);

      const result = detectCurrentPitch(mockAnalyser, mockAudioCtx);

      expect(result).toBe(null);
    });
  });
});
