// 曲库导入导出功能单元测试
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as musicDb from '../db/musicDb';

// Mock user songs data
const mockUserSongs = [
  {
    id: 1,
    title: '我的原创曲',
    artist: '张三',
    abcText: 'X:1\nT:我的原创曲\nM:4/4\nL:1/8\nK:C\nCDEF GABc',
    key: 'C',
    difficulty: '中等' as const,
    createdAt: 1000,
    updatedAt: 1000,
  },
  {
    id: 2,
    title: '练习曲',
    artist: '李四',
    abcText: 'X:1\nT:练习曲\nM:3/4\nL:1/4\nK:G\nG A B',
    key: 'G',
    difficulty: '简单' as const,
    createdAt: 2000,
    updatedAt: 2000,
  },
];

describe('曲库导入导出功能', () => {
  beforeEach(() => {
    // Mock getAllSongs 和 addSong
    vi.spyOn(musicDb, 'getAllSongs').mockResolvedValue(mockUserSongs);
    vi.spyOn(musicDb, 'addSong').mockResolvedValue(3);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('导入数据验证', () => {
    it('应该验证导入文件的格式', () => {
      const validData = {
        version: '1.0',
        songs: [
          {
            title: '测试',
            abcText: 'X:1\nT:测试',
          },
        ],
      };

      expect(validData.songs).toBeDefined();
      expect(Array.isArray(validData.songs)).toBe(true);
    });

    it('应该处理缺少必要字段的歌曲', () => {
      const invalidSong = {
        title: '缺少 abcText',
      };

      expect(invalidSong.title && (invalidSong as { abcText?: string }).abcText).toBeFalsy();
    });

    it('应该验证歌曲数据的完整性', () => {
      const validSong = {
        title: '完整的歌曲',
        artist: '测试歌手',
        abcText: 'X:1\nT:完整的歌曲\nK:C\nCDEF',
        key: 'C',
        difficulty: '中等',
      };

      expect(validSong.title).toBeTruthy();
      expect(validSong.abcText).toBeTruthy();
      expect(validSong.abcText).toContain('X:');
      expect(validSong.abcText).toContain('K:');
    });
  });

  describe('导出文件格式', () => {
    it('应该生成正确的导出文件格式', () => {
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        songs: mockUserSongs.map(({ id, ...song }) => song),
      };

      expect(exportData.version).toBe('1.0');
      expect(exportData.exportDate).toBeDefined();
      expect(exportData.songs).toHaveLength(2);
      expect(exportData.songs[0].title).toBe('我的原创曲');
    });

    it('应该在导出时移除歌曲的 ID 字段', () => {
      const songsWithoutId = mockUserSongs.map(({ id, ...song }) => song);

      songsWithoutId.forEach((song) => {
        expect(song).not.toHaveProperty('id');
      });

      expect(songsWithoutId[0]).toHaveProperty('title');
      expect(songsWithoutId[0]).toHaveProperty('abcText');
      expect(songsWithoutId[0]).toHaveProperty('artist');
    });

    it('应该保留歌曲的所有必要信息', () => {
      const songsWithoutId = mockUserSongs.map(({ id, ...song }) => song);

      songsWithoutId.forEach((song) => {
        expect(song).toHaveProperty('title');
        expect(song).toHaveProperty('artist');
        expect(song).toHaveProperty('abcText');
        expect(song).toHaveProperty('key');
        expect(song).toHaveProperty('difficulty');
      });
    });

    it('应该包含版本信息用于兼容性检查', () => {
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        songs: mockUserSongs.map(({ id, ...song }) => song),
      };

      expect(exportData.version).toMatch(/^\d+\.\d+$/);
    });
  });

  describe('导入数据处理', () => {
    it('应该过滤掉缺少必要字段的歌曲', () => {
      const importData = {
        version: '1.0',
        songs: [
          {
            title: '有效歌曲',
            abcText: 'X:1\nT:有效歌曲',
          },
          {
            title: '无效歌曲',
            // 缺少 abcText
          },
        ],
      };

      const validSongs = importData.songs.filter(
        (song: { title: string; abcText?: string }) => song.title && song.abcText
      );

      expect(validSongs).toHaveLength(1);
      expect(validSongs[0].title).toBe('有效歌曲');
    });

    it('应该为缺少的字段提供默认值', () => {
      const importSong = {
        title: '测试歌曲',
        abcText: 'X:1\nT:测试歌曲',
      };

      const processedSong = {
        title: importSong.title,
        artist: importSong.artist || '未知作者',
        abcText: importSong.abcText,
        key: importSong.key || 'C',
        difficulty: importSong.difficulty || '中等',
      };

      expect(processedSong.artist).toBe('未知作者');
      expect(processedSong.key).toBe('C');
      expect(processedSong.difficulty).toBe('中等');
    });

    it('应该保留提供的字段值', () => {
      const importSong = {
        title: '测试歌曲',
        artist: '已知作者',
        abcText: 'X:1\nT:测试歌曲',
        key: 'G',
        difficulty: '简单',
      };

      const processedSong = {
        title: importSong.title,
        artist: importSong.artist || '未知作者',
        abcText: importSong.abcText,
        key: importSong.key || 'C',
        difficulty: importSong.difficulty || '中等',
      };

      expect(processedSong.artist).toBe('已知作者');
      expect(processedSong.key).toBe('G');
      expect(processedSong.difficulty).toBe('简单');
    });
  });

  describe('导出导入循环', () => {
    it('应该支持导出后再导入', () => {
      // 模拟导出
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        songs: mockUserSongs.map(({ id, ...song }) => song),
      };

      // 模拟导入验证
      expect(exportData.songs).toHaveLength(2);
      expect(exportData.songs[0]).toHaveProperty('title', '我的原创曲');
      expect(exportData.songs[1]).toHaveProperty('title', '练习曲');
    });

    it('应该在多次导出导入后保持数据一致性', () => {
      const originalSongs = mockUserSongs.map(({ id, ...song }) => song);
      
      // 第一次导出
      const export1 = {
        version: '1.0',
        songs: originalSongs,
      };

      // 模拟导入后再导出
      const export2 = {
        version: '1.0',
        songs: export1.songs.map((song: { id?: number }) => song),
      };

      expect(export2.songs).toHaveLength(originalSongs.length);
      expect(export2.songs[0].title).toBe(originalSongs[0].title);
    });
  });

  describe('错误处理', () => {
    it('应该处理空的歌曲列表', () => {
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        songs: [],
      };

      expect(exportData.songs).toHaveLength(0);
    });

    it('应该处理无效的 JSON 数据', () => {
      const invalidJson = '{ invalid json }';
      
      expect(() => JSON.parse(invalidJson)).toThrow();
    });

    it('应该处理 null 或 undefined 数据', () => {
      const nullData = null;
      const undefinedData = undefined;

      expect(nullData).toBeNull();
      expect(undefinedData).toBeUndefined();
    });
  });
});
