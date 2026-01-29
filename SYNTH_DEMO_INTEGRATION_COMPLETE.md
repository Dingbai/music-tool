# 🎵 abcjs Synth Demo 完整 React 集成总结

## 📋 概述

已成功将官方 abcjs Synth Demo HTML 示例的所有功能完全转换为 React 组件，集成到 `SheetEditor.tsx` 中，同时完全保留了原有的 ABC 记谱编辑功能。

## ✅ 集成完成的功能

### 1. **核心 Synth Demo 功能**
- ✅ **CursorControl（光标控制）** - 实时播放位置追踪
  - 自动生成 SVG 竖线光标
  - 随播放位置动态更新
  - 播放结束自动隐藏

- ✅ **SynthController（音频控制器）** - 完整播放控制
  - 播放/暂停功能
  - 进度条拖拽
  - 速度调节（Warp）
  - 重新开始按钮

- ✅ **Note Clicking（音符点击）** - 交互式音符播放
  - 点击音符立即播放
  - 显示 MIDI 音高信息
  - 显示恩格和装饰音
  - 自动同步编辑器光标

- ✅ **Real-time Rendering（实时渲染）** - 动态五线谱更新
  - 自动生成 SVG 乐谱
  - 点击高亮显示
  - 拖拽修改音符

### 2. **编辑功能（原有保留）**
- ✅ **ABC Text Editor（文本编辑）**
  - 完整的代码编辑器
  - 语法高亮
  - 撤销/重做

- ✅ **Drag-to-Edit（拖拽编辑）**
  - 在五线谱上直接拖拽修改音符高度
  - 源代码自动更新

- ✅ **Editor Cursor Sync（光标同步）**
  - 编辑器光标和五线谱同步
  - 点击乐谱自动跳转编辑位置

### 3. **反馈显示**
- ✅ **Beat Information（节拍信息）**
  - 实时显示当前节拍
  - 显示总拍数和时间

- ✅ **Clicked Note Panel（音符信息）**
  - MIDI 音高数据
  - 当前轨道毫秒/全音符
  - 装饰音信息

- ✅ **Feedback Panel（播放反馈）**
  - 实时播放事件数据
  - 高亮元素信息

## 🏗️ 技术实现细节

### SheetEditor.tsx 结构

```typescript
// 核心引用
const cursorControlRef = useRef<any>(null)      // CursorControl 配置
const synthControlRef = useRef<any>(null)       // SynthController 实例
const editorRef = useRef<any>(null)             // abcjs.Editor 实例
const textareaRef = useRef<HTMLTextAreaElement>(null)

// 初始化函数
initCursorControl()                             // 设置光标回调
initSynthControl()                              // 创建 SynthController
setTune()                                       // 加载乐谱到音频引擎

// 事件处理
handleClickListener()                           // 音符点击回调
handleModelChanged()                            // 拖拽编辑回调
```

### 双向绑定架构

```
编辑器中修改源码 → onEdit 回调 → App.tsx 更新状态
                                ↓
App.tsx 状态变化 → SheetEditor 重新渲染 → 五线谱更新

点击五线谱音符 → handleClickListener → 更新编辑器光标位置
拖拽修改音符 → handleModelChanged → 源码自动更新
```

### State 管理

```typescript
isEditing                  // 编辑/预览模式切换
editText                   // 当前 ABC 代码
selectedRange             // 编辑器选中范围
currentBeat               // 实时节拍信息
clickedInfo               // 点击音符的 MIDI 信息
feedbackInfo              // 播放事件反馈
```

## 🎨 UI 布局

### 编辑模式（`editor-mode-full`）
```
┌─────────────────────────────────────────┐
│       左侧编辑区        │    右侧播放区  │
├─────────────────────────┼────────────────┤
│                         │                │
│  • ABC 文本编辑器       │  • 播放控制    │
│  • 保存/取消按钮        │  • 五线谱预览  │
│  • 添加歌词按钮         │  • 节拍信息    │
│  • 编辑提示说明         │  • 音符信息    │
│                         │  • 反馈信息    │
│                         │                │
└─────────────────────────┴────────────────┘
```

### CSS 类映射

| 类名 | 用途 |
|-----|------|
| `.editor-mode-full` | 整体编辑模式容器 |
| `.editor-container-full` | 2列网格布局 |
| `.editor-left-panel` | 左侧编辑面板 |
| `.editor-right-panel` | 右侧播放面板 |
| `.editor-textarea` | ABC 代码编辑区 |
| `.editor-audio-controls` | 音频控制按钮组 |
| `.abcjs-cursor` | 播放位置光标线 |
| `.highlight` | 音符高亮样式 |
| `.beat-info` | 节拍显示 |
| `.clicked-info-panel` | 点击音符信息 |
| `.feedback-panel` | 播放反馈信息 |

## 🔧 初始化流程

