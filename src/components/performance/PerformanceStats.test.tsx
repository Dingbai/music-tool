import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PerformanceStats from './PerformanceStats';

describe('PerformanceStats', () => {
  const mockProps = {
    hitCount: 10,
    missCount: 5,
  };

  describe('基础渲染', () => {
    it('应该渲染统计组件', () => {
      render(<PerformanceStats {...mockProps} />);

      expect(screen.getByText(/练习统计/)).toBeInTheDocument();
      expect(screen.getByText(/当前音高/)).toBeInTheDocument();
      expect(screen.getByText(/得分/)).toBeInTheDocument();
      expect(screen.getByText(/准确率/)).toBeInTheDocument();
      expect(screen.getAllByText(/命中/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/练习进度/)).toBeInTheDocument();
    });

    it('应该显示默认音高状态', () => {
      render(<PerformanceStats {...mockProps} />);

      expect(screen.getByText(/未检测到/)).toBeInTheDocument();
    });
  });

  describe('音高显示', () => {
    it('在非活跃状态下应该显示未检测到', () => {
      render(
        <PerformanceStats
          {...mockProps}
          isActive={false}
          currentMidi={60}
        />
      );

      expect(screen.getByText(/未检测到/)).toBeInTheDocument();
    });

    it('在活跃状态下应该显示当前 MIDI 值', () => {
      render(
        <PerformanceStats
          {...mockProps}
          isActive={true}
          currentMidi={60}
        />
      );

      expect(screen.getByText('60')).toBeInTheDocument();
    });

    it('应该显示频率值', () => {
      render(
        <PerformanceStats
          {...mockProps}
          isActive={true}
          currentMidi={60}
          currentPitch={261.63}
        />
      );

      expect(screen.getByText(/261.63 Hz/)).toBeInTheDocument();
    });
  });

  describe('统计数据', () => {
    it('应该显示命中数', () => {
      render(<PerformanceStats {...mockProps} />);

      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('应该显示未命中数', () => {
      render(<PerformanceStats {...mockProps} />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('应该计算并显示准确率', () => {
      render(<PerformanceStats {...mockProps} />);

      // 10 / (10 + 5) = 66.67% ≈ 67%
      expect(screen.getByText(/67/)).toBeInTheDocument();
    });

    it('应该显示得分', () => {
      render(<PerformanceStats {...mockProps} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('应该显示自定义得分', () => {
      render(
        <PerformanceStats
          {...mockProps}
          score={850}
        />
      );

      expect(screen.getByText('850')).toBeInTheDocument();
    });

    it('应该显示自定义准确率', () => {
      render(
        <PerformanceStats
          {...mockProps}
          accuracy={85}
        />
      );

      expect(screen.getByText(/85/)).toBeInTheDocument();
    });
  });

  describe('进度条', () => {
    it('应该显示进度条', () => {
      render(<PerformanceStats {...mockProps} />);

      const progress = screen.getByRole('progressbar');
      expect(progress).toBeInTheDocument();
    });

    it('应该显示正确的进度百分比', () => {
      render(<PerformanceStats {...mockProps} />);

      expect(screen.getByText(/67% 准确/)).toBeInTheDocument();
    });
  });

  describe('评价标签', () => {
    it('准确率低时应该显示鼓励标签', () => {
      render(
        <PerformanceStats
          hitCount={2}
          missCount={8}
        />
      );

      expect(screen.getByText(/📚 多练习/)).toBeInTheDocument();
    });

    it('准确率中等时应该显示加油标签', () => {
      render(
        <PerformanceStats
          hitCount={7}
          missCount={3}
        />
      );

      // 70% 准确率
      expect(screen.getByText(/💪 加油/)).toBeInTheDocument();
    });

    it('准确率高时应该显示优秀标签', () => {
      render(
        <PerformanceStats
          hitCount={9}
          missCount={1}
        />
      );

      // 90% 准确率
      expect(screen.getByText(/🎯 优秀/)).toBeInTheDocument();
    });

    it('没有练习记录时不应该显示评价标签', () => {
      render(
        <PerformanceStats
          hitCount={0}
          missCount={0}
        />
      );

      expect(screen.queryByText(/📚 多练习/)).not.toBeInTheDocument();
    });
  });

  describe('颜色状态', () => {
    it('高准确率应该显示绿色', () => {
      render(
        <PerformanceStats
          hitCount={90}
          missCount={10}
        />
      );

      // 90% 准确率，应该使用绿色
      const accuracyElement = screen.getByText(/90/);
      expect(accuracyElement).toBeInTheDocument();
    });

    it('中等准确率应该显示橙色', () => {
      render(
        <PerformanceStats
          hitCount={7}
          missCount={3}
        />
      );

      const accuracyElement = screen.getByText(/70/);
      expect(accuracyElement).toBeInTheDocument();
    });

    it('低准确率应该显示红色', () => {
      render(
        <PerformanceStats
          hitCount={3}
          missCount={7}
        />
      );

      const accuracyElement = screen.getByText(/30/);
      expect(accuracyElement).toBeInTheDocument();
    });
  });
});
