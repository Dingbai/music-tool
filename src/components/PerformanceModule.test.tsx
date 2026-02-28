import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PerformanceModule from './PerformanceModule';
import * as musicDb from '../db/musicDb';

// Mock ABCJS
vi.mock('abcjs', () => ({
  default: {
    renderAbc: vi.fn().mockReturnValue([{}]),
    synth: {
      SynthController: vi.fn().mockImplementation(() => ({
        load: vi.fn(),
        setTune: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
        disable: vi.fn().mockResolvedValue(undefined),
      })),
      CreateSynth: vi.fn().mockImplementation(() => ({
        init: vi.fn().mockResolvedValue(undefined),
        prime: vi.fn().mockResolvedValue(undefined),
      })),
      playEvent: vi.fn(),
    },
  },
}));

// Mock IndexedDB
class MockIDBRequest {
  result: unknown = null;
  onsuccess: (() => void) | null = null;
}

class MockIDBStore {
  data: Map<number, unknown> = new Map();
  nextId = 1;

  add(item: unknown): MockIDBRequest {
    const request = new MockIDBRequest();
    const id = this.nextId++;
    this.data.set(id, item);
    request.result = id;
    setTimeout(() => request.onsuccess?.(), 0);
    return request;
  }

  getAll(): MockIDBRequest {
    const request = new MockIDBRequest();
    request.result = Array.from(this.data.values());
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
    contains: () => true,
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

class MockIndexedDB {
  db: MockIDBDatabase | null = null;

  open(): MockIDBDatabase {
    if (!this.db) {
      this.db = new MockIDBDatabase();
    }
    return this.db;
  }
}

// Mock user songs
const mockUserSongs = [
  {
    id: 1,
    title: '测试歌曲',
    artist: '测试歌手',
    abcText: 'X:1\nT:测试歌曲\nM:4/4\nL:1/8\nK:C\nCDEF GABc',
    key: 'C',
    difficulty: '中等' as const,
    createdAt: 1000,
    updatedAt: 1000,
  },
];

describe('PerformanceModule', () => {
  const mockProps = {
    abcText: 'X:1\nT:Test\nM:4/4\nL:1/8\nK:C\nCDEF GABc',
    instrument: 0,
    setInstrument: vi.fn(),
    setAbcText: vi.fn(),
  };

  beforeEach(() => {
    vi.stubGlobal('indexedDB', new MockIndexedDB());
    vi.spyOn(musicDb, 'getAllSongs').mockResolvedValue(mockUserSongs);
    vi.spyOn(musicDb, 'addPracticeRecord').mockResolvedValue(1);
    vi.spyOn(musicDb, 'getRecentPracticeRecords').mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  describe('基础渲染', () => {
    it('应该渲染演练模式组件', () => {
      const { container } = render(<PerformanceModule {...mockProps} />);
      
      // 验证组件渲染成功
      expect(container).toBeInTheDocument();
      expect(screen.getByText(/音色/)).toBeInTheDocument();
    });

    it('应该渲染音色选择器', () => {
      render(<PerformanceModule {...mockProps} />);
      
      expect(screen.getByText(/音色/)).toBeInTheDocument();
    });

    it('应该渲染 BPM 滑块', () => {
      render(<PerformanceModule {...mockProps} />);
      
      expect(screen.getByText(/BPM/)).toBeInTheDocument();
    });

    it('应该渲染播放/练习模式切换开关', () => {
      render(<PerformanceModule {...mockProps} />);
      
      expect(screen.getAllByText(/播放/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/练习/).length).toBeGreaterThan(0);
    });

    it('应该渲染曲库按钮', () => {
      render(<PerformanceModule {...mockProps} />);
      
      const libraryButtons = screen.getAllByText('曲库');
      expect(libraryButtons.length).toBeGreaterThan(0);
    });

    it('应该渲染历史记录按钮', () => {
      render(<PerformanceModule {...mockProps} />);
      
      expect(screen.getByText('历史记录')).toBeInTheDocument();
    });
  });

  describe('模式切换', () => {
    it('应该默认处于播放模式', () => {
      render(<PerformanceModule {...mockProps} />);
      
      const switchComponent = screen.getByRole('switch');
      expect(switchComponent).not.toBeChecked();
    });

    it('应该可以切换到练习模式', () => {
      render(<PerformanceModule {...mockProps} />);
      
      const switchComponent = screen.getByRole('switch');
      fireEvent.click(switchComponent);
      
      expect(switchComponent).toBeChecked();
    });
  });

  describe('播放控制', () => {
    it('应该显示准备并开始按钮', () => {
      render(<PerformanceModule {...mockProps} />);
      
      expect(screen.getByText(/准备并开始回放/)).toBeInTheDocument();
    });

    it('应该在练习模式显示不同的按钮文本', () => {
      render(<PerformanceModule {...mockProps} />);
      
      const switchComponent = screen.getByRole('switch');
      fireEvent.click(switchComponent);
      
      expect(screen.getByText(/准备并开始练习/)).toBeInTheDocument();
    });
  });

  describe('BPM 控制', () => {
    it('应该显示当前 BPM 值', () => {
      render(<PerformanceModule {...mockProps} />);
      
      expect(screen.getByText(/BPM/)).toBeInTheDocument();
    });

    it('应该可以调节 BPM', () => {
      render(<PerformanceModule {...mockProps} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveValue(80);
    });

    it('BPM 滑块应该存在', () => {
      render(<PerformanceModule {...mockProps} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
    });
  });

  describe('曲库功能', () => {
    it('应该可以打开曲库 Modal', async () => {
      render(<PerformanceModule {...mockProps} />);
      
      const libraryButtons = screen.getAllByText('曲库');
      fireEvent.click(libraryButtons[0]);
      
      await waitFor(() => {
        expect(screen.getAllByText('曲库').length).toBeGreaterThan(1);
      });
    });

    it('应该显示预设曲库标签页', async () => {
      render(<PerformanceModule {...mockProps} />);
      
      const libraryButtons = screen.getAllByText('曲库');
      fireEvent.click(libraryButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('预设曲库')).toBeInTheDocument();
      });
    });

    it('应该显示我的曲谱标签页', async () => {
      render(<PerformanceModule {...mockProps} />);
      
      const libraryButtons = screen.getAllByText('曲库');
      fireEvent.click(libraryButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('我的曲谱')).toBeInTheDocument();
      });
    });

    it('应该可以搜索歌曲', async () => {
      render(<PerformanceModule {...mockProps} />);
      
      const libraryButtons = screen.getAllByText('曲库');
      fireEvent.click(libraryButtons[0]);
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/搜索歌曲或歌手/);
        fireEvent.change(searchInput, { target: { value: '月亮' } });
      });
    });

    it('应该显示预设歌曲列表', async () => {
      render(<PerformanceModule {...mockProps} />);
      
      const libraryButtons = screen.getAllByText('曲库');
      fireEvent.click(libraryButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('穿越时空的爱恋')).toBeInTheDocument();
        expect(screen.getByText('我们的时光')).toBeInTheDocument();
      });
    });
  });

  describe('历史记录功能', () => {
    it('应该可以打开历史记录 Modal', () => {
      render(<PerformanceModule {...mockProps} />);
      
      const historyButton = screen.getByText('历史记录');
      fireEvent.click(historyButton);
      
      expect(screen.getByText(/历史记录/)).toBeInTheDocument();
    });

    it('应该显示空状态当没有练习记录时', async () => {
      render(<PerformanceModule {...mockProps} />);
      
      const historyButton = screen.getByText('历史记录');
      fireEvent.click(historyButton);
      
      await waitFor(() => {
        expect(screen.getByText(/暂无练习记录/)).toBeInTheDocument();
      });
    });
  });

  describe('乐器音色', () => {
    it('应该显示音色选择器', () => {
      render(<PerformanceModule {...mockProps} />);
      
      expect(screen.getByText(/音色/)).toBeInTheDocument();
    });

    it('应该可以切换音色', () => {
      render(<PerformanceModule {...mockProps} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });
  });

  describe('辅助功能', () => {
    it('应该显示播放模式标签', () => {
      render(<PerformanceModule {...mockProps} />);
      
      expect(screen.getByText(/播放模式/)).toBeInTheDocument();
    });

    it('应该显示练习模式标签当切换后', () => {
      render(<PerformanceModule {...mockProps} />);
      
      const switchComponent = screen.getByRole('switch');
      fireEvent.click(switchComponent);
      
      expect(screen.getByText(/练习模式/)).toBeInTheDocument();
    });
  });
});
