import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { emailQueue, emailLogs, campaigns } from "@/lib/schema"
import { eq, and, desc, sql } from "drizzle-orm"

const BATCH_SIZE = 50 // Process 50 emails at a time
const MAX_CONCURRENT_BATCHES = 5 // Allow 5 parallel processing batches

export async function POST(request: NextRequest) {
  try {
    const results = await processEmailQueue()
    return NextResponse.json(results)
  } catch (error) {
    console.error("Error processing queue:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function processEmailQueue() {
  const startTime = Date.now()
  let totalProcessed = 0
  let totalSuccess = 0
  let totalFailed = 0

  // Process multiple batches concurrently for load balancing
  const batchPromises = []
  
  for (let i = 0; i < MAX_CONCURRENT_BATCHES; i++) {
    batchPromises.push(processBatch())
  }

  const batchResults = await Promise.all(batchPromises)
  
  // Aggregate results
  batchResults.forEach(result => {
    totalProcessed += result.processed
    totalSuccess += result.success
    totalFailed += result.failed
  })

  const processingTime = Date.now() - startTime

  return {
    processed: totalProcessed,
    success: totalSuccess,
    failed: totalFailed,
    processingTime,
    throughput: Math.round((totalProcessed / processingTime) * 1000) // emails per second
  }
}

async function processBatch() {
  let processed = 0
  let success = 0
  let failed = 0

  try {
    // Get pending emails ordered by priority (highest first)
    const pendingEmails = await db
      .select({
        id: emailQueue.id,
        campaignId: emailQueue.campaignId,
        recipientEmail: emailQueue.recipientEmail,
        recipientName: emailQueue.recipientName,
        priority: emailQueue.priority,
        retryCount: emailQueue.retryCount
      })
      .from(emailQueue)
      .where(
        and(
          eq(emailQueue.status, 'pending'),
          sql`${emailQueue.scheduledAt} <= NOW()`
        )
      )
      .orderBy(desc(emailQueue.priority))
      .limit(BATCH_SIZE)

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
      .where(sql`${emailQueue.id} IN (${emailIds.join(',')})`)

    // Process emails concurrently within batch
    const emailPromises = pendingEmails.map(email => processEmail(email))
    const results = await Promise.allSettled(emailPromises)

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
          recipientEmail: email.recipientEmail,
          status: 'sent',
          sentAt: new Date(),
          createdAt: new Date()
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
          recipientEmail: email.recipientEmail,
          status: 'failed',
          error: result.status === 'rejected' ? result.reason?.message : 'Unknown error',
          createdAt: new Date()
        })

        failed++
      }
    }

    return { processed, success, failed }
  } catch (error) {
    console.error("Error processing batch:", error)
    return { processed, success, failed }
  }
}

async function processEmail(email: any): Promise<{ success: boolean; error?: string }> {
  try {
    // Simulate email sending (replace with actual email service)
    await simulateEmailSending(email)
    
    // In production, integrate with:
    // - SendGrid: await sendgrid.send(emailData)
    // - AWS SES: await ses.sendEmail(emailParams).promise()
    // - Mailgun: await mailgun.messages().send(emailData)
    
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

async function simulateEmailSending(email: any): Promise<void> {
  // Simulate network delay and potential failures
  const delay = Math.random() * 100 + 50 // 50-150ms delay
  await new Promise(resolve => setTimeout(resolve, delay))
  
  // Simulate 5% failure rate
  if (Math.random() < 0.05) {
    throw new Error("Simulated email sending failure")
  }
}