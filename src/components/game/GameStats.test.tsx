import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GameStats from './GameStats';

describe('GameStats', () => {
  const defaultProps = {
    score: 1000,
    combo: 5,
    maxCombo: 10,
  };

  it('should render score and combo statistics', () => {
    render(<GameStats {...defaultProps} />);

    expect(screen.getByText('得分')).toBeInTheDocument();
    expect(screen.getByText('连击')).toBeInTheDocument();
  });

  it('should render score value correctly', () => {
    const { container } = render(
      <GameStats score={1000} combo={5} maxCombo={10} />,
    );
    expect(container.textContent).toContain('1,000');
  });

  it('should render combo value correctly', () => {
    const { container } = render(
      <GameStats score={1000} combo={5} maxCombo={10} />,
    );
    expect(container.textContent).toContain('5');
  });

  it('should render time left when isPlaying is true', () => {
    render(<GameStats {...defaultProps} timeLeft={30} isPlaying={true} />);
    expect(screen.getByText('30s')).toBeInTheDocument();
  });

  it('should not render time left when isPlaying is false', () => {
    render(<GameStats {...defaultProps} timeLeft={30} isPlaying={false} />);
    expect(screen.queryByText('30s')).not.toBeInTheDocument();
  });

  it('should not render time left when timeLeft is not provided', () => {
    render(<GameStats {...defaultProps} isPlaying={true} />);
    expect(screen.queryByText(/^[0-9]+s$/)).not.toBeInTheDocument();
  });

  it('should display values correctly', () => {
    const { container } = render(
      <GameStats score={1000} combo={5} maxCombo={10} />,
    );
    expect(container.textContent).toContain('1,000');
    expect(container.textContent).toContain('5');
  });

  it('should display large scores correctly', () => {
    const { container } = render(
      <GameStats score={9999} combo={99} maxCombo={150} />,
    );
    expect(container.textContent).toContain('9,999');
    expect(container.textContent).toContain('99');
  });

  it('should render time with clock icon when time is low', () => {
    render(<GameStats {...defaultProps} timeLeft={5} isPlaying={true} />);
    expect(screen.getByText('5s')).toBeInTheDocument();
  });

  it('should render time display when timeLeft is 10 or less', () => {
    render(<GameStats {...defaultProps} timeLeft={10} isPlaying={true} />);
    expect(screen.getByText('10s')).toBeInTheDocument();
  });
});
