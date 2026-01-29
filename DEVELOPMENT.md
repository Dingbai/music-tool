# 🎵 音乐学习助手 - 开发文档

## 项目架构

### 组件结构
```
App (主应用)
├── OCRModule        # 简谱OCR识别模块
├── SheetRenderer    # 五线谱渲染模块
├── SheetEditor      # 五线谱编辑模块
├── MIDIPlayer       # MIDI播放器
└── PitchDetection   # 音准检测模块
```

### 数据流
```
OCRModule
    ↓
   ABC格式
    ↓
SheetRenderer + SheetEditor + MIDIPlayer
    ↓
用户交互反馈
```

## 核心模块详解

### 1. OCRModule (src/modules/OCRModule.tsx)

**功能**:
- 接收图片文件
- 使用Tesseract.js进行OCR识别
- 将识别的简谱转换为ABC格式

**主要函数**:
- `convertSimplifyToABC()`: 将简谱数字转换为ABC格式
- `handleFileUpload()`: 处理文件上传和OCR识别

**技术栈**:
- Tesseract.js v5.1.1
- React File Input API

### 2. SheetRenderer (src/modules/SheetRenderer.tsx)

**功能**:
- 接收ABC格式乐谱
- 使用ABCjs渲染五线谱
- 支持音符高亮显示

**主要函数**:
- `abcjs.renderAbc()`: 渲染五线谱

**配置参数**:
```javascript
{
  responsive: 'resize',   // 响应式调整
  staffwidth: 700,        // 五线谱宽度
  scale: 1.2,            // 缩放比例
}
```

**技术栈**:
- ABCjs v6.6.0
- SVG渲染

### 3. SheetEditor (src/modules/SheetEditor.tsx)

**功能**:
- 显示当前ABC格式
- 提供编辑界面
- 实时验证ABC格式

**编辑模式**:
- Preview Mode: 显示ABC代码
- Edit Mode: 编辑ABC代码

**技术栈**:
- React State管理
- Textarea元素

### 4. MIDIPlayer (src/modules/MIDIPlayer.tsx)

**功能**:
- 解析ABC格式提取音符信息
- 使用Tone.js合成音频
- 支持播放/停止控制

**主要函数**:
- `parseABCNotes()`: 解析ABC格式获取音符列表
- `playNotes()`: 顺序播放音符
- `noteToMIDI`: 音符映射表

**音色设置**:
```javascript
new Tone.Synth({
  oscillator: { type: 'triangle' },  // 三角波模拟口琴
  envelope: {
    attack: 0.005,
    decay: 0.3,
    sustain: 0.3,
    release: 0.1,
  }
})
```

**技术栈**:
- Tone.js v14.9.17
- Web Audio API

### 5. PitchDetection (src/modules/PitchDetection.tsx)

**功能**:
- 捕获麦克风音频流
- 进行频率分析
- 检测基频并计算准确度

**主要函数**:
- `startListening()`: 启动麦克风和音频分析
- `detectPitch()`: 使用FFT检测基频
- `frequencyToNote()`: 转换频率为音符名称

**算法**:
- FFT (快速傅里叶变换) 进行频率分析
- 寻找最大幅度的频率
- 基于目标音高计算准确度

**技术栈**:
- Web Audio API (AnalyserNode)
- getUserMedia API
- 频率分析算法

## 样式系统

### 颜色方案
```css
Primary:   #667eea (紫色)
Secondary: #764ba2 (深紫)
Accent:    #f093fb (粉色)
Success:   #11998e → #38ef7d (青绿)
Danger:    #eb3349 → #f45c43 (红色)
```

### 响应式设计
- Desktop: 2列网格
- Tablet: 1列布局
- Mobile: 堆栈式布局

### 动画和过渡
```css
Fade: 0.8s ease
Slide: 0.6s ease
Pulse: 1.5s infinite (监听指示器)
```

## API和外部依赖

### Tone.js API
```javascript
await Tone.start()              // 初始化音频上下文
Tone.Synth                      // 合成器
Tone.Transport                  // 播放控制
Tone.Midi(midiNote).toFrequency() // 音符转频率
```

### ABCjs API
```javascript
abcjs.renderAbc(
  'container-id',
  'abc-notation-string',
  { options }
)
```

### Tesseract.js API
```javascript
Tesseract.recognize(
  file,
  'eng',
  { logger: (progress) => {} }
)
```

### Web Audio API
```javascript
navigator.mediaDevices.getUserMedia()
audioContext.createAnalyser()
analyserNode.getByteFrequencyData()
```

## 配置和环境变量

### 可配置参数
```javascript
// 音频参数
const SAMPLE_RATE = 44100
const FFT_SIZE = 4096

// 频率范围
const MIN_FREQ = 50
const MAX_FREQ = 2000

// 口琴音色参数
const HARMONICA_SETTINGS = {
  instrument: 22,
  velocity: 100,
}
```

## 性能优化

1. **React优化**:
   - 使用`useRef`缓存非状态值
   - 使用`forwardRef`进行组件通信

2. **音频优化**:
   - FFT缓冲区大小：4096（精度vs性能平衡）
   - 合成器使用三角波（计算量小）

3. **渲染优化**:
   - SVG渲染（缩放无损）
   - 响应式宽度适应

## 浏览器兼容性检查

```javascript
// 检查必需API
const hasWebAudio = !!window.AudioContext || !!window.webkitAudioContext
const hasMediaDevices = !!navigator.mediaDevices
const hasCanvas = !!document.createElement('canvas').getContext
```

## 常见问题解决

### OCR识别准确度低
- 原因：图片质量差、光线不足、倾斜角度大
- 解决：改进图片质量，使用清晰的黑白图

### 音频播放无声
- 原因：浏览器音量静音、系统音量低、权限问题
- 解决：检查所有音量设置，允许音频播放权限

### 音准检测不准
- 原因：背景噪音、麦克风质量差、音源不稳定
- 解决：使用清晰的音源，在安静环境中测试

## 扩展功能建议

1. **录音功能**:
   - 添加录音和回放功能
   - 对比实际演奏和标准演奏

2. **高级OCR**:
   - 支持多种简谱格式
   - 识别歌词和节奏标记

3. **进度跟踪**:
   - 保存练习记录
   - 统计学习进度

4. **多种音色**:
   - 提供不同乐器音色
   - 支持和弦演奏

5. **网络功能**:
   - 乐谱共享
   - 在线练习课程

## 部署

### 生产构建
```bash
pnpm build
```

### 输出
- 位置: `dist/`
- 大小: ~500KB (gzipped)
- 兼容: 所有现代浏览器

### 部署到Netlify/Vercel
```bash
# 连接Git仓库后自动部署
# 或手动部署
netlify deploy --prod --dir=dist
```

---

**最后更新**: 2026年1月27日
