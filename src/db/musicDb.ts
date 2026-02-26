// IndexedDB 本地数据库服务 - 用于存储用户曲谱

const DB_NAME = 'MusicAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'userSongs';

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

      // 创建对象存储空间
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        // 创建索引
        store.createIndex('title', 'title', { unique: false });
        store.createIndex('artist', 'artist', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
};

// 添加歌曲
export const addSong = async (song: Omit<UserSong, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

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
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

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
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

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
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

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
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

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
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

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
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

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
