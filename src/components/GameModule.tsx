import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Card,
  Button,
  Radio,
  Slider,
  Space,
  Row,
  Col,
  Typography,
  Statistic,
  Alert,
  Modal,
  Tag,
} from 'antd';
import {
  RocketOutlined,
  AimOutlined,
  StopOutlined,
  TrophyOutlined,
  FireOutlined,
} from '@ant-design/icons';
import ABCJS from 'abcjs';
import {
  detectPitchYIN,
  freqToMidi,
  midiToNoteName,
} from '../utils/pitchService'; // 引用之前的工具类

const { Text, Title } = Typography;

// 定义音符数据结构
interface GameNote {
  id: string;
  midi: number;
  timestamp: number; // 相对开始的时间（秒）
  y: number; // 实时 Y 坐标
  hit: boolean; // 是否命中
  missed: boolean; // 是否漏掉
}

const GameModule: React.FC<{ abcText: string }> = ({ abcText }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameMode, setGameMode] = useState<'single' | 'song'>('single');
  const [speed, setSpeed] = useState(4); // 下落速度系数
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState<{
    text: string;
    color: string;
  } | null>(null);

  // Refs 用于高性能渲染循环，避免 React 状态更新延迟
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const notesRef = useRef<GameNote[]>([]);
  const requestRef = useRef<number>();
  const currentMidiRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const JUDGMENT_LINE_Y = 480; // 判定线位置
  const NOTE_WIDTH = 50;
  const TRACK_COUNT = 12; // 对应一个八度的 12 个半音

  // 1. 从 ABC 源码解析曲子模式的音符序列
  const parseSongNotes = () => {
    const visualObj = ABCJS.renderAbc(
      document.createElement('div'),
      abcText,
    )[0];
    const notes: GameNote[] = [];
    if (!visualObj.lines) return [];

    visualObj.lines.forEach((line: any) => {
      line.staff.forEach((staff: any) => {
        staff.voices.forEach((voice: any) => {
          voice.forEach((element: any) => {
            if (element.el_type === 'note' && element.midiPitches) {
              notes.push({
                id: Math.random().toString(36),
                midi: element.midiPitches[0].pitch,
                timestamp: element.startMS / 1000, // 转换为秒
                y: -50, // 初始在屏幕上方以外
                hit: false,
                missed: false,
              });
            }
          });
        });
      });
    });
    return notes;
  };

  // 2. 音频环境初始化
  const startAudioEngine = async () => {
    if (!audioCtxRef.current)
      audioCtxRef.current = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
    await audioCtxRef.current.resume();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioCtxRef.current.createMediaStreamSource(stream);
    analyserRef.current = audioCtxRef.current.createAnalyser();
    analyserRef.current.fftSize = 2048;
    source.connect(analyserRef.current);
  };

  // 3. 游戏主渲染循环
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isPlaying) return;
    const ctx = canvas.getContext('2d')!;
    const currentTime = (performance.now() - startTimeRef.current) / 1000;

    // 清理画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制背景轨道
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < TRACK_COUNT; i++) {
      ctx.strokeStyle = '#333';
      ctx.strokeRect(
        i * (canvas.width / TRACK_COUNT),
        0,
        canvas.width / TRACK_COUNT,
        canvas.height,
      );
    }

    // 绘制判定线
    ctx.strokeStyle = '#1890ff';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(0, JUDGMENT_LINE_Y);
    ctx.lineTo(canvas.width, JUDGMENT_LINE_Y);
    ctx.stroke();
    ctx.setLineDash([]);

    // 实时音高检测
    if (analyserRef.current) {
      const buffer = new Float32Array(2048);
      analyserRef.current.getFloatTimeDomainData(buffer);
      const freq = detectPitchYIN(buffer, audioCtxRef.current!.sampleRate);
      currentMidiRef.current = freq ? freqToMidi(freq) : null;
    }

    // 单音模式生成逻辑
    if (gameMode === 'single' && Math.random() < 0.015) {
      const randomMidi = 60 + Math.floor(Math.random() * 12);
      notesRef.current.push({
        id: Math.random().toString(),
        midi: randomMidi,
        timestamp: currentTime + 2, // 2秒后到达
        y: 0,
        hit: false,
        missed: false,
      });
    }

    // 更新音符位置与判定
    notesRef.current.forEach((note) => {
      if (note.hit || note.missed) return;

      // 计算 Y 坐标：基于时间差和速度
      // 公式：Y = 判定线 - (预定到达时间 - 当前时间) * 像素速度
      const timeTillHit = note.timestamp - currentTime;
      note.y = JUDGMENT_LINE_Y - timeTillHit * speed * 100;

      // 判定逻辑
      const dist = Math.abs(note.y - JUDGMENT_LINE_Y);

      // 命中判定：在判定范围内且音高匹配
      if (dist < 25 && currentMidiRef.current === note.midi) {
        note.hit = true;
        handleHit();
      }
      // 漏掉判定：超过判定线
      else if (note.y > JUDGMENT_LINE_Y + 30) {
        note.missed = true;
        handleMiss();
      }

      // 绘制音符块
      if (!note.hit) {
        const x = (note.midi % 12) * (canvas.width / TRACK_COUNT);
        const gradient = ctx.createLinearGradient(x, note.y, x, note.y + 30);
        gradient.addColorStop(0, '#faad14');
        gradient.addColorStop(1, '#d48806');
        ctx.fillStyle = gradient;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#faad14';
        ctx.fillRect(x + 5, note.y, canvas.width / TRACK_COUNT - 10, 25);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(midiToNoteName(note.midi), x + 15, note.y + 18);
      }
    });

    // 绘制底部实时反馈
    if (currentMidiRef.current) {
      ctx.fillStyle = '#52c41a';
      ctx.font = '24px Arial';
      ctx.fillText(
        `正在演奏: ${midiToNoteName(currentMidiRef.current)}`,
        20,
        40,
      );
    }

    requestRef.current = requestAnimationFrame(render);
  }, [isPlaying, speed, gameMode]);

  const handleHit = () => {
    setScore((s) => s + 100);
    setCombo((c) => c + 1);
    setFeedback({ text: 'PERFECT', color: '#52c41a' });
  };

  const handleMiss = () => {
    setCombo(0);
    setFeedback({ text: 'MISS', color: '#ff4d4f' });
  };

  const startGame = async () => {
    await startAudioEngine();
    notesRef.current = gameMode === 'song' ? parseSongNotes() : [];
    setScore(0);
    setCombo(0);
    startTimeRef.current = performance.now();
    setIsPlaying(true);
  };

  const stopGame = () => {
    setIsPlaying(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    Modal.success({
      title: '挑战结束',
      content: `最终得分: ${score} | 最大连击: ${combo}`,
    });
  };

  useEffect(() => {
    if (isPlaying) requestRef.current = requestAnimationFrame(render);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, render]);

  return (
    <Card
      title={
        <span>
          <RocketOutlined /> 音乐节奏大师模式
        </span>
      }
      extra={<Tag color='red'>Beta</Tag>}
    >
      <Row gutter={24}>
        <Col span={16}>
          <div
            style={{
              position: 'relative',
              background: '#000',
              borderRadius: '12px',
              border: '4px solid #333',
              overflow: 'hidden',
            }}
          >
            <canvas
              ref={canvasRef}
              width={600}
              height={550}
              style={{ width: '100%', display: 'block' }}
            />

            {/* 游戏内 UI 叠加层 */}
            {feedback && (
              <div
                key={Math.random()}
                className='game-feedback'
                style={{ color: feedback.color }}
              >
                {feedback.text}
              </div>
            )}

            <div className='combo-display'>
              <div className='combo-num'>{combo}</div>
              <div className='combo-text'>COMBO</div>
            </div>
          </div>
        </Col>

        <Col span={8}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <div
              style={{
                background: '#f5f5f5',
                padding: '20px',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <Statistic
                title='Score'
                value={score}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </div>

            <Card size='small' title='游戏设置'>
              <Space direction='vertical' style={{ width: '100%' }}>
                <Text strong>模式选择</Text>
                <Radio.Group
                  value={gameMode}
                  onChange={(e) => setGameMode(e.target.value)}
                  disabled={isPlaying}
                  block
                  optionType='button'
                >
                  <Radio.Button
                    value='single'
                    style={{ width: '50%', textAlign: 'center' }}
                  >
                    单音随机
                  </Radio.Button>
                  <Radio.Button
                    value='song'
                    style={{ width: '50%', textAlign: 'center' }}
                  >
                    曲子挑战
                  </Radio.Button>
                </Radio.Group>

                <Text strong>下落速度 (难度)</Text>
                <Slider
                  min={2}
                  max={10}
                  value={speed}
                  onChange={setSpeed}
                  disabled={isPlaying}
                  marks={{ 2: '慢', 5: '中', 10: '快' }}
                />
              </Space>
            </Card>

            <Button
              type='primary'
              block
              size='large'
              icon={isPlaying ? <StopOutlined /> : <FireOutlined />}
              onClick={isPlaying ? stopGame : startGame}
              danger={isPlaying}
              style={{ height: '60px', fontSize: '20px' }}
            >
              {isPlaying ? '放弃挑战' : '进入游戏'}
            </Button>

            <Alert
              message='玩法说明'
              description='音符块到达蓝色虚线时，请吹奏出对应的音符。正确匹配可获得连击加分！'
              type='info'
              showIcon
            />
          </Space>
        </Col>
      </Row>

      <style>{`
        .game-feedback {
          position: absolute;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 64px;
          font-weight: 900;
          font-style: italic;
          text-shadow: 2px 2px 10px rgba(0,0,0,0.5);
          animation: feedbackAnim 0.4s ease-out forwards;
          pointer-events: none;
        }
        .combo-display {
          position: absolute;
          right: 20px;
          top: 20px;
          text-align: right;
          color: #fff;
          font-family: 'Arial Black', sans-serif;
        }
        .combo-num { font-size: 48px; line-height: 1; color: #faad14; }
        .combo-text { font-size: 14px; letter-spacing: 2px; }
        
        @keyframes feedbackAnim {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(2); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -100%) scale(0.8); }
        }
      `}</style>
    </Card>
  );
};

export default GameModule;
