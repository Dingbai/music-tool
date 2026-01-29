import React, { useRef, useState, useEffect } from 'react'
import * as Tone from 'tone'

const PitchDetection: React.FC = () => {
  const [isListening, setIsListening] = useState(false)
  const [detectedPitch, setDetectedPitch] = useState<string>('未检测')
  const [frequency, setFrequency] = useState<number | null>(null)
  const [accuracy, setAccuracy] = useState<number>(0)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationIdRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // 频率到音符名称的映射
  const frequencyToNote = (freq: number): { note: string; octave: number; cents: number } => {
    const A4 = 440
    const C0 = A4 * Math.pow(2, -4.75)
    const h = 12 * (Math.log2(freq / C0))
    const octave = Math.floor(h / 12)
    const cents = (h % 12) * 100
    const noteName = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][Math.round(cents / 100)]
    return { note: noteName, octave, cents: cents % 100 }
  }

  // 使用FFT算法检测基频（简化版）
  const detectPitch = (dataArray: Uint8Array, sampleRate: number) => {
    let maxValue = 0
    let maxIndex = 0

    for (let i = 0; i < dataArray.length; i++) {
      if (dataArray[i] > maxValue) {
        maxValue = dataArray[i]
        maxIndex = i
      }
    }

    const nyquist = sampleRate / 2
    const freq = (maxIndex * nyquist) / dataArray.length

    return freq > 50 ? freq : null // 过滤掉过低的频率
  }

  const startListening = async () => {
    try {
      await Tone.start()
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const source = audioContext.createMediaStreamSource(stream)
      analyserRef.current = audioContext.createAnalyser()
      analyserRef.current.fftSize = 4096
      source.connect(analyserRef.current)

      setIsListening(true)

      const detectAndDisplay = () => {
        if (!analyserRef.current) return

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(dataArray)

        const freq = detectPitch(dataArray, audioContext.sampleRate)

        if (freq && freq > 50 && freq < 2000) {
          setFrequency(freq)
          const { note, octave, cents } = frequencyToNote(freq)
          setDetectedPitch(`${note}${octave} (${freq.toFixed(1)}Hz)`)

          // 计算准确度（假设目标是A4 440Hz）
          const targetFreq = 440
          const accuracyPercent = Math.max(0, 100 - Math.abs(freq - targetFreq) / targetFreq * 100)
          setAccuracy(Math.round(accuracyPercent))
        }

        animationIdRef.current = requestAnimationFrame(detectAndDisplay)
      }

      detectAndDisplay()
    } catch (error) {
      console.error('麦克风访问失败:', error)
      alert('无法访问麦克风，请检查权限')
    }
  }

  const stopListening = () => {
    setIsListening(false)

    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current)
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }

    setDetectedPitch('未检测')
    setFrequency(null)
    setAccuracy(0)
  }

  return (
    <div className="pitch-detection">
      <div className="detection-controls">
        <button
          onClick={startListening}
          disabled={isListening}
          className="btn btn-primary"
        >
          {isListening ? '🎙️ 检测中...' : '🎙️ 开始检测'}
        </button>
        <button
          onClick={stopListening}
          disabled={!isListening}
          className="btn btn-danger"
        >
          🛑 停止检测
        </button>
      </div>

      <div className="detection-results">
        <div className="result-box">
          <p className="result-label">检测到的音高</p>
          <p className="result-value">{detectedPitch}</p>
        </div>

        {frequency && (
          <div className="result-box">
            <p className="result-label">准确度</p>
            <div className="accuracy-bar">
              <div className="accuracy-fill" style={{ width: `${accuracy}%` }}></div>
            </div>
            <p className="result-percentage">{accuracy}%</p>
          </div>
        )}
      </div>

      <div className="detection-info">
        <p>🎵 唱出或吹出音符，系统将实时检测音高并显示准确度</p>
        {isListening && (
          <p className="listening-indicator">
            <span className="pulse"></span> 正在监听...
          </p>
        )}
      </div>
    </div>
  )
}

export default PitchDetection
