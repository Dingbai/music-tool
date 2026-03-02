import React, { useRef, useEffect, useCallback } from 'react';
import ABCJS from 'abcjs';
import { Badge, Button, Space } from 'antd';
import { AudioOutlined } from '@ant-design/icons';
import { detectPitchYIN, freqToMidi, midiToNoteName } from '../../utils/pitchService';

interface PerformanceCanvasProps {
  abcText: string;
  isActive: boolean;
  isRecordingMode: boolean;
  currentMidi: number | null;
  instrument: number;
  onNoteDetected?: (midi: number) => void;
}

const PerformanceCanvas: React.FC<PerformanceCanvasProps> = ({
  abcText,
  isActive,
  isRecordingMode,
  currentMidi,
  instrument,
  onNoteDetected,
}) => {
  const paperRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLDivElement>(null);
  const visualObjRef = useRef<unknown>(null);
  const synthControlRef = useRef<unknown>(null);

  // 渲染乐谱
  useEffect(() => {
    if (paperRef.current) {
      const res = ABCJS.renderAbc(paperRef.current, abcText, {
        add_classes: true,
        responsive: 'resize',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        clickListener: (abcElem: any) => {
          if (abcElem.midiPitches) {
            ABCJS.synth.playEvent(
              abcElem.midiPitches,
              abcElem.midiGraceNotePitches,
              500,
              instrument,
            );
          }
        },
      });
      visualObjRef.current = res[0];
    }
  }, [abcText, instrument]);

  // 初始化音频播放器
  useEffect(() => {
    if (audioRef.current && visualObjRef.current) {
      synthControlRef.current = new ABCJS.synth.SynthController();
      synthControlRef.current.load('#audio-controls', null, {
        displayLoop: false,
        displayRestart: false,
        displayPlay: true,
        displayProgress: true,
        displayWarp: true,
      });

      const midiBuffer = new ABCJS.synth.CreateSynth();
      midiBuffer.init({
        visualObj: visualObjRef.current,
        options: {
          chordsOff: true,
          program: instrument,
        },
      });

      synthControlRef.current
        .setTune(visualObjRef.current, false, {
          midiBuffer,
          displayLoop: false,
          loopTarget: undefined,
        })
        .then(() => {
          console.log('音频播放器初始化成功');
        })
        .catch((err: unknown) => {
          console.error('音频播放器初始化失败:', err);
        });
    }
  }, [visualObjRef.current, instrument]);

  // 播放控制
  const handlePlayPause = useCallback(() => {
    if (synthControlRef.current) {
      synthControlRef.current.togglePlay();
    }
  }, []);

  const handleStop = useCallback(() => {
    if (synthControlRef.current) {
      synthControlRef.current.stop();
    }
  }, []);

  return (
    <div>
      <Badge
        count={isRecordingMode ? 1 : 0}
        style={{
          backgroundColor: isRecordingMode ? '#ff4d4f' : '#1890ff',
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 'bold' }}>
          {isRecordingMode ? '🎤 录音中' : '👀 浏览模式'}
        </span>
      </Badge>

      {/* 乐谱显示区域 */}
      <div
        ref={paperRef}
        style={{
          background: '#fff',
          padding: 20,
          borderRadius: 8,
          minHeight: 200,
          marginBottom: 16,
        }}
      />

      {/* 播放器控件 */}
      <div
        id="audio-controls"
        ref={audioRef}
        style={{
          background: '#f5f5f5',
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
        }}
      />

      {/* 当前演奏音符显示 */}
      {isActive && currentMidi !== null && (
        <div
          style={{
            textAlign: 'center',
            padding: 16,
            background: '#e6f7ff',
            borderRadius: 8,
            border: '2px solid #1890ff',
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
            当前音符：{currentMidi}
          </div>
        </div>
      )}

      {/* 播放控制按钮 */}
      <Space style={{ marginTop: 16 }}>
        <Button onClick={handlePlayPause} disabled={!abcText}>
          {isActive ? '暂停' : '播放'}
        </Button>
        <Button onClick={handleStop} disabled={!isActive}>
          停止
        </Button>
      </Space>
    </div>
  );
};

export default PerformanceCanvas;
