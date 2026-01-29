import React, { useEffect, useRef, useState } from 'react';
import abcjs from 'abcjs';
import {
  Card,
  Button,
  Select,
  InputNumber,
  Space,
  Typography,
  Divider,
  Row,
  Col,
} from 'antd';
import {
  DownloadOutlined,
  RocketOutlined,
  SoundOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import 'abcjs/abcjs-audio.css';
import '../styles/sheetEditor.css';

const { Title, Text } = Typography;

// 游标控制类
class CursorControl {
  private paperRef: React.RefObject<HTMLDivElement>;
  constructor(paperRef: React.RefObject<HTMLDivElement>) {
    this.paperRef = paperRef;
  }
  onStart() {
    const svg = this.paperRef.current?.querySelector('svg');
    if (svg) {
      const cursor = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line',
      );
      cursor.setAttribute('class', 'abcjs-cursor');
      cursor.setAttribute('x1', '0');
      cursor.setAttribute('y1', '0');
      cursor.setAttribute('x2', '0');
      cursor.setAttribute('y2', '0');
      svg.appendChild(cursor);
    }
  }
  onBeat(beatNumber: number, totalBeats: number, totalTime: number) {
    const beatEl = document.getElementById('beat-info');
    if (beatEl)
      beatEl.innerText = `进度: ${beatNumber}/${totalBeats} 拍 (${totalTime.toFixed(1)}s)`;
  }
  onEvent(ev: any) {
    if (ev.measureStart && ev.left === null) return;
    const lastSelection = document.querySelectorAll('#paper svg .highlight');
    lastSelection.forEach((el) => el.classList.remove('highlight'));
    ev.elements.forEach((noteGroup: HTMLElement[]) =>
      noteGroup.forEach((el) => el.classList.add('highlight')),
    );
    const cursor = document.querySelector(
      '#paper svg .abcjs-cursor',
    ) as SVGLineElement;
    if (cursor) {
      cursor.setAttribute('x1', (ev.left - 2).toString());
      cursor.setAttribute('x2', (ev.left - 2).toString());
      cursor.setAttribute('y1', ev.top.toString());
      cursor.setAttribute('y2', (ev.top + ev.height).toString());
    }
  }
  onFinished() {
    const els = document.querySelectorAll('svg .highlight');
    els.forEach((el) => el.classList.remove('highlight'));
  }
}

