import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import EditorModule from './EditorModule'

// Mock abcjs
vi.mock('abcjs', async () => {
  const mockRenderAbc = vi.fn() as unknown as (container: HTMLElement, abcText: string, options: object) => unknown[]
  
  return {
    default: {
      renderAbc: mockRenderAbc,
    },
  }
})

// Mock antd 组件
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    Card: ({ children, title, bordered }: { children: React.ReactNode; title: string; bordered?: boolean }) => (
      <div data-testid="card" data-bordered={bordered}>
        <div data-testid="card-title">{title}</div>
        <div data-testid="card-content">{children}</div>
      </div>
    ),
    Input: {
      TextArea: React.forwardRef(({ value, onChange, rows, style, spellCheck }: { value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; rows: number; style: React.CSSProperties; spellCheck: boolean }, ref) => (
        <textarea
          ref={ref}
          data-testid="abc-textarea"
          value={value}
          onChange={onChange}
          rows={rows}
          style={style}
          spellCheck={spellCheck}
        />
      )),
    },
    Row: ({ children }: { children: React.ReactNode }) => <div data-testid="row">{children}</div>,
    Col: ({ children }: { children: React.ReactNode }) => <div data-testid="col">{children}</div>,
    Typography: {
      Text: ({ children, type }: { children: React.ReactNode; type?: string }) => (
        <span data-testid="text" data-type={type}>{children}</span>
      ),
    },
  }
})

describe('EditorModule', () => {
  const defaultProps = {
    abcText: 'X:1\nT:Test Piece\nM:4/4\nL:1/8\nK:C\nCDEF GABc |',
    setAbcText: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该渲染编辑器组件', () => {
    render(<EditorModule {...defaultProps} />)

    expect(screen.getByTestId('card')).toBeInTheDocument()
    expect(screen.getByTestId('card-title')).toHaveTextContent('乐谱编辑器')
  })

  it('应该显示 ABC 文本输入框', () => {
    render(<EditorModule {...defaultProps} />)

    const textArea = screen.getByTestId('abc-textarea')
    expect(textArea).toBeInTheDocument()
    expect(textArea).toHaveValue(defaultProps.abcText)
  })

  it('应该调用 setAbcText 当用户输入时', () => {
    const setAbcTextMock = vi.fn()
    render(<EditorModule abcText={defaultProps.abcText} setAbcText={setAbcTextMock} />)

    const textArea = screen.getByTestId('abc-textarea')
    fireEvent.change(textArea, { target: { value: 'new value' } })
    
    expect(setAbcTextMock).toHaveBeenCalledWith('new value')
  })

  it('应该显示正确的初始 ABC 文本', () => {
    render(<EditorModule {...defaultProps} />)

    const textArea = screen.getByTestId('abc-textarea')
    expect(textArea).toHaveValue(defaultProps.abcText)
  })

  it('文本框应该禁用拼写检查', () => {
    render(<EditorModule {...defaultProps} />)

    const textArea = screen.getByTestId('abc-textarea')
    expect(textArea).toHaveAttribute('spellCheck', 'false')
  })

  it('应该渲染帮助文本', () => {
    render(<EditorModule {...defaultProps} />)

    expect(screen.getByText(/在下方编辑 ABC 源码/)).toBeInTheDocument()
  })

  describe('ABC 记谱法支持', () => {
    it('应该接受标准 ABC 记谱格式', () => {
      const standardAbc = `X:1
T:测试曲目
M:4/4
L:1/8
K:C
CDEF GABc|`

      render(<EditorModule abcText={standardAbc} setAbcText={vi.fn()} />)
      expect(screen.getByTestId('abc-textarea')).toHaveValue(standardAbc)
    })

    it('应该接受包含休止符的 ABC 记谱', () => {
      const abcWithRest = 'X:1\nT:Rest Test\nM:4/4\nK:C\nCDE z GAB|'

      render(<EditorModule abcText={abcWithRest} setAbcText={vi.fn()} />)
      expect(screen.getByTestId('abc-textarea')).toHaveValue(abcWithRest)
    })

    it('应该接受包含升降号的 ABC 记谱', () => {
      const abcWithAccidentals = 'X:1\nT:Accidentals\nM:4/4\nK:C\nC#DE F^GA Bcd|'

      render(<EditorModule abcText={abcWithAccidentals} setAbcText={vi.fn()} />)
      expect(screen.getByTestId('abc-textarea')).toHaveValue(abcWithAccidentals)
    })
  })

  describe('乐谱渲染', () => {
    it('应该调用 ABCJS.renderAbc 渲染乐谱', async () => {
      const ABCJS = await import('abcjs')
      render(<EditorModule {...defaultProps} />)

      expect(ABCJS.default.renderAbc).toHaveBeenCalled()
    })

    it('应该传递正确的配置选项', async () => {
      const ABCJS = await import('abcjs')
      render(<EditorModule {...defaultProps} />)

      expect(ABCJS.default.renderAbc).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        defaultProps.abcText,
        expect.objectContaining({
          responsive: 'resize',
          add_classes: true,
        })
      )
    })
  })
})
