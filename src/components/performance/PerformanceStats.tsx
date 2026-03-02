import React from 'react';
import { Card, Row, Col, Statistic, Progress, Tag } from 'antd';
import {
  DashboardOutlined,
  TrophyOutlined,
  FireOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';

interface PerformanceStatsProps {
  currentPitch?: number | null;
  currentMidi?: number | null;
  hitCount: number;
  missCount: number;
  accuracy?: number;
  score?: number;
  isActive?: boolean;
}

const PerformanceStats: React.FC<PerformanceStatsProps> = ({
  currentPitch,
  currentMidi,
  hitCount,
  missCount,
  accuracy,
  score,
  isActive,
}) => {
  const total = hitCount + missCount;
  const computedAccuracy = accuracy ?? (total > 0 ? Math.round((hitCount / total) * 100) : 0);
  const computedScore = score ?? 0;

  return (
    <Card size="small" title="练习统计">
      <Row gutter={16}>
        <Col span={24}>
          <div
            style={{
              textAlign: 'center',
              padding: 16,
              background: '#f5f5f5',
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>当前音高</div>
            {isActive && currentMidi !== null ? (
              <>
                <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1890ff' }}>
                  {currentMidi}
                </div>
                {currentPitch && (
                  <div style={{ fontSize: 14, color: '#999', marginTop: 4 }}>
                    {currentPitch} Hz
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 24, color: '#999' }}>未检测到</div>
            )}
          </div>
        </Col>

        <Col span={12}>
          <Statistic
            title="得分"
            value={computedScore}
            prefix={<TrophyOutlined />}
            valueStyle={{ color: '#faad14' }}
          />
        </Col>

        <Col span={12}>
          <Statistic
            title="准确率"
            value={computedAccuracy}
            suffix="%"
            prefix={<DashboardOutlined />}
            valueStyle={{
              color: computedAccuracy >= 80 ? '#52c41a' : computedAccuracy >= 60 ? '#faad14' : '#ff4d4f',
            }}
          />
        </Col>

        <Col span={12}>
          <Statistic
            title="命中"
            value={hitCount}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>

        <Col span={12}>
          <Statistic
            title="未命中"
            value={missCount}
            prefix={<CloseCircleOutlined />}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Col>

        <Col span={24}>
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>练习进度</div>
            <Progress
              percent={computedAccuracy}
              strokeColor={{
                '0%': computedAccuracy >= 80 ? '#52c41a' : '#faad14',
                '100%': computedAccuracy >= 80 ? '#73d13d' : '#ffc53d',
              }}
              format={(percent) => `${percent}% 准确`}
            />
          </div>
        </Col>

        {total > 0 && (
          <Col span={24}>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Tag color={computedAccuracy >= 80 ? 'green' : computedAccuracy >= 60 ? 'orange' : 'red'}>
                {computedAccuracy >= 80 ? '🎯 优秀' : computedAccuracy >= 60 ? '💪 加油' : '📚 多练习'}
              </Tag>
            </div>
          </Col>
        )}
      </Row>
    </Card>
  );
};

export default PerformanceStats;
