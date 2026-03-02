import React from 'react';
import { Card, Button, Row, Col, Statistic, Divider } from 'antd';
import { TrophyOutlined, FireOutlined } from '@ant-design/icons';

interface GameResultProps {
  score: number;
  combo: number;
  maxCombo: number;
  hitCount: number;
  missCount: number;
  onPlayAgain: () => void;
  onClose: () => void;
}

const GameResult: React.FC<GameResultProps> = ({
  score,
  maxCombo,
  hitCount,
  missCount,
  onPlayAgain,
  onClose,
}) => {
  const total = hitCount + missCount;
  const accuracy = total > 0 ? Math.round((hitCount / total) * 100) : 0;

  let rank = 'C';
  if (accuracy >= 90 && maxCombo >= 10) rank = 'S';
  else if (accuracy >= 80) rank = 'A';
  else if (accuracy >= 70) rank = 'B';

  const rankEmoji: Record<string, string> = {
    'S': '🏆',
    'A': '🥇',
    'B': '🥈',
    'C': '🥉',
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        borderRadius: '8px',
      }}
    >
      <Card
        style={{ width: 400, textAlign: 'center' }}
        title={
          <div style={{ fontSize: 24 }}>
            <span style={{ fontSize: 48 }}>{rankEmoji[rank]}</span>
            <div style={{ marginTop: 16 }}>游戏结束</div>
          </div>
        }
        extra={
          <Button type='text' onClick={onClose} size='small'>
            ✕
          </Button>
        }
      >
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 36, fontWeight: 'bold', color: '#1890ff' }}>
            等级：{rank}
          </div>
        </div>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Statistic title='最终得分' value={score} prefix={<TrophyOutlined />} />
          </Col>
          <Col span={12}>
            <Statistic title='最大连击' value={maxCombo} prefix={<FireOutlined />} />
          </Col>
        </Row>

        <Divider style={{ margin: '16px 0' }} />

        <Row gutter={16}>
          <Col span={8}>
            <Statistic title='命中' value={hitCount} style={{ color: '#52c41a' }} />
          </Col>
          <Col span={8}>
            <Statistic title='未命中' value={missCount} style={{ color: '#ff4d4f' }} />
          </Col>
          <Col span={8}>
            <Statistic title='准确率' value={accuracy} suffix='%' />
          </Col>
        </Row>

        <Divider style={{ margin: '24px 0 16px' }} />

        <Button type='primary' size='large' block onClick={onPlayAgain}>
          🎮 再来一局
        </Button>
      </Card>
    </div>
  );
};

export default GameResult;
