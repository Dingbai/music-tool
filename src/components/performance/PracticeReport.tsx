import React from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Button,
  Divider,
  Space,
} from 'antd';
import {
  TrophyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  RedoOutlined,
} from '@ant-design/icons';

interface PracticeReportProps {
  score: number;
  accuracy: number;
  hitNotes: number;
  missNotes: number;
  duration: number;
  onPlayAgain?: () => void;
  onClose?: () => void;
}

const PracticeReport: React.FC<PracticeReportProps> = ({
  score,
  accuracy,
  hitNotes,
  missNotes,
  duration,
  onPlayAgain,
  onClose,
}) => {
  // 根据准确率确定等级
  const getRank = () => {
    if (accuracy >= 90) return { grade: 'S', color: '#ffd700', emoji: '🏆' };
    if (accuracy >= 80) return { grade: 'A', color: '#c0c0c0', emoji: '🥇' };
    if (accuracy >= 70) return { grade: 'B', color: '#cd7f32', emoji: '🥈' };
    if (accuracy >= 60) return { grade: 'C', color: '#52c41a', emoji: '🥉' };
    return { grade: 'D', color: '#999', emoji: '📚' };
  };

  const rank = getRank();

  return (
    <Card
      title='🎵 练习报告'
      extra={
        <Button type='text' size='small' onClick={onClose}>
          ✕
        </Button>
      }
      style={{ maxWidth: 500, margin: '0 auto' }}
    >
      {/* 等级显示 */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 64, marginBottom: 8 }}>{rank.emoji}</div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 'bold',
            color: rank.color,
          }}
        >
          {rank.grade}
        </div>
      </div>

      <Divider style={{ margin: '16px 0' }} />

      {/* 统计数据 */}
      <Row gutter={16}>
        <Col span={12}>
          <Statistic
            title='最终得分'
            value={score}
            prefix={<TrophyOutlined />}
            valueStyle={{ color: '#faad14' }}
          />
        </Col>

        <Col span={12}>
          <Statistic
            title='准确率'
            value={accuracy}
            suffix='%'
            valueStyle={{
              color:
                accuracy >= 80
                  ? '#52c41a'
                  : accuracy >= 60
                    ? '#faad14'
                    : '#ff4d4f',
            }}
          />
        </Col>

        <Col span={12}>
          <Statistic
            title='命中音符'
            value={hitNotes}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>

        <Col span={12}>
          <Statistic
            title='未命中'
            value={missNotes}
            prefix={<CloseCircleOutlined />}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Col>

        <Col span={24}>
          <Statistic
            title='练习时长'
            value={Math.floor(duration / 60)}
            suffix={`分 ${duration % 60}秒`}
            prefix={<ClockCircleOutlined />}
          />
        </Col>
      </Row>

      <Divider style={{ margin: '16px 0' }} />

      {/* 进度条 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
          总体表现
        </div>
        <Progress
          percent={accuracy}
          strokeColor={{
            '0%':
              accuracy >= 80
                ? '#52c41a'
                : accuracy >= 60
                  ? '#faad14'
                  : '#ff4d4f',
            '100%':
              accuracy >= 80
                ? '#73d13d'
                : accuracy >= 60
                  ? '#ffc53d'
                  : '#ff7875',
          }}
          format={(percent) => `${percent}% 准确`}
        />
      </div>

      {/* 操作按钮 */}
      <Space orientation='vertical' style={{ width: '100%' }} size='middle'>
        <Button
          type='primary'
          size='large'
          block
          icon={<RedoOutlined />}
          onClick={onPlayAgain}
        >
          再来一次
        </Button>
      </Space>
    </Card>
  );
};

export default PracticeReport;
