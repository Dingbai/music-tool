// IndexedDB 数据库服务测试
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  addSong,
  updateSong,
  deleteSong,
  getAllSongs,
  getSongById,
  searchSongs,
  clearAllSongs,
  type UserSong,
} from '../db/musicDb';

// 完整的 IndexedDB Mock
class MockIDBRequest {
  result: unknown = null;
  error: Error | null = null;
  onsuccess: (() => void) | null = null;
  onerror: (() => void) | null = null;
}

class MockIDBStore {
  data: Map<number, UserSong> = new Map();
  nextId = 1;

  add(song: UserSong): MockIDBRequest {
    const request = new MockIDBRequest();
    try {
      const id = this.nextId++;
      this.data.set(id, { ...song, id } as UserSong);
      request.result = id;
      setTimeout(() => request.onsuccess?.(), 0);
    } catch (e) {
      request.error = e as Error;
      setTimeout(() => request.onerror?.(), 0);
    }
    return request;
  }

  put(song: UserSong): MockIDBRequest {
    const request = new MockIDBRequest();
    try {
      if (song.id) {
        this.data.set(song.id, song);
        request.result = song.id;
      }
      setTimeout(() => request.onsuccess?.(), 0);
    } catch (e) {
      request.error = e as Error;
      setTimeout(() => request.onerror?.(), 0);
    }
    return request;
  }

  get(id: number): MockIDBRequest {
    const request = new MockIDBRequest();
    request.result = this.data.get(id);
    setTimeout(() => request.onsuccess?.(), 0);
    return request;
  }

  getAll(): MockIDBRequest {
    const request = new MockIDBRequest();
    request.result = Array.from(this.data.values());
    setTimeout(() => request.onsuccess?.(), 0);
    return request;
  }

  delete(id: number): MockIDBRequest {
    const request = new MockIDBRequest();
    this.data.delete(id);
    setTimeout(() => request.onsuccess?.(), 0);
    return request;
  }

  clear(): MockIDBRequest {
    const request = new MockIDBRequest();
    this.data.clear();
    setTimeout(() => request.onsuccess?.(), 0);
    return request;
  }
}

class MockIDBTransaction {
  constructor(private store: MockIDBStore) {}
  objectStore(): MockIDBStore {
    return this.store;
  }
  oncomplete: (() => void) | null = null;
}

class MockIDBDatabase {
  store: MockIDBStore;
  objectStoreNames = {
    contains: (name: string) => name === 'userSongs',
  };

  constructor() {
    this.store = new MockIDBStore();
  }

  createObjectStore(): MockIDBStore {
    return this.store;
  }

  transaction(): MockIDBTransaction {
    return new MockIDBTransaction(this.store);
  }

  close(): void {}
}

class MockIDBOpenDBRequest {
  result: MockIDBDatabase | null = null;
  error: Error | null = null;
  onsuccess: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onupgradeneeded: (() => void) | null = null;
}

class MockIndexedDB {
  db: MockIDBDatabase | null = null;

  open(): MockIDBOpenDBRequest {
    const request = new MockIDBOpenDBRequest();
    if (!this.db) {
      this.db = new MockIDBDatabase();
    }
    request.result = this.db;
    setTimeout(() => {
      request.onsuccess?.();
    }, 0);
    return request;
  }
}

