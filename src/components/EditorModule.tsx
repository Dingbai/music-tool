import React, { useEffect, useRef, useState } from 'react';
import { Input, Row, Col, Card, Button, Space, Modal, Form, Select, message, Tag, Divider, Typography, Empty, Upload, Tooltip } from 'antd';
import {
  SaveOutlined,
  FolderOpenOutlined,
  DeleteOutlined,
  BookOutlined,
  ExportOutlined,
  ImportOutlined,
} from '@ant-design/icons';
import ABCJS from 'abcjs';
import {
  addSong,
  getAllSongs,
  updateSong,
  deleteSong,
  type UserSong,
} from '../db/musicDb';

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;

interface EditorModuleProps {
  abcText: string;
  setAbcText: (text: string) => void;
}

const EditorModule: React.FC<EditorModuleProps> = ({ abcText, setAbcText }) => {
  const paperRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  // 曲库相关状态
  const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
  const [isLibraryModalVisible, setIsLibraryModalVisible] = useState(false);
  const [userSongs, setUserSongs] = useState<UserSong[]>([]);
  const [selectedSong, setSelectedSong] = useState<UserSong | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [saveForm] = Form.useForm();

  // 加载用户曲谱列表
  const loadUserSongs = async () => {
    try {
      const songs = await getAllSongs();
      setUserSongs(songs);
    } catch (error) {
      console.error('加载曲谱失败:', error);
      message.error('加载曲谱失败');
    }
  };

  // 打开保存对话框
  const handleSaveClick = () => {
    // 从 ABC 文本中提取调性和曲名
    const titleMatch = abcText.match(/^T:(.+)$/m);
    const keyMatch = abcText.match(/^K:(\w+)/m);
    const title = titleMatch ? titleMatch[1].trim() : '未命名曲谱';
    const key = keyMatch ? keyMatch[1].trim() : 'C';

    saveForm.setFieldsValue({
      title,
      artist: '用户创作',
      key,
      difficulty: '中等',
    });
    setIsSaveModalVisible(true);
  };

  // 保存曲谱
  const handleSaveSong = async () => {
    try {
      const values = await saveForm.validateFields();
      const songData = {
        title: values.title,
        artist: values.artist,
        abcText,
        key: values.key,
        difficulty: values.difficulty,
      };

      if (selectedSong) {
        // 更新现有曲谱
        await updateSong({
          ...selectedSong,
          ...songData,
        });
        message.success('曲谱已更新');
      } else {
        // 添加新曲谱
        await addSong(songData);
        message.success('曲谱已保存');
      }

      setIsSaveModalVisible(false);
      saveForm.resetFields();
      setSelectedSong(null);
      loadUserSongs();
    } catch (error) {
      console.error('保存曲谱失败:', error);
      message.error('保存曲谱失败');
    }
  };

  // 打开曲库
  const handleOpenLibrary = async () => {
    await loadUserSongs();
    setIsLibraryModalVisible(true);
    setSearchKeyword('');
  };

  // 加载曲谱
  const handleLoadSong = (song: UserSong) => {
    setAbcText(song.abcText);
    setSelectedSong(song);
    setIsLibraryModalVisible(false);
    message.success(`已加载：${song.title}`);
  };

  // 删除曲谱
  const handleDeleteSong = async (song: UserSong, e: React.MouseEvent) => {
    e.stopPropagation();
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除曲谱"${song.title}"吗？`,
      onOk: async () => {
        try {
          await deleteSong(song.id!);
          message.success('曲谱已删除');
          loadUserSongs();
        } catch (error) {
          console.error('删除曲谱失败:', error);
          message.error('删除曲谱失败');
        }
      },
    });
  };

  // 编辑曲谱
  const handleEditSong = (song: UserSong, e: React.MouseEvent) => {
    e.stopPropagation();
    setAbcText(song.abcText);
    setSelectedSong(song);
    setIsLibraryModalVisible(false);
    message.success(`已加载：${song.title}，可进行编辑`);
  };

  // 导出用户曲谱
  const handleExportSongs = async () => {
    try {
      const songs = await getAllSongs();
      if (songs.length === 0) {
        message.warning('暂无可导出的曲谱');
        return;
      }
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        songs: songs.map(({ id, ...song }) => song),
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `music-app-songs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success(`成功导出 ${songs.length} 首曲谱`);
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    }
  };

  // 导入用户曲谱
  const handleImportSongs = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.songs || !Array.isArray(data.songs)) {
        throw new Error('文件格式不正确');
      }

      let importCount = 0;
      for (const song of data.songs) {
        if (!song.title || !song.abcText) {
          continue;
        }
        await addSong({
          title: song.title,
          artist: song.artist || '未知作者',
          abcText: song.abcText,
          key: song.key || 'C',
          difficulty: song.difficulty || '中等',
        });
        importCount++;
      }

      if (importCount > 0) {
        message.success(`成功导入 ${importCount} 首曲谱`);
        loadUserSongs();
      } else {
        message.warning('没有可导入的曲谱');
      }
    } catch (error: unknown) {
      console.error('导入失败:', error);
      message.error(`导入失败：${error instanceof Error ? error.message : '未知错误'}`);
    }
    return false;
  };

  // 过滤曲谱
  const filteredSongs = searchKeyword
    ? userSongs.filter(
        (song) =>
          song.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          song.artist.toLowerCase().includes(searchKeyword.toLowerCase()),
      )
    : userSongs;

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
    <Card
      title='乐谱编辑器 (点击音符定位源码)'
      variant="borderless"
      extra={
        <Space>
          <Button
            icon={<SaveOutlined />}
            onClick={handleSaveClick}
          >
            保存到曲库
          </Button>
          <Button
            icon={<FolderOpenOutlined />}
            onClick={handleOpenLibrary}
          >
            打开曲库
          </Button>
        </Space>
      }
    >
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

      {/* 保存曲谱 Modal */}
      <Modal
        title={<span><SaveOutlined /> 保存到曲库</span>}
        open={isSaveModalVisible}
        onOk={handleSaveSong}
        onCancel={() => {
          setIsSaveModalVisible(false);
          saveForm.resetFields();
          setSelectedSong(null);
        }}
        okText='保存'
        cancelText='取消'
      >
        <Form
          form={saveForm}
          layout='vertical'
          initialValues={{
            difficulty: '中等',
          }}
        >
          <Form.Item
            name='title'
            label='曲名'
            rules={[{ required: true, message: '请输入曲名' }]}
          >
            <Input placeholder='请输入曲名' />
          </Form.Item>
          <Form.Item
            name='artist'
            label='作者/歌手'
            rules={[{ required: true, message: '请输入作者' }]}
          >
            <Input placeholder='请输入作者或歌手' />
          </Form.Item>
          <Form.Item
            name='key'
            label='调性'
            rules={[{ required: true, message: '请输入调性' }]}
          >
            <Input placeholder='如：C, D, Em, Am 等' />
          </Form.Item>
          <Form.Item
            name='difficulty'
            label='难度'
            rules={[{ required: true, message: '请选择难度' }]}
          >
            <Select>
              <Option value='简单'>简单</Option>
              <Option value='中等'>中等</Option>
              <Option value='困难'>困难</Option>
            </Select>
          </Form.Item>
        </Form>
        {selectedSong && (
          <Text type='secondary'>正在更新曲谱：{selectedSong.title}</Text>
        )}
      </Modal>

      {/* 曲库 Modal */}
      <Modal
        title={<span><BookOutlined /> 我的曲谱库</span>}
        open={isLibraryModalVisible}
        onCancel={() => {
          setIsLibraryModalVisible(false);
          setSearchKeyword('');
          setSelectedSong(null);
        }}
        footer={null}
        width={700}
      >
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
          <Input
            placeholder='搜索歌曲或作者...'
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            allowClear
            style={{ flex: 1 }}
          />
          <Space>
            <Tooltip title='导出曲谱数据'>
              <Button
                icon={<ExportOutlined />}
                onClick={handleExportSongs}
                size='middle'
              >
                导出
              </Button>
            </Tooltip>
            <Upload
              accept='.json,.abc'
              showUploadList={false}
              beforeUpload={handleImportSongs}
              maxCount={1}
              data-testid='upload-input'
            >
              <Button icon={<ImportOutlined />} size='middle'>导入</Button>
            </Upload>
          </Space>
        </div>
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {filteredSongs.length > 0 ? (
            filteredSongs.map((song) => (
              <div
                key={song.id}
                style={{
                  cursor: 'pointer',
                  background:
                    selectedSong?.id === song.id ? '#e6f7ff' : 'transparent',
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  transition: 'background 0.2s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onClick={() => handleLoadSong(song)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fafafa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    selectedSong?.id === song.id ? '#e6f7ff' : 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOutlined style={{ color: '#1890ff' }} />
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: '4px' }}>{song.title}</div>
                    <Space size='small'>
                      <Text type='secondary'>{song.artist}</Text>
                      <Tag color='blue'>{song.key}调</Tag>
                      <Tag
                        color={
                          song.difficulty === '简单'
                            ? 'green'
                            : song.difficulty === '中等'
                            ? 'orange'
                            : 'red'
                        }
                      >
                        {song.difficulty}
                      </Tag>
                      <Text type='secondary' style={{ fontSize: 12 }}>
                        {new Date(song.updatedAt).toLocaleDateString('zh-CN')}
                      </Text>
                    </Space>
                  </div>
                </div>
                <Space size='small'>
                  <Button
                    type='primary'
                    size='small'
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLoadSong(song);
                    }}
                  >
                    加载
                  </Button>
                  <Button
                    size='small'
                    onClick={(e) => handleEditSong(song, e)}
                  >
                    编辑
                  </Button>
                  <Button
                    danger
                    size='small'
                    icon={<DeleteOutlined />}
                    onClick={(e) => handleDeleteSong(song, e)}
                  />
                </Space>
              </div>
            ))
          ) : (
            <Empty
              description={
                searchKeyword ? '未找到相关曲谱' : '暂无保存的曲谱，点击"保存到曲库"添加'
              }
            />
          )}
        </div>
        <Divider />
        <Space direction='vertical' style={{ width: '100%' }} size='small'>
          <Text type='secondary' style={{ fontSize: 12 }}>
            提示：曲谱保存在本地浏览器中，清除浏览器数据会丢失
          </Text>
          <Text type='secondary' style={{ fontSize: 12 }}>
            <ExportOutlined style={{ marginRight: 4 }} />
            建议使用导出功能备份曲谱数据，更换浏览器时可通过导入功能恢复
          </Text>
        </Space>
      </Modal>

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
