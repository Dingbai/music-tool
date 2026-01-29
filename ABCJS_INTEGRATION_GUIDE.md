# abcjs 五线谱应用集成指南

本指南说明如何使用新的五线谱渲染、编辑和控制器功能，实现"实时同步、双向关联、可视化编辑"的完整五线谱应用。

## 📋 核心功能概述

### 1. 实时同步播放进度 (MIDI Sync) - SheetRenderer.tsx
使用 `abcjs.TimingCallbacks` 实现音符随播放进度高亮。

**特性：**
- ✅ 播放时自动高亮当前音符（`.abcjs-highlight` 类）
- ✅ 音符点击监听（`clickListener`）
- ✅ 实时同步进度条

**使用示例：**
```tsx
<SheetRenderer 
  abcNotation={abcNotation}
  onNoteClick={(abcElem, tuneNumber) => {
    console.log('选中音符:', abcElem.startChar, abcElem.endChar)
  }}
/>
```

---

### 2. 可视化播放器控制 (Synth Controller) - SheetController.tsx
使用 `abcjs.synth.SynthController` 提供可视化的播放控制界面。

**特性：**
- 🎹 播放/暂停按钮
- ⏱️ 进度条拖拽
- ⚡ 语速调节（Warp）
- 🔄 重新开始按钮

**使用示例：**
```tsx
<SheetController 
  visualObj={visualObj}
  abcNotation={abcNotation}
/>
```

---

### 3. 编辑器双向关联与拖拽 (Editor & Interaction) - SheetEditor.tsx
使用 `abcjs.Editor` 实现完整的交互式编辑功能。

**特性：**
- 🖱️ 点击五线谱音符 → 编辑器光标自动定位
- 🎯 拖拽音符直接修改音高
- 🔄 源码自动更新
- 📝 双向同步编辑

**使用示例：**
```tsx
<SheetEditor 
  abcNotation={abcNotation}
  onEdit={handleSheetEdited}
  onNoteSelected={(abcElem) => {
    console.log('选中的音符:', abcElem)
  }}
/>
```

---

## 🎨 CSS 样式类

### 高亮样式

```css
/* 播放时的音符高亮 */
.abcjs-highlight {
  fill: #ff0000 !important;
  filter: brightness(1.2) drop-shadow(0 0 8px #ff6b6b);
  animation: play-highlight 0.4s ease;
}

/* 音符悬停效果 */
.abcjs-note:hover {
  fill: #0000ff !important;
  cursor: pointer;
  filter: brightness(1.3);
}
```

---

## 🔧 完整集成示例

在 `App.tsx` 中集成所有功能：

```tsx
import React, { useState, useRef } from 'react'
import SheetRenderer from './modules/SheetRenderer'
import SheetController from './modules/SheetController'
import SheetEditor from './modules/SheetEditor'

function App() {
  const [abcNotation, setAbcNotation] = useState('X:1\nK:C\nC D E F|')
  const visualObjRef = useRef<any>(null)

  const handleNoteClick = (abcElem: any) => {
    console.log('音符范围:', abcElem.startChar, abcElem.endChar)
  }

  const handleSheetEdited = (newAbc: string) => {
    setAbcNotation(newAbc)
  }

  return (
    <div className="app">
      <section>
        <h2>五线谱编辑</h2>
        <SheetEditor 
          abcNotation={abcNotation}
          onEdit={handleSheetEdited}
          onNoteSelected={handleNoteClick}
        />
      </section>

      <section>
        <h2>五线谱渲染</h2>
        <SheetRenderer 
          abcNotation={abcNotation}
          onNoteClick={handleNoteClick}
        />
      </section>

      <section>
        <h2>播放控制</h2>
        <SheetController 
          visualObj={visualObjRef.current}
          abcNotation={abcNotation}
        />
      </section>
    </div>
  )
}

export default App
```

---

## 📝 配置说明

### SheetRenderer 配置选项

```tsx
const options = {
  responsive: 'resize',      // 响应式渲染
  staffwidth: 900,           // 五线谱宽度
  scale: 1.2,                // 缩放比例
  add_classes: true,         // 必须开启，用于 CSS 控制
  clickListener: handleClick, // 点击监听
  wrap: {
    minSpacing: 1.8,
    maxSpacing: 2.7,
    preferredMeasuresPerLine: 4,
  },
}
```

### SheetController 配置选项

```tsx
synthControl.load('#audio-controls', null, {
  displayRestart: true,   // 显示重新开始按钮
  displayPlay: true,      // 显示播放/暂停
  displayProgress: true,  // 显示进度条
  displayWarp: true,      // 显示速度调节
})
```

---

## 🎯 使用流程

```
用户输入/上传乐谱
        ↓
OCRModule (识别简谱)
        ↓
SheetEditor (编辑ABC记谱)
        ↓
SheetRenderer (渲染五线谱)
        ├─ 点击音符 → clickListener 回调
        ├─ 拖拽音符 → modelChanged 回调
        └─ 渲染完成 → 返回 visualObj
        ↓
SheetController (播放控制)
        ├─ 初始化 SynthController
        ├─ 绑定 visualObj
        └─ 播放时 → TimingCallbacks 高亮音符
        ↓
实时同步显示
```

---

## 🚀 高级功能

### 1. 获取 VisualObj（用于外部播放控制）

```tsx
// 在 SheetRenderer 中暴露的方法
const visualObj = (window as any).sheetRendererMethods?.getVisualObj()
```

### 2. 自定义高亮样式

修改 `src/styles/modules.css` 中的 `.abcjs-highlight` 类：

```css
.abcjs-highlight {
  fill: #your-color !important;
  filter: your-filter;
  animation: your-animation;
}
```

### 3. 监听播放状态

在 SheetController 中的 `observer` 可以监听播放状态变化：

```tsx
const observer = new MutationObserver(() => {
  // 在此处处理播放状态变化
})
```

---

## ⚠️ 常见问题

### Q: 高亮不显示？
A: 确保在 `renderAbc` 时设置 `add_classes: true`

### Q: 点击音符没有反应？
A: 检查 `clickListener` 是否正确绑定，并检查浏览器控制台是否有错误

### Q: 拖拽修改无效？
A: 确保在编辑模式下，并检查 `abcjs.Editor` 是否正确初始化

### Q: 播放器不显示？
A: 检查 `#audio-controls` 容器是否存在，且确保 `visualObj` 已正确获取

---

## 📚 相关资源

- [abcjs 官方文档](https://abcjs.net/)
- [ABC 记谱法参考](https://abcnotation.com/)
- [项目仓库](https://github.com/yourusername/music-app)

---

## 🔄 版本信息

- abcjs: ^6.2.3
- React: ^18.2.0
- TypeScript: ^5.3.3

最后更新: 2026-01-28