describe('musicDb', () => {
  let mockIndexedDB: MockIndexedDB;

  beforeEach(() => {
    mockIndexedDB = new MockIndexedDB();
    vi.stubGlobal('indexedDB', mockIndexedDB);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  describe('addSong', () => {
    const testSong = {
      title: '测试歌曲',
      artist: '测试歌手',
      abcText: 'X:1\nT:测试歌曲\nK:C\nCDEF GABc',
      key: 'C',
      difficulty: '中等' as const,
    };

    it('应该成功添加歌曲', async () => {
      const id = await addSong(testSong);

      expect(id).toBeGreaterThan(0);
    });

    it('应该为添加的歌曲设置时间戳', async () => {
      const beforeAdd = Date.now();
      
      await addSong(testSong);
      
      // 验证时间戳被设置
      const songs = await getAllSongs();
      expect(songs[0].createdAt).toBeGreaterThanOrEqual(beforeAdd);
      expect(songs[0].updatedAt).toBeGreaterThanOrEqual(beforeAdd);
    });
  });

  describe('getAllSongs', () => {
    it('应该获取所有歌曲并按时间倒序排列', async () => {
      // 先添加一些歌曲
      await addSong({
        title: '歌曲 1',
        artist: '歌手 1',
        abcText: 'X:1\nT:歌曲 1\nK:C\nCDEF',
        key: 'C',
        difficulty: '简单',
      });
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await addSong({
        title: '歌曲 2',
        artist: '歌手 2',
        abcText: 'X:1\nT:歌曲 2\nK:G\nGABC',
        key: 'G',
        difficulty: '中等',
      });

      const songs = await getAllSongs();

      expect(songs.length).toBe(2);
      expect(songs[0].createdAt).toBeGreaterThanOrEqual(songs[1].createdAt);
    });

    it('应该在数据库为空时返回空数组', async () => {
      const songs = await getAllSongs();

      expect(songs).toHaveLength(0);
    });
  });

  describe('getSongById', () => {
    it('应该通过 ID 获取歌曲', async () => {
      const id = await addSong({
        title: '测试歌曲',
        artist: '测试歌手',
        abcText: 'X:1\nT:测试歌曲\nK:C\nCDEF',
        key: 'C',
        difficulty: '中等',
      });

      const song = await getSongById(id);

      expect(song).toBeDefined();
      expect(song?.id).toBe(id);
      expect(song?.title).toBe('测试歌曲');
    });

    it('应该在歌曲不存在时返回 undefined', async () => {
      const song = await getSongById(999);

      expect(song).toBeUndefined();
    });
  });

  describe('updateSong', () => {
    it('应该成功更新歌曲', async () => {
      const id = await addSong({
        title: '原歌曲',
        artist: '原歌手',
        abcText: 'X:1\nT:原歌曲\nK:C\nCDEF',
        key: 'C',
        difficulty: '简单',
      });

      const originalSong = await getSongById(id);
      expect(originalSong).toBeDefined();

      await updateSong({
        ...originalSong!,
        title: '更新的歌曲',
        difficulty: '困难',
      });

      const updatedSong = await getSongById(id);
      expect(updatedSong?.title).toBe('更新的歌曲');
      expect(updatedSong?.difficulty).toBe('困难');
    });

    it('应该更新 updatedAt 时间戳', async () => {
      const id = await addSong({
        title: '测试歌曲',
        artist: '测试歌手',
        abcText: 'X:1\nT:测试歌曲\nK:C\nCDEF',
        key: 'C',
        difficulty: '中等',
      });

      const originalSong = await getSongById(id);
      expect(originalSong).toBeDefined();

      await new Promise(resolve => setTimeout(resolve, 10));

      await updateSong({
        ...originalSong!,
        title: '更新的歌曲',
      });

      const updatedSong = await getSongById(id);
      expect(updatedSong?.updatedAt).toBeGreaterThan(originalSong!.updatedAt);
    });
  });

  describe('deleteSong', () => {
    it('应该成功删除歌曲', async () => {
      const id = await addSong({
        title: '要删除的歌曲',
        artist: '测试歌手',
        abcText: 'X:1\nT:要删除的歌曲\nK:C\nCDEF',
        key: 'C',
        difficulty: '简单',
      });

      await deleteSong(id);

      const song = await getSongById(id);
      expect(song).toBeUndefined();
    });
  });

  describe('searchSongs', () => {
    beforeEach(async () => {
      // 添加测试数据
      await addSong({
        title: '月亮代表我的心',
        artist: '邓丽君',
        abcText: 'X:1\nT:月亮代表我的心\nK:C\nCDEF',
        key: 'C',
        difficulty: '简单',
      });

      await addSong({
        title: '童年',
        artist: '罗大佑',
        abcText: 'X:1\nT:童年\nK:G\nGABC',
        key: 'G',
        difficulty: '简单',
      });

      await addSong({
        title: '后来',
        artist: '刘若英',
        abcText: 'X:1\nT:后来\nK:C\nCDEF',
        key: 'C',
        difficulty: '中等',
      });
    });

    it('应该按标题搜索歌曲', async () => {
      const songs = await searchSongs('月亮');

      expect(songs.length).toBe(1);
      expect(songs[0].title).toBe('月亮代表我的心');
    });

    it('应该按歌手搜索歌曲', async () => {
      const songs = await searchSongs('罗大佑');

      expect(songs.length).toBe(1);
      expect(songs[0].artist).toBe('罗大佑');
    });

    it('应该支持不区分大小写的搜索', async () => {
      const songs = await searchSongs('后来');

      expect(songs.length).toBe(1);
    });

    it('应该在搜索结果为空时返回空数组', async () => {
      const songs = await searchSongs('不存在的歌曲');

      expect(songs).toHaveLength(0);
    });
  });

  describe('clearAllSongs', () => {
    it('应该清空所有歌曲', async () => {
      await addSong({
        title: '测试歌曲',
        artist: '测试歌手',
        abcText: 'X:1\nT:测试歌曲\nK:C\nCDEF',
        key: 'C',
        difficulty: '简单',
      });

      await clearAllSongs();

      const songs = await getAllSongs();
      expect(songs).toHaveLength(0);
    });
  });
});
