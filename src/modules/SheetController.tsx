import React, { useEffect, useRef, useState } from 'react'
import abcjs from 'abcjs'

interface SheetControllerProps {
  abcNotation: string
}

const SheetController: React.FC<SheetControllerProps> = ({
  abcNotation,
}) => {
  const synthControlRef = useRef<any>(null)
  const midiBufferRef = useRef<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTempo, setCurrentTempo] = useState(120)
  const [visualObj, setVisualObj] = useState<any>(null)

  // 初始化 and update visualObj when abcNotation changes
  useEffect(() => {
    if (!abcNotation) {
      console.warn('未提供 abcNotation，无法初始化播放器')
      return
    }

    try {
      // Parse the ABC notation to get the visual object
      const tuneObject = abcjs.parseOnly(abcNotation);
      if (tuneObject && tuneObject.length > 0) {
        // Create a temporary div to render the ABC notation and get the visual object
        const tempDiv = document.createElement('div');
        tempDiv.style.display = 'none'; // Hide the temporary div
        document.body.appendChild(tempDiv);

        const rendered = abcjs.renderAbc(tempDiv, abcNotation, {
          generateWarnings: false,
          add_classes: true
        });

        if (rendered && rendered[0]) {
          setVisualObj(rendered[0]);
        }

        // Clean up the temporary div
        document.body.removeChild(tempDiv);
      }
    } catch (error) {
      console.error('解析ABC乐谱失败:', error)
    }
  }, [abcNotation])

  // 初始化播放器
  useEffect(() => {
    if (!visualObj) {
      console.warn('未提供 visualObj，无法初始化播放器')
      return
    }

    try {
      // 3. 初始化 SynthController - 可视化播放器控制
      synthControlRef.current = new (abcjs.synth as any).SynthController()

      // 配置播放器外观和功能
      synthControlRef.current.load('#audio-controls', null, {
        displayRestart: true, // 显示重新开始按钮
        displayPlay: true, // 显示播放/暂停按钮
        displayProgress: true, // 显示进度条
        displayWarp: true, // 允许调节语速/节拍
      })

      // 初始化 MIDI 合成器
      midiBufferRef.current = new (abcjs.synth as any).CreateSynth()

      setupPlayer(visualObj)
    } catch (error) {
      console.error('播放器初始化失败:', error)
    }
  }, [visualObj])

  // 设置播放器与渲染内容的关联
  const setupPlayer = async (visObj: any) => {
    try {
      if (!midiBufferRef.current || !synthControlRef.current) return

      // 初始化 MIDI 缓冲
      await midiBufferRef.current.init({
        visualObj: visObj,
        options: {
          // 使用公共 Soundfont 库
          soundFontUrl: `https://paulrosen.github.io/midi-js-soundfonts/FluidR3_GM/`,
        },
      })

      // 绑定合成器到 UI 控制器
      await synthControlRef.current.setTune(visObj, false)

      console.log('播放器设置完成')
    } catch (error) {
      console.error('播放器设置失败:', error)
    }
  }

  // 当 visualObj 更新时，重新初始化播放器
  useEffect(() => {
    if (visualObj) {
      setupPlayer(visualObj)
    }
  }, [visualObj])

  // 监听播放状态变化
  useEffect(() => {
    const audioControls = document.getElementById('audio-controls')
    if (!audioControls) return

    const playButton = audioControls.querySelector('[class*="play"]')
    if (!playButton) return

    const observer = new MutationObserver(() => {
      // 可以在这里监听播放状态的变化
      const isCurrentlyPlaying = playButton.textContent?.includes('Pause')
      if (isCurrentlyPlaying !== isPlaying) {
        setIsPlaying(!!isCurrentlyPlaying)
      }
    })

    observer.observe(playButton, { attributes: true, childList: true })

    return () => observer.disconnect()
  }, [isPlaying])

  return (
    <div className="sheet-controller">
      <div className="controller-header">
        <h3>🎵 音乐播放器</h3>
        {isPlaying && <span className="playing-indicator">正在播放...</span>}
      </div>

      {/* abcjs 自带的播放器控制 UI 将挂载到这个容器 */}
      <div
        id="audio-controls"
        className="audio-controls-container"
      ></div>

      {/* 额外的控制面板 */}
      <div className="controller-panel">
        <div className="tempo-control">
          <label htmlFor="tempo-slider">节拍速度：</label>
          <input
            id="tempo-slider"
            type="range"
            min="40"
            max="200"
            value={currentTempo}
            onChange={(e) => {
              const newTempo = parseInt(e.target.value)
              setCurrentTempo(newTempo)

              // 如果播放器支持动态调整速度，可以在这里实现
              // 目前 abcjs 的速度调整通常通过 UI 中的 warp 控件完成
            }}
            className="tempo-slider"
          />
          <span className="tempo-value">{currentTempo} BPM</span>
        </div>

        <div className="abc-info">
          <p className="info-text">
            💡 提示：使用上方的播放器控制 🎹 按钮来播放音乐。
            <br />
            拖拽速度滑块调节播放速度。
          </p>
        </div>
      </div>
    </div>
  )
}

export default SheetController