const AbcjsEditorSynth: React.FC = () => {
  const paperRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [synthControl, setSynthControl] = useState<any>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(true);
  const [abcText, setAbcText] = useState(
    "T: Cooley's\nM: 4/4\nL: 1/8\nR: reel\nK: Emin\n|:{E}D2|EB{c}BA B2 EB|~B2 AB dBAG|FDAD BDAD|FDAD dAFD|EBBA B2 EB|B2 AB defg|afe^c dBAF|DEFD E2:|",
  );
  const [seekAmount, setSeekAmount] = useState<number>(0);
  const [seekUnits, setSeekUnits] = useState<string>('percent');

  // MIDI 音色配置：存储 MIDI Program ID
  const [programId, setProgramId] = useState<number>(0);

  // 同步音频逻辑：使用 program 参数强制指定音色
  const syncAudio = async (control: any, visualObj: any, pId: number) => {
    if (!control || !visualObj) return;
    setIsAudioLoading(true);
    try {
      const midiBuffer = new abcjs.synth.CreateSynth();
      await midiBuffer.init({
        visualObj,
        options: {
          soundFontUrl: `https://paulrosen.github.io/midi-js-soundfonts/FluidR3_GM/`,
          program: pId, // 强制覆盖乐谱中的音色设定，实现真正的 UI 切换
        },
      });
      await midiBuffer.prime();
      await control.setTune(visualObj, false);
      console.log(`音色切换成功，MIDI ID: ${pId}`);
    } catch (err) {
      console.warn('音频同步失败:', err);
    } finally {
      setIsAudioLoading(false);
    }
  };

  useEffect(() => {
    let control: any = null;

    if (abcjs.synth.supportsAudio()) {
      control = new abcjs.synth.SynthController();
      control.load(audioRef.current!, new CursorControl(paperRef), {
        displayLoop: true,
        displayRestart: true,
        displayPlay: true,
        displayProgress: true,
        displayWarp: true,
      });
      setSynthControl(control);
    }

    const editor = new abcjs.Editor(textareaRef.current!, {
      canvas_id: 'paper',
      warnings_id: 'warnings',
      abcjsParams: {
        responsive: 'resize',
        add_classes: true,
        clickListener: (abcElem: any) => {
          if (abcElem.midiPitches && control) {
            abcjs.synth
              .activeAudioContext()
              .resume()
              .then(() => {
                control?.playEvent(
                  abcElem.midiPitches,
                  abcElem.midiGraceNotePitches,
                  control.visualObj.millisecondsPerMeasure(),
                );
              });
          }
        },
      },
      onchange: (editorInstance: any) => {
        const visualObj = editorInstance.tunes[0];
        if (control) syncAudio(control, visualObj, programId);
      },
    });

    // 解决首屏初始化问题：
    // Editor 初始化后可能不会立即触发 onchange，我们需要手动渲染一次
    const initialVisualObj = abcjs.renderAbc('paper', abcText, {
      responsive: 'resize',
      add_classes: true,
    })[0];
    if (initialVisualObj && control) {
      syncAudio(control, initialVisualObj, programId);
    }

    return () => {
      if (control) control.disable(true);
    };
  }, [programId]); // 监听 programId，确保音色选择即时生效

  return (
    <div className='app-container'>
      <Card variant='borderless' className='shadow-sm'>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
          <SoundOutlined /> MIDI 交互乐谱编辑器 (AntD 6.x)
        </Title>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={10}>
            <Space direction='vertical' style={{ width: '100%' }} size='large'>
              <div>
                <Text strong>ABC 源码:</Text>
                <textarea
                  ref={textareaRef}
                  className='abc-textarea'
                  value={abcText}
                  onChange={(e) => setAbcText(e.target.value)}
                  spellCheck={false}
                />
              </div>
              <div id='warnings' style={{ color: 'red', minHeight: '20px' }} />

              <Card
                size='small'
                title={
                  <>
                    <SettingOutlined /> 音色配置
                  </>
                }
              >
                <Space direction='vertical' style={{ width: '100%' }}>
                  <div>
                    <Text type='secondary'>选择 MIDI 乐器:</Text>
                    <Select
                      style={{ width: '100%', marginTop: 8 }}
                      value={programId}
                      onChange={setProgramId}
                      options={[
                        { value: 0, label: '钢琴 (Acoustic Grand Piano)' },
                        { value: 40, label: '小提琴 (Violin)' },
                        { value: 19, label: '教堂风琴 (Church Organ)' },
                        { value: 24, label: '古典吉他 (Guitar Nylon)' },
                        { value: 73, label: '长笛 (Flute)' },
                        { value: 48, label: '弦乐合奏 (String Ensemble 1)' },
                      ]}
                    />
                  </div>
                  <Divider style={{ margin: '12px 0' }} />
                  <Space wrap>
                    <Button
                      icon={<RocketOutlined />}
                      onClick={() => synthControl?.setWarp(Math.random() * 100)}
                      disabled={isAudioLoading}
                    >
                      随机变速
                    </Button>
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={() => synthControl?.download('music.wav')}
                      disabled={isAudioLoading}
                    >
                      导出 WAV
                    </Button>
                  </Space>
                </Space>
              </Card>
            </Space>
          </Col>

          <Col xs={24} lg={14}>
            <Card type='inner' title='五线谱预览'>
              <div className='paper-container' id='paper' ref={paperRef} />

              <Divider orientation='left'>播放控制</Divider>

              <div className='audio-controls-wrapper'>
                <Row gutter={[16, 16]} align='middle'>
                  <Col span={24}>
                    <div id='audio' ref={audioRef} />
                  </Col>
                  <Col span={24}>
                    <Space wrap>
                      <Text id='beat-info' type='secondary'>
                        {isAudioLoading ? '正在加载音频系统...' : '准备就绪'}
                      </Text>
                      <Divider type='vertical' />
                      <InputNumber
                        min={0}
                        value={seekAmount}
                        onChange={(val) => setSeekAmount(val || 0)}
                      />
                      <Select
                        value={seekUnits}
                        onChange={setSeekUnits}
                        style={{ width: 100 }}
                        options={[
                          { value: 'percent', label: '百分比' },
                          { value: 'seconds', label: '秒数' },
                          { value: 'beats', label: '拍数' },
                        ]}
                      />
                      <Button
                        type='primary'
                        onClick={() =>
                          synthControl?.seek(seekAmount, seekUnits as any)
                        }
                      >
                        跳转
                      </Button>
                    </Space>
                  </Col>
                </Row>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default AbcjsEditorSynth;
