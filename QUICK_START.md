# 快速开始指南 - 新五线谱系统

## 🎯 30秒快速入门

### 1️⃣ 基础组件使用

```tsx
import SheetRenderer from './modules/SheetRenderer'
import SheetEditor from './modules/SheetEditor'
import SheetController from './modules/SheetController'

export default function App() {
  const [abc, setAbc] = useState('X:1\nK:C\nC D E F|')

  return (
    <>
      {/* 编辑器 */}
      <SheetEditor 
        abcNotation={abc}
        onEdit={setAbc}
      />

      {/* 五线谱 */}
      <SheetRenderer 
        abcNotation={abc}
        onNoteClick={(elem) => {
          console.log('点击了:', elem.startChar, elem.endChar)
        }}
      />

      {/* 播放器 */}
      <SheetController abcNotation={abc} />
    </>
  )
}
```

---

## 🎨 三个核心功能

### 功能1️⃣: 实时播放高亮 (SheetRenderer)

**工作原理**: 播放时音符自动变红

```tsx
<SheetRenderer 
  abcNotation={abc}
  onNoteClick={handleClick}
/>
```

**CSS 类**: `.abcjs-highlight` (红色 + 动画)

---

### 功能2️⃣: 点击和拖拽编辑 (SheetEditor)

**工作流程**:
1. 点击五线谱音符 → 编辑器光标跳转
2. 拖拽音符 → 源码自动更新
3. 编辑源码 → 五线谱实时更新

```tsx
<SheetEditor 
  abcNotation={abc}
  onEdit={setAbc}
  onNoteSelected={(elem) => {
    console.log('选中范围:', elem.startChar, elem.endChar)
  }}
/>
```

---

### 功能3️⃣: 可视化播放器 (SheetController)

**包含功能**:
- 🎹 播放/暂停
- 📊 进度条拖拽
- ⚡ 语速调节
- 🔄 重新开始

```tsx
<SheetController abcNotation={abc} />
```

---

## 📝 完整工作示例

### 示例 App.tsx

```tsx
import React, { useState } from 'react'
import SheetRenderer from './modules/SheetRenderer'
import SheetEditor from './modules/SheetEditor'
import SheetController from './modules/SheetController'

function App() {
  // 1. ABC 记谱法数据
  const [abc, setAbc] = useState(`X:1
T:欢迎
M:4/4
L:1/8
K:C
C D E F|G A B c|`)

  // 2. 处理音符点击
  const handleNoteClick = (abcElem: any, tuneNumber: number) => {
    console.log(`选中音符 (${abcElem.startChar}-${abcElem.endChar})`)
  }

  // 3. 处理编辑完成
  const handleEdit = (newAbc: string) => {
    console.log('乐谱已更新')
    setAbc(newAbc)
  }

  // 4. 处理音符选中
  const handleNoteSelected = (abcElem: any) => {
    console.log('编辑器中选中:', abcElem)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
      
      {/* 左侧: 编辑 */}
      <div>
        <h2>编辑</h2>
        <SheetEditor 
          abcNotation={abc}
          onEdit={handleEdit}
          onNoteSelected={handleNoteSelected}
        />
      </div>

      {/* 右侧: 播放和渲染 */}
      <div>
        <h2>播放</h2>
        <SheetRenderer 
          abcNotation={abc}
          onNoteClick={handleNoteClick}
        />
        
        <h2 style={{ marginTop: '2rem' }}>控制器</h2>
        <SheetController abcNotation={abc} />
      </div>
    </div>
  )
}

export default App
```

---

## 🎼 ABC 记谱法基础

### 最简单的例子

```abc
X:1           # 乐谱编号
T:Hello       # 标题
M:4/4         # 拍子（4/4）
L:1/8         # 基础音符长度（8分音符）
K:C           # 调号（C大调）
C D E F|      # 音符（C、D、E、F）
G A B c|      # c 是高八度的C
```

### 常用音符

| 记号 | 含义 | 记号 | 含义 |
|-----|------|------|------|
| C | Do | Z | 休止符 |
| D | Re | C2 | 半长音符 |
| E | Mi | C4 | 全长音符 |
| F | Fa | c | 高八度 Do |
| G | Sol | C' | 高八度 Do |
| A | La | C2 | 中等长度 |
| B | Si | C/ | 半长度 |

