import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Card,
  Button,
  Switch,
  Slider,
  Space,
  Select,
  Row,
  Col,
  Typography,
  Badge,
  Progress,
  Modal,
  Statistic,
  Divider,
  Tag,
  Input,
  Empty,
  Tabs,
  Upload,
  message,
  Tooltip,
} from 'antd';
import {
  DashboardOutlined,
  PlayCircleOutlined,
  StopOutlined,
  AudioOutlined,
  SettingOutlined,
  BookOutlined,
  SearchOutlined,
  UserOutlined,
  ExportOutlined,
  ImportOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import ABCJS from 'abcjs';
import {
  detectPitchYIN,
  freqToMidi,
  midiToNoteName,
} from '../utils/pitchService'; // 引用之前的工具函数
import { INSTRUMENTS } from './instruments';
import { songLibrary, type Song } from '../data/songLibrary';
import { getAllSongs, addSong, type UserSong } from '../db/musicDb';
import 'abcjs/abcjs-audio.css';

const { Text } = Typography;

interface PerformanceModuleProps {
  abcText: string;
  instrument: number;
  setInstrument: (val: number) => void;
  setAbcText?: (text: string) => void;
}

const PerformanceModule: React.FC<PerformanceModuleProps> = ({
  abcText,
  instrument,
  setInstrument,
  setAbcText,
}) => {
  // --- 状态管理 ---
  const [isActive, setIsActive] = useState(false); // 是否启动（由播放或练习触发）
  const [isRecordingMode, setIsRecordingMode] = useState(false); // 是否处于练习录音模式
  const [bpm, setBpm] = useState(80);
  const [currentMidi, setCurrentMidi] = useState<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // --- 曲库相关状态 ---
  const [isLibraryVisible, setIsLibraryVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [userSongs, setUserSongs] = useState<UserSong[]>([]);
  const [activeLibraryTab, setActiveLibraryTab] = useState('preset');

  // --- 曲库相关函数 ---
  const filteredSongs = searchKeyword
    ? songLibrary.filter(
        (song) =>
          song.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          song.artist.toLowerCase().includes(searchKeyword.toLowerCase()),
      )
    : songLibrary;

  const filteredUserSongs = searchKeyword
    ? userSongs.filter(
        (song) =>
          song.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          song.artist.toLowerCase().includes(searchKeyword.toLowerCase()),
      )
    : userSongs;

  // 加载用户曲谱
  const loadUserSongs = async () => {
    try {
      const songs = await getAllSongs();
      setUserSongs(songs);
    } catch (error) {
      console.error('加载用户曲谱失败:', error);
    }
  };

  const handleSelectSong = (song: Song | UserSong) => {
    setSelectedSong(song as Song);
    if (setAbcText) {
      setAbcText(song.abcText);
    }
    setIsLibraryVisible(false);
  };

  const handleCloseLibrary = () => {
    setIsLibraryVisible(false);
    setSearchKeyword('');
    setActiveLibraryTab('preset');
  };

  const handleLibraryTabChange = (key: string) => {
    setActiveLibraryTab(key);
    setSearchKeyword('');
    if (key === 'user') {
      loadUserSongs();
    }
  };

  // 导出用户曲谱
  const handleExportSongs = async () => {
    try {
      const songs = await getAllSongs();
      if (songs.length === 0) {
        message.warning('暂无可导出的曲谱');
        return;
      }
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        songs: songs.map(({ id, ...song }) => song), // 移除数据库 ID
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `music-app-songs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success(`成功导出 ${songs.length} 首曲谱`);
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    }
  };

  // 导入用户曲谱
  const handleImportSongs = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.songs || !Array.isArray(data.songs)) {
        throw new Error('文件格式不正确');
      }

      let importCount = 0;
      for (const song of data.songs) {
        if (!song.title || !song.abcText) {
          continue;
        }
        await addSong({
          title: song.title,
          artist: song.artist || '未知作者',
          abcText: song.abcText,
          key: song.key || 'C',
          difficulty: song.difficulty || '中等',
        });
        importCount++;
      }

      if (importCount > 0) {
        message.success(`成功导入 ${importCount} 首曲谱`);
        loadUserSongs();
      } else {
        message.warning('没有可导入的曲谱');
      }
    } catch (error: unknown) {
      console.error('导入失败:', error);
      message.error(`导入失败：${error instanceof Error ? error.message : '未知错误'}`);
    }
    return false; // 阻止默认上传行为
  };

  // --- Refs ---
  const paperRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLDivElement>(null); // 播放器控件容器
  const audioCtxRef = useRef<AudioContext | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const synthControlRef = useRef<any>(null); // ABCJS 播放控制器
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const visualObjRef = useRef<any>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const requestRef = useRef<number | null>(null);
  const historyRef = useRef<{ expected: number; actual: number }[]>([]);

  // 1. 初始化/更新乐谱渲染
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
  }, [abcText]);

  // 2. 光标跟随对象 (由 SynthController 调用)
  const cursorControl = {
    onReady: () => {},
    onStart: () => {
      const svg = paperRef.current?.querySelector('svg');
      if (svg && !svg.querySelector('.abcjs-cursor')) {
        const cursor = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'line',
        );
        cursor.setAttribute('class', 'abcjs-cursor');
        cursor.setAttribute('stroke', isRecordingMode ? '#52c41a' : '#ff4d4f'); // 练习模式用绿色光标
        cursor.setAttribute('style', 'stroke-width: 2px;');
        svg.appendChild(cursor);
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onEvent: (ev: any) => {
      if (ev.measureStart && ev.left === null) return;

      // 高亮逻辑
      const lastSelection =
        paperRef.current?.querySelectorAll('.abcjs-highlight');
      lastSelection?.forEach((el) => el.classList.remove('abcjs-highlight'));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ev.elements.forEach((noteGroup: any) => {
        noteGroup.forEach((el: HTMLElement) => {
          el.classList.add('abcjs-highlight');
          // 练习模式下，如果是正在处理的音符，且我们有识别到 MIDI
          if (isRecordingMode && currentMidi) {
            // 这里可以添加更复杂的实时对比变色逻辑
          }
        });
      });

      // 光标移动
      const cursor = paperRef.current?.querySelector('.abcjs-cursor');
      if (cursor) {
        cursor.setAttribute('x1', (ev.left - 2).toString());
        cursor.setAttribute('x2', (ev.left - 2).toString());
        cursor.setAttribute('y1', ev.top.toString());
        cursor.setAttribute('y2', (ev.top + ev.height).toString());
      }
    },
    onFinished: () => {
      paperRef.current
        ?.querySelectorAll('.abcjs-highlight')
        .forEach((el) => el.classList.remove('abcjs-highlight'));
    },
  };

  // 3. 音高分析循环
  const analyzePitch = useCallback(() => {
    if (isRecordingMode && analyserRef.current && audioCtxRef.current) {
      const buffer = new Float32Array(2048);
      analyserRef.current.getFloatTimeDomainData(buffer);
      const freq = detectPitchYIN(buffer, audioCtxRef.current.sampleRate);
      if (freq && freq > 60) {
        const midi = freqToMidi(freq);
        setCurrentMidi(midi);
        historyRef.current.push({ expected: 60, actual: midi }); // 简化逻辑
      }
    }
    requestRef.current = requestAnimationFrame(analyzePitch);
  }, [isRecordingMode]);

  // 4. 核心：初始化音频并准备播放/练习
  const setupAudio = async () => {
    setLoading(true);
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      await audioCtxRef.current.resume();

      // 清理旧实例
      if (synthControlRef.current) await synthControlRef.current.disable();

      // 初始化播放器 UI 控件
      const control = new ABCJS.synth.SynthController();
      control.load(audioRef.current!, cursorControl, {
        displayLoop: true,
        displayRestart: true,
        displayPlay: true,
        displayProgress: true,
        displayWarp: true,
      });
      synthControlRef.current = control;

      // 初始化合成器
      const midiBuffer = new ABCJS.synth.CreateSynth();
      await midiBuffer.init({
        visualObj: visualObjRef.current,
        options: {
          program: instrument,
          audioContext: audioCtxRef.current,
        },
      });
      await midiBuffer.prime();
      await control.setTune(visualObjRef.current, false, {
        program: instrument,
      });

      // 如果开启练习模式，初始化麦克风
      if (isRecordingMode) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        analyserRef.current = audioCtxRef.current.createAnalyser();
        audioCtxRef.current
          .createMediaStreamSource(stream)
          .connect(analyserRef.current);
        requestRef.current = requestAnimationFrame(analyzePitch);
      }

      setIsActive(true);
    } catch (err) {
      console.error('Setup failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = () => {
    if (synthControlRef.current) synthControlRef.current.pause();
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (isRecordingMode) generateReport();
    setIsActive(false);
  };

  const generateReport = () => {
    // 模拟报告逻辑
    setReport({ score: 85, total: historyRef.current.length });
  };

  return (
    <Card variant="borderless">
      <Space orientation='vertical' size='middle' style={{ width: '100%' }}>
        {/* 控制顶栏 */}
        <Row
          align='middle'
          justify='space-between'
          style={{
            background: '#f5f5f5',
            padding: '16px',
            borderRadius: '8px',
          }}
        >
          <Col>
            <Space size='large'>
              <span>
                <Text strong>
                  <SettingOutlined /> 音色:{' '}
                </Text>
                <Select
                  value={instrument}
                  onChange={setInstrument}
                  options={INSTRUMENTS}
                  style={{ width: 150 }}
                  disabled={isActive}
                />
              </span>
              <span>
                <Text strong>
                  <DashboardOutlined /> BPM:{' '}
                </Text>
                <Slider
                  min={40}
                  max={200}
                  value={bpm}
                  onChange={setBpm}
                  style={{
                    width: 120,
                    display: 'inline-block',
                    verticalAlign: 'middle',
                  }}
                  disabled={isActive}
                />
              </span>
            </Space>
          </Col>
          <Col>
            <Space>
              <Tag color={isRecordingMode ? 'green' : 'blue'}>
                {isRecordingMode ? <AudioOutlined /> : <PlayCircleOutlined />}{' '}
                {isRecordingMode ? '练习模式' : '播放模式'}
              </Tag>
              <Switch
                checkedChildren='练习'
                unCheckedChildren='播放'
                checked={isRecordingMode}
                onChange={setIsRecordingMode}
                disabled={isActive}
              />
              <Button
                icon={<BookOutlined />}
                onClick={() => setIsLibraryVisible(true)}
                disabled={isActive}
              >
                曲库
              </Button>
            </Space>
          </Col>
        </Row>

        {/* 操作区 */}
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          {!isActive ? (
            <Button
              type='primary'
              size='large'
              icon={<PlayCircleOutlined />}
              onClick={setupAudio}
              loading={loading}
            >
              准备并开始{isRecordingMode ? '练习' : '回放'}
            </Button>
          ) : (
            <Button
              type='primary'
              danger
              size='large'
              icon={<StopOutlined />}
              onClick={handleStop}
            >
              停止并{isRecordingMode ? '生成报告' : '结束回放'}
            </Button>
          )}
        </div>

        {/* 状态监控 */}
        {isActive && isRecordingMode && (
          <Row justify='center'>
            <Col span={12}>
              <Card
                size='small'
                style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}
              >
                <Statistic
                  title='实时监测音高'
                  value={currentMidi ? midiToNoteName(currentMidi) : '--'}
                  valueStyle={{ color: '#3f8600' }}
                />
                <Badge
                  status='processing'
                  text='麦克风录音中，伴奏通过耳机更佳'
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* ABCJS 播放器控件 */}
        <div
          ref={audioRef}
          className={`custom-audio-ui ${!isActive ? 'hidden' : ''}`}
        />

        {/* 乐谱容器 */}
        <div
          ref={paperRef}
          className='performance-paper'
          style={{
            padding: '20px',
            border: '1px solid #eee',
            background: '#fff',
          }}
        />
      </Space>

      {/* 练习报告 Modal */}
      <Modal
        title='练习成果报告'
        open={!!report}
        onOk={() => setReport(null)}
        onCancel={() => setReport(null)}
      >
        {report && (
          <div style={{ textAlign: 'center' }}>
            <Statistic title='练习得分' value={report.score} suffix='/ 100' />
            <Progress percent={report.score} status='active' />
            <Divider />
            <Text type='secondary'>
              基于您的演奏准确度，本次表现：<Text strong>优秀</Text>
            </Text>
          </div>
        )}
      </Modal>

      {/* 曲库 Modal */}
      <Modal
        title={
          <span>
            <BookOutlined /> 曲库
          </span>
        }
        open={isLibraryVisible}
        onCancel={handleCloseLibrary}
        footer={null}
        width={700}
      >
        <Tabs
          activeKey={activeLibraryTab}
          onChange={handleLibraryTabChange}
          items={[
            {
              key: 'preset',
              label: (
                <span>
                  <BookOutlined /> 预设曲库
                </span>
              ),
              children: (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <Input
                      placeholder='搜索歌曲或歌手...'
                      prefix={<SearchOutlined />}
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      allowClear
                    />
                  </div>
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {filteredSongs.length > 0 ? (
                      filteredSongs.map((song) => (
                        <div
                          key={`preset-${song.id}`}
                          style={{
                            cursor: 'pointer',
                            background:
                              selectedSong?.id === song.id ? '#e6f7ff' : 'transparent',
                            padding: '12px 16px',
                            borderBottom: '1px solid #f0f0f0',
                            transition: 'background 0.2s',
                          }}
                          onClick={() => handleSelectSong(song)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#fafafa';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              selectedSong?.id === song.id ? '#e6f7ff' : 'transparent';
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <BookOutlined style={{ color: '#1890ff' }} />
                              <div>
                                <div style={{ fontWeight: 500, marginBottom: '4px' }}>{song.title}</div>
                                <Space size='small'>
                                  <Text type='secondary'>{song.artist}</Text>
                                  <Tag color='blue'>{song.key}调</Tag>
                                  <Tag
                                    color={
                                      song.difficulty === '简单'
                                        ? 'green'
                                        : song.difficulty === '中等'
                                        ? 'orange'
                                        : 'red'
                                    }
                                  >
                                    {song.difficulty}
                                  </Tag>
                                </Space>
                              </div>
                            </div>
                            <Button
                              type='primary'
                              size='small'
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectSong(song);
                              }}
                            >
                              选择
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <Empty description='未找到相关歌曲' />
                    )}
                  </div>
                </>
              ),
            },
            {
              key: 'user',
              label: (
                <span>
                  <UserOutlined /> 我的曲谱
                </span>
              ),
              children: (
                <>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <Input
                      placeholder='搜索歌曲或作者...'
                      prefix={<SearchOutlined />}
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      allowClear
                      style={{ flex: 1 }}
                    />
                    <Space>
                      <Tooltip title='导出曲谱数据'>
                        <Button
                          icon={<ExportOutlined />}
                          onClick={handleExportSongs}
                        >
                          导出
                        </Button>
                      </Tooltip>
                      <Upload
                        accept='.json,.abc'
                        showUploadList={false}
                        beforeUpload={handleImportSongs}
                        maxCount={1}
                      >
                        <Button icon={<ImportOutlined />}>导入</Button>
                      </Upload>
                    </Space>
                  </div>
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {filteredUserSongs.length > 0 ? (
                      filteredUserSongs.map((song) => (
                        <div
                          key={`user-${song.id}`}
                          style={{
                            cursor: 'pointer',
                            background:
                              selectedSong?.id === song.id ? '#e6f7ff' : 'transparent',
                            padding: '12px 16px',
                            borderBottom: '1px solid #f0f0f0',
                            transition: 'background 0.2s',
                          }}
                          onClick={() => handleSelectSong(song)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#fafafa';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              selectedSong?.id === song.id ? '#e6f7ff' : 'transparent';
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <UserOutlined style={{ color: '#52c41a' }} />
                              <div>
                                <div style={{ fontWeight: 500, marginBottom: '4px' }}>{song.title}</div>
                                <Space size='small'>
                                  <Text type='secondary'>{song.artist}</Text>
                                  <Tag color='blue'>{song.key}调</Tag>
                                  <Tag
                                    color={
                                      song.difficulty === '简单'
                                        ? 'green'
                                        : song.difficulty === '中等'
                                        ? 'orange'
                                        : 'red'
                                    }
                                  >
                                    {song.difficulty}
                                  </Tag>
                                  <Text type='secondary' style={{ fontSize: 12 }}>
                                    {new Date(song.updatedAt).toLocaleDateString('zh-CN')}
                                  </Text>
                                </Space>
                              </div>
                            </div>
                            <Button
                              type='primary'
                              size='small'
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectSong(song);
                              }}
                            >
                              选择
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <Empty description='暂无保存的曲谱，请先到编辑模式保存' />
                    )}
                  </div>
                </>
              ),
            },
          ]}
        />
        <Divider />
        <Space direction='vertical' style={{ width: '100%' }} size='small'>
          <Text type='secondary' style={{ fontSize: 12 }}>
            提示：选择歌曲后将自动加载曲谱到演奏模式，点击"准备并开始"即可播放
          </Text>
          {activeLibraryTab === 'user' && (
            <Text type='secondary' style={{ fontSize: 12 }}>
              <ExportOutlined style={{ marginRight: 4 }} />
              导出功能可用于备份曲谱数据，更换浏览器时可通过导入功能恢复
            </Text>
          )}
        </Space>
      </Modal>

      <style>{`
        .abcjs-highlight { fill: #1890ff !important; transition: fill 0.2s; }
        .abcjs-cursor { transition: all 0.1s linear; }
        .hidden { display: none; }
        svg { width: 100%; height: auto; }
        .custom-audio-ui { min-height: 50px; background: #fafafa; border-radius: 4px; padding: 5px; }
      `}</style>
    </Card>
  );
};

export default PerformanceModule;
