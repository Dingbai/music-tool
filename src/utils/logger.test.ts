import { describe, it, expect, beforeEach, vi } from 'vitest'
import { logger } from './logger'

describe('logger', () => {
  beforeEach(() => {
    // 每个测试前清空日志
    logger.clearLogs()
    // Mock console 方法
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('info', () => {
    it('应该记录 info 级别的日志', () => {
      const message = '测试信息'
      logger.info(message)

      const logs = logger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].message).toBe(message)
      expect(logs[0].level).toBe('info')
      expect(logs[0].timestamp).toBeDefined()
    })

    it('应该在控制台输出 info 日志', () => {
      const message = '控制台测试'
      logger.info(message)

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining(message))
    })

    it('应该记录多条 info 日志', () => {
      logger.info('消息 1')
      logger.info('消息 2')
      logger.info('消息 3')

      const logs = logger.getLogs()
      expect(logs).toHaveLength(3)
      expect(logs.map(l => l.message)).toEqual(['消息 1', '消息 2', '消息 3'])
    })
  })

  describe('warn', () => {
    it('应该记录 warn 级别的日志', () => {
      const message = '警告信息'
      logger.warn(message)

      const logs = logger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].message).toBe(message)
      expect(logs[0].level).toBe('warn')
    })

    it('应该在控制台输出 warn 日志', () => {
      const message = '警告测试'
      logger.warn(message)

      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(message))
    })
  })

  describe('error', () => {
    it('应该记录 error 级别的日志', () => {
      const message = '错误信息'
      logger.error(message)

      const logs = logger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].message).toBe(message)
      expect(logs[0].level).toBe('error')
    })

    it('应该在控制台输出 error 日志', () => {
      const message = '错误测试'
      logger.error(message)

      expect(console.error).toHaveBeenCalledWith(expect.stringContaining(message))
    })
  })

  describe('getLogs', () => {
    it('应该返回所有日志', () => {
      logger.info('信息')
      logger.warn('警告')
      logger.error('错误')

      const logs = logger.getLogs()
      expect(logs).toHaveLength(3)
      expect(logs.map(l => l.level)).toEqual(['info', 'warn', 'error'])
    })

    it('应该按时间顺序返回日志', () => {
      logger.info('第一条')
      logger.info('第二条')

      const logs = logger.getLogs()
      expect(logs[0].message).toBe('第一条')
      expect(logs[1].message).toBe('第二条')
    })
  })

  describe('clearLogs', () => {
    it('应该清空所有日志', () => {
      logger.info('测试')
      logger.clearLogs()

      const logs = logger.getLogs()
      expect(logs).toHaveLength(0)
    })
  })

  describe('日志数量限制', () => {
    it('应该限制最大日志数量为 100', () => {
      // 记录 150 条日志
      for (let i = 0; i < 150; i++) {
        logger.info(`日志 ${i}`)
      }

      const logs = logger.getLogs()
      expect(logs).toHaveLength(100)
      // 最早的 50 条应该被移除，所以第一条应该是日志 50
      expect(logs[0].message).toBe('日志 50')
    })
  })

  describe('downloadLogs', () => {
    it('应该创建下载链接', () => {
      // Mock document.createElement 和 click
      const mockClick = vi.fn()
      const mockCreateElement = vi.spyOn(document, 'createElement').mockImplementation(() => ({
        href: '',
        download: '',
        click: mockClick,
      }) as unknown as HTMLAnchorElement)

      // Mock URL.createObjectURL 和 revokeObjectURL
      const originalCreateObjectURL = URL.createObjectURL
      const originalRevokeObjectURL = URL.revokeObjectURL
      
      URL.createObjectURL = vi.fn(() => 'mock-url')
      URL.revokeObjectURL = vi.fn()

      logger.info('测试日志')
      logger.downloadLogs()

      expect(mockCreateElement).toHaveBeenCalledWith('a')
      expect(URL.createObjectURL).toHaveBeenCalled()
      expect(mockClick).toHaveBeenCalled()
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('mock-url')

      // 恢复原始方法
      URL.createObjectURL = originalCreateObjectURL
      URL.revokeObjectURL = originalRevokeObjectURL
      mockCreateElement.mockRestore()
    })
  })

  describe('日志格式', () => {
    it('时间戳应该是有效的格式', () => {
      logger.info('测试')
      const logs = logger.getLogs()
      
      // 时间戳应该包含时分秒
      expect(logs[0].timestamp).toMatch(/\d{1,2}:\d{2}:\d{2}/)
    })

    it('日志应该包含所有必需字段', () => {
      logger.info('测试')
      const logs = logger.getLogs()
      
      expect(logs[0]).toHaveProperty('timestamp')
      expect(logs[0]).toHaveProperty('level')
      expect(logs[0]).toHaveProperty('message')
    })
  })
})
