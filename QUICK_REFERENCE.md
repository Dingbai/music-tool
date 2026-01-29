# ⚡ Synth Demo React 集成 - 快速参考

## 🚀 快速开始

```bash
# 1. 启动开发服务器
pnpm dev

# 2. 打开浏览器
http://localhost:5174

# 3. 点击 "编辑ABC记谱" 进入编辑模式
```

---

## 🎯 核心功能速查表

| 功能 | 触发方式 | 结果 |
|------|---------|------|
| **进入编辑模式** | 点击 "✏️ 编辑ABC记谱" | 显示双列编辑/播放界面 |
| **保存更改** | 点击 "💾 保存" | 关闭编辑模式，保存内容 |
| **重新加载乐谱** | 点击 "🔄 重新加载乐谱" | 更新 SVG 五线谱 |
| **播放音乐** | 点击播放按钮 | 光标动画，音符高亮 |
| **暂停播放** | 点击暂停按钮 | 停止播放，光标停止 |
| **调节速度** | 拖拽 Warp 滑块 | 改变播放速度 |
| **点击音符播放** | 点击五线谱音符 | 播放音符，显示 MIDI 信息 |
| **拖拽修改音高** | 拖拽五线谱音符 | ABC 代码自动更新 |
| **添加歌词** | 点击 "🎵 添加歌词" | 在代码末尾插入歌词模板 |

---

## 📁 文件位置速查

```
src/
├── modules/
│   ├── SheetEditor.tsx          ⭐ 主要组件 (381 行)
│   ├── SheetRenderer.tsx        (五线谱渲染)
│   └── SheetController.tsx      (独立播放器)
├── styles/
│   └── modules.css              ⭐ 所有样式 (770+ 行)
└── App.tsx                      ⭐ 主应用 (92 行)
```

---

## 🔧 SheetEditor 组件 Props

```typescript
interface SheetEditorProps {
  abcNotation: string
  onEdit: (abc: string) => void
  onNoteSelected?: (abcElem: any) => void
}
```

**使用示例**：
```tsx
<SheetEditor
  abcNotation={currentABC}
  onEdit={handleABCChange}
  onNoteSelected={handleNoteClick}
/>
```

---

## 🎨 CSS 类名参考

### 容器和布局
```css
.sheet-editor              /* 主容器 */
.editor-mode-full          /* 编辑模式 */
.editor-container-full     /* 双列网格 */
.editor-left-panel         /* 左侧编辑面板 */
.editor-right-panel        /* 右侧播放面板 */
```

### 编辑器元素
```css
.editor-textarea           /* ABC 代码编辑区 */
.editor-buttons            /* 按钮组 */
.selection-info            /* 光标位置信息 */
.editor-hint               /* 编辑提示文本 */
```

### 播放控制
```css
.editor-audio-controls     /* 播放控制按钮组 */
.editor-paper              /* SVG 乐谱容器 */
.beat-info                 /* 节拍显示 */
```

### 反馈面板
```css
.clicked-info-panel        /* 点击音符信息 */
.feedback-panel            /* 播放事件反馈 */
.audio-error               /* 音频不支持提示 */
```

### SVG 样式
```css
.abcjs-cursor              /* 播放位置光标线 */
.highlight                 /* 音符高亮 */
```

---

## 🔌 关键 API 调用

### 初始化音频控制
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

### 加载乐谱
```typescript
const setTune = () => {
  const visualObj = abcjs.renderAbc('editor-paper', editText, {
    responsive: 'resize',
    add_classes: true,
    clickListener: handleClickListener,
    dragging: true,
  })[0]
  
  const midiBuffer = new abcjs.synth.CreateSynth()
  midiBuffer.init({ visualObj }).then(() => {
    synthControlRef.current.setTune(visualObj, false)
  })
}
```

### 播放单个音符
```typescript
abcjs.synth.playEvent(
  abcElem.midiPitches,
  abcElem.midiGraceNotePitches,
  synthControlRef.current.visualObj.millisecondsPerMeasure()
)
```

---

## 🎵 ABC 记谱法速查

