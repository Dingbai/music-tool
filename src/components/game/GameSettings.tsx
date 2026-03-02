import React from 'react';
import { Card, Radio, Slider, Space, Divider, Select, Button } from 'antd';
import { UnorderedListOutlined, SoundOutlined } from '@ant-design/icons';
import { Tag } from 'antd';

interface GameConfig {
  duration: number;
  noteCount: number;
}

interface GameSettingsProps {
  gameMode: 'single' | 'song';
  notationMode: 'jianpu' | 'staff';
  enableMic: boolean;
  speed: number;
  gameConfig: GameConfig;
  isPlaying: boolean;
  showMoreSettings: boolean;
  onGameModeChange: (mode: 'single' | 'song') => void;
  onNotationModeChange: (mode: 'jianpu' | 'staff') => void;
  onEnableMicChange: (enable: boolean) => void;
  onSpeedChange: (speed: number) => void;
  onDurationChange: (duration: number) => void;
  onNoteCountChange: (count: number) => void;
  onToggleMoreSettings: () => void;
}

const GameSettings: React.FC<GameSettingsProps> = ({
  gameMode,
  notationMode,
  enableMic,
  speed,
  gameConfig,
  isPlaying,
  showMoreSettings,
  onGameModeChange,
  onNotationModeChange,
  onEnableMicChange,
  onSpeedChange,
  onDurationChange,
  onNoteCountChange,
  onToggleMoreSettings,
}) => {
  return (
    <Card size='small' title='游戏设置'>
      <Space orientation='vertical' style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type='checkbox'
            id='enableMic'
            checked={enableMic}
            onChange={(e) => onEnableMicChange(e.target.checked)}
            disabled={isPlaying}
            style={{ width: 16, height: 16 }}
          />
          <label
            htmlFor='enableMic'
            style={{ fontSize: 14, cursor: 'pointer' }}
          >
            🎤 启用录音模式（需要麦克风权限）
          </label>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        <Button
          type='link'
          onClick={onToggleMoreSettings}
          style={{ padding: 0, textAlign: 'left' }}
        >
          {showMoreSettings ? '收起设置' : '查看更多设置'}{' '}
          {showMoreSettings ? '▲' : '▼'}
        </Button>

        {showMoreSettings && (
          <>
            <Divider style={{ margin: '12px 0' }} />

            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                ⌨️ 键盘 + 👆 点击 <Tag color='blue'>默认支持</Tag>
              </div>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div style={{ marginBottom: 8 }}>
              <div
                style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}
              >
                模式选择
              </div>
              <Radio.Group
                value={gameMode}
                onChange={(e) => onGameModeChange(e.target.value)}
                disabled={isPlaying}
              >
                <Radio value='single'>自由模式</Radio>
                <Radio value='song' disabled>
                  曲谱模式
                </Radio>
              </Radio.Group>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div style={{ marginBottom: 8 }}>
              <div
                style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}
              >
                音符显示
              </div>
              <Radio.Group
                value={notationMode}
                onChange={(e) => onNotationModeChange(e.target.value)}
                disabled={isPlaying}
              >
                <Radio value='jianpu'>
                  <UnorderedListOutlined /> 简谱
                </Radio>
                <Radio value='staff' disabled>
                  <SoundOutlined /> 五线谱
                </Radio>
              </Radio.Group>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div style={{ marginBottom: 8 }}>
              <div
                style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}
              >
                游戏时长
              </div>
              <Select
                value={gameConfig.duration}
                onChange={onDurationChange}
                disabled={isPlaying}
                style={{ width: '100%' }}
                options={[
                  { value: 30, label: '30 秒' },
                  { value: 60, label: '60 秒' },
                  { value: 90, label: '90 秒' },
                  { value: 120, label: '120 秒' },
                ]}
              />
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div style={{ marginBottom: 8 }}>
              <div
                style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}
              >
                音符数量
              </div>
              <Select
                value={gameConfig.noteCount}
                onChange={onNoteCountChange}
                disabled={isPlaying || gameMode === 'song'}
                style={{ width: '100%' }}
                options={[
                  { value: 20, label: '20 个' },
                  { value: 30, label: '30 个' },
                  { value: 50, label: '50 个' },
                  { value: 80, label: '80 个' },
                ]}
              />
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div style={{ marginBottom: 8 }}>
              <div
                style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}
              >
                下落速度：{speed}
              </div>
              <Slider
                min={1}
                max={10}
                value={speed}
                onChange={onSpeedChange}
                disabled={isPlaying}
              />
            </div>
          </>
        )}
      </Space>
    </Card>
  );
};

export default GameSettings;
