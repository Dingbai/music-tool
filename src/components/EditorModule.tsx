import React, { useEffect, useRef } from 'react';
import { Input, Row, Col, Card } from 'antd';
import ABCJS from 'abcjs';

const { TextArea } = Input;

interface EditorModuleProps {
  abcText: string;
  setAbcText: (text: string) => void;
}

const EditorModule: React.FC<EditorModuleProps> = ({ abcText, setAbcText }) => {
  const paperRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  // 渲染乐谱
  useEffect(() => {
    if (paperRef.current) {
      ABCJS.renderAbc(paperRef.current, abcText, {
        responsive: 'resize',
        add_classes: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        clickListener: (abcElem: any) => {
          handleNoteClick(abcElem);
        },
      });
    }
  }, [abcText]);

  // 处理点击五线谱音符高亮源码
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNoteClick = (abcElem: any) => {
    const { startChar, endChar } = abcElem;

    if (
      startChar !== undefined &&
      endChar !== undefined &&
      textAreaRef.current
    ) {
      const textAreaDOM = textAreaRef.current.resizableTextArea.textArea;

      textAreaDOM.focus();
      textAreaDOM.setSelectionRange(startChar, endChar);

      const lineHeight = 22;
      const charBefore = abcText.substring(0, startChar);
      const linesBefore = charBefore.split('\n').length;
      textAreaDOM.scrollTop = (linesBefore - 1) * lineHeight;

      console.log(`选中区域：${startChar} - ${endChar}`);
    }
  };

  return (
    <Card title='乐谱编辑器 (点击音符定位源码)' bordered={false}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={10}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: '#666', fontSize: '14px' }}>
              在下方编辑 ABC 源码，或点击右侧音符定位代码：
            </span>
          </div>
          <TextArea
            ref={textAreaRef}
            rows={18}
            value={abcText}
            onChange={(e) => setAbcText(e.target.value)}
            style={{
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: '14px',
              backgroundColor: '#fafafa',
            }}
            spellCheck={false}
          />
        </Col>
        <Col xs={24} md={14}>
          <div
            ref={paperRef}
            className='abc-editor-paper'
            style={{
              border: '1px solid #f0f0f0',
              borderRadius: '4px',
              padding: '16px',
              minHeight: '400px',
              background: '#fff',
              width: '100%',
            }}
          />
        </Col>
      </Row>

      <style>{`
        .abcjs-note, .abcjs-beam, .abcjs-slur {
          cursor: pointer;
        }
        .abcjs-note:hover {
          fill: #1890ff;
        }
        .abc-editor-paper svg {
          width: 100%;
          height: auto;
        }
      `}</style>
    </Card>
  );
};

export default EditorModule;
