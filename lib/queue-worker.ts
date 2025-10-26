// Background worker for processing email queue
// This can be run as a cron job or background task

export async function processEmailQueue() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/queue/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })

    const result = await response.json()
    console.log("[Queue Worker] Processing result:", result)
    return result
  } catch (error) {
    console.error("[Queue Worker] Error:", error)
    throw error
  }
}
