// 预设曲库数据测试
import { describe, it, expect } from 'vitest';
import { songLibrary, getSongById, searchSongs } from '../data/songLibrary';

describe('songLibrary', () => {
  describe('songLibrary 数据', () => {
    it('应该包含预期的歌曲数量', () => {
      expect(songLibrary.length).toBeGreaterThan(0);
    });

    it('所有歌曲都应该有必要的字段', () => {
      songLibrary.forEach((song) => {
        expect(song).toHaveProperty('id');
        expect(song).toHaveProperty('title');
        expect(song).toHaveProperty('artist');
        expect(song).toHaveProperty('abcText');
        expect(song).toHaveProperty('difficulty');
        expect(song).toHaveProperty('key');
      });
    });

    it('所有歌曲的 difficulty 应该是有效值', () => {
      const validDifficulties = ['简单', '中等', '困难'];
      
      songLibrary.forEach((song) => {
        expect(validDifficulties).toContain(song.difficulty);
      });
    });

    it('所有歌曲的 abcText 应该是有效的 ABC 记谱法格式', () => {
      songLibrary.forEach((song) => {
        expect(song.abcText).toContain('X:'); // 必须有 X: 头字段
        expect(song.abcText).toContain('T:'); // 必须有 T: 标题
        expect(song.abcText).toContain('M:'); // 必须有 M: 拍号
        expect(song.abcText).toContain('K:'); // 必须有 K: 调号
      });
    });
  });

  describe('getSongById', () => {
    it('应该通过 ID 找到歌曲', () => {
      const song = getSongById('1');
      
      expect(song).toBeDefined();
      expect(song?.id).toBe('1');
    });

    it('应该在找不到歌曲时返回 undefined', () => {
      const song = getSongById('999');
      
      expect(song).toBeUndefined();
    });

    it('应该找到穿越时空的爱恋', () => {
      const song = getSongById('1');
      
      expect(song?.title).toBe('穿越时空的爱恋');
      expect(song?.artist).toBe('张信哲');
    });

    it('应该找到我们的时光', () => {
      const song = getSongById('2');
      
      expect(song?.title).toBe('我们的时光');
      expect(song?.artist).toBe('赵雷');
    });

    it('应该找到骑在银龙背上', () => {
      const song = getSongById('3');
      
      expect(song?.title).toBe('骑在银龙背上');
      expect(song?.artist).toBe('中岛美雪');
    });

    it('应该找到烟花易冷', () => {
      const song = getSongById('4');
      
      expect(song?.title).toBe('烟花易冷');
      expect(song?.artist).toBe('周杰伦');
    });

    it('应该找到滚滚红尘', () => {
      const song = getSongById('5');
      
      expect(song?.title).toBe('滚滚红尘');
      expect(song?.artist).toBe('陈淑桦');
    });
  });

  describe('searchSongs', () => {
    it('应该按歌曲名搜索', () => {
      const songs = searchSongs('穿越时空');
      
      expect(songs.length).toBeGreaterThan(0);
      expect(songs[0].title).toContain('穿越时空');
    });

    it('应该按歌手名搜索', () => {
      const songs = searchSongs('周杰伦');
      
      expect(songs.length).toBeGreaterThan(0);
      expect(songs[0].artist).toBe('周杰伦');
    });

    it('应该支持不区分大小写的搜索', () => {
      const songs = searchSongs('后来');
      
      expect(songs.length).toBeGreaterThan(0);
    });

    it('应该在搜索结果为空时返回空数组', () => {
      const songs = searchSongs('不存在的歌曲名');
      
      expect(songs).toHaveLength(0);
    });

    it('应该支持部分匹配搜索', () => {
      const songs = searchSongs('时光');
      
      // 应该匹配"我们的时光"
      expect(songs.length).toBeGreaterThan(0);
    });

    it('应该能找到所有包含搜索关键词的歌曲', () => {
      const songs = searchSongs('');
      
      // 空关键词应该返回所有歌曲
      expect(songs.length).toBe(songLibrary.length);
    });
  });

  describe('歌曲数据完整性', () => {
    it('所有歌曲的 ID 应该是唯一的', () => {
      const ids = songLibrary.map((song) => song.id);
      const uniqueIds = new Set(ids);
      
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('歌曲应该包含多种难度级别', () => {
      const difficulties = new Set(songLibrary.map((song) => song.difficulty));
      
      expect(difficulties.has('简单')).toBe(true);
      expect(difficulties.has('中等')).toBe(true);
    });

    it('歌曲应该包含多种调性', () => {
      const keys = new Set(songLibrary.map((song) => song.key));
      
      expect(keys.size).toBeGreaterThan(1);
    });
  });
});
