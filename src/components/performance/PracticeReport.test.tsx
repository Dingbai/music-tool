import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PracticeReport from './PracticeReport';

describe('PracticeReport', () => {
  const mockProps = {
    score: 850,
    accuracy: 85,
    hitNotes: 17,
    missNotes: 3,
    duration: 125, // 2 分 5 秒
  };

  describe('基础渲染', () => {
    it('应该渲染练习报告组件', () => {
      render(<PracticeReport {...mockProps} />);

      expect(screen.getByText(/🎵 练习报告/)).toBeInTheDocument();
      expect(screen.getByText(/最终得分/)).toBeInTheDocument();
      expect(screen.getByText(/准确率/)).toBeInTheDocument();
      expect(screen.getByText(/命中音符/)).toBeInTheDocument();
      expect(screen.getByText(/未命中/)).toBeInTheDocument();
      expect(screen.getByText(/练习时长/)).toBeInTheDocument();
      expect(screen.getByText(/总体表现/)).toBeInTheDocument();
    });

    it('应该显示等级评价', () => {
      render(<PracticeReport {...mockProps} />);

      // 85% 准确率应该是 A 级
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('🥇')).toBeInTheDocument();
    });

    it('应该显示再来一次按钮', () => {
      render(<PracticeReport {...mockProps} />);

      expect(screen.getByText(/再来一次/)).toBeInTheDocument();
    });
  });

  describe('等级评定', () => {
    it('90% 以上准确率应该显示 S 级', () => {
      render(
        <PracticeReport
          {...mockProps}
          accuracy={95}
        />
      );

      expect(screen.getByText('S')).toBeInTheDocument();
      expect(screen.getByText('🏆')).toBeInTheDocument();
    });

    it('80-89% 准确率应该显示 A 级', () => {
      render(
        <PracticeReport
          {...mockProps}
          accuracy={85}
        />
      );

      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('🥇')).toBeInTheDocument();
    });

    it('70-79% 准确率应该显示 B 级', () => {
      render(
        <PracticeReport
          {...mockProps}
          accuracy={75}
        />
      );

      expect(screen.getByText('B')).toBeInTheDocument();
      expect(screen.getByText('🥈')).toBeInTheDocument();
    });

    it('60-69% 准确率应该显示 C 级', () => {
      render(
        <PracticeReport
          {...mockProps}
          accuracy={65}
        />
      );

      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.getByText('🥉')).toBeInTheDocument();
    });

    it('60% 以下准确率应该显示 D 级', () => {
      render(
        <PracticeReport
          {...mockProps}
          accuracy={50}
        />
      );

      expect(screen.getByText('D')).toBeInTheDocument();
      expect(screen.getByText('📚')).toBeInTheDocument();
    });
  });

  describe('统计数据显示', () => {
    it('应该显示得分', () => {
      render(<PracticeReport {...mockProps} />);

      expect(screen.getByText('850')).toBeInTheDocument();
    });

    it('应该显示准确率百分比', () => {
      render(<PracticeReport {...mockProps} />);

      // 查找准确率标题对应的值
      const accuracyTitle = screen.getByText(/准确率/).closest('.ant-statistic-header');
      const statistic = accuracyTitle?.parentElement;
      expect(statistic?.querySelector('.ant-statistic-content-value-int')).toHaveTextContent('85');
    });

    it('应该显示命中音符数', () => {
      render(<PracticeReport {...mockProps} />);

      expect(screen.getByText('17')).toBeInTheDocument();
    });

    it('应该显示未命中音符数', () => {
      render(<PracticeReport {...mockProps} />);

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('应该显示练习时长（分秒格式）', () => {
      render(<PracticeReport {...mockProps} />);

      expect(screen.getByText(/2 分/)).toBeInTheDocument();
      expect(screen.getByText(/5 秒/)).toBeInTheDocument();
    });

    it('应该显示整分钟时长', () => {
      render(
        <PracticeReport
          {...mockProps}
          duration={180}
        />
      );

      expect(screen.getByText(/3 分/)).toBeInTheDocument();
    });
  });

  describe('进度条', () => {
    it('应该显示进度条', () => {
      render(<PracticeReport {...mockProps} />);

      const progress = screen.getByRole('progressbar');
      expect(progress).toBeInTheDocument();
    });

    it('应该显示正确的进度百分比', () => {
      render(<PracticeReport {...mockProps} />);

      expect(screen.getByText(/85% 准确/)).toBeInTheDocument();
    });
  });

  describe('按钮事件', () => {
    it('应该响应再来一次按钮点击', () => {
      const onPlayAgain = vi.fn();
      render(
        <PracticeReport
          {...mockProps}
          onPlayAgain={onPlayAgain}
        />
      );

      const playAgainButton = screen.getByText(/再来一次/);
      fireEvent.click(playAgainButton);

      expect(onPlayAgain).toHaveBeenCalledTimes(1);
    });

    it('应该响应关闭按钮点击', () => {
      const onClose = vi.fn();
      render(
        <PracticeReport
          {...mockProps}
          onClose={onClose}
        />
      );

      const closeButton = screen.getByText('✕');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('颜色状态', () => {
    it('高准确率应该使用绿色进度条', () => {
      render(
        <PracticeReport
          {...mockProps}
          accuracy={90}
        />
      );

      const progress = screen.getByRole('progressbar');
      expect(progress).toBeInTheDocument();
    });

    it('中等准确率应该使用橙色进度条', () => {
      render(
        <PracticeReport
          {...mockProps}
          accuracy={65}
        />
      );

      const progress = screen.getByRole('progressbar');
      expect(progress).toBeInTheDocument();
    });

    it('低准确率应该使用红色进度条', () => {
      render(
        <PracticeReport
          {...mockProps}
          accuracy={40}
        />
      );

      const progress = screen.getByRole('progressbar');
      expect(progress).toBeInTheDocument();
    });
  });
});
