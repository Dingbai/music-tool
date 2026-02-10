import { useRef, useState } from 'react';

export const useMusicPractice = () => {
  const audioCtx = useRef(null);
  const [bpm, setBpm] = useState(120);
  const nextClickTime = useRef(0);
  const timerID = useRef(null);

  // 初始化音频上下文
  const initAudio = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (
        window.AudioContext || window.webkitAudioContext
      )();
    }
  };

  // 产生节拍器的“滴”声
  const playClick = (time, isFirstBeat) => {
    const osc = audioCtx.current.createOscillator();
    const envelope = audioCtx.current.createGain();

    osc.frequency.value = isFirstBeat ? 880 : 440; // 第一拍高音
    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(envelope);
    envelope.connect(audioCtx.current.destination);

    osc.start(time);
    osc.stop(time + 0.1);
  };

  const startMetronome = (targetBpm) => {
    initAudio();
    const secondsPerBeat = 60.0 / targetBpm;
    nextClickTime.current = audioCtx.current.currentTime + 0.1;

    const scheduler = () => {
      while (nextClickTime.current < audioCtx.current.currentTime + 0.1) {
        playClick(nextClickTime.current, true); // 简化处理，每拍都滴
        nextClickTime.current += secondsPerBeat;
      }
      timerID.current = requestAnimationFrame(scheduler);
    };
    scheduler();
  };

  const stopMetronome = () => {
    cancelAnimationFrame(timerID.current);
  };

  return { initAudio, startMetronome, stopMetronome, audioCtx };
};
