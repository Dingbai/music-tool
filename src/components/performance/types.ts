// 练习报告数据
export interface PracticeReport {
  score: number;
  accuracy: number;
  totalNotes: number;
  hitNotes: number;
  missNotes: number;
  duration: number;
  timestamp: number;
}

// 音符练习记录
export interface NotePracticeRecord {
  expected: number; // 期望的 MIDI 音符
  actual: number; // 实际演奏的 MIDI 音符
  hit: boolean; // 是否命中
  timestamp: number;
}

// 练习统计
export interface PracticeStats {
  currentPitch: number | null;
  currentMidi: number | null;
  hitCount: number;
  missCount: number;
  accuracy: number;
}

// 乐器配置
export interface InstrumentConfig {
  id: number;
  name: string;
  soundFont: string;
}

// 练习模式
export type PracticeMode = 'free' | 'follow' | 'record';
