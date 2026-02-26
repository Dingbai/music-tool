// IndexedDB 本地数据库服务 - 用于存储用户曲谱和练习记录

const DB_NAME = 'MusicAppDB';
const DB_VERSION = 2; // 升级版本以支持新存储
const SONGS_STORE = 'userSongs';
const PRACTICE_STORE = 'practiceRecords';
const GAME_STORE = 'gameRecords';

export interface UserSong {
  id?: number;
  title: string;
  artist: string;
  abcText: string;
  key: string;
  difficulty: '简单' | '中等' | '困难';
  createdAt: number;
  updatedAt: number;
}

export interface PracticeRecord {
  id?: number;
  songTitle: string;
  score: number;
  accuracy: number;
  totalNotes: number;
  hitNotes: number;
  duration: number;
  createdAt: number;
}

export interface GameRecord {
  id?: number;
  gameMode: 'single' | 'song';
  score: number;
  combo: number;
  maxCombo: number;
  hitCount: number;
  missCount: number;
  duration: number;
  createdAt: number;
}

// 打开数据库连接
export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('无法打开数据库'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 创建歌曲存储
      if (!db.objectStoreNames.contains(SONGS_STORE)) {
        const songsStore = db.createObjectStore(SONGS_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        songsStore.createIndex('title', 'title', { unique: false });
        songsStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 创建练习记录存储
      if (!db.objectStoreNames.contains(PRACTICE_STORE)) {
        const practiceStore = db.createObjectStore(PRACTICE_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        practiceStore.createIndex('createdAt', 'createdAt', { unique: false });
        practiceStore.createIndex('songTitle', 'songTitle', { unique: false });
      }

      // 创建游戏记录存储
      if (!db.objectStoreNames.contains(GAME_STORE)) {
        const gameStore = db.createObjectStore(GAME_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        gameStore.createIndex('createdAt', 'createdAt', { unique: false });
        gameStore.createIndex('gameMode', 'gameMode', { unique: false });
      }
    };
  });
};

// 添加歌曲
export const addSong = async (song: Omit<UserSong, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SONGS_STORE], 'readwrite');
    const store = transaction.objectStore(SONGS_STORE);

    const newSong: Omit<UserSong, 'id'> = {
      ...song,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const request = store.add(newSong);

    request.onsuccess = () => {
      resolve(request.result as number);
    };

    request.onerror = () => {
      reject(new Error('添加歌曲失败'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// 更新歌曲
export const updateSong = async (song: UserSong): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SONGS_STORE], 'readwrite');
    const store = transaction.objectStore(SONGS_STORE);

    const updatedSong = {
      ...song,
      updatedAt: Date.now(),
    };

    const request = store.put(updatedSong);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('更新歌曲失败'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// 删除歌曲
export const deleteSong = async (id: number): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SONGS_STORE], 'readwrite');
    const store = transaction.objectStore(SONGS_STORE);

    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('删除歌曲失败'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// 获取所有歌曲
export const getAllSongs = async (): Promise<UserSong[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SONGS_STORE], 'readonly');
    const store = transaction.objectStore(SONGS_STORE);

    const request = store.getAll();

    request.onsuccess = () => {
      // 按创建时间倒序排列
      const songs = request.result.sort((a, b) => b.createdAt - a.createdAt);
      resolve(songs);
    };

    request.onerror = () => {
      reject(new Error('获取歌曲列表失败'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// 根据 ID 获取歌曲
export const getSongById = async (id: number): Promise<UserSong | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SONGS_STORE], 'readonly');
    const store = transaction.objectStore(SONGS_STORE);

    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error('获取歌曲失败'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// 搜索歌曲
export const searchSongs = async (keyword: string): Promise<UserSong[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SONGS_STORE], 'readonly');
    const store = transaction.objectStore(SONGS_STORE);

    const request = store.getAll();

    request.onsuccess = () => {
      const lowerKeyword = keyword.toLowerCase();
      const songs = request.result.filter(
        (song) =>
          song.title.toLowerCase().includes(lowerKeyword) ||
          song.artist.toLowerCase().includes(lowerKeyword),
      );
      resolve(songs);
    };

    request.onerror = () => {
      reject(new Error('搜索歌曲失败'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// 清空所有歌曲
export const clearAllSongs = async (): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SONGS_STORE], 'readwrite');
    const store = transaction.objectStore(SONGS_STORE);

    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('清空歌曲失败'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// ==================== 练习记录相关操作 ====================

// 添加练习记录
export const addPracticeRecord = async (record: Omit<PracticeRecord, 'id' | 'createdAt'>): Promise<number> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PRACTICE_STORE], 'readwrite');
    const store = transaction.objectStore(PRACTICE_STORE);

    const newRecord: Omit<PracticeRecord, 'id'> = {
      ...record,
      createdAt: Date.now(),
    };

    const request = store.add(newRecord);

    request.onsuccess = () => {
      resolve(request.result as number);
    };

    request.onerror = () => {
      reject(new Error('添加练习记录失败'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// 获取所有练习记录
export const getAllPracticeRecords = async (): Promise<PracticeRecord[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PRACTICE_STORE], 'readonly');
    const store = transaction.objectStore(PRACTICE_STORE);

    const request = store.getAll();

    request.onsuccess = () => {
      const records = request.result.sort((a, b) => b.createdAt - a.createdAt);
      resolve(records);
    };

    request.onerror = () => {
      reject(new Error('获取练习记录失败'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// 获取最近 N 条练习记录
export const getRecentPracticeRecords = async (limit: number = 10): Promise<PracticeRecord[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PRACTICE_STORE], 'readonly');
    const store = transaction.objectStore(PRACTICE_STORE);

    const request = store.getAll();

    request.onsuccess = () => {
      const records = request.result
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit);
      resolve(records);
    };

    request.onerror = () => {
      reject(new Error('获取练习记录失败'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// 清空练习记录
export const clearPracticeRecords = async (): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PRACTICE_STORE], 'readwrite');
    const store = transaction.objectStore(PRACTICE_STORE);

    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('清空练习记录失败'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// ==================== 游戏记录相关操作 ====================

// 添加游戏记录
export const addGameRecord = async (record: Omit<GameRecord, 'id' | 'createdAt'>): Promise<number> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([GAME_STORE], 'readwrite');
    const store = transaction.objectStore(GAME_STORE);

    const newRecord: Omit<GameRecord, 'id'> = {
      ...record,
      createdAt: Date.now(),
    };

    const request = store.add(newRecord);

    request.onsuccess = () => {
      resolve(request.result as number);
    };

    request.onerror = () => {
      reject(new Error('添加游戏记录失败'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// 获取所有游戏记录
export const getAllGameRecords = async (): Promise<GameRecord[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([GAME_STORE], 'readonly');
    const store = transaction.objectStore(GAME_STORE);

    const request = store.getAll();

    request.onsuccess = () => {
      const records = request.result.sort((a, b) => b.createdAt - a.createdAt);
      resolve(records);
    };

    request.onerror = () => {
      reject(new Error('获取游戏记录失败'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// 获取最近 N 条游戏记录
export const getRecentGameRecords = async (limit: number = 10): Promise<GameRecord[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([GAME_STORE], 'readonly');
    const store = transaction.objectStore(GAME_STORE);

    const request = store.getAll();

    request.onsuccess = () => {
      const records = request.result
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit);
      resolve(records);
    };

    request.onerror = () => {
      reject(new Error('获取游戏记录失败'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// 清空游戏记录
export const clearGameRecords = async (): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([GAME_STORE], 'readwrite');
    const store = transaction.objectStore(GAME_STORE);

    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('清空游戏记录失败'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};
