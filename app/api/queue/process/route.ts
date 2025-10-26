import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { emailQueue, emailLogs, campaigns } from "@/lib/schema"
import { eq } from "drizzle-orm"

// Simulated email sending function
// In production, integrate with SendGrid, AWS SES, Mailgun, etc.
async function sendEmail(to: string, subject: string, content: string): Promise<boolean> {
  try {
    // Simulate email sending with 95% success rate
    if (Math.random() > 0.95) {
      throw new Error("Simulated email failure")
    }

    console.log(`[Email Sent] To: ${to}, Subject: ${subject}`)
    return true
  } catch (error) {
    console.error(`[Email Failed] To: ${to}, Error: ${error}`)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get pending emails from queue, ordered by priority (campaigns with higher priority first)
    const pendingEmails = await db
      .select()
      .from(emailQueue)
      .innerJoin(campaigns, eq(emailQueue.campaignId, campaigns.id))
      .where(eq(emailQueue.status, "pending"))
      .orderBy((t) => [
        // Order by campaign priority (descending), then by queue creation time
        (campaigns, { desc }) => desc(campaigns.priority),
        (emailQueue, { asc }) => asc(emailQueue.createdAt),
      ])
      .limit(100) // Process max 100 emails per request

    if (pendingEmails.length === 0) {
      return NextResponse.json({ processed: 0, message: "No pending emails" })
    }

    let successCount = 0
    let failureCount = 0

    for (const { email_queue, campaigns: campaign } of pendingEmails) {
      try {
        // Update status to processing
        await db
          .update(emailQueue)
          .set({ status: "processing", updatedAt: new Date() })
          .where(eq(emailQueue.id, email_queue.id))

        // Attempt to send email
        const success = await sendEmail(email_queue.recipientEmail, campaign.subject, campaign.content)

        if (success) {
          // Update queue item as sent
          await db
            .update(emailQueue)
            .set({
              status: "sent",
              sentAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(emailQueue.id, email_queue.id))

          // Log successful send
          await db.insert(emailLogs).values({
            campaignId: email_queue.campaignId,
            customerId: email_queue.customerId,
            recipientEmail: email_queue.recipientEmail,
            status: "sent",
            metadata: { sentAt: new Date().toISOString() },
          })

          // Update campaign stats
          await db
            .update(campaigns)
            .set({
              sentCount: campaign.sentCount + 1,
              updatedAt: new Date(),
            })
            .where(eq(campaigns.id, campaign.id))

          successCount++
        } else {
          // Increment attempts
          const newAttempts = email_queue.attempts + 1

          if (newAttempts >= email_queue.maxAttempts) {
            // Max attempts reached, mark as failed
            await db
              .update(emailQueue)
              .set({
                status: "failed",
                attempts: newAttempts,
                error: "Max retry attempts exceeded",
                updatedAt: new Date(),
              })
              .where(eq(emailQueue.id, email_queue.id))

            // Log failed send
            await db.insert(emailLogs).values({
              campaignId: email_queue.campaignId,
              customerId: email_queue.customerId,
              recipientEmail: email_queue.recipientEmail,
              status: "failed",
              metadata: { attempts: newAttempts, error: "Max retries exceeded" },
            })

            // Update campaign stats
            await db
              .update(campaigns)
              .set({
                failedCount: campaign.failedCount + 1,
                updatedAt: new Date(),
              })
              .where(eq(campaigns.id, campaign.id))

            failureCount++
          } else {
            // Retry later
            await db
              .update(emailQueue)
              .set({
                status: "pending",
                attempts: newAttempts,
                error: "Temporary failure, will retry",
                updatedAt: new Date(),
              })
              .where(eq(emailQueue.id, email_queue.id))
          }
        }
      } catch (error) {
        console.error(`Error processing email ${email_queue.id}:`, error)
        failureCount++
      }
    }

    return NextResponse.json({
      processed: pendingEmails.length,
      success: successCount,
      failed: failureCount,
    })
  } catch (error) {
    console.error("Queue processing error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
