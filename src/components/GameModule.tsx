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
  Table,
  Divider,
  Empty,
  message,
} from 'antd';
import {
  RocketOutlined,
  StopOutlined,
  TrophyOutlined,
  FireOutlined,
  HistoryOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import ABCJS from 'abcjs';
import {
  detectPitchYIN,
  freqToMidi,
  midiToNoteName,
} from '../utils/pitchService';
import {
  addGameRecord,
  getRecentGameRecords,
  clearGameRecords,
  type GameRecord,
} from '../db/musicDb';

const { Text } = Typography;

// 定义音符数据结构
interface GameNote {
  id: string;
  midi: number;
  timestamp: number;
  y: number;
  hit: boolean;
  missed: boolean;
}

const GameModule: React.FC<{ abcText: string }> = ({ abcText }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameMode, setGameMode] = useState<'single' | 'song'>('single');
  const [speed, setSpeed] = useState(4);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; color: string } | null>(null);
  
  // 历史记录相关状态
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [gameRecords, setGameRecords] = useState<GameRecord[]>([]);
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [hitCount, setHitCount] = useState(0);
  const [missCount, setMissCount] = useState(0);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const notesRef = useRef<GameNote[]>([]);
  const requestRef = useRef<number>();
  const currentMidiRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const JUDGMENT_LINE_Y = 480;
  const TRACK_COUNT = 12;

  // 解析歌曲音符
  const parseSongNotes = () => {
    const notes: GameNote[] = [];
    if (!abcText) return [];
    const visualObj = ABCJS.renderAbc(document.createElement('div'), abcText)[0];
    if (!visualObj.lines) return [];

    visualObj.lines.forEach((line: any) => {
      line.staff.forEach((staff: any) => {
        staff.voices.forEach((voice: any) => {
          voice.forEach((element: any) => {
            if (element.el_type === 'note' && element.midiPitches) {
              notes.push({
                id: Math.random().toString(36),
                midi: element.midiPitches[0].pitch,
                timestamp: element.startMS / 1000,
                y: -50,
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

  // 音频引擎
  const startAudioEngine = async () => {
    if (!audioCtxRef.current)
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    await audioCtxRef.current.resume();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioCtxRef.current.createMediaStreamSource(stream);
    analyserRef.current = audioCtxRef.current.createAnalyser();
    analyserRef.current.fftSize = 2048;
    source.connect(analyserRef.current);
  };

  // 渲染循环
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isPlaying) return;
    const ctx = canvas.getContext('2d')!;
    const currentTime = (performance.now() - startTimeRef.current) / 1000;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < TRACK_COUNT; i++) {
      ctx.strokeStyle = '#333';
      ctx.strokeRect(i * (canvas.width / TRACK_COUNT), 0, canvas.width / TRACK_COUNT, canvas.height);
    }

    ctx.strokeStyle = '#1890ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, JUDGMENT_LINE_Y);
    ctx.lineTo(canvas.width, JUDGMENT_LINE_Y);
    ctx.stroke();

    // 更新和绘制音符
    notesRef.current.forEach((note) => {
      if (!note.hit && !note.missed) {
        note.y = (currentTime - note.timestamp) * speed * 100;

        const trackWidth = canvas.width / TRACK_COUNT;
        const trackIndex = (note.midi % 12) % TRACK_COUNT;
        const x = trackIndex * trackWidth;

        ctx.fillStyle = note.hit ? '#52c41a' : '#1890ff';
        ctx.fillRect(x + 5, note.y - 30, trackWidth - 10, 30);

        // 判定
        if (Math.abs(note.y - JUDGMENT_LINE_Y) < 50 && !note.hit) {
          const detectedFreq = analyserRef.current
            ? detectPitchYIN(new Float32Array(2048), audioCtxRef.current?.sampleRate || 44100)
            : null;
          const detectedMidi = detectedFreq ? freqToMidi(detectedFreq) : null;

          if (detectedMidi && Math.abs(detectedMidi - note.midi) <= 1) {
            note.hit = true;
            handleHit();
          }
        }

        if (note.y > canvas.height && !note.hit && !note.missed) {
          note.missed = true;
          handleMiss();
        }
      }
    });

    // 绘制反馈
    if (feedback) {
      ctx.fillStyle = feedback.color;
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(feedback.text, canvas.width / 2, JUDGMENT_LINE_Y - 50);
    }

    requestRef.current = requestAnimationFrame(render);
  }, [isPlaying, speed, gameMode, feedback]);

  const handleHit = () => {
    setScore((s) => s + 100);
    setCombo((c) => {
      const newCombo = c + 1;
      if (newCombo > maxCombo) setMaxCombo(newCombo);
      return newCombo;
    });
    setHitCount((h) => h + 1);
    setFeedback({ text: 'PERFECT', color: '#52c41a' });
  };

  const handleMiss = () => {
    setCombo(0);
    setMissCount((m) => m + 1);
    setFeedback({ text: 'MISS', color: '#ff4d4f' });
  };

  // 加载游戏记录
  const loadGameRecords = async () => {
    try {
      const records = await getRecentGameRecords(50);
      setGameRecords(records);
    } catch (error) {
      console.error('加载游戏记录失败:', error);
    }
  };

  // 打开历史记录
  const handleOpenHistory = async () => {
    await loadGameRecords();
    setIsHistoryVisible(true);
  };

  // 开始游戏追踪
  const startGameTracking = () => {
    setGameStartTime(Date.now());
    setHitCount(0);
    setMissCount(0);
    setMaxCombo(0);
  };

  // 保存游戏记录
  const saveGameRecord = async () => {
    try {
      const duration = gameStartTime > 0 ? Math.floor((Date.now() - gameStartTime) / 1000) : 0;
      await addGameRecord({
        gameMode,
        score,
        combo,
        maxCombo,
        hitCount,
        missCount,
        duration,
      });
      message.success('游戏记录已保存');
    } catch (error) {
      console.error('保存游戏记录失败:', error);
    }
  };

  const startGame = async () => {
    await startAudioEngine();
    notesRef.current = gameMode === 'song' ? parseSongNotes() : [];
    setScore(0);
    setCombo(0);
    startGameTracking();
    startTimeRef.current = performance.now();
    setIsPlaying(true);
  };

  const stopGame = () => {
    setIsPlaying(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    saveGameRecord();
    Modal.success({
      title: '挑战结束',
      content: `最终得分：${score} | 最大连击：${maxCombo}`,
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
      extra={
        <Space>
          <Tag color='red'>Beta</Tag>
          <Button icon={<HistoryOutlined />} size='small' onClick={handleOpenHistory}>
            历史记录
          </Button>
        </Space>
      }
    >
      <Row gutter={24}>
        <Col span={16}>
          <div style={{ position: 'relative', background: '#000', borderRadius: '12px', border: '4px solid #333', overflow: 'hidden' }}>
            <canvas ref={canvasRef} width={600} height={500} style={{ display: 'block' }} />
            {!isPlaying && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: '#fff' }}>
                <RocketOutlined style={{ fontSize: 64, marginBottom: 16 }} />
                <p>准备开始挑战</p>
              </div>
            )}
          </div>
        </Col>
        <Col span={8}>
          <Space orientation='vertical' style={{ width: '100%' }} size='middle'>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1, background: 'linear-gradient(135deg, #667eea, #764ba2)', padding: 20, borderRadius: 12, color: '#fff' }}>
                <Statistic title='得分' value={score} prefix={<TrophyOutlined />} styles={{ content: { color: '#fff' } }} />
              </div>
              <div style={{ flex: 1, background: 'linear-gradient(135deg, #f093fb, #f5576c)', padding: 20, borderRadius: 12, color: '#fff' }}>
                <Statistic title='连击' value={combo} prefix={<FireOutlined />} styles={{ content: { color: '#fff' } }} />
              </div>
            </div>

            <Card size='small' title='游戏设置'>
              <Space orientation='vertical' style={{ width: '100%' }}>
                <Text strong>模式选择</Text>
                <Radio.Group value={gameMode} onChange={(e) => setGameMode(e.target.value)} disabled={isPlaying} block>
                  <Radio value='single'>自由模式</Radio>
                  <Radio value='song'>曲谱模式</Radio>
                </Radio.Group>
                <Text strong>下落速度：{speed}</Text>
                <Slider min={1} max={10} value={speed} onChange={setSpeed} disabled={isPlaying} />
              </Space>
            </Card>

            <Space orientation='vertical' style={{ width: '100%' }}>
              {!isPlaying ? (
                <Button type='primary' size='large' block icon={<RocketOutlined />} onClick={startGame}>
                  开始挑战
                </Button>
              ) : (
                <Button danger size='large' block icon={<StopOutlined />} onClick={stopGame}>
                  结束挑战
                </Button>
              )}
            </Space>

            <Alert
              title='玩法说明'
              description='音符块到达蓝色虚线时，请吹奏出对应的音符。正确匹配可获得连击加分！'
              type='info'
              showIcon
            />
          </Space>
        </Col>
      </Row>

      {/* 游戏历史记录 Modal */}
      <Modal
        title={
          <span>
            <HistoryOutlined /> 游戏历史记录
          </span>
        }
        open={isHistoryVisible}
        onCancel={() => setIsHistoryVisible(false)}
        footer={null}
        width={800}
      >
        {gameRecords.length > 0 ? (
          <Table
            dataSource={gameRecords}
            rowKey='id'
            pagination={{ pageSize: 10, showSizeChanger: false }}
            locale={{ emptyText: '暂无游戏记录' }}
            columns={[
              {
                title: '模式',
                dataIndex: 'gameMode',
                key: 'gameMode',
                render: (mode: string) => (
                  <Tag color={mode === 'song' ? 'blue' : 'green'}>
                    {mode === 'song' ? '曲谱模式' : '自由模式'}
                  </Tag>
                ),
              },
              {
                title: '得分',
                dataIndex: 'score',
                key: 'score',
                render: (score: number) => (
                  <Tag color={score >= 500 ? 'green' : score >= 200 ? 'orange' : 'red'}>
                    {score} 分
                  </Tag>
                ),
                sorter: (a, b) => a.score - b.score,
              },
              {
                title: '最大连击',
                dataIndex: 'maxCombo',
                key: 'maxCombo',
                render: (maxCombo: number) => (
                  <span><FireOutlined style={{ color: '#faad14' }} /> {maxCombo} 连击</span>
                ),
                sorter: (a, b) => a.maxCombo - b.maxCombo,
              },
              {
                title: '命中/ missed',
                key: 'hitMiss',
                render: (_: unknown, record: GameRecord) => (
                  <span style={{ color: record.hitCount > record.missCount ? '#52c41a' : '#ff4d4f' }}>
                    {record.hitCount} / {record.missCount}
                  </span>
                ),
              },
              {
                title: '时长',
                dataIndex: 'duration',
                key: 'duration',
                render: (duration: number) => {
                  const mins = Math.floor(duration / 60);
                  const secs = duration % 60;
                  return `${mins}:${secs.toString().padStart(2, '0')}`;
                },
                sorter: (a, b) => a.duration - b.duration,
              },
              {
                title: '游戏时间',
                dataIndex: 'createdAt',
                key: 'createdAt',
                render: (createdAt: number) => new Date(createdAt).toLocaleString('zh-CN'),
                sorter: (a, b) => a.createdAt - b.createdAt,
                defaultSortOrder: 'descend',
              },
            ]}
          />
        ) : (
          <Empty description='暂无游戏记录，开始挑战吧！' />
        )}
        <Divider />
        <Space orientation='vertical' style={{ width: '100%' }} size='small'>
          <Text type='secondary' style={{ fontSize: 12 }}>
            <TrophyOutlined style={{ marginRight: 4 }} />
            游戏记录会自动保存，最多显示最近 50 条记录
          </Text>
          {gameRecords.length > 0 && (
            <Button
              danger
              size='small'
              onClick={async () => {
                Modal.confirm({
                  title: '确认清空',
                  content: '确定要清空所有游戏记录吗？此操作不可恢复。',
                  onOk: async () => {
                    try {
                      await clearGameRecords();
                      message.success('已清空游戏记录');
                      loadGameRecords();
                    } catch (error) {
                      message.error('清空失败');
                    }
                  },
                });
              }}
            >
              清空历史记录
            </Button>
          )}
        </Space>
      </Modal>

      <style>{`
        .game-feedback {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 48px;
          font-weight: bold;
          pointer-events: none;
          animation: fadeOut 0.5s ease forwards;
        }
        @keyframes fadeOut {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -100%) scale(1.5); }
        }
      `}</style>
    </Card>
  );
};

export default GameModule;
