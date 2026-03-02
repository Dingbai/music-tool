import { detectPitchYIN, freqToMidi, midiToNoteName } from '../../utils/pitchService';

/**
 * 从音频流中检测当前音高
 */
export const detectCurrentPitch = (
  analyser: AnalyserNode | null,
  audioCtx: AudioContext | null
): { freq: number; midi: number; noteName: string } | null => {
  if (!analyser || !audioCtx) return null;

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Float32Array(bufferLength);
  analyser.getFloatTimeDomainData(dataArray);

  const freq = detectPitchYIN(dataArray, audioCtx.sampleRate);
  if (!freq) return null;

  const midi = freqToMidi(freq);
  const noteName = midiToNoteName(midi);

  return { freq, midi, noteName };
};

/**
 * 计算音符是否命中（允许 ±1 个半音的误差）
 */
export const isNoteHit = (expectedMidi: number, actualMidi: number, tolerance: number = 1): boolean => {
  return Math.abs(expectedMidi - actualMidi) <= tolerance;
};

/**
 * 计算练习准确率
 */
export const calculateAccuracy = (hitCount: number, totalCount: number): number => {
  if (totalCount === 0) return 0;
  return Math.round((hitCount / totalCount) * 100);
};

/**
 * 计算练习得分
 */
export const calculateScore = (accuracy: number, hitCount: number, missCount: number): number => {
  const baseScore = accuracy * 10;
  const hitBonus = hitCount * 5;
  const missPenalty = missCount * 2;
  return Math.max(0, Math.round(baseScore + hitBonus - missPenalty));
};

/**
 * 格式化时间（秒 -> MM:SS）
 */
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * 从 ABC 文本提取曲名
 */
export const extractTitleFromAbc = (abcText: string): string => {
  const titleMatch = abcText.match(/^T:(.+)$/m);
  return titleMatch ? titleMatch[1].trim() : '练习曲目';
};

export { detectPitchYIN, freqToMidi, midiToNoteName };
