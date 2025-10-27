import { db } from "./db"
import { systemLogs } from "./schema"

export type LogLevel = 'info' | 'warn' | 'error' | 'debug'
export type LogCategory = 'queue' | 'auth' | 'api' | 'email' | 'system' | 'campaign'

interface LogData {
  level: LogLevel
  category: LogCategory
  message: string
  userId?: number
  campaignId?: number
  metadata?: any
  ipAddress?: string
  userAgent?: string
}

class Logger {
  async log(data: LogData) {
    try {
      await db.insert(systemLogs).values({
        level: data.level,
        category: data.category,
        message: data.message,
        userId: data.userId || null,
        campaignId: data.campaignId || null,
        metadata: data.metadata || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        createdAt: new Date()
      })

      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        const timestamp = new Date().toISOString()
        const logMessage = `[${timestamp}] ${data.level.toUpperCase()} [${data.category}] ${data.message}`
        
        switch (data.level) {
          case 'error':
            console.error(logMessage, data.metadata)
            break
          case 'warn':
            console.warn(logMessage, data.metadata)
            break
          case 'debug':
            console.debug(logMessage, data.metadata)
            break
          default:
            console.log(logMessage, data.metadata)
        }
      }
    } catch (error) {
      // Fallback to console if database logging fails
      console.error('Failed to write to system logs:', error)
      console.log('Original log:', data)
    }
  }

  info(category: LogCategory, message: string, metadata?: any, userId?: number, campaignId?: number) {
    return this.log({ level: 'info', category, message, metadata, userId, campaignId })
  }

  warn(category: LogCategory, message: string, metadata?: any, userId?: number, campaignId?: number) {
    return this.log({ level: 'warn', category, message, metadata, userId, campaignId })
  }

  error(category: LogCategory, message: string, metadata?: any, userId?: number, campaignId?: number) {
    return this.log({ level: 'error', category, message, metadata, userId, campaignId })
  }

  debug(category: LogCategory, message: string, metadata?: any, userId?: number, campaignId?: number) {
    return this.log({ level: 'debug', category, message, metadata, userId, campaignId })
  }

  // Queue specific logging
  queueInfo(message: string, metadata?: any, campaignId?: number) {
    return this.info('queue', message, metadata, undefined, campaignId)
  }

  queueError(message: string, error?: any, campaignId?: number) {
    return this.error('queue', message, { error: error?.message, stack: error?.stack }, undefined, campaignId)
  }

  // Auth specific logging
  authInfo(message: string, userId?: number, metadata?: any) {
    return this.info('auth', message, metadata, userId)
  }

  authError(message: string, error?: any, userId?: number) {
    return this.error('auth', message, { error: error?.message }, userId)
  }

  // API specific logging
  apiInfo(message: string, metadata?: any, userId?: number) {
    return this.info('api', message, metadata, userId)
  }

  apiError(message: string, error?: any, userId?: number) {
    return this.error('api', message, { error: error?.message, stack: error?.stack }, userId)
  }

  // Email specific logging
  emailInfo(message: string, metadata?: any, campaignId?: number) {
    return this.info('email', message, metadata, undefined, campaignId)
  }

  emailError(message: string, error?: any, campaignId?: number) {
    return this.error('email', message, { error: error?.message }, undefined, campaignId)
  }
}

export const logger = new Logger()