import { db } from "./db"
import { emailQueue, emailLogs, campaigns, customers } from "./schema"
import { eq, and, desc, sql, lt } from "drizzle-orm"
import { logger } from "./logger"

export class EmailQueueProcessor {
  private isProcessing = false
  private batchSize = 50
  private maxConcurrentBatches = 5
  private processingInterval = 5000 // 5 seconds

  async start() {
    await logger.queueInfo("Email Queue Processor started")
    this.scheduleProcessing()
  }

  private scheduleProcessing() {
    setInterval(async () => {
      if (!this.isProcessing) {
        await this.processQueue()
      }
    }, this.processingInterval)
  }

  async processQueue() {
    if (this.isProcessing) return
    
    this.isProcessing = true
    const startTime = Date.now()
    
    try {
      await logger.queueInfo("Processing email queue batch", { batchSize: this.batchSize, maxConcurrentBatches: this.maxConcurrentBatches })
      
      // Process multiple batches concurrently for load balancing
      const batchPromises = []
      for (let i = 0; i < this.maxConcurrentBatches; i++) {
        batchPromises.push(this.processBatch())
      }

      const results = await Promise.all(batchPromises)
      
      // Aggregate results
      const totalResults = results.reduce((acc, result) => ({
        processed: acc.processed + result.processed,
        success: acc.success + result.success,
        failed: acc.failed + result.failed
      }), { processed: 0, success: 0, failed: 0 })

      const processingTime = Date.now() - startTime
      const throughput = Math.round((totalResults.processed / processingTime) * 1000)

      if (totalResults.processed > 0) {
        await logger.queueInfo(`Processed ${totalResults.processed} emails`, {
          success: totalResults.success,
          failed: totalResults.failed,
          processingTime,
          throughput
        })
      }

      return totalResults
    } catch (error) {
      await logger.queueError("Queue processing failed", error)
    } finally {
      this.isProcessing = false
    }
  }

  private async processBatch() {
    try {
      // Get pending emails ordered by priority (highest first)
      // This ensures smaller campaigns (higher priority) are processed first
      const pendingEmails = await db
        .select({
          id: emailQueue.id,
          campaignId: emailQueue.campaignId,
          customerId: emailQueue.customerId,
          recipientEmail: emailQueue.recipientEmail,
          recipientName: emailQueue.recipientName,
          priority: emailQueue.priority,
          retryCount: emailQueue.retryCount
        })
        .from(emailQueue)
        .where(
          and(
            eq(emailQueue.status, 'pending'),
            lt(emailQueue.scheduledAt, new Date())
          )
        )
        .orderBy(desc(emailQueue.priority))
        .limit(this.batchSize)

      if (pendingEmails.length === 0) {
        return { processed: 0, success: 0, failed: 0 }
      }

      // Mark as processing
      const emailIds = pendingEmails.map(email => email.id)
      await db
        .update(emailQueue)
        .set({ 
          status: 'processing',
          updatedAt: new Date()
        })
        .where(sql`${emailQueue.id} = ANY(${emailIds})`)

      // Process emails concurrently within batch
      const emailPromises = pendingEmails.map(email => this.processEmail(email))
      const results = await Promise.allSettled(emailPromises)

      let processed = 0, success = 0, failed = 0

      // Update status based on results
      for (let i = 0; i < results.length; i++) {
        const result = results[i]
        const email = pendingEmails[i]
        processed++

        if (result.status === 'fulfilled' && result.value.success) {
          // Mark as sent
          await db
            .update(emailQueue)
            .set({ 
              status: 'sent',
              sentAt: new Date(),
              updatedAt: new Date()
            })
            .where(eq(emailQueue.id, email.id))

          // Log success
          await db.insert(emailLogs).values({
            campaignId: email.campaignId,
            customerId: email.customerId,
            recipientEmail: email.recipientEmail,
            status: 'sent',
            sentAt: new Date()
          })

          success++
        } else {
          // Handle failure with retry logic
          const newRetryCount = (email.retryCount || 0) + 1
          const maxRetries = 3

          if (newRetryCount >= maxRetries) {
            // Mark as failed permanently
            await db
              .update(emailQueue)
              .set({ 
                status: 'failed',
                retryCount: newRetryCount,
                error: result.status === 'rejected' ? result.reason?.message : 'Unknown error',
                updatedAt: new Date()
              })
              .where(eq(emailQueue.id, email.id))
          } else {
            // Schedule for retry with exponential backoff
            const retryDelay = Math.pow(2, newRetryCount) * 60000 // 2^n minutes
            const retryAt = new Date(Date.now() + retryDelay)
            
            await db
              .update(emailQueue)
              .set({ 
                status: 'pending',
                retryCount: newRetryCount,
                scheduledAt: retryAt,
                updatedAt: new Date()
              })
              .where(eq(emailQueue.id, email.id))
          }

          // Log failure
          await db.insert(emailLogs).values({
            campaignId: email.campaignId,
            customerId: email.customerId || null,
            recipientEmail: email.recipientEmail,
            status: 'failed',
            metadata: { error: result.status === 'rejected' ? result.reason?.message : 'Unknown error' }
          })

          failed++
        }
      }

      return { processed, success, failed }
    } catch (error) {
      await logger.queueError("Batch processing failed", error)
      return { processed: 0, success: 0, failed: 0 }
    }
  }

  private async processEmail(email: any): Promise<{ success: boolean; error?: string }> {
    try {
      // Simulate email sending with realistic delays
      await this.simulateEmailSending(email)
      
      // In production, integrate with actual email service:
      // - SendGrid: await sendgrid.send(emailData)
      // - AWS SES: await ses.sendEmail(emailParams).promise()
      // - Mailgun: await mailgun.messages().send(emailData)
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  private async simulateEmailSending(email: any): Promise<void> {
    // Simulate realistic network delays
    const delay = Math.random() * 100 + 50 // 50-150ms delay
    await new Promise(resolve => setTimeout(resolve, delay))
    
    // Simulate 2% failure rate
    if (Math.random() < 0.02) {
      throw new Error("Simulated email delivery failure")
    }
  }

  // Priority calculation for fair queue management
  static calculatePriority(
    campaignPriority: 'high' | 'normal' | 'low',
    totalRecipients: number,
    batchIndex: number = 0
  ): number {
    // Base priority scores
    const basePriority = {
      'high': 1000,
      'normal': 500, 
      'low': 100
    }[campaignPriority]

    // Smaller campaigns get priority boost (inverse of size)
    const sizePenalty = Math.min(totalRecipients / 1000, 500)
    
    // Earlier emails in campaign get slight priority
    const positionBonus = Math.max(0, 50 - (batchIndex / 100))

    return basePriority - sizePenalty + positionBonus
  }
}

// Export singleton instance
export const queueProcessor = new EmailQueueProcessor()