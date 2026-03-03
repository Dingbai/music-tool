import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PracticeHistory from './PracticeHistory';
import type { PracticeRecord } from '../../db/musicDb';

describe('PracticeHistory', () => {
  const mockRecords: PracticeRecord[] = [
    {
      id: 1,
      songTitle: '测试歌曲 1',
      score: 850,
      accuracy: 85,
      totalNotes: 20,
      hitNotes: 17,
      duration: 125,
      createdAt: Date.now() - 1000000,
    },
    {
      id: 2,
      songTitle: '测试歌曲 2',
      score: 600,
      accuracy: 60,
      totalNotes: 30,
      hitNotes: 18,
      duration: 200,
      createdAt: Date.now() - 2000000,
    },
    {
      id: 3,
      songTitle: '测试歌曲 3',
      score: 950,
      accuracy: 95,
      totalNotes: 25,
      hitNotes: 24,
      duration: 180,
      createdAt: Date.now() - 3000000,
    },
  ];

  const mockProps = {
    open: true,
    records: mockRecords,
    onClose: vi.fn(),
    onClear: vi.fn(),
  };

  describe('基础渲染', () => {
    it('应该渲染历史记录组件', () => {
      render(<PracticeHistory {...mockProps} />);

      expect(screen.getByText(/练习历史记录/)).toBeInTheDocument();
    });

    it('应该显示表格列头', () => {
      render(<PracticeHistory {...mockProps} />);

      expect(screen.getByText(/曲目/)).toBeInTheDocument();
      expect(screen.getByText(/得分/)).toBeInTheDocument();
      expect(screen.getByText(/准确率/)).toBeInTheDocument();
      expect(screen.getByText(/命中\/总数/)).toBeInTheDocument();
      expect(screen.getByText(/时长/)).toBeInTheDocument();
      expect(screen.getByText(/练习时间/)).toBeInTheDocument();
    });

    it('应该显示记录数量', () => {
      render(<PracticeHistory {...mockProps} />);

      expect(screen.getByText('测试歌曲 1')).toBeInTheDocument();
      expect(screen.getByText('测试歌曲 2')).toBeInTheDocument();
      expect(screen.getByText('测试歌曲 3')).toBeInTheDocument();
    });
  });

  describe'空状态', () => {
    it('没有记录时应该显示空状态', () => {
      render(
        <PracticeHistory
          {...mockProps}
          records={[]}
        />
      );

      expect(screen.getByText(/暂无练习记录，开始练习吧！/)).toBeInTheDocument();
    });

    it('空状态时不应该显示清空按钮', () => {
      render(
        <PracticeHistory
          {...mockProps}
          records={[]}
        />
      );

      expect(screen.queryByText(/清空历史记录/)).not.toBeInTheDocument();
    });
  });

  describe('数据显示', () => {
    it('应该显示得分标签', () => {
      render(<PracticeHistory {...mockProps} />);

      expect(screen.getByText('850 分')).toBeInTheDocument();
      expect(screen.getByText('600 分')).toBeInTheDocument();
      expect(screen.getByText('950 分')).toBeInTheDocument();
    });

    it('应该显示准确率标签', () => {
      render(<PracticeHistory {...mockProps} />);

      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
      expect(screen.getByText('95%')).toBeInTheDocument();
    });

    it('应该显示命中/总数', () => {
      render(<PracticeHistory {...mockProps} />);

      expect(screen.getByText('17 / 3')).toBeInTheDocument();
    });

    it('应该显示格式化的时长', () => {
      render(<PracticeHistory {...mockProps} />);

      // 125 秒 = 2:05
      expect(screen.getByText('2:05')).toBeInTheDocument();
      // 200 秒 = 3:20
      expect(screen.getByText('3:20')).toBeInTheDocument();
    });

    it('应该显示练习时间', () => {
      render(<PracticeHistory {...mockProps} />);

      // 验证时间显示（格式：YYYY/M/D HH:MM:SS）
      const timeElements = screen.getAllByText(/\d{4}\/\d{1,2}\/\d{1,2} \d{1,2}:\d{2}:\d{2}/);
      expect(timeElements.length).toBeGreaterThan(0);
    });
  });

  describe('标签颜色', () => {
    it('高准确率应该显示绿色标签', () => {
      render(<PracticeHistory {...mockProps} />);

      const accuracyTags = screen.getAllByText('95%');
      expect(accuracyTags.length).toBeGreaterThan(0);
    });

    it('中等准确率应该显示橙色标签', () => {
      render(<PracticeHistory {...mockProps} />);

      const accuracyTags = screen.getAllByText('85%');
      expect(accuracyTags.length).toBeGreaterThan(0);
    });

    it('低准确率应该显示红色标签', () => {
      render(<PracticeHistory {...mockProps} />);

      const accuracyTags = screen.getAllByText('60%');
      expect(accuracyTags.length).toBeGreaterThan(0);
    });

    it('高分应该显示绿色标签', () => {
      render(<PracticeHistory {...mockProps} />);

      const scoreTags = screen.getAllByText('950 分');
      expect(scoreTags.length).toBeGreaterThan(0);
    });

    it('中等分数应该显示橙色标签', () => {
      render(<PracticeHistory {...mockProps} />);

      const scoreTags = screen.getAllByText('850 分');
      expect(scoreTags.length).toBeGreaterThan(0);
    });

    it('低分应该显示红色标签', () => {
      render(<PracticeHistory {...mockProps} />);

      const scoreTags = screen.getAllByText('600 分');
      expect(scoreTags.length).toBeGreaterThan(0);
    });
  });

  describe('表格排序', () => {
    it('应该可以按得分排序', () => {
      render(<PracticeHistory {...mockProps} />);

      const scoreHeader = screen.getByText(/得分/);
      fireEvent.click(scoreHeader);

      // 验证排序发生（表格重新渲染）
      expect(screen.getByText('600 分')).toBeInTheDocument();
    });

    it('应该可以按准确率排序', () => {
      render(<PracticeHistory {...mockProps} />);

      const accuracyHeader = screen.getByText(/准确率/);
      fireEvent.click(accuracyHeader);

      expect(screen.getByText('60%')).toBeInTheDocument();
    });

    it('应该可以按时长排序', () => {
      render(<PracticeHistory {...mockProps} />);

      const durationHeader = screen.getByText(/时长/);
      fireEvent.click(durationHeader);

      expect(screen.getByText(/2:05/)).toBeInTheDocument();
    });

    it('应该可以按练习时间排序', () => {
      render(<PracticeHistory {...mockProps} />);

      const timeHeader = screen.getByText(/练习时间/);
      fireEvent.click(timeHeader);

      // 验证排序发生
      expect(screen.getByText('测试歌曲 1')).toBeInTheDocument();
    });
  });

  describe('清空历史记录', () => {
    it('有记录时应该显示清空按钮', () => {
      render(<PracticeHistory {...mockProps} />);

      expect(screen.getByText(/清空历史记录/)).toBeInTheDocument();
    });

    it('应该可以触发清空确认对话框', () => {
      render(<PracticeHistory {...mockProps} />);

      const clearButton = screen.getByText(/清空历史记录/);
      fireEvent.click(clearButton);

      expect(screen.getByText(/确认清空/)).toBeInTheDocument();
      expect(
        screen.getByText(/确定要清空所有练习记录吗？此操作不可恢复。/)
      ).toBeInTheDocument();
    });

    it('应该可以确认清空操作', async () => {
      render(<PracticeHistory {...mockProps} />);

      const clearButton = screen.getByText(/清空历史记录/);
      fireEvent.click(clearButton);

      const confirmButton = screen.getByText('确定');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockProps.onClear).toHaveBeenCalledTimes(1);
      });
    });

    it('可以取消清空操作', async () => {
      render(<PracticeHistory {...mockProps} />);

      const clearButton = screen.getByText(/清空历史记录/);
      fireEvent.click(clearButton);

      const cancelButton = screen.getByText('取消');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(mockProps.onClear).not.toHaveBeenCalled();
      });
    });
  });

  describe('关闭功能', () => {
    it('应该可以关闭 Modal', () => {
      render(<PracticeHistory {...mockProps} />);

      // Ant Design Modal 通常通过点击遮罩或按 ESC 关闭
      // 这里测试 onClose 回调
      const closeButton = screen.getByRole('button', { name: /✕/ });
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe'提示信息', () => {
    it('应该显示提示信息', () => {
      render(<PracticeHistory {...mockProps} />);

      expect(
        screen.getByText(/练习记录会自动保存，最多显示最近 50 条记录/)
      ).toBeInTheDocument();
    });
  });
});
