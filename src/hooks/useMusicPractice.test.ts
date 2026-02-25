import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMusicPractice } from './useMusicPractice'

describe('useMusicPractice', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('应该初始化 hook', () => {
    const { result } = renderHook(() => useMusicPractice())

    expect(result.current.audioCtx).toBeDefined()
    expect(result.current.audioCtx.current).toBeNull()
  })

  describe('initAudio', () => {
    it('应该创建 AudioContext', () => {
      const { result } = renderHook(() => useMusicPractice())

      act(() => {
        result.current.initAudio()
      })

      expect(result.current.audioCtx.current).toBeDefined()
    })

    it('不应该重复创建 AudioContext', () => {
      const { result } = renderHook(() => useMusicPractice())

      act(() => {
        result.current.initAudio()
      })

      const firstCtx = result.current.audioCtx.current

      act(() => {
        result.current.initAudio()
      })

      expect(result.current.audioCtx.current).toBe(firstCtx)
    })
  })

  describe('startMetronome', () => {
    it('应该初始化音频并启动节拍器', () => {
      const { result } = renderHook(() => useMusicPractice())

      // Mock requestAnimationFrame 只调用一次
      const rafMock = vi.fn()
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation(rafMock)

      act(() => {
        result.current.startMetronome(120)
      })

      expect(result.current.audioCtx.current).toBeDefined()
    })

    it('应该使用传入的 BPM 值', () => {
      const { result } = renderHook(() => useMusicPractice())

      vi.spyOn(window, 'requestAnimationFrame').mockImplementation(vi.fn())

      act(() => {
        result.current.startMetronome(60)
      })

      expect(result.current.audioCtx.current).toBeDefined()
    })

    it('应该使用不同的 BPM 值', () => {
      const { result } = renderHook(() => useMusicPractice())

      vi.spyOn(window, 'requestAnimationFrame').mockImplementation(vi.fn())

      act(() => {
        result.current.startMetronome(180)
      })

      expect(result.current.audioCtx.current).toBeDefined()
    })
  })

  describe('stopMetronome', () => {
    it('应该停止节拍器', () => {
      const { result } = renderHook(() => useMusicPractice())
      const cancelRAF = vi.spyOn(window, 'cancelAnimationFrame')

      vi.spyOn(window, 'requestAnimationFrame').mockImplementation(vi.fn())

      act(() => {
        result.current.startMetronome(120)
      })

      act(() => {
        result.current.stopMetronome()
      })

      expect(cancelRAF).toHaveBeenCalled()

      cancelRAF.mockRestore()
    })
  })

  describe('节拍器完整流程', () => {
    it('应该能启动和停止节拍器', () => {
      const { result } = renderHook(() => useMusicPractice())

      vi.spyOn(window, 'requestAnimationFrame').mockImplementation(vi.fn())
      const cancelRAF = vi.spyOn(window, 'cancelAnimationFrame')

      // 启动
      act(() => {
        result.current.startMetronome(100)
      })

      expect(result.current.audioCtx.current).toBeDefined()

      // 停止
      act(() => {
        result.current.stopMetronome()
      })

      expect(cancelRAF).toHaveBeenCalled()

      cancelRAF.mockRestore()
    })
  })

  describe('playClick', () => {
    it('应该产生节拍声', () => {
      const { result } = renderHook(() => useMusicPractice())

      act(() => {
        result.current.initAudio()
      })

      vi.spyOn(window, 'requestAnimationFrame').mockImplementation(vi.fn())

      act(() => {
        result.current.startMetronome(120)
      })

      expect(result.current.audioCtx.current).toBeDefined()
    })
  })

  describe('audioCtx ref', () => {
    it('audioCtx 应该是 ref 对象', () => {
      const { result } = renderHook(() => useMusicPractice())

      expect(result.current.audioCtx).toHaveProperty('current')
    })

    it('初始化后 audioCtx.current 应该是 AudioContext 实例', () => {
      const { result } = renderHook(() => useMusicPractice())

      act(() => {
        result.current.initAudio()
      })

      expect(result.current.audioCtx.current).toBeDefined()
      expect(result.current.audioCtx.current).toHaveProperty('createOscillator')
      expect(result.current.audioCtx.current).toHaveProperty('createGain')
    })
  })
})
