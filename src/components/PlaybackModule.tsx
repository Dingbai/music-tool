import { useEffect, useRef, useState, type FC } from 'react';
import { Button, Select, Space, Alert, Spin } from 'antd';
import ABCJS from 'abcjs';
import 'abcjs/abcjs-audio.css';

interface PlaybackModuleProps {
  abcText: string;
  instrument: number;
  setInstrument: (instrument: number) => void;
}

const PlaybackModule: FC<PlaybackModuleProps> = ({
  abcText,
  instrument,
  setInstrument,
}) => {
  const [isAudioInitialized, setIsAudioInitialized] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const paperRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLDivElement>(null);
  const synthControlRef = useRef<any>(null);

  const initAudio = async () => {
    if (ABCJS.synth.activeAudioContext()) {
      await ABCJS.synth.activeAudioContext().resume();
    }
    setIsAudioInitialized(true);
  };

  useEffect(() => {
    const visualObj = ABCJS.renderAbc(paperRef.current, abcText, {
      add_classes: true,
    })[0];

    if (isAudioInitialized) {
      setLoading(true);
      const synth = new ABCJS.synth.SynthController();
      synth.load(audioRef.current, null, {
        displayPlay: true,
        displayProgress: true,
      });

      const midi = new ABCJS.synth.CreateSynth();
      midi
        .init({ visualObj, options: { program: instrument } })
        .then(() => midi.prime())
        .then(() => synth.setTune(visualObj, false, { program: instrument }))
        .finally(() => setLoading(false));

      synthControlRef.current = synth;
    }
  }, [abcText, instrument, isAudioInitialized]);

  return (
    <Space direction='vertical' style={{ width: '100%' }}>
      {!isAudioInitialized && (
        <Alert
          message='请激活音频以进行播放'
          type='info'
          action={<Button onClick={initAudio}>激活</Button>}
        />
      )}
      <Select
        value={instrument}
        onChange={setInstrument}
        options={[
          { label: '钢琴', value: 0 },
          { label: '小号', value: 56 },
        ]}
      />
      <Spin spinning={loading}>
        <div ref={audioRef} />
        <div ref={paperRef} />
      </Spin>
    </Space>
  );
};

export default PlaybackModule;
