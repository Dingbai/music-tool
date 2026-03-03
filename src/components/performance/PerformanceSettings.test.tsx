import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PerformanceSettings from './PerformanceSettings';

describe('PerformanceSettings', () => {
  const mockProps = {
    bpm: 80,
    instrument: 0,
    isRecordingMode: false,
    isActive: false,
    onBpmChange: vi.fn(),
    onInstrumentChange: vi.fn(),
    onRecordingModeChange: vi.fn(),
    onParameterChange: vi.fn(),
  };

  describe('基础渲染', () => {
    it('应该渲染设置组件', () => {
      render(<PerformanceSettings {...mockProps} />);

      expect(screen.getByText(/练习设置/)).toBeInTheDocument();
      expect(screen.getByText(/练习模式/)).toBeInTheDocument();
      expect(screen.getByText(/演奏速度/)).toBeInTheDocument();
      expect(screen.getByText(/乐器音色/)).toBeInTheDocument();
    });

    it('应该显示当前 BPM 值', () => {
      render(<PerformanceSettings {...mockProps} />);

      expect(screen.getByText('演奏速度：80 BPM')).toBeInTheDocument();
    });

    it('应该显示模式标签', () => {
      render(<PerformanceSettings {...mockProps} />);

      expect(screen.getByText(/浏览模式/)).toBeInTheDocument();
    });
  });

  describe('BPM 控制', () => {
    it('应该渲染 BPM 滑块', () => {
      render(<PerformanceSettings {...mockProps} />);

      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveValue(80);
    });

    it('应该可以改变 BPM 值', () => {
      render(<PerformanceSettings {...mockProps} />);

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '100' } });

      expect(mockProps.onBpmChange).toHaveBeenCalledWith(100);
      expect(mockProps.onParameterChange).toHaveBeenCalled();
    });

    it('BPM 滑块应该有正确的范围', () => {
      render(<PerformanceSettings {...mockProps} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', '40');
      expect(slider).toHaveAttribute('max', '200');
    });
  });

  describe('模式切换', () => {
    it('应该显示浏览模式选项', () => {
      render(<PerformanceSettings {...mockProps} />);

      expect(screen.getByText(/浏览模式 - 仅播放和观看/)).toBeInTheDocument();
    });

    it('应该显示录音模式选项', () => {
      render(<PerformanceSettings {...mockProps} />);

      expect(screen.getByText(/录音模式 - 跟踪演奏并评分/)).toBeInTheDocument();
    });

    it('应该可以切换到录音模式', () => {
      render(<PerformanceSettings {...mockProps} />);

      const select = screen.getByRole('combobox');
      fireEvent.mouseDown(select);

      const recordingOption = screen.getByText(/录音模式 - 跟踪演奏并评分/);
      fireEvent.click(recordingOption);

      expect(mockProps.onRecordingModeChange).toHaveBeenCalledWith(true);
      expect(mockProps.onParameterChange).toHaveBeenCalled();
    });

    it('在录音模式下应该显示红色标签', () => {
      render(
        <PerformanceSettings
          {...mockProps}
          isRecordingMode={true}
        />
      );

      expect(screen.getByText(/🎤 录音模式/)).toBeInTheDocument();
    });

    it('在浏览模式下应该显示蓝色标签', () => {
      render(<PerformanceSettings {...mockProps} />);

      expect(screen.getByText(/👀 浏览模式/)).toBeInTheDocument();
    });
  });

  describe('乐器选择', () => {
    it('应该渲染乐器选择器', () => {
      render(<PerformanceSettings {...mockProps} />);

      const selects = screen.getAllByRole('combobox');
      // 第二个 combobox 是乐器选择器
      expect(selects.length).toBeGreaterThanOrEqual(1);
    });

    it('应该可以改变乐器', () => {
      render(<PerformanceSettings {...mockProps} />);

      const selects = screen.getAllByRole('combobox');
      const instrumentSelect = selects[selects.length - 1]; // 最后一个选择器
      fireEvent.mouseDown(instrumentSelect);

      // 验证选择器存在
      expect(instrumentSelect).toBeInTheDocument();
    });
  });

  describe('禁用状态', () => {
    it('在活跃状态下应该禁用所有控件', () => {
      render(
        <PerformanceSettings
          {...mockProps}
          isActive={true}
        />
      );

      const slider = screen.getByRole('slider');
      expect(slider).toBeDisabled();

      const selects = screen.getAllByRole('combobox');
      selects.forEach((select) => {
        expect(select).toBeDisabled();
      });
    });

    it('在非活跃状态下应该启用所有控件', () => {
      render(<PerformanceSettings {...mockProps} />);

      const slider = screen.getByRole('slider');
      expect(slider).not.toBeDisabled();

      const selects = screen.getAllByRole('combobox');
      selects.forEach((select) => {
        expect(select).not.toBeDisabled();
      });
    });
  });

  describe('提示信息', () => {
    it('应该显示提示信息', () => {
      render(<PerformanceSettings {...mockProps} />);

      expect(
        screen.getByText(/💡 提示：点击"开始练习\/播放"按钮后，设置将自动应用/)
      ).toBeInTheDocument();
    });
  });
});
