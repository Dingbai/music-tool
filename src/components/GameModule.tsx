import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Card,
  Button,
  Space,
  Tag,
  Alert,
  Modal,
  message,
  Table,
  Divider,
  Empty,
  Typography,
} from 'antd';
import {
  RocketOutlined,
  StopOutlined,
  HistoryOutlined,
  QuestionCircleOutlined,
  FireOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import ABCJS from 'abcjs';
import {
  addGameRecord,
  getRecentGameRecords,
  clearGameRecords,
  type GameRecord,
} from '../db/musicDb';
import GameCanvas from './game/GameCanvas';
import GameStats from './game/GameStats';
import GameSettings from './game/GameSettings';
import GameResult from './game/GameResult';
import { GameNote, GameConfig, GameFeedback, PlayingNote } from './game/types';
import { midiToJianpu, KEY_TO_MIDI, JUDGMENT_THRESHOLDS } from './game/utils';

const JUDGMENT_LINE_RATIO = 0.8;

interface GameModuleProps {
  abcText: string;
}

const GameModule: React.FC<GameModuleProps> = ({ abcText }) => {
  // 游戏状态
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameEnded, setIsGameEnded] = useState(false);
  const [gameMode, setGameMode] = useState<'single' | 'song'>('single');
  const [speed, setSpeed] = useState(4);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [feedback, setFeedback] = useState<GameFeedback | null>(null);
  const [notationMode, setNotationMode] = useState<'jianpu' | 'staff'>(
    'jianpu',
  );
  const [enableMic, setEnableMic] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentPlayingNote, setCurrentPlayingNote] =
    useState<PlayingNote | null>(null);
  const [errorTrackIndex, setErrorTrackIndex] = useState<number | null>(null);
  const [_hitCount, setHitCount] = useState(0);
  const [_missCount, setMissCount] = useState(0);
  const [showMoreSettings, setShowMoreSettings] = useState(false);
  const [gameConfig, setGameConfig] = useState<GameConfig>({
    duration: 60,
    noteCount: 30,
  });

  // 历史记录相关
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [gameRecords, setGameRecords] = useState<GameRecord[]>([]);

  // 帮助 Modal
  const [isHelpVisible, setIsHelpVisible] = useState(false);

  // Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const notesRef = useRef<GameNote[]>([]);
  const startTimeRef = useRef<number>(0);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const isPlayingRef = useRef<boolean>(false);
  // const enableMicRef = useRef<boolean>(false);
  const isGameEndingRef = useRef<boolean>(false);
  const errorTrackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 游戏统计 refs
  const scoreRef = useRef<number>(0);
  const comboRef = useRef<number>(0);
  const maxComboRef = useRef<number>(0);
  const hitCountRef = useRef<number>(0);
  const missCountRef = useRef<number>(0);

  // 解析歌曲音符
  const parseSongNotes = useCallback(() => {
    const notes: GameNote[] = [];
    if (!abcText) return [];
    const visualObj = ABCJS.renderAbc(
      document.createElement('div'),
      abcText,
    )[0];
    if (!visualObj.lines) return [];

    visualObj.lines.forEach((line: any) => {
      line.staff.forEach((staff: any) => {
        staff.voices.forEach((voice: any) => {
          voice.forEach((element: any) => {
            if (element.el_type === 'note' && element.midiPitches) {
              const midi = element.midiPitches[0].pitch;
              const trackIndex = midi % 12;
              notes.push({
                id: Math.random().toString(36),
                midi,
                timestamp: element.startMS / 1000,
                y: -50,
                hit: false,
                missed: false,
                trackIndex,
                keyHint: Object.keys(KEY_TO_MIDI).find(
                  (key) => KEY_TO_MIDI[key] === midi,
                ),
              });
            }
          });
        });
      });
    });
    return notes;
  }, [abcText]);

  // 生成自由模式的随机音符
  const generateRandomNotes = useCallback((count: number, duration: number) => {
    const notes: GameNote[] = [];
    const baseMidi = 60;

    for (let i = 0; i < count; i++) {
      const timestamp = (i / count) * duration;
      const whiteKeys = [0, 2, 4, 5, 7, 9, 11];
      const octave = Math.floor(Math.random() * 2);
      const noteIndex = whiteKeys[Math.floor(Math.random() * whiteKeys.length)];
      const midi = baseMidi + octave * 12 + noteIndex;
      const trackIndex = midi % 12;

      notes.push({
        id: Math.random().toString(36),
        midi,
        timestamp,
        y: -50,
        hit: false,
        missed: false,
        trackIndex,
        keyHint: Object.keys(KEY_TO_MIDI).find(
          (key) => KEY_TO_MIDI[key] === midi,
        ),
      });
    }
    return notes;
  }, []);

  // 音频引擎
  const startAudioEngine = async () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
    }
    await audioCtxRef.current.resume();

    if (enableMic) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const source = audioCtxRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioCtxRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048;
        source.connect(analyserRef.current);
      } catch (error) {
        console.error('麦克风访问失败:', error);
        message.warning('麦克风访问失败，将禁用录音模式');
        setEnableMic(false);
      }
    }
  };

  // 播放音效
  const playSound = useCallback((midi: number) => {
    if (!audioCtxRef.current) return;

    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    const oscillator = audioCtxRef.current.createOscillator();
    const gainNode = audioCtxRef.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtxRef.current.destination);

    oscillator.frequency.value = freq;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioCtxRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioCtxRef.current.currentTime + 0.5,
    );

    oscillator.start(audioCtxRef.current.currentTime);
    oscillator.stop(audioCtxRef.current.currentTime + 0.5);
  }, []);

  // 绘制音符标志
  const drawNoteSymbol = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      height: number,
      midi: number,
      mode: 'jianpu' | 'staff',
    ) => {
      if (mode === 'jianpu') {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const jianpu = midiToJianpu(midi);
        ctx.fillText(jianpu, x + width / 2, y + height / 2);
      } else {
        const baseMidi = 60;
        const lineSpacing = 8;
        const staffBaseY = y + height / 2;
        const semitonesFromC4 = midi - baseMidi;
        const staffPosition = semitonesFromC4 / 2;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1;
        const staffTop = staffBaseY - 2 * lineSpacing;
        for (let i = 0; i < 5; i++) {
          const lineY = staffTop + i * lineSpacing;
          ctx.beginPath();
          ctx.moveTo(x + 6, lineY);
          ctx.lineTo(x + width - 6, lineY);
          ctx.stroke();
        }

        const noteHeadY = staffBaseY - staffPosition * lineSpacing;
        const noteHeadX = x + width / 2;

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(noteHeadX, noteHeadY, 8, 6, -0.2, 0, Math.PI * 2);
        ctx.fill();

        const stemLength = 20;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        const stemDown = staffPosition > 0;

        ctx.beginPath();
        if (stemDown) {
          ctx.moveTo(noteHeadX - 6, noteHeadY);
          ctx.lineTo(noteHeadX - 6, noteHeadY + stemLength);
        } else {
          ctx.moveTo(noteHeadX + 6, noteHeadY);
          ctx.lineTo(noteHeadX + 6, noteHeadY - stemLength);
        }
        ctx.stroke();

        if (midi < baseMidi) {
          const ledgerLinesNeeded = Math.ceil((baseMidi - midi) / 2);
          for (let i = 1; i <= ledgerLinesNeeded; i++) {
            const ledgerY = staffBaseY + i * lineSpacing;
            ctx.beginPath();
            ctx.moveTo(noteHeadX - 10, ledgerY);
            ctx.lineTo(noteHeadX + 10, ledgerY);
            ctx.stroke();
          }
        }

        if (midi > baseMidi + 12) {
          const ledgerLinesNeeded = Math.ceil((midi - baseMidi - 12) / 2);
          for (let i = 1; i <= ledgerLinesNeeded; i++) {
            const ledgerY = staffBaseY - (2 + i) * lineSpacing;
            ctx.beginPath();
            ctx.moveTo(noteHeadX - 10, ledgerY);
            ctx.lineTo(noteHeadX + 10, ledgerY);
            ctx.stroke();
          }
        }
      }
    },
    [],
  );

  // 处理音符命中
  const handleHitNote = useCallback(
    (note: GameNote) => {
      playSound(note.midi);
      setCurrentPlayingNote({ midi: note.midi, key: note.keyHint });
      setTimeout(() => setCurrentPlayingNote(null), 300);

      setScore((s) => {
        const newScore = s + 100 + Math.min(combo, 10) * 10;
        scoreRef.current = newScore;
        return newScore;
      });
      setCombo((c) => {
        const newCombo = c + 1;
        comboRef.current = newCombo;
        if (newCombo > maxCombo) {
          setMaxCombo(newCombo);
          maxComboRef.current = newCombo;
        }
        return newCombo;
      });
      setHitCount((h) => {
        const newHitCount = h + 1;
        hitCountRef.current = newHitCount;
        return newHitCount;
      });
      setFeedback({ text: 'PERFECT', color: '#52c41a' });

      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 500);
    },
    [combo, playSound],
  );

  // 处理音符未命中
  const handleMissNote = useCallback(() => {
    setCombo(0);
    comboRef.current = 0;
    setMissCount((m) => {
      const newMissCount = m + 1;
      missCountRef.current = newMissCount;
      return newMissCount;
    });
    setFeedback({ text: 'MISS', color: '#ff4d4f' });

    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 500);
  }, []);

  // 处理点击轨道
  const handleTrackClick = useCallback(
    (clickedTrack: number, trackMidi: number) => {
      if (!isPlaying) return;

      const currentTime = (performance.now() - startTimeRef.current) / 1000;
      const canvas = document.getElementById('game-canvas-container');
      const judgmentLineY = canvas
        ? canvas.clientHeight * JUDGMENT_LINE_RATIO
        : 400;

      playSound(trackMidi);

      let hitNote: GameNote | null = null;
      let minDistance = Infinity;

      notesRef.current.forEach((note) => {
        if (!note.hit && !note.missed) {
          const noteY = (currentTime - note.timestamp) * speed * 100;
          const noteTrackIndex = note.midi % 12;

          if (noteTrackIndex === clickedTrack) {
            const distance = Math.abs(noteY - judgmentLineY);
            if (distance < JUDGMENT_THRESHOLDS.MISS && distance < minDistance) {
              minDistance = distance;
              hitNote = note;
            }
          }
        }
      });

      if (errorTrackTimeoutRef.current)
        clearTimeout(errorTrackTimeoutRef.current);

      if (hitNote) {
        if (minDistance < JUDGMENT_THRESHOLDS.PERFECT) {
          hitNote.hit = true;
          handleHitNote(hitNote);
        } else if (minDistance < JUDGMENT_THRESHOLDS.GOOD) {
          hitNote.hit = true;
          setFeedback({
            text: minDistance < 65 ? 'TOO EARLY' : 'TOO LATE',
            color: '#faad14',
          });
          if (feedbackTimeoutRef.current)
            clearTimeout(feedbackTimeoutRef.current);
          feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 300);

          setScore((s) => {
            const newScore = s + 50;
            scoreRef.current = newScore;
            return newScore;
          });
        } else {
          setErrorTrackIndex(clickedTrack);
          setFeedback({ text: 'MISS', color: '#ff4d4f' });
          if (feedbackTimeoutRef.current)
            clearTimeout(feedbackTimeoutRef.current);
          feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 500);
          errorTrackTimeoutRef.current = setTimeout(
            () => setErrorTrackIndex(null),
            300,
          );

          setCombo(0);
          comboRef.current = 0;
        }
      } else {
        setErrorTrackIndex(clickedTrack);
        setFeedback({ text: 'MISS', color: '#ff4d4f' });
        if (feedbackTimeoutRef.current)
          clearTimeout(feedbackTimeoutRef.current);
        feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 500);
        errorTrackTimeoutRef.current = setTimeout(
          () => setErrorTrackIndex(null),
          300,
        );

        setCombo(0);
        comboRef.current = 0;
      }
    },
    [isPlaying, speed, playSound, handleHitNote],
  );

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlayingRef.current) return;

      const key = e.key.toLowerCase();
      if (pressedKeysRef.current.has(key) || e.repeat) return;

      pressedKeysRef.current.add(key);
      const targetMidi = KEY_TO_MIDI[key];

      if (targetMidi !== undefined) {
        playSound(targetMidi);
        setCurrentPlayingNote({ midi: targetMidi, key });

        const currentTime = (performance.now() - startTimeRef.current) / 1000;
        const canvas = document.getElementById('game-canvas-container');
        const judgmentLineY = canvas
          ? canvas.clientHeight * JUDGMENT_LINE_RATIO
          : 400;

        let hitNote: GameNote | null = null;
        let minDistance = Infinity;

        notesRef.current.forEach((note) => {
          if (!note.hit && !note.missed) {
            const noteY = (currentTime - note.timestamp) * speed * 100;
            const distance = Math.abs(noteY - judgmentLineY);
            const noteTrackIndex = note.midi % 12;
            const keyTrackIndex = targetMidi % 12;

            if (
              noteTrackIndex === keyTrackIndex &&
              distance < JUDGMENT_THRESHOLDS.GOOD &&
              distance < minDistance
            ) {
              minDistance = distance;
              hitNote = note;
            }
          }
        });

        if (errorTrackTimeoutRef.current)
          clearTimeout(errorTrackTimeoutRef.current);

        if (hitNote && minDistance < JUDGMENT_THRESHOLDS.PERFECT) {
          hitNote.hit = true;
          handleHitNote(hitNote);
        } else if (hitNote && minDistance < JUDGMENT_THRESHOLDS.GOOD) {
          hitNote.hit = true;
          setFeedback({
            text: minDistance < 65 ? 'TOO EARLY' : 'TOO LATE',
            color: '#faad14',
          });
          if (feedbackTimeoutRef.current)
            clearTimeout(feedbackTimeoutRef.current);
          feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 300);

          setScore((s) => {
            const newScore = s + 50;
            scoreRef.current = newScore;
            return newScore;
          });
        } else {
          const keyTrackIndex = targetMidi % 12;
          setErrorTrackIndex(keyTrackIndex);
          setFeedback({ text: 'MISS', color: '#ff4d4f' });
          if (feedbackTimeoutRef.current)
            clearTimeout(feedbackTimeoutRef.current);
          feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 500);
          errorTrackTimeoutRef.current = setTimeout(
            () => setErrorTrackIndex(null),
            300,
          );

          setCombo(0);
          comboRef.current = 0;
        }

        setTimeout(() => {
          setCurrentPlayingNote(null);
        }, 300);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      pressedKeysRef.current.delete(key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [speed, playSound, handleHitNote]);

  // 结束游戏
  const endGame = useCallback(() => {
    if (isGameEndingRef.current) return;
    isGameEndingRef.current = true;

    console.log('[GameModule] Ending game...');

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current as unknown as number);
      timerIntervalRef.current = null;
    }
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    if (errorTrackTimeoutRef.current)
      clearTimeout(errorTrackTimeoutRef.current);

    setIsPlaying(false);
    isPlayingRef.current = false;
    // 清空 canvas 数据，避免结束后残留滑块或高亮
    notesRef.current = [];
    setFeedback(null);
    setCurrentPlayingNote(null);
    setErrorTrackIndex(null);
    // 重置显示的倒计时为配置的默认时长，避免界面显示 0s
    setTimeLeft(gameConfig.duration);
    setIsGameEnded(true);
  }, [gameConfig.duration]);

  // 游戏计时器
  const startGameTimer = useCallback(() => {
    setTimeLeft(gameConfig.duration);

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current as unknown as number);
      timerIntervalRef.current = null;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        console.debug('[GameModule] timer tick', prev); // debug
        return prev - 1;
      });
    }, 1000);
  }, [gameConfig.duration]);

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

  // 保存游戏记录
  const saveGameRecord = async () => {
    try {
      const duration = gameConfig.duration - timeLeft;

      await addGameRecord({
        gameMode,
        score: scoreRef.current,
        combo: comboRef.current,
        maxCombo: maxComboRef.current,
        hitCount: hitCountRef.current,
        missCount: missCountRef.current,
        duration,
      });
      console.log('[GameModule] Game record saved');
    } catch (error) {
      console.error('保存游戏记录失败', error);
    }
  };

  // 再来一局
  const handlePlayAgain = () => {
    setIsGameEnded(false);
    setTimeLeft(gameConfig.duration);
    startGame();
  };

  // 关闭游戏结束界面
  const handleCloseResult = () => {
    setIsGameEnded(false);
    setTimeLeft(gameConfig.duration);
  };

  // 开始游戏
  const startGame = async () => {
    await startAudioEngine();
    isGameEndingRef.current = false;
    setIsGameEnded(false);

    notesRef.current =
      gameMode === 'song'
        ? parseSongNotes()
        : generateRandomNotes(gameConfig.noteCount, gameConfig.duration);

    if (notesRef.current.length === 0) {
      message.warning(
        '当前没有可玩的音符，请在编辑模式添加内容或选择有曲谱的模式',
      );
      return;
    }

    setScore(0);
    setCombo(0);
    setHitCount(0);
    setMissCount(0);
    setMaxCombo(0);
    scoreRef.current = 0;
    comboRef.current = 0;
    maxComboRef.current = 0;
    hitCountRef.current = 0;
    missCountRef.current = 0;

    startTimeRef.current = performance.now();
    setIsPlaying(true);
    isPlayingRef.current = true;
    startGameTimer();
  };

  // 停止游戏
  const stopGame = useCallback(() => {
    endGame();
  }, [endGame]);

  // 监听倒计时，结束游戏
  useEffect(() => {
    if (isPlaying && timeLeft <= 0) {
      console.debug('[GameModule] timeLeft <= 0 effect, calling endGame');
      endGame();
    }
  }, [timeLeft, isPlaying, endGame]);

  // 游戏结束时保存记录
  useEffect(() => {
    if (isGameEnded) {
      saveGameRecord();
    }
  }, [isGameEnded]);

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
          <Button
            icon={<QuestionCircleOutlined />}
            size='small'
            onClick={() => setIsHelpVisible(true)}
          >
            按键帮助
          </Button>
          <Button
            icon={<HistoryOutlined />}
            size='small'
            onClick={handleOpenHistory}
          >
            历史记录
          </Button>
        </Space>
      }
    >
      {/* 玩法说明移到顶部 */}
      <Alert
        title='玩法说明'
        description='键盘 + 点击默认支持。音符块到达蓝色虚线时，按下键盘对应按键或点击轨道。启用录音模式后可用麦克风演奏。正确匹配可获得连击加分！'
        type='info'
        showIcon
        style={{ marginBottom: 16 }}
      />

      <div style={{ position: 'relative' }}>
        <GameCanvas
          isPlaying={isPlaying}
          notesRef={notesRef}
          speed={speed}
          feedback={feedback}
          notationMode={notationMode}
          enableMic={enableMic}
          currentPlayingNote={currentPlayingNote}
          errorTrackIndex={errorTrackIndex}
          startTimeRef={startTimeRef.current}
          onHitNote={handleHitNote}
          onMissNote={handleMissNote}
          playSound={playSound}
          drawNoteSymbol={drawNoteSymbol}
          midiToJianpu={midiToJianpu}
          onTrackClick={handleTrackClick}
        />

        {/* 游戏统计和当前音符显示 */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
          }}
        >
          {isPlaying && currentPlayingNote && (
            <div
              style={{
                background: 'rgba(82, 196, 26, 0.9)',
                padding: '12px 24px',
                borderRadius: 12,
                color: '#fff',
                textAlign: 'center',
                minWidth: 120,
              }}
            >
              <div style={{ fontSize: 32, fontWeight: 'bold', lineHeight: 1 }}>
                {midiToJianpu(currentPlayingNote.midi)}
              </div>
              {currentPlayingNote.key && !enableMic && (
                <div style={{ fontSize: 14, opacity: 0.9, marginTop: 4 }}>
                  按键：{currentPlayingNote.key.toUpperCase()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 游戏结束界面 */}
        {isGameEnded && (
          <GameResult
            score={scoreRef.current}
            combo={comboRef.current}
            maxCombo={maxComboRef.current}
            hitCount={hitCountRef.current}
            missCount={missCountRef.current}
            onPlayAgain={handlePlayAgain}
            onClose={handleCloseResult}
          />
        )}
      </div>

      <div style={{ marginTop: 24 }}>
        <GameStats
          score={score}
          combo={combo}
          maxCombo={maxCombo}
          timeLeft={timeLeft}
          isPlaying={isPlaying}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <GameSettings
          gameMode={gameMode}
          notationMode={notationMode}
          enableMic={enableMic}
          speed={speed}
          gameConfig={gameConfig}
          isPlaying={isPlaying}
          showMoreSettings={showMoreSettings}
          onGameModeChange={setGameMode}
          onNotationModeChange={setNotationMode}
          onEnableMicChange={setEnableMic}
          onSpeedChange={setSpeed}
          onDurationChange={(value) =>
            setGameConfig({ ...gameConfig, duration: value })
          }
          onNoteCountChange={(value) =>
            setGameConfig({ ...gameConfig, noteCount: value })
          }
          onToggleMoreSettings={() => setShowMoreSettings(!showMoreSettings)}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <Space orientation='vertical' style={{ width: '100%' }}>
          {!isPlaying ? (
            <Button
              type='primary'
              size='large'
              block
              icon={<RocketOutlined />}
              onClick={startGame}
            >
              开始挑战
            </Button>
          ) : (
            <Button
              danger
              size='large'
              block
              icon={<StopOutlined />}
              onClick={stopGame}
            >
              结束挑战
            </Button>
          )}
        </Space>
      </div>

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
                  <Tag
                    color={
                      score >= 500 ? 'green' : score >= 200 ? 'orange' : 'red'
                    }
                  >
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
                  <span>
                    <FireOutlined style={{ color: '#faad14' }} /> {maxCombo}{' '}
                    连击
                  </span>
                ),
                sorter: (a, b) => a.maxCombo - b.maxCombo,
              },
              {
                title: '命中/ missed',
                key: 'hitMiss',
                render: (_: unknown, record: GameRecord) => (
                  <span
                    style={{
                      color:
                        record.hitCount > record.missCount
                          ? '#52c41a'
                          : '#ff4d4f',
                    }}
                  >
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
                render: (createdAt: number) =>
                  new Date(createdAt).toLocaleString('zh-CN'),
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
          <Typography.Text type='secondary' style={{ fontSize: 12 }}>
            <TrophyOutlined style={{ marginRight: 4 }} />
            游戏记录会自动保存，最多显示最近 50 条记录
          </Typography.Text>
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
                      message.error('清空失败', error);
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

      {/* 按键帮助 Modal */}
      <Modal
        title={
          <span>
            <QuestionCircleOutlined /> 游戏操作说明
          </span>
        }
        open={isHelpVisible}
        onCancel={() => setIsHelpVisible(false)}
        footer={null}
        width={750}
      >
        <div style={{ maxWidth: 650, margin: '0 auto' }}>
          <h3 style={{ marginBottom: 16, textAlign: 'center' }}>
            🎮 输入方式说明
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <Card
              size='small'
              style={{ background: '#e6f7ff', borderColor: '#1890ff' }}
            >
              <h4 style={{ margin: '0 0 12px 0', color: '#1890ff' }}>
                ⌨️ 键盘输入
              </h4>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 20,
                  fontSize: 14,
                  lineHeight: 1.8,
                }}
              >
                <li>使用键盘按键对应不同音高</li>
                <li>反应更快，适合熟练玩家</li>
                <li>下方有按键提示</li>
                <li>支持多键同时按下</li>
                <li>
                  <strong>默认启用，无法关闭</strong>
                </li>
              </ul>
            </Card>

            <Card
              size='small'
              style={{ background: '#f6ffed', borderColor: '#52c41a' }}
            >
              <h4 style={{ margin: '0 0 12px 0', color: '#52c41a' }}>
                👆 点击轨道
              </h4>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 20,
                  fontSize: 14,
                  lineHeight: 1.8,
                }}
              >
                <li>每个轨道像一个钢琴按键</li>
                <li>点击轨道任何位置都会触发</li>
                <li>时机准确时判定成功</li>
                <li>适合不熟悉键盘的用户</li>
                <li>
                  <strong>默认启用，无法关闭</strong>
                </li>
              </ul>
            </Card>

            <Card
              size='small'
              style={{ background: '#fff7e6', borderColor: '#fa8c16' }}
            >
              <h4 style={{ margin: '0 0 12px 0', color: '#fa8c16' }}>
                🎤 录音模式
              </h4>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 20,
                  fontSize: 14,
                  lineHeight: 1.8,
                }}
              >
                <li>使用麦克风检测演奏音高</li>
                <li>需要浏览器麦克风权限</li>
                <li>在设置中勾选启用</li>
                <li>可与键盘/点击同时使用</li>
                <li>
                  <strong>需要手动开启</strong>
                </li>
              </ul>
            </Card>

            <Card
              size='small'
              style={{ background: '#f9f0ff', borderColor: '#b37feb' }}
            >
              <h4 style={{ margin: '0 0 12px 0', color: '#b37feb' }}>
                💡 游戏技巧
              </h4>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 20,
                  fontSize: 14,
                  lineHeight: 1.8,
                }}
              >
                <li>当滑块到达蓝色判定线时操作</li>
                <li>连续命中可以获得连击加分</li>
                <li>点击整个轨道任何位置都有效</li>
                <li>可以在设置中调整下落速度</li>
              </ul>
            </Card>
          </div>

          <Alert
            message='💡 温馨提示'
            description={
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 20,
                  fontSize: 14,
                  lineHeight: 1.8,
                }}
              >
                <li>录音模式需要麦克风权限，请确保环境安静</li>
                <li>点击轨道时会有音效反馈</li>
                <li>错误点击轨道会显示红色提示</li>
              </ul>
            }
            type='info'
            showIcon
          />
        </div>
      </Modal>
    </Card>
  );
};

export default GameModule;
