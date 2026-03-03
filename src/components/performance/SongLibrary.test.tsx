import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SongLibrary from './SongLibrary';
import { songLibrary } from '../../data/songLibrary';
import type { UserSong } from '../../db/musicDb';

// Mock songLibrary data
vi.mock('../../data/songLibrary', () => ({
  songLibrary: [
    {
      title: '月亮代表我的心',
      artist: '邓丽君',
      abcText: 'X:1\nT:月亮代表我的心\nM:4/4\nL:1/8\nK:C\nCDEF GABc',
      key: 'C',
      difficulty: '简单' as const,
    },
    {
      title: '穿越时空的爱恋',
      artist: '周杰伦',
      abcText: 'X:1\nT:穿越时空的爱恋\nM:4/4\nL:1/8\nK:D\nDEFG ABcd',
      key: 'D',
      difficulty: '中等' as const,
    },
    {
      title: '我们的时光',
      artist: 'TFBOYS',
      abcText: 'X:1\nT:我们的时光\nM:3/4\nL:1/8\nK:G\nGABc defg',
      key: 'G',
      difficulty: '困难' as const,
    },
  ],
}));

describe('SongLibrary', () => {
  const mockUserSongs: UserSong[] = [
    {
      id: 1,
      title: '我的原创',
      artist: '我',
      abcText: 'X:1\nT:我的原创\nM:4/4\nL:1/8\nK:C\nCDEF GABc',
      key: 'C',
      difficulty: '中等' as const,
      createdAt: 1000,
      updatedAt: 1000,
    },
  ];

  const mockProps = {
    open: true,
    userSongs: mockUserSongs,
    onSelectSong: vi.fn(),
    onClose: vi.fn(),
    onLoadUserSongs: vi.fn(),
    onExportSongs: vi.fn(),
    onImportSongs: vi.fn(),
    onDeleteUserSong: vi.fn(),
  };

  describe('基础渲染', () => {
    it('应该渲染曲库组件', () => {
      render(<SongLibrary {...mockProps} />);

      expect(screen.getByText(/曲库选择/)).toBeInTheDocument();
    });

    it('应该显示搜索框', () => {
      render(<SongLibrary {...mockProps} />);

      expect(screen.getByPlaceholderText(/搜索曲目/)).toBeInTheDocument();
    });

    it('应该显示导出按钮', () => {
      render(<SongLibrary {...mockProps} />);

      expect(screen.getByText(/导出曲谱/)).toBeInTheDocument();
    });

    it('应该显示导入按钮', () => {
      render(<SongLibrary {...mockProps} />);

      expect(screen.getByText(/导入曲谱/)).toBeInTheDocument();
    });

    it('应该显示预设曲库标签', () => {
      render(<SongLibrary {...mockProps} />);

      expect(screen.getByText(/预设曲库/)).toBeInTheDocument();
    });

    it('应该显示用户曲谱标签', () => {
      render(<SongLibrary {...mockProps} />);

      expect(screen.getByText(/用户曲谱/)).toBeInTheDocument();
    });
  });

  describe('搜索功能', () => {
    it('应该可以输入搜索关键词', () => {
      render(<SongLibrary {...mockProps} />);

      const searchInput = screen.getByPlaceholderText(/搜索曲目/);
      fireEvent.change(searchInput, { target: { value: '月亮' } });

      expect(searchInput).toHaveValue('月亮');
    });

    it('应该可以清空搜索', () => {
      render(<SongLibrary {...mockProps} />);

      const searchInput = screen.getByPlaceholderText(/搜索曲目/);
      fireEvent.change(searchInput, { target: { value: '月亮' } });
      
      const clearButton = screen.getByRole('button', { name: /close-circle/i });
      if (clearButton) {
        fireEvent.click(clearButton);
      }

      expect(searchInput).toHaveValue('');
    });

    it('搜索后应该过滤预设曲目', async () => {
      render(<SongLibrary {...mockProps} />);

      const searchInput = screen.getByPlaceholderText(/搜索曲目/);
      fireEvent.change(searchInput, { target: { value: '月亮' } });

      await waitFor(() => {
        expect(screen.getByText(/月亮代表我的心/)).toBeInTheDocument();
      });
    });
  });

  describe('标签页切换', () => {
    it('默认应该显示预设曲库标签', () => {
      render(<SongLibrary {...mockProps} />);

      const presetTab = screen.getByText(/预设曲库/);
      expect(presetTab).toBeInTheDocument();
    });

    it('应该可以切换到用户曲谱标签', () => {
      render(<SongLibrary {...mockProps} />);

      const userTab = screen.getByText(/用户曲谱/);
      fireEvent.click(userTab);

      expect(mockProps.onLoadUserSongs).toHaveBeenCalled();
    });

    it('切换标签时应该清空搜索', () => {
      render(<SongLibrary {...mockProps} />);

      const searchInput = screen.getByPlaceholderText(/搜索曲目/);
      fireEvent.change(searchInput, { target: { value: '测试' } });

      const userTab = screen.getByText(/用户曲谱/);
      fireEvent.click(userTab);

      expect(searchInput).toHaveValue('');
    });
  });

  describe('预设曲库', () => {
    it('应该显示预设歌曲列表', () => {
      render(<SongLibrary {...mockProps} />);

      expect(screen.getByText('月亮代表我的心')).toBeInTheDocument();
      expect(screen.getByText('穿越时空的爱恋')).toBeInTheDocument();
      expect(screen.getByText('我们的时光')).toBeInTheDocument();
    });

    it('应该显示歌曲信息', () => {
      render(<SongLibrary {...mockProps} />);

      expect(screen.getByText('邓丽君')).toBeInTheDocument();
      expect(screen.getByText('周杰伦')).toBeInTheDocument();
      expect(screen.getByText('TFBOYS')).toBeInTheDocument();
    });

    it('应该显示调性标签', () => {
      render(<SongLibrary {...mockProps} />);

      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.getByText('D')).toBeInTheDocument();
      expect(screen.getByText('G')).toBeInTheDocument();
    });

    it('应该显示难度标签', () => {
      render(<SongLibrary {...mockProps} />);

      expect(screen.getByText('简单')).toBeInTheDocument();
      expect(screen.getByText('中等')).toBeInTheDocument();
      expect(screen.getByText('困难')).toBeInTheDocument();
    });

    it('点击曲目应该触发选择', () => {
      render(<SongLibrary {...mockProps} />);

      const songRow = screen.getByText('月亮代表我的心').closest('tr');
      if (songRow) {
        fireEvent.click(songRow);
      }

      expect(mockProps.onSelectSong).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '月亮代表我的心',
        })
      );
    });
  });

  describe('用户曲谱', () => {
    it('应该显示用户曲谱', () => {
      render(<SongLibrary {...mockProps} />);

      const userTab = screen.getByText(/用户曲谱/);
      fireEvent.click(userTab);

      expect(screen.getByText('我的原创')).toBeInTheDocument();
    });

    it('应该显示删除按钮', () => {
      render(<SongLibrary {...mockProps} />);

      const userTab = screen.getByText(/用户曲谱/);
      fireEvent.click(userTab);

      expect(screen.getByText('删除')).toBeInTheDocument();
    });

    it('点击删除按钮应该触发删除', () => {
      render(<SongLibrary {...mockProps} />);

      const userTab = screen.getByText(/用户曲谱/);
      fireEvent.click(userTab);

      const deleteButton = screen.getByText('删除');
      fireEvent.click(deleteButton);

      expect(mockProps.onDeleteUserSong).toHaveBeenCalledWith(1);
    });

    it('点击用户曲目应该触发选择', () => {
      render(<SongLibrary {...mockProps} />);

      const userTab = screen.getByText(/用户曲谱/);
      fireEvent.click(userTab);

      const songRow = screen.getByText('我的原创').closest('tr');
      if (songRow) {
        fireEvent.click(songRow);
      }

      expect(mockProps.onSelectSong).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '我的原创',
        })
      );
    });
  });

  describe('空状态', () => {
    it('预设曲库为空时应该显示空状态', () => {
      render(
        <SongLibrary
          {...mockProps}
          userSongs={[]}
        />
      );

      // Mock 空曲库
      vi.mocked(songLibrary).length = 0;
      
      const searchInput = screen.getByPlaceholderText(/搜索曲目/);
      fireEvent.change(searchInput, { target: { value: '不存在的歌曲' } });

      expect(screen.getByText(/没有找到匹配的曲目/)).toBeInTheDocument();
    });

    it('用户曲谱为空时应该显示空状态', () => {
      render(
        <SongLibrary
          {...mockProps}
          userSongs={[]}
        />
      );

      const userTab = screen.getByText(/用户曲谱/);
      fireEvent.click(userTab);

      expect(screen.getByText(/暂无用户曲谱，可以导入或创建新曲谱/)).toBeInTheDocument();
    });
  });

  describe('导出功能', () => {
    it('应该可以触发出口', () => {
      render(<SongLibrary {...mockProps} />);

      const exportButton = screen.getByText(/导出曲谱/);
      fireEvent.click(exportButton);

      expect(mockProps.onExportSongs).toHaveBeenCalledTimes(1);
    });
  });

  describe('导入功能', () => {
    it('应该可以触发导入', () => {
      render(<SongLibrary {...mockProps} />);

      const importButton = screen.getByText(/导入曲谱/);
      expect(importButton).toBeInTheDocument();
    });
  });

  describe'关闭功能', () => {
    it('应该有关闭按钮', () => {
      render(<SongLibrary {...mockProps} />);

      const closeButton = screen.getByRole('button', { name: /✕/ });
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe'提示信息', () => {
    it('应该显示提示文字', () => {
      render(<SongLibrary {...mockProps} />);

      expect(
        screen.getByText(/点击曲目即可加载到练习模式/)
      ).toBeInTheDocument();
    });
  });
});
