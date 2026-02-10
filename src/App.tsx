import { useState, type FC } from 'react';
import { Tabs, Card, Typography } from 'antd';
import {
  EditOutlined,
  PlayCircleOutlined,
  AimOutlined,
} from '@ant-design/icons';
import EditorModule from './components/EditorModule';
import PlaybackModule from './components/PlaybackModule';
import PracticeModule from './components/PracticeModule';

const { Title } = Typography;

const MusicWorkstation: FC = () => {
  const [abcText, setAbcText] = useState<string>(
    'X:1\nT:Practice Piece\nM:4/4\nL:1/8\nK:C\nCDEF GABc | cBAG FEDC |',
  );
  const [instrument, setInstrument] = useState<number>(0);

  const items = [
    {
      key: 'edit',
      label: (
        <span>
          <EditOutlined />
          编辑模式
        </span>
      ),
      children: <EditorModule abcText={abcText} setAbcText={setAbcText} />,
    },
    {
      key: 'play',
      label: (
        <span>
          <PlayCircleOutlined />
          播放模式
        </span>
      ),
      children: (
        <PlaybackModule
          abcText={abcText}
          instrument={instrument}
          setInstrument={setInstrument}
        />
      ),
    },
    {
      key: 'practice',
      label: (
        <span>
          <AimOutlined />
          练习模式
        </span>
      ),
      children: <PracticeModule abcText={abcText} />,
    },
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <Title level={3} style={{ textAlign: 'center' }}>
        AI 音乐助教工作站
      </Title>
      <Card>
        <Tabs
          defaultActiveKey='edit'
          items={items}
          destroyInactiveTabPane={false}
        />
      </Card>
    </div>
  );
};

export default MusicWorkstation;
