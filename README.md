# 🎵 音乐学习助手 - Music Learning Assistant

一个功能完整的音乐学习和演奏辅助应用，支持简谱OCR识别、五线谱编辑、MIDI播放和实时音准检测。

## ✨ 核心功能

- **✅ OCR识别简谱** - 使用 Tesseract.js 识别图片中的简谱并转换为ABC格式
- **✅ 五线谱专业渲染** - 使用 ABCjs 渲染精美的五线谱
- **✅ 五线谱可编辑** - 直接编辑ABC格式，实时更新五线谱
- **✅ 口琴音色MIDI播放** - Tone.js 提供逼真的口琴音色合成与播放
- **✅ 音符高亮** - 播放时音符动态高亮显示
- **✅ 实时音准检测** - Web Audio API 实时检测和分析音高准确度
- **✅ 演奏反馈** - 实时显示检测到的音高和准确度百分比
- **✅ 优雅的渐变UI** - 现代化的紫粉色渐变设计，流畅的动画效果

## 🛠 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **包管理**: pnpm
- **音乐库**:
  - [Tone.js](https://tonejs.org/) - 音频合成与播放
  - [ABCjs](https://abcjs.net/) - 五线谱渲染
  - [Tesseract.js](https://tesseract.projectnaptha.com/) - 图片OCR识别
- **Web API**:
  - Web Audio API - 音频处理与分析
  - Media Devices API - 麦克风访问

## 📦 安装

```bash
# 克隆项目
cd music-app

# 安装依赖（使用pnpm）
pnpm install
```

## 🚀 开发

```bash
# 启动开发服务器 (http://localhost:5173)
pnpm dev
```

## 🏗 构建

```bash
# 生产构建
pnpm build

# 预览构建结果
pnpm preview
```

## 📁 项目结构

```
music-app/
├── src/
│   ├── modules/
│   │   ├── OCRModule.tsx        # 简谱OCR识别模块
│   │   ├── SheetRenderer.tsx    # 五线谱渲染器
│   │   ├── SheetEditor.tsx      # 五线谱编辑器
│   │   ├── MIDIPlayer.tsx       # MIDI播放器（口琴音色）
│   │   └── PitchDetection.tsx   # 音准检测模块
│   ├── styles/
│   │   ├── global.css           # 全局样式
│   │   ├── App.css              # 应用主要样式
│   │   └── modules.css          # 模块样式
│   ├── App.tsx                  # 主应用组件
│   └── main.tsx                 # 入口文件
├── public/                      # 静态资源
├── index.html                   # HTML模板
├── package.json                 # 项目配置
├── vite.config.ts               # Vite配置
└── tsconfig.json                # TypeScript配置
```

## 🎯 使用说明

### 1. 简谱识别
- 点击"📤 上传简谱图片"按钮
- 选择包含简谱的图片文件
- 系统将自动识别并转换为五线谱

### 2. 编辑五线谱
- 点击"✏️ 编辑ABC记谱"按钮
- 直接编辑ABC格式的乐谱
- 点击"💾 保存"更新五线谱

### 3. 播放音乐
- 点击"▶️ 播放"按钮开始演奏
- 点击"⏹️ 停止"按钮停止播放
- 系统使用口琴音色进行合成

### 4. 检测音准
- 点击"🎙️ 开始检测"激活麦克风
- 唱出或吹出音符
- 系统实时显示检测到的音高和准确度
- 点击"🛑 停止检测"结束检测

## 📝 ABC记谱法简介

- `1-7` - 音符（Do到Si）
- `z` - 休止符
- `C D E F G A B` - 高音（大写字母）
- `#` - 升号（如 C#）
- `b` - 降号（如 Bb）
- `/` - 缩短时值（如 C/2 为半音符）
- `|` - 小节线

## 🎨 界面设计特点

- 优雅的紫粉色渐变背景（#667eea → #764ba2 → #f093fb）
- 毛玻璃效果（Glassmorphism）的卡片设计
- 流畅的进入和交互动画
- 响应式布局，支持桌面端和平板
- 高对比度的文本和按钮，便于使用

## 🔊 音频特性

- **Tone.js合成器**: 使用三角波模拟口琴音色
- **实时音准检测**: 50Hz-2000Hz频率范围
- **频率分析**: FFT算法进行基频检测
- **准确度评分**: 基于目标音高的偏差计算

## 🌐 浏览器兼容性

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- 需要支持 Web Audio API 和 Media Devices API

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**提示**: 使用麦克风进行音准检测时，浏览器可能会请求权限。请允许访问麦克风以使用此功能。
