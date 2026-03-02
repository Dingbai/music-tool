import React from 'react';
import { Statistic } from 'antd';
import {
  TrophyOutlined,
  FireOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

interface GameStatsProps {
  score: number;
  combo: number;
  maxCombo: number;
  timeLeft?: number;
  isPlaying?: boolean;
}

const GameStats: React.FC<GameStatsProps> = ({
  score,
  combo,
  timeLeft,
  isPlaying,
}) => {
  return (
    <>
      <div style={{ display: 'flex', gap: 16 }}>
        <div
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            padding: 20,
            borderRadius: 12,
            color: '#fff',
          }}
        >
          <Statistic
            title='得分'
            value={score}
            prefix={<TrophyOutlined />}
            styles={{ content: { color: '#fff' } }}
          />
        </div>
        <div
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #f093fb, #f5576c)',
            padding: 20,
            borderRadius: 12,
            color: '#fff',
          }}
        >
          <Statistic
            title='连击'
            value={combo}
            prefix={<FireOutlined />}
            styles={{ content: { color: '#fff' } }}
          />
        </div>
      </div>

      {isPlaying && timeLeft !== undefined && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'rgba(0,0,0,0.7)',
            padding: '8px 16px',
            borderRadius: 8,
            color: timeLeft <= 10 ? '#ff4d4f' : '#fff',
            fontSize: 24,
            fontWeight: 'bold',
            zIndex: 10,
          }}
        >
          <ClockCircleOutlined /> {timeLeft}s
        </div>
      )}
    </>
  );
};

export default GameStats;
