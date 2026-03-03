import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, Button, Space, Modal, message, Badge } from 'antd';
import {
  PlayCircleOutlined,
  StopOutlined,
  AudioOutlined,
  BookOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import ABCJS from 'abcjs';
import { INSTRUMENTS } from './instruments';
import {
  getAllSongs,
  addSong,
  addPracticeRecord,
  getRecentPracticeRecords,
  type UserSong,
  type PracticeRecord,
} from '../db/musicDb';
import { type Song } from '../data/songLibrary';
import { detectPitchYIN, freqToMidi } from '../utils/pitchService';
import PerformanceStats from './performance/PerformanceStats';
import PerformanceSettings from './performance/PerformanceSettings';
import PracticeReport from './performance/PracticeReport';
import SongLibrary from './performance/SongLibrary';
import PracticeHistory from './performance/PracticeHistory';
import {
  calculateAccuracy,
  calculateScore,
  extractTitleFromAbc,
} from './performance/utils';
import 'abcjs/abcjs-audio.css';

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
  const [isActive, setIsActive] = useState(false);
  const [isRecordingMode, setIsRecordingMode] = useState(false);
  const [bpm, setBpm] = useState(80);
  const [currentMidi, setCurrentMidi] = useState<number | null>(null);
  const [report, setReport] = useState<{
    score: number;
    accuracy: number;
    total: number;
    hitCount?: number;
    missCount?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showPlayerControls, setShowPlayerControls] = useState(false);

  // --- 曲库相关状态 ---
  const [isLibraryVisible, setIsLibraryVisible] = useState(false);
  const [userSongs, setUserSongs] = useState<UserSong[]>([]);

  // --- 历史记录相关状态 ---
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [practiceRecords, setPracticeRecords] = useState<PracticeRecord[]>([]);
  const [practiceStartTime, setPracticeStartTime] = useState<number>(0);

  // --- 练习统计状态 ---
  const [hitCount, setHitCount] = useState(0);
  const [missCount, setMissCount] = useState(0);

  // --- Refs ---
  const paperRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthControlRef = useRef<unknown>(null);
  const visualObjRef = useRef<unknown>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const requestRef = useRef<number | null>(null);
  const historyRef = useRef<
    Array<{ expected: number; actual: number; hit: boolean }>
  >([]);
  const currentExpectedNoteRef = useRef<number | null>(null);

  // --- 曲库相关函数 ---
  const loadUserSongs = async () => {
    try {
      const songs = await getAllSongs();
      setUserSongs(songs);
    } catch (error) {
      console.error('加载用户曲谱失败:', error);
    }
  };

  const handleSelectSong = (song: Song | UserSong) => {
    if (setAbcText) {
      setAbcText(song.abcText);
    }
    setIsLibraryVisible(false);
  };

  const handleCloseLibrary = () => {
    setIsLibraryVisible(false);
  };

  // --- 历史记录相关函数 ---
  const loadPracticeRecords = async () => {
    try {
      const records = await getRecentPracticeRecords(50);
      setPracticeRecords(records);
    } catch (error) {
      console.error('加载练习记录失败:', error);
    }
  };

  const handleOpenHistory = async () => {
    await loadPracticeRecords();
    setIsHistoryVisible(true);
  };

  const handleClearHistory = async () => {
    try {
      // 这里需要实现 clearPracticeRecords 函数
      setPracticeRecords([]);
      message.success('已清空练习记录');
    } catch (error) {
      message.error('清空失败');
    }
  };

  const startPracticeTracking = () => {
    setPracticeStartTime(Date.now());
    setHitCount(0);
    setMissCount(0);
    historyRef.current = [];
  };

  const savePracticeRecord = async (reportData: {
    score: number;
    accuracy: number;
    total: number;
    hitCount?: number;
  }) => {
    try {
      const duration =
        practiceStartTime > 0
          ? Math.floor((Date.now() - practiceStartTime) / 1000)
          : 0;

      const songTitle = extractTitleFromAbc(abcText);

      await addPracticeRecord({
        songTitle,
        score: reportData.score || 0,
        accuracy: reportData.accuracy || 0,
        totalNotes: reportData.total || 0,
        hitNotes: reportData.hitCount || 0,
        duration,
      });
      message.success('练习记录已保存');
    } catch (error) {
      console.error('保存练习记录失败:', error);
    }
  };

  // --- 导出/导入曲谱 ---
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
        songs: songs.map(({ id, ...song }) => song),
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
      message.error(
        `导入失败：${error instanceof Error ? error.message : '未知错误'}`,
      );
    }
    return false;
  };

  const handleDeleteUserSong = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这首曲谱吗？',
      onOk: async () => {
        try {
          // 这里需要实现 deleteUserSong 函数
          message.success('已删除曲谱');
          loadUserSongs();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  // --- 光标控制 ---
  const cursorControl = {
    onReady: () => {},
    onStart: () => {
      const svg = paperRef.current?.querySelector('svg');
      if (svg && !svg.querySelector('.abcjs-cursor')) {
        // 创建光标
        const cursor = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'line',
        );
        cursor.setAttribute('class', 'abcjs-cursor');
        cursor.setAttribute('stroke', isRecordingMode ? '#52c41a' : '#ff4d4f');
        cursor.setAttribute('style', 'stroke-width: 2px;');
        svg.appendChild(cursor);
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onEvent: (ev: any) => {
      if (ev.measureStart && ev.left === null) return;

      // 移除当前光标高亮，但保留已播放音符的背景色
      const cursor = paperRef.current?.querySelector('.abcjs-cursor');

      // 为当前音符添加高亮（光标位置）
      const lastSelection =
        paperRef.current?.querySelectorAll('.abcjs-highlight');
      lastSelection?.forEach((el) => el.classList.remove('abcjs-highlight'));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ev.elements.forEach((noteGroup: any) => {
        noteGroup.forEach((el: HTMLElement) => {
          // 添加已播放标记和背景色
          el.classList.add('abcjs-played');
          if (isRecordingMode) {
            const midiNotes = el.getAttribute('data-midi');
            if (midiNotes) {
              const notes = midiNotes
                .split(',')
                .map((n: string) => parseInt(n.trim(), 10));
              if (notes.length > 0 && !isNaN(notes[0])) {
                currentExpectedNoteRef.current = notes[0];
              }
            }
          }
        });
      });

      // 移动光标
      if (cursor) {
        cursor.setAttribute('x1', (ev.left - 2).toString());
        cursor.setAttribute('x2', (ev.left - 2).toString());
        cursor.setAttribute('y1', ev.top.toString());
        cursor.setAttribute('y2', (ev.top + ev.height).toString());
      }
    },
    onFinished: () => {
      // 播放结束后移除光标和已播放标记
      const cursor = paperRef.current?.querySelector('.abcjs-cursor');
      if (cursor) {
        cursor.remove();
      }

      // 可选：播放结束后清除已播放标记
      // 如果想保留已播放标记直到用户停止，可以注释掉下面的代码
      const playedElements =
        paperRef.current?.querySelectorAll('.abcjs-played');
      playedElements?.forEach((el) => el.classList.remove('abcjs-played'));
    },
  };

  // --- 音高分析循环 ---
  const analyzePitch = useCallback(() => {
    if (isRecordingMode && analyserRef.current && audioCtxRef.current) {
      const buffer = new Float32Array(2048);
      analyserRef.current.getFloatTimeDomainData(buffer);
      const freq = detectPitchYIN(buffer, audioCtxRef.current.sampleRate);
      if (freq && freq > 60) {
        const midi = freqToMidi(freq);
        setCurrentMidi(midi);
        const expectedMidi = currentExpectedNoteRef.current;
        if (expectedMidi !== null) {
          const hit = Math.abs(midi - expectedMidi) <= 1;
          historyRef.current.push({
            expected: expectedMidi,
            actual: midi,
            hit,
          });
        }
      }
    }
    requestRef.current = requestAnimationFrame(analyzePitch);
  }, [isRecordingMode]);

  // --- 核心音频设置 ---
  const setupAudio = async () => {
    setLoading(true);
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      await audioCtxRef.current.resume();

      if (isRecordingMode) {
        startPracticeTracking();
      }

      if (synthControlRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (synthControlRef.current as any).disable();
      }

      const control = new ABCJS.synth.SynthController();
      control.load(audioRef.current!, cursorControl, {
        displayLoop: true,
        displayRestart: true,
        displayPlay: true,
        displayProgress: true,
        displayWarp: true,
      });
      synthControlRef.current = control;

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
      setShowPlayerControls(true);
    } catch (err) {
      console.error('Setup failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = () => {
    if (synthControlRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (synthControlRef.current as any).pause();
    }
    if (requestRef.current) cancelAnimationFrame(requestRef.current);

    // 清除已播放标记
    const playedElements = paperRef.current?.querySelectorAll('.abcjs-played');
    playedElements?.forEach((el) => el.classList.remove('abcjs-played'));

    if (isRecordingMode) {
      generateReport();
      setShowReport(true);
    }
    setIsActive(false);
    setShowPlayerControls(false);
  };

  const generateReport = () => {
    const history = historyRef.current;
    const total = history.length;

    if (total === 0) {
      const reportData = {
        score: 0,
        total: 0,
        accuracy: 0,
        hitCount: 0,
        missCount: 0,
      };
      setReport(reportData);
      return;
    }

    const hitCount = history.filter((record) => record.hit).length;
    const missCount = total - hitCount;
    const accuracy = calculateAccuracy(hitCount, total);
    const score = calculateScore(accuracy, hitCount, missCount);

    const reportData = {
      score,
      total,
      accuracy,
      hitCount,
      missCount,
    };

    setReport(reportData);
    setHitCount(hitCount);
    setMissCount(missCount);

    if (isRecordingMode) {
      savePracticeRecord(reportData);
    }
  };

  const handlePlayAgain = () => {
    setShowReport(false);
    setupAudio();
  };

  const handleCloseReport = () => {
    setShowReport(false);
  };

  // --- 参数变化时重置 abcjs 状态 ---
  const handleParameterChange = useCallback(() => {
    // 如果正在播放，先停止
    if (isActive) {
      if (synthControlRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (synthControlRef.current as any).pause();
      }
      if (requestRef.current) cancelAnimationFrame(requestRef.current);

      // 清除已播放标记
      const playedElements =
        paperRef.current?.querySelectorAll('.abcjs-played');
      playedElements?.forEach((el) => el.classList.remove('abcjs-played'));

      setIsActive(false);
      setShowPlayerControls(false);
    }
    // 重置 synthControlRef，这样下次播放时会重新初始化
    if (synthControlRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (synthControlRef.current as any).disable();
      synthControlRef.current = null;
    }
    // 清除光标和已播放标记
    const cursor = paperRef.current?.querySelector('.abcjs-cursor');
    if (cursor) {
      cursor.remove();
    }
    const playedElements = paperRef.current?.querySelectorAll('.abcjs-played');
    playedElements?.forEach((el) => el.classList.remove('abcjs-played'));
  }, [isActive]);

  // --- 乐谱渲染 ---
  useEffect(() => {
    if (paperRef.current) {
      const res = ABCJS.renderAbc(paperRef.current, abcText, {
        add_classes: true,
        responsive: 'resize',
        // 添加自定义类名，便于样式控制
        classes: {
          note: 'abcjs-note',
          rest: 'abcjs-rest',
        },
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

  // --- 清理 ---
  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const duration =
    practiceStartTime > 0
      ? Math.floor((Date.now() - practiceStartTime) / 1000)
      : 0;

  return (
    <Card variant='borderless'>
      <Space orientation='vertical' size='middle' style={{ width: '100%' }}>
        {/* 顶部状态栏 */}
        <div
          style={{
            background: '#f5f5f5',
            padding: '16px',
            borderRadius: '8px',
          }}
        >
          <Space separator={<span style={{ color: '#d9d9d9' }}>|</span>}>
            <Badge
              count={isRecordingMode ? '练习模式' : '播放模式'}
              style={{
                backgroundColor: isRecordingMode ? '#52c41a' : '#1890ff',
              }}
            />
            <span>
              <AudioOutlined /> 音色：
              {INSTRUMENTS.find((i) => i.value === instrument)?.label || '未知'}
            </span>
            <span>
              <BookOutlined /> BPM: {bpm}
            </span>
            {/* {!isActive && (
              <Tag color='orange'>⚠ 请先设置下方参数，再点击开始</Tag>
            )} */}
          </Space>

          <Space style={{ float: 'right' }}>
            <Button icon={<HistoryOutlined />} onClick={handleOpenHistory}>
              历史记录
            </Button>
            <Button
              icon={<BookOutlined />}
              onClick={() => setIsLibraryVisible(true)}
            >
              曲库
            </Button>
          </Space>
        </div>

        {/* 乐谱和播放器 */}
        <div ref={paperRef} />
        <div
          ref={audioRef}
          style={{ display: showPlayerControls ? 'block' : 'none' }}
        />
        {/* 操作按钮 */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          {!isActive ? (
            <Button
              type='primary'
              size='large'
              icon={<PlayCircleOutlined />}
              onClick={setupAudio}
              loading={loading}
            >
              ▶ 开始{isRecordingMode ? '练习' : '播放'}（请先设置下方参数）
            </Button>
          ) : (
            <Button
              type='primary'
              danger
              size='large'
              icon={<StopOutlined />}
              onClick={handleStop}
            >
              停止{isRecordingMode ? '并查看报告' : ''}
            </Button>
          )}
        </div>
        {/* 设置和统计 */}
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
        >
          <PerformanceSettings
            bpm={bpm}
            instrument={instrument}
            isRecordingMode={isRecordingMode}
            isActive={isActive}
            onBpmChange={setBpm}
            onInstrumentChange={setInstrument}
            onRecordingModeChange={setIsRecordingMode}
            onParameterChange={handleParameterChange}
          />

          <PerformanceStats
            currentMidi={currentMidi}
            hitCount={hitCount}
            missCount={missCount}
            isActive={isRecordingMode && isActive}
          />
        </div>

        {/* 练习报告 Modal */}
        {showReport && report && (
          <Modal
            open={showReport}
            onCancel={handleCloseReport}
            footer={null}
            width={500}
          >
            <PracticeReport
              score={report.score}
              accuracy={report.accuracy}
              hitNotes={report.hitCount || 0}
              missNotes={report.missCount || 0}
              duration={duration}
              onPlayAgain={handlePlayAgain}
              onClose={handleCloseReport}
            />
          </Modal>
        )}

        {/* 曲库 Modal */}
        <SongLibrary
          open={isLibraryVisible}
          userSongs={userSongs}
          onSelectSong={handleSelectSong}
          onClose={handleCloseLibrary}
          onLoadUserSongs={loadUserSongs}
          onExportSongs={handleExportSongs}
          onImportSongs={handleImportSongs}
          onDeleteUserSong={handleDeleteUserSong}
        />

        {/* 历史记录 Modal */}
        <PracticeHistory
          open={isHistoryVisible}
          records={practiceRecords}
          onClose={() => setIsHistoryVisible(false)}
          onClear={handleClearHistory}
        />
      </Space>
    </Card>
  );
};

export default PerformanceModule;
