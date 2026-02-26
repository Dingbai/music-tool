// 流行音乐曲库 - ABC 记谱法格式

export interface Song {
  id: string;
  title: string;
  artist: string;
  abcText: string;
  difficulty: '简单' | '中等' | '困难';
  key: string;
}

export const songLibrary: Song[] = [
  {
    id: '1',
    title: '穿越时空的爱恋',
    artist: '张信哲',
    difficulty: '中等',
    key: 'C',
    abcText: `X:1
T:穿越时空的爱恋
C:张信哲
M:4/4
L:1/8
K:C
"Am"ED C2 "G"DE D2 | "Am"ED C2 "G"DE D2 |
"Am"ED C2 "G"DE D2 | "F"FE D2 "C"CD E2 |
"Am"ED C2 "G"DE D2 | "Am"ED C2 "G"DE D2 |
"F"FE D2 "C"CD E2 | "G"GF E2 "Am"D2 z2 |`,
  },
  {
    id: '2',
    title: '我们的时光',
    artist: '赵雷',
    difficulty: '简单',
    key: 'C',
    abcText: `X:1
T:我们的时光
C:赵雷
M:4/4
L:1/8
K:C
"C"CD E2 "G"GF E2 | "Am"AB c2 "G"GF E2 |
"C"CD E2 "G"GF E2 | "F"FE D2 "C"C2 z2 |
"C"CD E2 "G"GF E2 | "Am"AB c2 "G"GF E2 |
"F"FE D2 "C"CD E2 | "G"G2 "C"C2 z4 |`,
  },
  {
    id: '3',
    title: '骑在银龙背上',
    artist: '中岛美雪',
    difficulty: '困难',
    key: 'D',
    abcText: `X:1
T:骑在银龙背上
C:中岛美雪
M:4/4
L:1/8
K:D
"D"DE F2 "A"AG F2 | "Bm"AB c2 "A"AG F2 |
"D"DE F2 "A"AG F2 | "G"GF E2 "D"D2 z2 |
"D"DE F2 "A"AG F2 | "Bm"AB c2 "A"AG F2 |
"G"GF E2 "D"DE F2 | "A"A2 "D"D2 z4 |`,
  },
  {
    id: '4',
    title: '烟花易冷',
    artist: '周杰伦',
    difficulty: '中等',
    key: 'Am',
    abcText: `X:1
T:烟花易冷
C:周杰伦
M:4/4
L:1/8
K:Am
"Am"AB c2 "G"GF E2 | "F"FE D2 "C"CD E2 |
"Am"AB c2 "G"GF E2 | "F"FE D2 "C"C2 z2 |
"Am"AB c2 "G"GF E2 | "F"FE D2 "C"CD E2 |
"F"FE D2 "C"CD E2 | "G"G2 "Am"A2 z4 |`,
  },
  {
    id: '5',
    title: '滚滚红尘',
    artist: '陈淑桦',
    difficulty: '中等',
    key: 'G',
    abcText: `X:1
T:滚滚红尘
C:陈淑桦
M:4/4
L:1/8
K:G
"G"GA B2 "D"DC B2 | "Em"EF G2 "D"DC B2 |
"G"GA B2 "D"DC B2 | "C"CB A2 "G"G2 z2 |
"G"GA B2 "D"DC B2 | "Em"EF G2 "D"DC B2 |
"C"CB A2 "G"GA B2 | "D"D2 "G"G2 z4 |`,
  },
  {
    id: '6',
    title: '月亮代表我的心',
    artist: '邓丽君',
    difficulty: '简单',
    key: 'C',
    abcText: `X:1
T:月亮代表我的心
C:邓丽君
M:4/4
L:1/8
K:C
"C"C2 D2 "G"E2 G2 | "Am"A2 G2 "G"E2 D2 |
"C"C2 D2 "G"E2 G2 | "F"F2 E2 "C"C2 z2 |
"C"C2 D2 "G"E2 G2 | "Am"A2 G2 "G"E2 D2 |
"F"F2 E2 "C"CD E2 | "G"G2 "C"C2 z4 |`,
  },
  {
    id: '7',
    title: '童年',
    artist: '罗大佑',
    difficulty: '简单',
    key: 'G',
    abcText: `X:1
T:童年
C:罗大佑
M:4/4
L:1/8
K:G
"G"GA B2 "D"DC B2 | "Em"EF G2 "D"DC B2 |
"G"GA B2 "D"DC B2 | "C"CB A2 "G"G2 z2 |
"G"GA B2 "D"DC B2 | "Em"EF G2 "D"DC B2 |
"C"CB A2 "G"GA B2 | "D"D2 "G"G2 z4 |`,
  },
  {
    id: '8',
    title: '后来',
    artist: '刘若英',
    difficulty: '中等',
    key: 'C',
    abcText: `X:1
T:后来
C:刘若英
M:4/4
L:1/8
K:C
"C"C2 D2 "G"E2 G2 | "Am"A2 G2 "G"E2 D2 |
"F"F2 G2 "C"E2 C2 | "G"G2 E2 "C"C2 z2 |
"C"C2 D2 "G"E2 G2 | "Am"A2 G2 "G"E2 D2 |
"F"F2 G2 "C"CD E2 | "G"G2 "C"C2 z4 |`,
  },
  {
    id: '9',
    title: '平凡之路',
    artist: '朴树',
    difficulty: '简单',
    key: 'Em',
    abcText: `X:1
T:平凡之路
C:朴树
M:4/4
L:1/8
K:Em
"Em"EF G2 "D"DC B2 | "C"CD E2 "D"DC B2 |
"Em"EF G2 "D"DC B2 | "C"CB A2 "B,B,"B,2 z2 |
"Em"EF G2 "D"DC B2 | "C"CD E2 "D"DC B2 |
"C"CB A2 "B,B,"B,A, | "G,"G,2 "Em"E2 z4 |`,
  },
  {
    id: '10',
    title: '小幸运',
    artist: '田馥甄',
    difficulty: '中等',
    key: 'F',
    abcText: `X:1
T:小幸运
C:田馥甄
M:4/4
L:1/8
K:F
"F"FG A2 "C"CB A2 | "Dm"DE F2 "C"CB A2 |
"F"FG A2 "C"CB A2 | "Bb"BA G2 "F"F2 z2 |
"F"FG A2 "C"CB A2 | "Dm"DE F2 "C"CB A2 |
"Bb"BA G2 "F"FG A2 | "C"C2 "F"F2 z4 |`,
  },
];

export const getSongById = (id: string): Song | undefined => {
  return songLibrary.find((song) => song.id === id);
};

export const searchSongs = (keyword: string): Song[] => {
  const lowerKeyword = keyword.toLowerCase();
  return songLibrary.filter(
    (song) =>
      song.title.toLowerCase().includes(lowerKeyword) ||
      song.artist.toLowerCase().includes(lowerKeyword),
  );
};
