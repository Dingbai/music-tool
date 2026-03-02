// 游戏音符数据结构
export interface GameNote {
  id: string;
  midi: number;
  timestamp: number;
  y: number;
  hit: boolean;
  missed: boolean;
  trackIndex: number; // 轨道索引（0-11）
  keyHint?: string; // 键盘提示
  clickError?: boolean; // 点击错误标记
}

// 游戏配置
export interface GameConfig {
  duration: number; // 游戏时长（秒）
  noteCount: number; // 音符数量
}

// 游戏模式
export type GameMode = 'single' | 'song';

// 音符显示模式
export type NotationMode = 'jianpu' | 'staff';

// 游戏反馈
export interface GameFeedback {
  text: string;
  color: string;
}

// 游戏统计
export interface GameStats {
  score: number;
  combo: number;
  maxCombo: number;
  hitCount: number;
  missCount: number;
}

// 当前演奏的音符
export interface PlayingNote {
  midi: number;
  key?: string;
}
