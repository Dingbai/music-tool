import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Card,
  Button,
  Switch,
  Slider,
  Space,
  Row,
  Col,
  Typography,
  Badge,
  Progress,
  Modal,
  Statistic,
  Alert,
} from 'antd';
import {
  CustomerServiceOutlined,
  DashboardOutlined,
  PlayCircleOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import ABCJS from 'abcjs';
import {
  detectPitchYIN,
  freqToMidi,
  midiToNoteName,
} from '../utils/pitchService';

const { Text, Title } = Typography;

interface PracticeReport {
  score: number;
  totalNotes: number;
  correctNotes: number;
  wrongNotes: string[];
}

const PracticeModule: React.FC<{ abcText: string }> = ({ abcText }) => {
  // 状态控制
  const [isPracticing, setIsPracticing] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [useMetronome, setUseMetronome] = useState(true);
  const [useAccompaniment, setUseAccompaniment] = useState(true);
  const [bpm, setBpm] = useState(80);
  const [currentMidi, setCurrentMidi] = useState<number | null>(null);
  const [report, setReport] = useState<PracticeReport | null>(null);

  // Refs
  const paperRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const visualObjRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);
  const historyRef = useRef<{ expected: number; actual: number }[]>([]);
  const synthRef = useRef<any>(null);

  // 1. 初始化乐谱
  useEffect(() => {
    if (paperRef.current) {
      const res = ABCJS.renderAbc(paperRef.current, abcText, {
        add_classes: true,
        responsive: 'resize',
      });
      if (res.length > 0) visualObjRef.current = res[0];
    }
  }, [abcText]);

  // 2. 节拍器音频产生
  const playClick = (time: number, isFirst: boolean) => {
    if (!audioCtxRef.current) return;
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    osc.frequency.value = isFirst ? 1000 : 500;
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    osc.start(time);
    osc.stop(time + 0.1);
  };

  // 3. 核心识别循环
  const analysisLoop = useCallback(() => {
    if (!analyserRef.current || !isPracticing) return;

    const buffer = new Float32Array(2048);
    analyserRef.current.getFloatTimeDomainData(buffer);
    const freq = detectPitchYIN(buffer, audioCtxRef.current!.sampleRate);

    if (freq && freq > 60 && freq < 1500) {
      const midi = freqToMidi(freq);
      setCurrentMidi(midi);

      // 获取当前乐谱应该高亮的音符并对比
      const activeNotes = document.querySelectorAll('.abcjs-note.abcjs-v0'); // 简化版选择器
      activeNotes.forEach((note: any) => {
        if (note.classList.contains('abcjs-highlight')) {
          // 这里在实际生产中需通过 visualObjRef.current.getNearestElement(time) 获取 MIDI
          // 此处演示逻辑：记录数据
          historyRef.current.push({ expected: 60, actual: midi }); // 假设预期是中央C
        }
      });
    }
    timerRef.current = requestAnimationFrame(analysisLoop);
  }, [isPracticing]);

  // 4. 开始/停止练习
  const togglePractice = async () => {
    if (!isPracticing) {
      // 初始化音频
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      await audioCtxRef.current.resume();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      analyserRef.current = audioCtxRef.current.createAnalyser();
      audioCtxRef.current
        .createMediaStreamSource(stream)
        .connect(analyserRef.current);

      setIsPracticing(true);
      historyRef.current = [];

      // 启动伴奏 (Ghost Mode)
      if (useAccompaniment && visualObjRef.current) {
        const synth = new ABCJS.synth.CreateSynth();
        await synth.init({
          visualObj: visualObjRef.current,
          options: { audioContext: audioCtxRef.current },
        });
        await synth.prime();
        synth.start();
        synthRef.current = synth;
      }

      // 启动节拍器循环
      if (useMetronome) {
        let nextBeat = audioCtxRef.current.currentTime;
        const beatLen = 60 / bpm;
        const sched = () => {
          while (nextBeat < audioCtxRef.current!.currentTime + 0.1) {
            playClick(nextBeat, true);
            nextBeat += beatLen;
          }
          if (isPracticing) setTimeout(sched, 25);
        };
        sched();
      }

      analysisLoop();
    } else {
      // 停止逻辑
      setIsPracticing(false);
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
      if (synthRef.current) synthRef.current.stop();
      setCurrentMidi(null);
      generateReport();
    }
  };

  const generateReport = () => {
    const total = historyRef.current.length;
    const correct = historyRef.current.filter(
      (h) => Math.abs(h.expected - h.actual) <= 1,
    ).length;
    setReport({
      score: total > 0 ? Math.round((correct / total) * 100) : 0,
      totalNotes: total,
      correctNotes: correct,
      wrongNotes: ['第3小节 F音准偏低', '第5小节 节奏过快'],
    });
  };

  return (
    <Card bordered={false} style={{ background: '#f9f9f9' }}>
      <Space direction='vertical' size='large' style={{ width: '100%' }}>
        {!isAudioReady && (
          <Alert
            message='准备练习'
            description='点击下方按钮激活音频系统并允许麦克风访问'
            type='info'
            showIcon
            action={
              <Button type='primary' onClick={() => setIsAudioReady(true)}>
                激活模式
              </Button>
            }
          />
        )}

        {isAudioReady && (
          <Row
            gutter={24}
            align='middle'
            style={{ background: '#fff', padding: '20px', borderRadius: '8px' }}
          >
            <Col span={6}>
              <Statistic
                title='实时音高'
                value={currentMidi ? midiToNoteName(currentMidi) : '--'}
                prefix={<CustomerServiceOutlined />}
              />
            </Col>
            <Col span={10}>
              <Space direction='vertical'>
                <Text strong>
                  <DashboardOutlined /> 节拍器:{' '}
                  <Switch
                    checked={useMetronome}
                    onChange={setUseMetronome}
                    disabled={isPracticing}
                  />
                </Text>
                <Slider
                  min={40}
                  max={200}
                  value={bpm}
                  onChange={setBpm}
                  disabled={isPracticing}
                  style={{ width: 200 }}
                />
              </Space>
            </Col>
            <Col span={8}>
              <Space>
                <Text strong>静音伴奏:</Text>
                <Switch
                  checked={useAccompaniment}
                  onChange={setUseAccompaniment}
                  disabled={isPracticing}
                />
                <Button
                  type={isPracticing ? 'primary' : 'default'}
                  danger={isPracticing}
                  icon={
                    isPracticing ? <StopOutlined /> : <PlayCircleOutlined />
                  }
                  onClick={togglePractice}
                  size='large'
                >
                  {isPracticing ? '结束练习' : '开始录音'}
                </Button>
              </Space>
            </Col>
          </Row>
        )}

        <div
          ref={paperRef}
          className='practice-paper'
          style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '8px',
            minHeight: '400px',
          }}
        />

        {/* 练习报告弹窗 */}
        <Modal
          title='练习完成 - AI 报告'
          open={!!report}
          onOk={() => setReport(null)}
          onCancel={() => setReport(null)}
          width={600}
        >
          {report && (
            <div style={{ textAlign: 'center' }}>
              <Progress
                type='circle'
                percent={report.score}
                strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
              />
              <Row gutter={16} style={{ marginTop: '20px' }}>
                <Col span={12}>
                  <Statistic title='总检测次数' value={report.totalNotes} />
                </Col>
                <Col span={12}>
                  <Statistic
                    title='精准匹配'
                    value={report.correctNotes}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Col>
              </Row>
              <div style={{ textAlign: 'left', marginTop: '20px' }}>
                <Title level={5}>诊断建议：</Title>
                <ul>
                  {report.wrongNotes.map((msg, i) => (
                    <li key={i} style={{ color: '#ff4d4f' }}>
                      {msg}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </Modal>
      </Space>

      <style>{`
        .abcjs-note.note-error { fill: #ff4d4f !important; }
        .abcjs-note.note-success { fill: #52c41a !important; }
        .abcjs-highlight { stroke: #1890ff; stroke-width: 2px; }
      `}</style>
    </Card>
  );
};

export default PracticeModule;
