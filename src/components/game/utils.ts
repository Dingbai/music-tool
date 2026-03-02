// 简谱音符映射（MIDI -> 简谱表示）
export const midiToJianpu = (midi: number): string => {
  const noteInOctave = midi % 12;
  const octave = Math.floor(midi / 12) - 1;

  // 简谱基本音符：1=C, 2=D, 3=E, 4=F, 5=G, 6=A, 7=B
  const jianpuMap: Record<number, string> = {
    0: '1', // C
    2: '2', // D
    4: '3', // E
    5: '4', // F
    7: '5', // G
    9: '6', // A
    11: '7', // B
  };

  const baseNote = jianpuMap[noteInOctave] || '?';

  // 中央 C4 (MIDI 60) 为基准，不加标记
  const baseOctave = 4;
  if (octave < baseOctave) {
    return baseNote.toLowerCase(); // 低音
  } else if (octave > baseOctave) {
    return baseNote.toUpperCase(); // 高音
  }
  return baseNote;
};

// 五线谱音符位置（用于在滑块上绘制）
export const getStaffPosition = (midi: number): number => {
  const baseMidi = 48; // C3 作为基准
  return Math.floor((midi - baseMidi) / 2);
};

// 键盘按键映射（Z X C V ... 对应白键）
export const KEY_TO_MIDI: Record<string, number> = {
  'z': 60,  // C4
  's': 61,  // C#4
  'x': 62,  // D4
  'd': 63,  // D#4
  'c': 64,  // E4
  'v': 65,  // F4
  'g': 66,  // F#4
  'b': 67,  // G4
  'h': 68,  // G#4
  'n': 69,  // A4
  'j': 70,  // A#4
  'm': 71,  // B4
  ',': 72,  // C5
  'l': 73,  // C#5
  '.': 74,  // D5
  ';': 75,  // D#5
  '/': 76,  // E5
  'q': 72,  // C5 (高八度区)
  '2': 73,  // C#5
  'w': 74,  // D5
  '3': 75,  // D#5
  'e': 76,  // E5
  'r': 77,  // F5
  '5': 78,  // F#5
  't': 79,  // G5
  '6': 80,  // G#5
  'y': 81,  // A5
  '7': 82,  // A#5
  'u': 83,  // B5
  'i': 84,  // C6
};

// 判定阈值配置
export const JUDGMENT_THRESHOLDS = {
  PERFECT: 50,    // 完美判定阈值
  GOOD: 80,       // 良好判定阈值
  MISS: 120,      // 失误判定阈值
};
