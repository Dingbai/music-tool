import { useEffect, useRef, type FC } from 'react';
import { Input, Row, Col } from 'antd';
import ABCJS from 'abcjs';

interface EditorModuleProps {
  abcText: string;
  setAbcText: (text: string) => void;
}

const EditorModule: FC<EditorModuleProps> = ({ abcText, setAbcText }) => {
  const paperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paperRef.current) {
      ABCJS.renderAbc(paperRef.current, abcText, { responsive: 'resize' });
    }
  }, [abcText]);

  return (
    <Row gutter={16}>
      <Col span={10}>
        <Input.TextArea
          rows={15}
          value={abcText}
          onChange={(e) => setAbcText(e.target.value)}
          style={{ fontFamily: 'monospace' }}
        />
      </Col>
      <Col span={14}>
        <div
          ref={paperRef}
          style={{ border: '1px solid #eee', padding: '10px' }}
        />
      </Col>
    </Row>
  );
};

export default EditorModule;