### 修饰符

```abc
C#  # C升号
Cb  # C降号
C2  # C 两倍长
C/2 # C 半长
```

---

## 🎯 常见任务

### 任务1: 加载一首歌

```tsx
const song = `X:1
T:小星星
M:4/4
L:1/8
K:C
C C G G|A A G|
F F E E|D D C|`

<SheetRenderer abcNotation={song} />
```

### 任务2: 监听用户编辑

```tsx
const handleEdit = (newAbc: string) => {
  console.log('用户修改了:', newAbc)
  // 保存到数据库
  saveToDatabase(newAbc)
}

<SheetEditor 
  abcNotation={abc}
  onEdit={handleEdit}
/>
```

### 任务3: 点击音符时执行操作

```tsx
const handleNoteClick = (abcElem: any, tuneNumber: number) => {
  // 播放这个音符
  playNote(abcElem)
  
  // 显示音符信息
  console.log(`开始字符: ${abcElem.startChar}`)
  console.log(`结束字符: ${abcElem.endChar}`)
}

<SheetRenderer 
  abcNotation={abc}
  onNoteClick={handleNoteClick}
/>
```

### 任务4: 双向编辑同步

```tsx
const [abc, setAbc] = useState('...')

<>
  {/* 用户编辑源码 */}
  <SheetEditor 
    abcNotation={abc}
    onEdit={setAbc}  // 更新 abc
  />
  
  {/* 五线谱自动更新 */}
  <SheetRenderer 
    abcNotation={abc}  // 依赖 abc 状态
    onNoteClick={(elem) => {
      // 点击五线谱 → 编辑器光标跳转
      setSelectedElem(elem)
    }}
  />
</>
```

---

## 🎨 自定义样式

### 修改高亮颜色

在 `src/styles/modules.css` 中找到:

```css
/* 默认: 红色 */
.abcjs-highlight {
  fill: #ff0000 !important;  /* 改成你要的颜色 */
}
```

**颜色建议**:
- 绿色: `#00ff00` (积极)
- 蓝色: `#0000ff` (冷色)
- 橙色: `#ff9900` (温暖)
- 紫色: `#ff00ff` (高对比)

### 修改编辑器样式

```css
.editor-textarea {
  font-size: 0.9rem;        /* 改大小 */
  border-color: #667eea;    /* 改边框颜色 */
  background: white;        /* 改背景 */
}
```

---

## 🔧 故障排除

### 问题: 高亮不显示

**解决**:
```tsx
// ✅ 正确
<SheetRenderer 
  abcNotation={abc}
  onNoteClick={handler}
/>

// ❌ 错误: 检查 CSS 是否加载
import './styles/modules.css'  // 确保导入
```

### 问题: 编辑器初始化失败

**解决**:
```tsx
// 检查浏览器控制台是否有错误
console.log('初始化:', editorRef.current)

// 确保在编辑模式下
const [isEditing, setIsEditing] = useState(true)
```

### 问题: 点击无反应

**解决**:
```tsx
// 在回调中添加日志
const handleClick = (elem: any) => {
  console.log('点击了!', elem)  // 检查是否调用
}
```

---

## 📚 学习资源

- **abcjs 官网**: https://abcjs.net/
- **ABC 记谱法**: https://abcnotation.com/
- **本项目文档**: 见 `ABCJS_INTEGRATION_GUIDE.md`

---

## ✅ 检查清单

启动应用前确认:

- [ ] 已安装 abcjs (`npm install abcjs`)
- [ ] 已导入 CSS 文件
- [ ] 已导入三个组件
- [ ] ABC 记谱法格式正确
- [ ] Props 接口匹配
- [ ] 没有编译错误

---

## 🚀 下一步

1. **复制上面的示例 App.tsx**
2. **运行 `npm install` 确保依赖已安装**
3. **运行 `npm run dev` 启动开发服务器**
4. **在浏览器中打开应用试用**
5. **修改 ABC 记谱法试试**
6. **点击和拖拽五线谱中的音符**
7. **使用播放器控制播放**

---

**祝您使用愉快! 🎵**

有问题? 查看详细文档: `ABCJS_INTEGRATION_GUIDE.md`
