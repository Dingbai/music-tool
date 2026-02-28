# AI 音乐助教工作站

一个功能丰富的音乐学习和演奏辅助应用，支持简谱/五线谱编辑、MIDI 播放、音准检测、节奏游戏等多种功能。

## ✨ 功能特性

### 🎼 编辑模式
- **ABC 记谱法编辑器**：实时预览乐谱渲染效果
- **点击定位**：点击音符自动定位源码位置
- **曲谱保存**：将创作的曲谱保存到本地曲库
- **曲库管理**：支持导入/导出曲谱（JSON 格式）
- **本地存储**：使用 IndexedDB 持久化存储用户曲谱

### 🎹 演练模式
- **双模式切换**：播放模式 / 练习模式
- **音色选择**：支持多种乐器音色
- **速度调节**：BPM 40-200 可调
- **实时音高检测**：麦克风录音检测演奏音准
- **练习报告**：每次练习后自动生成评分
- **历史记录**：自动保存最近 50 条练习记录，支持查看和清空

### 🎮 游戏模式
- **音乐节奏大师**：类似节奏游戏的演奏挑战
- **双模式**：自由模式（随机音符）/ 曲谱模式（ABC 曲谱）
- **速度调节**：音符下落速度可调
- **连击系统**：连续命中获得连击加分
- **实时反馈**：PERFECT/MISS 判定反馈
- **游戏记录**：自动保存最近 50 条游戏记录

### 📚 曲库功能
- **预设曲库**：内置 10 首经典流行歌曲
  - 穿越时空的爱恋（张信哲）
  - 我们的时光（赵雷）
  - 骑在银龙背上（中岛美雪）
  - 烟花易冷（周杰伦）
  - 滚滚红尘（陈淑桦）
  - 月亮代表我的心（邓丽君）
  - 童年（罗大佑）
  - 后来（刘若英）
  - 平凡之路（朴树）
  - 小幸运（田馥甄）
- **用户曲谱**：支持保存个人创作的曲谱
- **搜索功能**：按曲名或歌手搜索
- **难度标签**：简单/中等/困难分级
- **数据备份**：支持导出/导入曲谱数据

## 🚀 快速开始

### 环境要求
- Node.js >= 16
- pnpm >= 8

### 安装依赖
```bash
pnpm install
```

### 开发模式
```bash
pnpm run dev
```

### 构建生产版本
```bash
pnpm run build
```

### 预览生产构建
```bash
pnpm run preview
```

### 运行测试
```bash
pnpm run test
```

### 代码检查
```bash
pnpm run lint
```

## 📁 项目结构

```
music-app/
├── src/
│   ├── components/          # React 组件
│   │   ├── EditorModule.tsx     # 编辑模式
│   │   ├── PerformanceModule.tsx # 演练模式
│   │   ├── GameModule.tsx       # 游戏模式
│   │   └── instruments.ts       # 乐器音色配置
│   ├── data/                # 数据文件
│   │   └── songLibrary.ts   # 预设曲库
│   ├── db/                  # 数据库服务
│   │   └── musicDb.ts       # IndexedDB 操作
│   ├── hooks/               # 自定义 Hooks
│   │   └── useMusicPractice.ts
│   ├── utils/               # 工具函数
│   │   ├── pitchService.ts  # 音高检测
│   │   └── logger.ts        # 日志工具
│   ├── styles/              # 样式文件
│   │   ├── global.css       # 全局样式
│   │   └── App.css          # 应用样式
│   ├── test/                # 测试配置
│   │   └── setup.ts         # 测试初始化
│   ├── App.tsx              # 主应用组件
│   └── main.tsx             # 入口文件
├── dist/                    # 构建产物
├── index.html               # HTML 模板
├── package.json             # 项目配置
├── vite.config.ts           # Vite 配置
├── vitest.config.ts         # 测试配置
├── tsconfig.json            # TypeScript 配置
└── tailwind.config.js       # TailwindCSS 配置
```

## 🎯 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **UI 组件库**: Ant Design 6
- **样式方案**: TailwindCSS 3
- **乐谱渲染**: ABCJS
- **音频处理**: Web Audio API
- **音高检测**: YIN 算法
- **本地存储**: IndexedDB
- **测试框架**: Vitest + React Testing Library

## 🎵 ABC 记谱法简介

ABC 记谱法是一种用 ASCII 字符表示音乐的方法，适合文本编辑和分享。

### 基本语法示例
```abc
X:1          % 曲谱编号
T:曲名        % 曲名
M:4/4        % 拍号
L:1/8        % 默认音符长度
K:C          % 调号
CDEF GABc | cBAG FEDC |
```

### 常用符号
- `C D E F G A B` - 基本音符
- `c d e f g a b` - 高八度音符
- `,` - 低八度
- `^` - 升号
- `_` - 降号
- `z` - 休止符
- `|` - 小节线

## 📊 测试覆盖

项目包含 100+ 个测试用例，覆盖核心功能：

- ✅ 数据库操作测试（14 个）
- ✅ 导入导出功能测试（15 个）
- ✅ 预设曲库数据测试（20 个）
- ✅ 编辑器组件测试（11 个）
- ✅ 音高检测服务测试（24 个）
- ✅ 练习 Hook 测试（11 个）
- ✅ 日志工具测试（14 个）

运行测试并查看覆盖率：
```bash
pnpm run test:coverage
```

## 🔧 配置说明

### 乐器音色
支持 GM 标准音色库，常用音色：
- 0: Acoustic Grand Piano
- 24: Acoustic Guitar
- 32: Acoustic Bass
- 40: Violin
- 56: Trumpet
- 73: Flute

### 浏览器兼容性
- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

### 麦克风权限
演练模式的练习功能需要麦克风权限用于音准检测。

## 📝 更新日志

### v1.0.0
- ✨ 新增曲库功能（预设 + 用户曲谱）
- ✨ 新增练习/游戏历史记录功能
- ✨ 新增曲谱导入导出功能
- 🎨 更新全局样式（Ant Design 设计语言）
- 🧪 新增 49 个测试用例
- 🐛 修复多个废弃属性警告

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [ABCJS](https://github.com/paulrosen/abcjs) - 乐谱渲染库
- [Ant Design](https://ant.design/) - UI 组件库
- [Vite](https://vitejs.dev/) - 构建工具

## 📮 联系方式

如有问题或建议，请提交 Issue 或联系维护者。

---

**享受音乐学习的乐趣！** 🎶
