import React, { useEffect, useRef } from 'react';
import { Input, Row, Col, Card, Typography } from 'antd';
import ABCJS from 'abcjs';

const { TextArea } = Input;
const { Text } = Typography;

interface EditorModuleProps {
  abcText: string;
  setAbcText: (text: string) => void;
}

const EditorModule: React.FC<EditorModuleProps> = ({ abcText, setAbcText }) => {
  const paperRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<any>(null); // 用于访问 antd TextArea 的底层 DOM

  // 渲染乐谱
  useEffect(() => {
    if (paperRef.current) {
      ABCJS.renderAbc(paperRef.current, abcText, {
        responsive: 'resize', // 使乐谱适应容器宽度
        add_classes: true, // 添加 CSS 类以支持高亮
        clickListener: (
          abcElem: any,
          tuneNumber: number,
          classes: string,
          analysis: any,
          drag: any,
          mouseEvent: MouseEvent,
        ) => {
          handleNoteClick(abcElem);
        },
      });
    }
  }, [abcText]);

  // 处理点击五线谱音符高亮源码
  const handleNoteClick = (abcElem: any) => {
    // abcElem 包含了起始和结束字符的索引
    const { startChar, endChar } = abcElem;

    if (
      startChar !== undefined &&
      endChar !== undefined &&
      textAreaRef.current
    ) {
      // 获取 antd TextArea 内部真实的 HTMLTextAreaElement
      const textAreaDOM = textAreaRef.current.resizableTextArea.textArea;

      // 1. 设置焦点
      textAreaDOM.focus();
      // 2. 选中对应源码区域
      textAreaDOM.setSelectionRange(startChar, endChar);

      // 3. 滚动到选中的位置（如果代码很长）
      const lineHeight = 22; // 粗略估算行高
      const charBefore = abcText.substring(0, startChar);
      const linesBefore = charBefore.split('\n').length;
      textAreaDOM.scrollTop = (linesBefore - 1) * lineHeight;

      console.log(`选中区域: ${startChar} - ${endChar}`);
    }
  };

  return (
    <Card title='乐谱编辑器 (点击音符定位源码)' bordered={false}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={10}>
          <div style={{ marginBottom: 8 }}>
            <Text type='secondary'>
              在下方编辑 ABC 源码，或点击右侧音符定位代码：
            </Text>
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
              width: '100%', // 确保容器宽度 100%
            }}
          />
        </Col>
      </Row>

      <style>{`
        /* 鼠标悬停在音符上时显示手型，表示可点击 */
        .abcjs-note, .abcjs-beam, .abcjs-slur {
          cursor: pointer;
        }
        .abcjs-note:hover {
          fill: #1890ff;
        }
        /* 乐谱响应式容器样式 */
        .abc-editor-paper svg {
          width: 100%;
          height: auto;
        }
      `}</style>
    </Card>
  );
};

export default EditorModule;
