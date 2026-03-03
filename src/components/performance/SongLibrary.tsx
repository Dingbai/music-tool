import React, { useState } from 'react';
import {
  Modal,
  Table,
  Tag,
  Input,
  Space,
  Typography,
  Empty,
  Tabs,
  Button,
  Upload,
} from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  ExportOutlined,
  ImportOutlined,
  BookOutlined,
  // MusicOutlined,
} from '@ant-design/icons';
import { songLibrary, type Song } from '../../data/songLibrary';
import type { UserSong } from '../../db/musicDb';

const { Text } = Typography;

interface SongLibraryProps {
  open: boolean;
  userSongs: UserSong[];
  onSelectSong: (song: Song | UserSong) => void;
  onClose: () => void;
  onLoadUserSongs: () => void;
  onExportSongs: () => void;
  onImportSongs: (file: File) => void;
  onDeleteUserSong?: (id: number) => void;
}

const SongLibrary: React.FC<SongLibraryProps> = ({
  open,
  userSongs,
  onSelectSong,
  onClose,
  onLoadUserSongs,
  onExportSongs,
  onImportSongs,
  onDeleteUserSong,
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeTab, setActiveTab] = useState('preset');

  // 过滤预设曲库
  const filteredPresetSongs = searchKeyword
    ? songLibrary.filter(
        (song) =>
          song.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          song.artist.toLowerCase().includes(searchKeyword.toLowerCase()),
      )
    : songLibrary;

  // 过滤用户曲谱
  const filteredUserSongs = searchKeyword
    ? userSongs.filter(
        (song) =>
          song.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          song.artist.toLowerCase().includes(searchKeyword.toLowerCase()),
      )
    : userSongs;

  // 处理 Tab 切换
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setSearchKeyword('');
    if (key === 'user') {
      onLoadUserSongs();
    }
  };

  // 处理选择曲目
  const handleSelectSong = (song: Song | UserSong) => {
    onSelectSong(song);
  };

  // 处理导入
  const handleImport = (file: File) => {
    onImportSongs(file);
    return false;
  };

  // 预设曲库列定义
  const presetColumns = [
    {
      title: '曲名',
      dataIndex: 'title',
      key: 'title',
      render: (title: string) => (
        <Space>
          {/* <MusicOutlined style={{ color: '#1890ff' }} /> */}
          <Text strong>{title}</Text>
        </Space>
      ),
    },
    {
      title: '作者',
      dataIndex: 'artist',
      key: 'artist',
      render: (artist: string) => (
        <Text type='secondary'>{artist || '未知'}</Text>
      ),
    },
    {
      title: '调性',
      dataIndex: 'key',
      key: 'key',
      width: 60,
      render: (key: string) => <Tag color='blue'>{key}</Tag>,
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 80,
      render: (difficulty: string) => (
        <Tag
          color={
            difficulty === '简单'
              ? 'green'
              : difficulty === '中等'
                ? 'orange'
                : 'red'
          }
        >
          {difficulty}
        </Tag>
      ),
    },
  ];

  // 用户曲谱列定义
  const userColumns = [
    ...presetColumns.slice(0, 2),
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: UserSong) => (
        <Button
          type='link'
          danger
          size='small'
          onClick={(e) => {
            e.stopPropagation();
            if (record.id && onDeleteUserSong) {
              onDeleteUserSong(record.id);
            }
          }}
        >
          删除
        </Button>
      ),
    },
  ];

  return (
    <Modal
      title={
        <span>
          <BookOutlined /> 曲库选择
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      {/* 搜索框 */}
      <Space style={{ marginBottom: 16 }} size='large'>
        <Input
          placeholder='搜索曲目...'
          prefix={<SearchOutlined />}
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />

        <Space>
          <Button icon={<ExportOutlined />} onClick={onExportSongs}>
            导出曲谱
          </Button>
          <Upload
            accept='.json'
            showUploadList={false}
            beforeUpload={handleImport}
          >
            <Button icon={<ImportOutlined />}>导入曲谱</Button>
          </Upload>
        </Space>
      </Space>

      {/* Tab 切换 */}
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: 'preset',
            label: (
              <span>
                <BookOutlined /> 预设曲库 ({filteredPresetSongs.length})
              </span>
            ),
            children:
              filteredPresetSongs.length > 0 ? (
                <Table
                  dataSource={filteredPresetSongs}
                  rowKey={(record) => `${record.title}-${record.artist}`}
                  columns={presetColumns}
                  pagination={{ pageSize: 10 }}
                  onRow={(record) => ({
                    onClick: () => handleSelectSong(record),
                    style: { cursor: 'pointer' },
                  })}
                />
              ) : (
                <Empty description='没有找到匹配的曲目' />
              ),
          },
          {
            key: 'user',
            label: (
              <span>
                <UserOutlined /> 用户曲谱 ({filteredUserSongs.length})
              </span>
            ),
            children:
              filteredUserSongs.length > 0 ? (
                <Table
                  dataSource={filteredUserSongs}
                  rowKey='id'
                  columns={userColumns}
                  pagination={{ pageSize: 10 }}
                  onRow={(record) => ({
                    onClick: () => handleSelectSong(record),
                    style: { cursor: 'pointer' },
                  })}
                />
              ) : (
                <Empty description='暂无用户曲谱，可以导入或创建新曲谱' />
              ),
          },
        ]}
      />

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Text type='secondary'>点击曲目即可加载到练习模式</Text>
      </div>
    </Modal>
  );
};

export default SongLibrary;
