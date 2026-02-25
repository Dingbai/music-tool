# 测试指南

本项目使用 Vitest 和 React Testing Library 进行测试。

## 🚀 运行测试

```bash
# 运行所有测试（监视模式）
pnpm test

# 运行所有测试（单次运行）
pnpm test:run

# 运行测试并生成覆盖率报告
pnpm test:coverage
```

## 📁 测试文件位置

测试文件与被测试文件放在同一目录下，命名约定为 `*.test.ts` 或 `*.test.tsx`：

```
src/
├── utils/
│   ├── pitchService.ts
│   └── pitchService.test.ts
├── components/
│   ├── EditorModule.tsx
│   └── EditorModule.test.tsx
├── hooks/
│   ├── useMusicPractice.ts
│   └── useMusicPractice.test.ts
└── test/
    └── setup.ts  # 测试配置文件
```

## 📝 测试覆盖

### 1. 工具函数测试 (`src/utils/`)

- **pitchService.test.ts**: 测试音高检测、频率转换等功能
  - `freqToMidi()` - 频率到 MIDI 音符转换
  - `midiToNoteName()` - MIDI 到音符名称转换
  - `detectPitchYIN()` - YIN 算法音高检测

- **logger.test.ts**: 测试日志工具功能
  - `info()`, `warn()`, `error()` - 日志记录
  - `getLogs()`, `clearLogs()` - 日志管理
  - `downloadLogs()` - 日志下载

### 2. Hooks 测试 (`src/hooks/`)

- **useMusicPractice.test.ts**: 测试音乐练习 Hook
  - `initAudio()` - 音频上下文初始化
  - `startMetronome()` - 启动节拍器
  - `stopMetronome()` - 停止节拍器

### 3. 组件测试 (`src/components/`)

- **EditorModule.test.tsx**: 测试乐谱编辑器组件
  - 组件渲染
  - ABC 文本输入
  - 乐谱渲染
  - ABC 记谱法支持

## 🛠 测试配置

### Vitest 配置 (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    css: true,
  },
})
```

### 测试设置 (`src/test/setup.ts`)

包含以下 Mock：
- `AudioContext` - Web Audio API
- `ResizeObserver` - 元素大小观察
- `matchMedia` - 媒体查询
- `requestAnimationFrame` - 动画帧
- `navigator.mediaDevices` - 媒体设备

## ✍️ 编写测试

### 工具函数测试示例

```typescript
import { describe, it, expect } from 'vitest'
import { freqToMidi } from './pitchService'

describe('pitchService', () => {
  describe('freqToMidi', () => {
    it('标准音 A4 (440Hz) 应该转换为 MIDI 69', () => {
      expect(freqToMidi(440)).toBe(69)
    })
  })
})
```

### 组件测试示例

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EditorModule from './EditorModule'

describe('EditorModule', () => {
  it('应该调用 setAbcText 当用户输入时', () => {
    const setAbcTextMock = vi.fn()
    render(<EditorModule abcText="test" setAbcText={setAbcTextMock} />)
    
    const textArea = screen.getByTestId('abc-textarea')
    fireEvent.change(textArea, { target: { value: 'new value' } })
    
    expect(setAbcTextMock).toHaveBeenCalledWith('new value')
  })
})
```

### Hooks 测试示例

```typescript
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMusicPractice } from './useMusicPractice'

describe('useMusicPractice', () => {
  it('应该创建 AudioContext', () => {
    const { result } = renderHook(() => useMusicPractice())
    
    act(() => {
      result.current.initAudio()
    })
    
    expect(result.current.audioCtx.current).toBeDefined()
  })
})
```

## 🔍 测试最佳实践

1. **测试文件名**: 使用 `.test.ts` 或 `.test.tsx` 后缀
2. **描述性测试名**: 使用中文描述测试用例的目的
3. **AAA 模式**: Arrange（准备）- Act（执行）- Assert（断言）
4. **独立测试**: 每个测试应该独立运行，不依赖其他测试
5. **Mock 外部依赖**: 使用 `vi.mock()` 模拟外部模块

## 📊 当前测试统计

- **测试文件**: 4
- **测试用例**: 60
- **通过率**: 100%
- **代码覆盖率**: 
  - 工具函数 (utils): 100%
  - Hooks: 70.37%
  - 组件 (EditorModule): 79.24%

## 📁 覆盖率报告

运行 `pnpm test:coverage` 后，覆盖率报告会生成在 `coverage/` 目录下。

**注意**: `coverage/` 目录已在 `.gitignore` 中排除，不会被提交到 git。

查看 HTML 报告：
```bash
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

## ✅ ESLint 检查

```bash
pnpm lint  # 运行 ESLint 检查
```

当前 ESLint 配置为推荐规则，部分代码有类型警告但不影响功能。

## 🐛 常见问题

### ResizeObserver is not defined
已在 `setup.ts` 中添加了 Mock，如果遇到此错误，请检查是否正确导入了 setup 文件。

### window.matchMedia is not a function
已在 `setup.ts` 中添加了 Mock，确保在测试组件前加载了 setup 文件。

### AudioContext 相关错误
Web Audio API 已在 `setup.ts` 中被 Mock，无需额外配置。
