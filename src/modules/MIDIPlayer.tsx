import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react'
import * as Tone from 'tone'
import abcjs from 'abcjs'
import { logger } from '../utils/logger'

interface MIDIPlayerProps {
  abcNotation: string
  onPlayNote: (index: number) => void
  onPlayComplete: () => void
  onPlayStateChange: (isPlaying: boolean) => void
  selectedInstrument: string
  onInstrumentChange: (instrument: string) => void
}

// ABC音符转MIDI音高
const noteToMIDI: Record<string, number> = {
  'C': 60, 'D': 62, 'E': 64, 'F': 65, 'G': 67, 'A': 69, 'B': 71,
  'c': 72, 'd': 74, 'e': 76, 'f': 77, 'g': 79, 'a': 81, 'b': 83,
}

// 音色配置
const instrumentConfigs: Record<string, any> = {
  'harmonica': {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.1 }
  },
  'piano': {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.005, decay: 0.5, sustain: 0, release: 0.3 }
  },
  'flute': {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.08, decay: 0.3, sustain: 0.5, release: 0.2 }
  },
  'guitar': {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.8, sustain: 0.1, release: 0.4 }
  },
  'violin': {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.1, decay: 0.2, sustain: 0.8, release: 0.3 }
  },
  'trumpet': {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.05, decay: 0.3, sustain: 0.6, release: 0.2 }
  }
}

