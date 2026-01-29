// 调试和日志工具

interface LogMessage {
  timestamp: string
  level: 'info' | 'warn' | 'error'
  message: string
}

class Logger {
  private logs: LogMessage[] = []
  private maxLogs = 100

  info(message: string) {
    this.log(message, 'info')
    console.log(`[INFO] ${message}`)
  }

  warn(message: string) {
    this.log(message, 'warn')
    console.warn(`[WARN] ${message}`)
  }

  error(message: string) {
    this.log(message, 'error')
    console.error(`[ERROR] ${message}`)
  }

  private log(message: string, level: 'info' | 'warn' | 'error') {
    const timestamp = new Date().toLocaleTimeString()
    this.logs.push({ timestamp, level, message })
    
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }
  }

  getLogs() {
    return this.logs
  }

  clearLogs() {
    this.logs = []
  }

  downloadLogs() {
    const logText = this.logs
      .map(log => `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`)
      .join('\n')
    
    const blob = new Blob([logText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `music-app-logs-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }
}

export const logger = new Logger()
