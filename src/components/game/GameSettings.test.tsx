import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GameSettings from './GameSettings';

describe('GameSettings', () => {
  const defaultProps = {
    gameMode: 'single' as const,
    notationMode: 'jianpu' as const,
    enableMic: false,
    speed: 4,
    gameConfig: {
      duration: 60,
      noteCount: 30,
    },
    isPlaying: false,
    showMoreSettings: false,
    onGameModeChange: vi.fn(),
    onNotationModeChange: vi.fn(),
    onEnableMicChange: vi.fn(),
    onSpeedChange: vi.fn(),
    onDurationChange: vi.fn(),
    onNoteCountChange: vi.fn(),
    onToggleMoreSettings: vi.fn(),
  };

  it('should render game settings card', () => {
    render(<GameSettings {...defaultProps} />);
    expect(screen.getByText('游戏设置')).toBeInTheDocument();
  });

  it('should render microphone checkbox unchecked by default', () => {
    render(<GameSettings {...defaultProps} />);
    const checkbox = screen.getByLabelText(/启用录音模式/);
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('should call onEnableMicChange when checkbox is clicked', () => {
    const onEnableMicChange = vi.fn();
    render(<GameSettings {...defaultProps} onEnableMicChange={onEnableMicChange} />);
    
    const checkbox = screen.getByLabelText(/启用录音模式/);
    fireEvent.click(checkbox);
    
    expect(onEnableMicChange).toHaveBeenCalledWith(true);
  });

  it('should render microphone checkbox checked when enableMic is true', () => {
    render(<GameSettings {...defaultProps} enableMic={true} />);
    const checkbox = screen.getByLabelText(/启用录音模式/);
    expect(checkbox).toBeChecked();
  });

  it('should show "查看更多设置" button when showMoreSettings is false', () => {
    render(<GameSettings {...defaultProps} />);
    expect(screen.getByText(/查看更多设置/)).toBeInTheDocument();
  });

  it('should show "收起设置" button when showMoreSettings is true', () => {
    render(<GameSettings {...defaultProps} showMoreSettings={true} />);
    expect(screen.getByText(/收起设置/)).toBeInTheDocument();
  });

  it('should call onToggleMoreSettings when toggle button is clicked', () => {
    const onToggleMoreSettings = vi.fn();
    render(<GameSettings {...defaultProps} onToggleMoreSettings={onToggleMoreSettings} />);
    
    const button = screen.getByText(/查看更多设置/);
    fireEvent.click(button);
    
    expect(onToggleMoreSettings).toHaveBeenCalled();
  });

  it('should disable microphone checkbox when isPlaying is true', () => {
    render(<GameSettings {...defaultProps} isPlaying={true} />);
    const checkbox = screen.getByLabelText(/启用录音模式/);
    expect(checkbox).toBeDisabled();
  });

  it('should show default speed value', () => {
    render(<GameSettings {...defaultProps} showMoreSettings={true} />);
    expect(screen.getByText(/下落速度：4/)).toBeInTheDocument();
  });

  it('should show default duration value', () => {
    const { container } = render(<GameSettings {...defaultProps} showMoreSettings={true} />);
    expect(container.textContent).toContain('60');
  });

  it('should show default note count value', () => {
    const { container } = render(<GameSettings {...defaultProps} showMoreSettings={true} />);
    expect(container.textContent).toContain('30');
  });

  it('should show game mode options when expanded', () => {
    render(<GameSettings {...defaultProps} showMoreSettings={true} />);
    expect(screen.getByText('自由模式')).toBeInTheDocument();
    expect(screen.getByText('曲谱模式')).toBeInTheDocument();
  });

  it('should show notation mode options when expanded', () => {
    render(<GameSettings {...defaultProps} showMoreSettings={true} />);
    expect(screen.getByText('简谱')).toBeInTheDocument();
    expect(screen.getByText('五线谱')).toBeInTheDocument();
  });

  it('should display input method info', () => {
    render(<GameSettings {...defaultProps} showMoreSettings={true} />);
    expect(screen.getByText(/键盘.*点击/)).toBeInTheDocument();
  });
});
