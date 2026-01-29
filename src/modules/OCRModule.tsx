import React, { useRef, useState } from 'react'
import Tesseract from 'tesseract.js'

interface OCRModuleProps {
  onOCRComplete: (abc: string) => void
}

const OCRModule: React.FC<OCRModuleProps> = ({ onOCRComplete }) => {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const convertSimplifyToABC = (text: string): string => {
    // 简谱数字到ABC音符的映射（C大调）
    const noteMap: Record<string, string> = {
      '1': 'C',
      '2': 'D',
      '3': 'E',
      '4': 'F',
      '5': 'G',
      '6': 'A',
      '7': 'B',
      '0': 'z', // 休止符
    }

    let abc = 'X:1\nT:OCR Recognized Score\nM:4/4\nL:1/8\nK:C\n'
    let measures: string[] = []
    let currentMeasure = ''
    let noteCount = 0

    // 清理文本：移除中文、特殊字符和歌词
    const cleanedText = text
      .split('\n')
      .filter(line => {
        // 过滤掉包含中文或多个空格的行（这些通常是歌词）
        return !/[\u4e00-\u9fff]|[a-zA-Z\s]{5,}/.test(line)
      })
      .join('')

    // 处理字符
    for (const char of cleanedText) {
      if (noteMap[char]) {
        currentMeasure += noteMap[char]
        noteCount++
        
        // 每4个音符换一个小节
        if (noteCount >= 4) {
          measures.push(currentMeasure)
          currentMeasure = ''
          noteCount = 0
        }
      } else if (char === '#') {
        // 升号
        if (currentMeasure) {
          currentMeasure = currentMeasure.slice(0, -1) + currentMeasure[currentMeasure.length - 1] + '#'
        }
      } else if (char === 'b') {
        // 降号
        if (currentMeasure) {
          currentMeasure = currentMeasure.slice(0, -1) + currentMeasure[currentMeasure.length - 1] + 'b'
        }
      } else if (char === ' ' || char === '\n' || char === ',' || char === '，') {
        // 空格、换行、逗号作为分隔符
        if (currentMeasure && noteCount > 0) {
          measures.push(currentMeasure)
          currentMeasure = ''
          noteCount = 0
        }
      }
    }

    if (currentMeasure && noteCount > 0) {
      measures.push(currentMeasure)
    }

    // 如果没有识别到任何音符，返回空乐谱
    if (measures.length === 0) {
      return 'X:1\nT:Empty\nM:4/4\nL:1/8\nK:C\nz'
    }

    // 每4个小节换一行
    const lines: string[] = []
    for (let i = 0; i < measures.length; i += 4) {
      lines.push(measures.slice(i, i + 4).join('|'))
    }

    abc += lines.join('|\n') + '|]'
    return abc
  }

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请选择图像文件')
      return
    }

    setLoading(true)
    setProgress(0)

    try {
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (m: any) => {
          setProgress(Math.round(m.progress * 100))
        },
      })

      const recognizedText = result.data.text
      const abc = convertSimplifyToABC(recognizedText)
      
      console.log('OCR识别结果:', recognizedText)
      console.log('转换为ABC:', abc)
      
      onOCRComplete(abc)
      alert(`识别成功！识别文本：${recognizedText.substring(0, 100)}...`)
    } catch (error) {
      console.error('OCR识别失败:', error)
      alert('OCR识别失败，请重试')
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  return (
    <div className="ocr-module">
      <div className="upload-area">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? '识别中...' : '📤 上传简谱图片'}
        </button>
      </div>
      {loading && (
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="progress-text">{progress}%</p>
        </div>
      )}
    </div>
  )
}

export default OCRModule
