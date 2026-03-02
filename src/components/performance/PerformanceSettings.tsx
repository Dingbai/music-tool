import React from 'react';
import { Card, Slider, Select, Space, Typography, Tag } from 'antd';
import { SettingOutlined, AudioOutlined } from '@ant-design/icons';
import { INSTRUMENTS } from '../instruments';

const { Text } = Typography;

interface PerformanceSettingsProps {
  bpm: number;
  instrument: number;
  isRecordingMode: boolean;
  isActive: boolean;
  onBpmChange: (bpm: number) => void;
  onInstrumentChange: (instrument: number) => void;
  onRecordingModeChange: (enabled: boolean) => void;
}

const PerformanceSettings: React.FC<PerformanceSettingsProps> = ({
  bpm,
  instrument,
  isRecordingMode,
  isActive,
  onBpmChange,
  onInstrumentChange,
  onRecordingModeChange,
}) => {
  // 未开始播放时禁用所有设置
  const isDisabled = !isActive;

  return (
    <Card size="small" title={<><SettingOutlined /> 练习设置</>}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* 录音模式开关 */}
        <div>
          <div style={{ marginBottom: 8 }}>
            <Text strong>练习模式</Text>
            <Tag color={isRecordingMode ? 'red' : 'blue'} style={{ marginLeft: 8 }}>
              {isRecordingMode ? '🎤 录音模式' : '👀 浏览模式'}
            </Tag>
          </div>
          <Select
            value={isRecordingMode ? 'recording' : 'browsing'}
            onChange={(value) => onRecordingModeChange(value === 'recording')}
            disabled={isDisabled}
            style={{ width: '100%' }}
            options={[
              { value: 'browsing', label: '👀 浏览模式 - 仅播放和观看' },
              { value: 'recording', label: '🎤 录音模式 - 跟踪演奏并评分' },
            ]}
          />
        </div>

        {/* BPM 设置 */}
        <div>
          <div style={{ marginBottom: 8 }}>
            <Text strong>演奏速度：{bpm} BPM</Text>
          </div>
          <Slider
            min={40}
            max={200}
            value={bpm}
            onChange={onBpmChange}
            disabled={isDisabled}
            marks={{
              40: '慢',
              80: '中',
              120: '快',
              200: '极快',
            }}
          />
        </div>

        {/* 乐器选择 */}
        <div>
          <div style={{ marginBottom: 8 }}>
            <Text strong><AudioOutlined /> 乐器音色</Text>
          </div>
          <Select
            value={instrument}
            onChange={onInstrumentChange}
            disabled={isDisabled}
            style={{ width: '100%' }}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={INSTRUMENTS.map((inst) => ({
              value: inst.value,
              label: inst.label,
            }))}
          />
        </div>

        <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
          💡 提示：点击"开始练习/播放"按钮后，设置将自动应用
        </div>
      </Space>
    </Card>
  );
};

export default PerformanceSettings;