const MIDIPlayer = forwardRef<any, MIDIPlayerProps>(
  ({ abcNotation, onPlayNote, onPlayComplete, onPlayStateChange, selectedInstrument, onInstrumentChange }, ref) => {
    const [isPlaying, setIsPlaying] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)
    const synthRef = useRef<any>(null)
    const playingRef = useRef(false)
    const initializePromiseRef = useRef<Promise<void> | null>(null)

    // 延迟初始化函数
    const initializeAudio = async (): Promise<void> => {
      // 如果已经在初始化中或已初始化，直接返回
      if (initializePromiseRef.current) {
        return initializePromiseRef.current
      }

      if (isInitialized && synthRef.current) {
        return Promise.resolve()
      }

      // 创建初始化 Promise
      const initPromise = (async () => {
        try {
          logger.info('启动 Audio Context...')
          await Tone.start()
          logger.info('Audio Context 已启动')
          
          if (!synthRef.current) {
            logger.info(`创建 ${selectedInstrument} 合成器...`)
            const config = instrumentConfigs[selectedInstrument] || instrumentConfigs['harmonica']
            synthRef.current = new Tone.PolySynth(Tone.Synth, config).toDestination()
            logger.info(`${selectedInstrument} 合成器已创建`)
          }
          
          setIsInitialized(true)
          logger.info('Tone.js 初始化完成')
        } catch (error) {
          logger.error(`Audio 初始化失败: ${error}`)
          console.error('初始化失败:', error)
          throw error
        }
      })()

      initializePromiseRef.current = initPromise
      return initPromise
    }

    const parseABCNotes = (): Array<{ note: string; duration: number }> => {
      const lines = abcNotation.split('\n')
      const notes: Array<{ note: string; duration: number }> = []

      for (const line of lines) {
        if (line.startsWith('K:') || line.startsWith('X:') || line.startsWith('T:') || 
            line.startsWith('M:') || line.startsWith('L:')) {
          continue // 跳过元数据行
        }
        
        let i = 0
        let duration = 1

        while (i < line.length) {
          const char = line[i]

          if (/[A-Gz]/.test(char)) {
            const noteName = char
            // 检查升号或降号
            let modifiedNote = noteName
            if (i + 1 < line.length && line[i + 1] === '#') {
              modifiedNote += '#'
              i++
            } else if (i + 1 < line.length && line[i + 1] === 'b') {
              modifiedNote += 'b'
              i++
            }
            
            notes.push({ note: modifiedNote, duration })
            duration = 1
          } else if (char === '/') {
            duration *= 0.5
          } else if (char === '|') {
            // 小节线，跳过
          } else if (/\d/.test(char)) {
            duration *= parseInt(char)
          }

          i++
        }
      }

      return notes
    }

    const playNotes = async (notes: Array<{ note: string; duration: number }>) => {
      if (!synthRef.current) {
        logger.error('Synth 未初始化')
        return
      }

      playingRef.current = true
      setIsPlaying(true)
      onPlayStateChange(true)

      try {
        for (let i = 0; i < notes.length; i++) {
          if (!playingRef.current) break
          
          const { note, duration } = notes[i]
          
          // 实时高亮当前音符
          onPlayNote(i)

          let noteName = note.replace('#', '').replace('b', '')
          let midiNote = noteToMIDI[noteName] ?? 60

          if (note.includes('#')) midiNote += 1
          if (note.includes('b')) midiNote -= 1

          // 计算音符时长（秒）
          const baseDuration = 0.5
          const noteDuration = Math.max(0.1, baseDuration * duration)
          const delayMs = noteDuration * 1000

          if (note !== 'z') {
            const freq = Tone.Midi(midiNote).toFrequency()
            try {
              synthRef.current.triggerAttackRelease(freq, noteDuration)
              logger.info(`播放音符: ${note} (${freq.toFixed(2)}Hz)`)
            } catch (e) {
              logger.error(`播放失败: ${e}`)
            }
          } else {
            logger.info('休止符')
          }

          // 等待音符完成
          await new Promise((resolve) => setTimeout(resolve, delayMs))
        }
      } finally {
        playingRef.current = false
        setIsPlaying(false)
        onPlayStateChange(false)
        onPlayComplete()
      }
    }

    const handlePlay = async () => {
      if (isPlaying) {
        logger.warn('已在播放中')
        return
      }

      try {
        // 确保 Audio 已初始化
        logger.info('点击播放按钮，开始初始化...')
        await initializeAudio()
        
        const notes = parseABCNotes()
        if (notes.length === 0) {
          logger.warn('未能解析任何音符')
          alert('未能解析任何音符，请检查ABC格式')
          return
        }

        logger.info(`开始播放 ${notes.length} 个音符`)
        await playNotes(notes)
      } catch (error) {
        logger.error(`播放出错: ${error}`)
        alert('播放出错，请重试')
      }
    }

    const handleInstrumentChange = (newInstrument: string) => {
      // 停止当前播放
      if (isPlaying) {
        handleStop()
      }
      
      // 重置合成器，以便下次使用新配置
      if (synthRef.current) {
        try {
          synthRef.current.dispose()
        } catch (e) {
          console.error('处置合成器失败:', e)
        }
        synthRef.current = null
      }
      
      // 重置初始化状态
      setIsInitialized(false)
      initializePromiseRef.current = null
      
      // 通知父组件
      onInstrumentChange(newInstrument)
      logger.info(`切换音色到: ${newInstrument}`)
    }

    const handleStop = () => {
      playingRef.current = false
      setIsPlaying(false)
      onPlayStateChange(false)
      
      if (synthRef.current) {
        try {
          synthRef.current.triggerRelease()
        } catch (e) {
          console.error('停止播放失败:', e)
        }
      }
    }

    useImperativeHandle(ref, () => ({
      play: handlePlay,
      stop: handleStop,
    }))

    return (
      <div className="midi-player">
        <div className="instrument-selector">
          <label htmlFor="instrument-select">音色选择:</label>
          <select
            id="instrument-select"
            value={selectedInstrument}
            onChange={(e) => handleInstrumentChange(e.target.value)}
            disabled={isPlaying}
            className="instrument-dropdown"
          >
            <option value="harmonica">🎵 口琴</option>
            <option value="piano">🎹 钢琴</option>
            <option value="flute">🪘 长笛</option>
            <option value="guitar">🎸 吉他</option>
            <option value="violin">🎻 小提琴</option>
            <option value="trumpet">🎺 小号</option>
          </select>
        </div>
        
        <div className="player-controls">
          <button
            onClick={handlePlay}
            disabled={isPlaying}
            className="btn btn-success"
            title="点击播放五线谱"
          >
            {isPlaying ? '⏸️ 播放中...' : '▶️ 播放'}
          </button>
          <button
            onClick={handleStop}
            disabled={!isPlaying}
            className="btn btn-danger"
          >
            ⏹️ 停止
          </button>
        </div>
        <div className="player-info">
          {isPlaying && (
            <p>正在用{selectedInstrument === 'harmonica' ? '口琴' : selectedInstrument}音色演奏... 🎵</p>
          )}
          {!isPlaying && (
            <p>选择音色后点击播放五线谱（首次播放会进行初始化）</p>
          )}
        </div>
      </div>
    )
  }
)

MIDIPlayer.displayName = 'MIDIPlayer'

export default MIDIPlayer
