import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// 每个测试后清理 React Testing Library
afterEach(() => {
  cleanup()
})

// Mock AudioContext
class MockAudioContext {
  currentTime = 0
  sampleRate = 44100

  createOscillator() {
    return {
      frequency: { value: 0 },
      connect: () => {},
      start: () => {},
      stop: () => {},
    }
  }

  createGain() {
    return {
      gain: { value: 1, exponentialRampToValueAtTime: () => {} },
      connect: () => {},
    }
  }

  createAnalyser() {
    return {
      fftSize: 2048,
      getFloatTimeDomainData: () => {},
      connect: () => {},
    }
  }

  createMediaStreamSource() {
    return { connect: () => {} }
  }

  resume = () => Promise.resolve()
  close = () => Promise.resolve()
}

// @ts-expect-error mock implementation
window.AudioContext = MockAudioContext
// @ts-expect-error mock implementation
window.webkitAudioContext = MockAudioContext

// Mock navigator.mediaDevices
Object.defineProperty(window.navigator, 'mediaDevices', {
  value: {
    getUserMedia: () => Promise.resolve({} as MediaStream),
  },
  writable: true,
})

// Mock requestAnimationFrame
const rafIds = new Set<number>()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.requestAnimationFrame = (cb: any) => {
  const id = setTimeout(cb, 0) as unknown as number
  rafIds.add(id)
  return id
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.cancelAnimationFrame = (id: any) => {
  rafIds.delete(id)
  clearTimeout(id)
}

// 清理所有 pending 的 RAF
afterEach(() => {
  rafIds.forEach(id => clearTimeout(id))
  rafIds.clear()
})

// Mock ResizeObserver
class MockResizeObserver {
  observe = () => {}
  unobserve = () => {}
  disconnect = () => {}
}
// @ts-expect-error mock implementation
window.ResizeObserver = MockResizeObserver

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})
