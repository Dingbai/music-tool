import React, { useState, useRef } from 'react';
import OCRModule from './modules/OCRModule';
import SheetRenderer from './modules/SheetRenderer';
import SheetEditor from './modules/SheetEditor';
import SheetController from './modules/SheetController';
import MIDIPlayer from './modules/MIDIPlayer';
import PitchDetection from './modules/PitchDetection';
import './styles/App.css';
import './styles/modules.css';

function App() {
  const [abcNotation, setAbcNotation] = useState<string>(
    `X: 1
T: Cooley's
M: 4/4
L: 1/8
R: reel
K: Emin
|:D2|EB{c}BA B2 EB|~B2 AB dBAG|FDAD BDAD|FDAD dAFD|
EBBA B2 EB|B2 AB defg|afe^c dBAF|DEFD E2:|
|:gf|eB B2 efge|eB B2 gedB|A2 FA DAFA|A2 FA defg|
eB B2 eBgB|eB B2 defg|afe^c dBAF|DEFD E2:|谱`,
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [highlightedNote, setHighlightedNote] = useState<number | null>(null);
  const [selectedInstrument, setSelectedInstrument] =
    useState<string>('harmonica');
  const [selectedNoteElem, setSelectedNoteElem] = useState<any>(null);
  const playerRef = useRef<any>(null);

  const handleOCRComplete = (abc: string) => {
    setAbcNotation(abc);
  };

  const handleSheetEdited = (newAbc: string) => {
    setAbcNotation(newAbc);
  };

  const handleNoteClick = (abcElem: any, tuneNumber: number) => {
    console.log('选中音符:', abcElem.startChar, abcElem.endChar);
    setSelectedNoteElem(abcElem);
  };

  const handleNoteSelected = (abcElem: any) => {
    setSelectedNoteElem(abcElem);
  };

  const handlePlayNote = (noteIndex: number) => {
    setHighlightedNote(noteIndex);
  };

  const handlePlayComplete = () => {
    setIsPlaying(false);
    setHighlightedNote(null);
  };

  return (
    <div className='app'>
      <header className='app-header'>
        <h1>🎵 音乐学习助手</h1>
        <p>简谱OCR识别 • 五线谱编辑 • 实时音准检测</p>
      </header>

      <main className='app-main'>
        <div className='container grid-1'>
          {/* 左侧：OCR和编辑器 */}
          <section className='section'>
            <h2>📷 简谱识别</h2>
            <OCRModule onOCRComplete={handleOCRComplete} />

            <h2 style={{ marginTop: '2rem' }}>✏️ 五线谱编辑</h2>
            <SheetEditor />
          </section>

          {/* 右侧：渲染和播放 */}
          {/* <section className="section">
            <h2>🎼 五线谱渲染</h2>
            <SheetRenderer
              abcNotation={abcNotation}
              onNoteClick={handleNoteClick}
            />

            <h2 style={{ marginTop: '2rem' }}>▶️ 播放控制</h2>
            <SheetController
              abcNotation={abcNotation}
            />

            <h2 style={{ marginTop: '2rem' }}>🎙️ 音准检测</h2>
            <PitchDetection />
          </section> */}
        </div>
      </main>

      <footer className='app-footer'>
        <p>
          音乐学习助手 v2.0 |
          支持简谱OCR识别、五线谱编辑、MIDI播放和实时音准检测
        </p>
      </footer>
    </div>
  );
}

export default App;
