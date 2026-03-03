import React from 'react';
import { Modal, Table, Tag, Space, Button, Typography, Empty, Divider } from 'antd';
import {
  HistoryOutlined,
  TrophyOutlined,
  FireOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { PracticeRecord } from '../../db/musicDb';

const { Text } = Typography;

interface PracticeHistoryProps {
  open: boolean;
  records: PracticeRecord[];
  onClose: () => void;
  onClear: () => void;
}

const PracticeHistory: React.FC<PracticeHistoryProps> = ({
  open,
  records,
  onClose,
  onClear,
}) => {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAccuracyColor = (accuracy: number): string => {
    if (accuracy >= 80) return 'green';
    if (accuracy >= 60) return 'orange';
    return 'red';
  };

  const getScoreColor = (score: number): string => {
    if (score >= 800) return 'green';
    if (score >= 500) return 'orange';
    return 'red';
  };

  return (
    <Modal
      title={
        <span>
          <HistoryOutlined /> 练习历史记录
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      {records.length > 0 ? (
        <Table
          dataSource={records}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: '暂无练习记录' }}
          columns={[
            {
              title: '曲目',
              dataIndex: 'songTitle',
              key: 'songTitle',
              render: (title: string) => (
                <Text ellipsis style={{ maxWidth: 150 }}>
                  {title}
                </Text>
              ),
            },
            {
              title: '得分',
              dataIndex: 'score',
              key: 'score',
              render: (score: number) => (
                <Tag color={getScoreColor(score)}>{score} 分</Tag>
              ),
              sorter: (a, b) => a.score - b.score,
            },
            {
              title: '准确率',
              dataIndex: 'accuracy',
              key: 'accuracy',
              render: (accuracy: number) => (
                <Tag color={getAccuracyColor(accuracy)}>{accuracy}%</Tag>
              ),
              sorter: (a, b) => a.accuracy - b.accuracy,
            },
            {
              title: '命中/总数',
              key: 'hitTotal',
              render: (_: unknown, record: PracticeRecord) => (
                <span>
                  <span style={{ color: '#52c41a' }}>{record.hitNotes}</span>
                  {' / '}
                  <span style={{ color: '#ff4d4f' }}>{record.totalNotes - record.hitNotes}</span>
                </span>
              ),
            },
            {
              title: '时长',
              dataIndex: 'duration',
              key: 'duration',
              render: (duration: number) => (
                <span>
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  {formatDuration(duration)}
                </span>
              ),
              sorter: (a, b) => a.duration - b.duration,
            },
            {
              title: '练习时间',
              dataIndex: 'createdAt',
              key: 'createdAt',
              render: (createdAt: number) => new Date(createdAt).toLocaleString('zh-CN'),
              sorter: (a, b) => a.createdAt - b.createdAt,
              defaultSortOrder: 'descend',
            },
          ]}
        />
      ) : (
        <Empty description="暂无练习记录，开始练习吧！" />
      )}

      <Divider />

      <Space orientation="vertical" style={{ width: '100%' }} size="small">
        <Text type="secondary" style={{ fontSize: 12 }}>
          <TrophyOutlined style={{ marginRight: 4 }} />
          练习记录会自动保存，最多显示最近 50 条记录
        </Text>
        {records.length > 0 && (
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: '确认清空',
                content: '确定要清空所有练习记录吗？此操作不可恢复。',
                onOk: onClear,
              });
            }}
          >
            清空历史记录
          </Button>
        )}
      </Space>
    </Modal>
  );
};

export default PracticeHistory;
