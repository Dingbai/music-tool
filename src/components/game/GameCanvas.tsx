import React, { useRef, useEffect, useCallback } from 'react';
import { GameNote } from './types';

interface GameCanvasProps {
  isPlaying: boolean;
  notesRef: React.MutableRefObject<GameNote[]>;
  speed: number;
  feedback: { text: string; color: string } | null;
  notationMode: 'jianpu' | 'staff';
  enableMic: boolean;
  currentPlayingNote: { midi: number; key?: string } | null;
  errorTrackIndex: number | null;
  startTimeRef: number;
  onHitNote: (note: GameNote) => void;
  onMissNote: () => void;
  playSound: (midi: number) => void;
  drawNoteSymbol: (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    midi: number,
    mode: 'jianpu' | 'staff'
  ) => void;
  midiToJianpu: (midi: number) => string;
  onTrackClick?: (trackIndex: number, midi: number) => void;
}

const TRACK_COUNT = 12;
const JUDGMENT_LINE_RATIO = 0.8;

const GameCanvas: React.FC<GameCanvasProps> = ({
  isPlaying,
  notesRef,
  speed,
  feedback,
  notationMode,
  enableMic,
  currentPlayingNote,
  errorTrackIndex,
  startTimeRef,
  onHitNote,
  onMissNote,
  playSound,
  drawNoteSymbol,
  midiToJianpu,
  onTrackClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);

  // 渲染循环
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isPlaying) return;
    const ctx = canvas.getContext('2d')!;
    const currentTime = (performance.now() - startTimeRef) / 1000;
    const judgmentLineY = canvas.height * JUDGMENT_LINE_RATIO;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制轨道
    for (let i = 0; i < TRACK_COUNT; i++) {
      // 如果是错误轨道，绘制红色背景
      if (errorTrackIndex === i) {
        ctx.fillStyle = 'rgba(255, 77, 79, 0.3)';
        ctx.fillRect(i * (canvas.width / TRACK_COUNT), 0, canvas.width / TRACK_COUNT, canvas.height);
      }
      
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.strokeRect(i * (canvas.width / TRACK_COUNT), 0, canvas.width / TRACK_COUNT, canvas.height);

      // 绘制轨道底部的键位提示
      const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
      const keyLabel = whiteKeys[i % 7];
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(keyLabel, i * (canvas.width / TRACK_COUNT) + canvas.width / TRACK_COUNT / 2, canvas.height - 10);
    }

    // 绘制判定线
    ctx.strokeStyle = '#1890ff';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(0, judgmentLineY);
    ctx.lineTo(canvas.width, judgmentLineY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 更新和绘制音符
    notesRef.current.forEach((note) => {
      if (!note.hit && !note.missed) {
        const elapsed = currentTime - note.timestamp;
        note.y = elapsed * speed * 100;

        const trackWidth = canvas.width / TRACK_COUNT;
        const x = note.trackIndex * trackWidth;
        const blockHeight = notationMode === 'staff' ? 50 : 30;
        const blockY = note.y - blockHeight / 2;

        // 绘制滑块背景
        if (notationMode === 'staff') {
          const gradient = ctx.createLinearGradient(x, blockY, x, blockY + blockHeight);
          gradient.addColorStop(0, '#1890ff');
          gradient.addColorStop(1, '#096dd9');
          ctx.fillStyle = gradient;
          const radius = 8;
          ctx.beginPath();
          ctx.roundRect(x + 4, blockY, trackWidth - 8, blockHeight, radius);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          ctx.fillStyle = note.trackIndex % 2 === 0 ? '#1890ff' : '#096dd9';
          ctx.fillRect(x + 3, blockY, trackWidth - 6, blockHeight);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.fillRect(x + 5, blockY + 2, trackWidth - 10, 8);
        }

        // 绘制音符标志
        drawNoteSymbol(ctx, x + 4, blockY, trackWidth - 8, blockHeight, note.midi, notationMode);

        // 绘制键盘提示
        if (note.keyHint && !enableMic) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(note.keyHint.toUpperCase(), x + trackWidth / 2, blockY + blockHeight + 12);
        }

        // 判定 - 麦克风检测
        if (Math.abs(note.y - judgmentLineY) < 30 && !note.hit) {
          if (analyserRef.current) {
            const dataArray = new Float32Array(2048);
            analyserRef.current.getFloatTimeDomainData(dataArray);
            const detectedFreq = (window as any).detectPitchYIN
              ? (window as any).detectPitchYIN(dataArray, 44100)
              : null;

            if (detectedFreq) {
              const detectedMidi = Math.round(69 + 12 * Math.log2(detectedFreq / 440));
              if (Math.abs(detectedMidi - note.midi) <= 1) {
                note.hit = true;
                onHitNote(note);
                return;
              }
            }
          }
        }

        // 音符超出屏幕 - 未命中
        if (note.y > canvas.height && !note.hit && !note.missed) {
          note.missed = true;
          onMissNote();
        }
      }
    });

    // 绘制反馈
    if (feedback) {
      ctx.fillStyle = feedback.color;
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(feedback.text, canvas.width / 2, judgmentLineY - 50);
    }

    // 绘制当前演奏的音符（正确命中）
    if (currentPlayingNote && errorTrackIndex === null) {
      const trackWidth = canvas.width / TRACK_COUNT;
      const trackIndex = currentPlayingNote.midi % 12;
      const x = trackIndex * trackWidth;

      // 绘制高亮轨道
      ctx.fillStyle = 'rgba(82, 196, 26, 0.5)';
      ctx.fillRect(x, 0, trackWidth, canvas.height);

      // 绘制判定线处的音符
      ctx.fillStyle = '#52c41a';
      ctx.beginPath();
      ctx.arc(x + trackWidth / 2, judgmentLineY, 25, 0, Math.PI * 2);
      ctx.fill();

      // 绘制光晕效果
      ctx.strokeStyle = 'rgba(82, 196, 26, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x + trackWidth / 2, judgmentLineY, 35, 0, Math.PI * 2);
      ctx.stroke();

      // 绘制音符名称
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      const noteName = midiToJianpu(currentPlayingNote.midi);
      ctx.fillText(noteName, x + trackWidth / 2, judgmentLineY + 10);

      // 绘制按键提示
      if (currentPlayingNote.key && !enableMic) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Arial';
        ctx.fillText('按键：' + currentPlayingNote.key.toUpperCase(), x + trackWidth / 2, judgmentLineY + 40);
      }
    }

    requestRef.current = requestAnimationFrame(render);
  }, [isPlaying, speed, feedback, notationMode, enableMic, currentPlayingNote, errorTrackIndex, startTimeRef, notesRef, onHitNote, onMissNote, playSound, drawNoteSymbol, midiToJianpu]);

  // 点击轨道处理
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const trackWidth = canvas.width / TRACK_COUNT;
    const clickedTrack = Math.floor(clickX / trackWidth);

    // 播放点击音效
    const trackMidi = 60 + clickedTrack;
    playSound(trackMidi);

    // 通知父组件处理点击逻辑
    onTrackClick?.(clickedTrack, trackMidi);
  }, [isPlaying, playSound, onTrackClick]);

  // 启动渲染循环
  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(render);
    } else {
      // 如果停止播放，清空画布
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, render]);

  // 处理 canvas 尺寸调整
  useEffect(() => {
    const container = document.getElementById('game-canvas-container');
    const canvas = canvasRef.current;

    if (!container || !canvas) return;

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    resizeCanvas();

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      id="game-canvas-container"
      style={{
        position: 'relative',
        background: '#000',
        borderRadius: '12px',
        border: '4px solid #333',
        overflow: 'hidden',
        height: '500px',
      }}
    >
      <canvas
        ref={canvasRef}
        width={600}
        height={500}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor: isPlaying ? 'pointer' : 'default',
        }}
        onClick={handleCanvasClick}
      />
      {!isPlaying && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎮</div>
          <p>准备开始挑战</p>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;