```
useEffect (第一次) →
  ├─ initCursorControl()  // 配置光标回调
  ├─ initSynthControl()   // 创建 SynthController
  └─ new abcjs.Editor()   // 初始化文本编辑器
        ├─ clickListener: handleClickListener
        └─ modelChanged: handleModelChanged

onClick "重新加载乐谱" →
  └─ setTune()
      ├─ renderAbc('editor-paper', editText)
      └─ CreateSynth.init() + SynthController.setTune()
```

## 📊 事件流

### 播放流程
```
SynthController.play() →
  └─ onEvent (from CursorControl)
      ├─ 添加 .highlight 类到音符
      ├─ 移动 SVG 光标
      ├─ 更新 currentBeat
      └─ 更新 feedbackInfo
```

### 点击流程
```
用户点击五线谱 →
  └─ handleClickListener()
      ├─ 更新编辑器光标位置
      ├─ 显示 MIDI 信息 (clickedInfo)
      ├─ 使用 abcjs.synth.playEvent() 播放
      └─ 调用 onNoteSelected 回调
```

### 编辑流程
```
用户拖拽修改音符 →
  └─ handleModelChanged()
      ├─ 更新 editText
      └─ 调用 onEdit(editText) 传回 App
```

## 🚀 关键实现代码片段

### CursorControl 初始化
```typescript
const initCursorControl = () => {
  cursorControlRef.current = {
    onStart: () => { /* 创建 SVG 光标 */ },
    onBeat: (beatNumber, totalBeats) => { /* 更新节拍显示 */ },
    onEvent: (ev) => { /* 移动光标，添加高亮 */ },
    onFinished: () => { /* 隐藏光标和高亮 */ },
    beatSubdivisions: 2
  }
}
```

### SynthController 初始化
```typescript
const initSynthControl = () => {
  synthControlRef.current = new abcjs.synth.SynthController()
  synthControlRef.current.load('#editor-audio', cursorControlRef.current, {
    displayRestart: true,
    displayPlay: true,
    displayProgress: true,
    displayWarp: true,
  })
}
```

### 音符点击处理
```typescript
const handleClickListener = (abcElem, tuneNumber, classes, analysis, drag) => {
  // 1. 同步编辑器光标
  textareaRef.current?.setSelectionRange(abcElem.startChar, abcElem.endChar)
  
  // 2. 显示 MIDI 信息
  setClickedInfo(`midiPitches: ${JSON.stringify(abcElem.midiPitches)}`)
  
  // 3. 播放音符
  abcjs.synth.playEvent(
    abcElem.midiPitches,
    abcElem.midiGraceNotePitches,
    synthControlRef.current.visualObj.millisecondsPerMeasure()
  )
}
```

## 🔌 Props 接口

```typescript
interface SheetEditorProps {
  abcNotation: string              // 当前 ABC 代码
  onEdit: (abc: string) => void   // 编辑回调
  onNoteSelected?: (abcElem: any) => void  // 音符选中回调
}
```

## 📱 响应式设计

- **桌面 (1024px+)**: 双列布局 (编辑 | 播放)
- **平板 (768px-1023px)**: 单列布局，栈式排列
- **手机 (<768px)**: 单列、缩小字体、最小化高度

## 🧪 测试项目

```
✅ 加载应用，进入编辑模式
✅ 在左侧编辑器修改 ABC 代码
✅ 点击"重新加载乐谱"更新五线谱
✅ 点击"播放"按钮，观察光标和高亮动画
✅ 点击五线谱上的音符，验证：
   - 编辑器光标跳转
   - MIDI 信息显示
   - 音符立即播放
✅ 拖拽五线谱上的音符修改音高
✅ 验证源码自动更新
✅ 使用进度条快进/快退
✅ 调节播放速度（Warp）
```

## 📚 文件清单

| 文件 | 行数 | 修改内容 |
|-----|------|--------|
| `src/modules/SheetEditor.tsx` | 381 | 完整重写，集成 Synth Demo |
| `src/styles/modules.css` | 770+ | 新增 70+ CSS 规则 |
| `src/App.tsx` | 92 | Props 更新 |

## 🎯 总结

✨ **此次集成的成就：**
- 官方 Synth Demo 的所有功能已转换为 React Hooks 组件
- 完美保留了原有的 ABC 文本编辑功能
- 实现了编辑器光标与五线谱的实时同步
- 提供了完整的播放控制和实时反馈显示
- 代码组织清晰，易于维护和扩展

✨ **可用功能：**
- 📝 完整的 ABC 记谱法编辑
- 🎵 实时 MIDI 音乐合成与播放
- 🎼 动态五线谱可视化
- 🖱️ 交互式音符点击和拖拽
- 📊 实时反馈和播放信息
- 🎨 美观的 Tailwind CSS 样式

---

**集成完成日期**: 2024
**技术栈**: React 18 + TypeScript + abcjs 6.2.3 + Tailwind CSS