```abc
% 基本格式
X: 1                    % 乐曲编号
T: 乐曲名称            % 标题
M: 4/4                  % 拍子
L: 1/4                  % 默认音符长度
K: C                    % 调号

% 音符表示
A B C D E F G           % 中音区（c5）
a b c d e f g           % 高音区（c6）
A, B, C, D, E, F, G,   % 低音区（c4）

% 音符长度
C   = 四分音符 (L: 1/4)
C2  = 二分音符
C/  = 八分音符
C/2 = 十六分音符
C3  = 附点四分音符
C4  = 全音符

% 升降号
C#  = C升
Cb  = C降
C^  = C升
C_  = C降

% 其他符号
z   = 休止符
|   = 小节线
||  = 双小节线
]   = 结束线
(AB)  = 连音符
```

---

## 📊 State 变量说明

| 变量 | 类型 | 用途 |
|-----|------|------|
| `isEditing` | boolean | 是否在编辑模式 |
| `editText` | string | 当前 ABC 代码 |
| `selectedRange` | {start, end} | 编辑器选中范围 |
| `currentBeat` | string | 实时节拍信息 |
| `clickedInfo` | string | 点击音符的 MIDI 数据 |
| `feedbackInfo` | string | 播放事件反馈 |
| `isAudioSupported` | boolean | 浏览器是否支持音频 |

---

## 🐛 常见问题排查

### 问题：播放不出声音
```
❌ 检查清单：
1. 检查浏览器音量
2. 检查浏览器是否支持 Web Audio API
3. 检查控制台是否有错误
4. 尝试点击"重新加载乐谱"
✅ 解决：刷新页面，重新进入编辑模式
```

### 问题：五线谱不显示
```
❌ 检查清单：
1. ABC 代码格式是否正确
2. 是否点击了"重新加载乐谱"
3. 右侧面板是否有空间显示
✅ 解决：检查 ABC 语法，确保至少包含 K: 行
```

### 问题：编辑后乐谱未更新
```
❌ 检查清单：
1. 是否点击了"保存"按钮
2. 是否退出了编辑模式
✅ 解决：确认编辑内容已保存
```

### 问题：点击音符无反应
```
❌ 检查清单：
1. 是否已加载乐谱（点击"重新加载乐谱"）
2. 五线谱是否正确显示
3. 浏览器控制台是否有错误
✅ 解决：重新加载乐谱，刷新页面
```

---

## 🌐 浏览器要求

| 功能 | 需求 |
|-----|------|
| **编辑功能** | 所有现代浏览器 |
| **五线谱显示** | 需要 SVG 支持 (所有现代浏览器) |
| **音频播放** | 需要 Web Audio API (Chrome, Firefox, Safari, Edge) |
| **实时渲染** | 需要 ES6+ (所有现代浏览器) |

**建议**：使用最新版本的 Chrome、Firefox、Safari 或 Edge

---

## 📈 性能优化建议

```typescript
// 1. 避免频繁重新加载乐谱
// ❌ 不好：每次状态变化都重新加载
useEffect(() => {
  setTune()  // 调用太频繁
}, [editText])

// ✅ 好：仅在用户点击时加载
const handleReloadTune = () => {
  setTune()
}

// 2. 使用 useCallback 缓存回调函数
const handleClickListener = useCallback((abcElem) => {
  // 处理逻辑
}, [])

// 3. 使用 useRef 存储不需要触发重新渲染的值
const synthControlRef = useRef<any>(null)
```

---

## 🔄 常用操作流程

### 流程 1：编辑和保存
```
1. 点击 "编辑ABC记谱"
2. 在左侧编辑器修改代码
3. 点击 "重新加载乐谱" 预览效果
4. 点击 "保存" 保存更改
```

### 流程 2：播放和调节
```
1. 进入编辑模式
2. 确保乐谱已加载
3. 点击播放按钮
4. 观察光标和高亮动画
5. 使用 Warp 调节速度
6. 使用进度条快进/快退
```

### 流程 3：交互编辑
```
1. 点击五线谱上的音符
2. 观察编辑器光标跳转和音符播放
3. 在五线谱上拖拽修改音高
4. 观察 ABC 代码自动更新
5. 点击保存
```

---

## 🎓 学习资源

- **abcjs 官方文档**: https://abcjs.net/
- **ABC 记谱法**: https://abcnotation.com/
- **React Hooks**: https://react.dev/reference/react
- **TypeScript**: https://www.typescriptlang.org/docs/

---

## 📞 支持和反馈

如遇到问题或有改进建议，请查看：
- 控制台错误消息 (F12)
- `TEST_CHECKLIST.md` 功能测试清单
- `SYNTH_DEMO_INTEGRATION_COMPLETE.md` 完整文档

---

**最后更新**: 2024
**版本**: 1.0
**状态**: ✅ 生产就绪
