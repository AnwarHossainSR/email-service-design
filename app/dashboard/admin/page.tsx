"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Play, 
  RotateCcw, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from "lucide-react"

interface QueueStats {
  pending: number
  processing: number
  sent: number
  failed: number
  priorityDistribution?: Array<{ priority: string; count: number }>
  throughputPerHour?: number
  totalInQueue?: number
}

export default function Admin() {
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [demoRunning, setDemoRunning] = useState(false)
  const [lastProcessed, setLastProcessed] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchQueueStats()
    if (autoRefresh) {
      const interval = setInterval(fetchQueueStats, 3000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const fetchQueueStats = async () => {
    try {
      const response = await fetch("/api/queue/status")
      const data = await response.json()
      setQueueStats(data)
    } catch (error) {
      console.error("Error fetching queue stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleProcessQueue = async () => {
    setProcessing(true)
    try {
      const response = await fetch("/api/queue/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const result = await response.json()

      setLastProcessed(`Processed: ${result.processed}, Success: ${result.success}, Failed: ${result.failed}, Throughput: ${result.throughput || 0} emails/sec`)
      await fetchQueueStats()
    } catch (error) {
      console.error("Error processing queue:", error)
      setLastProcessed("Error processing queue")
    } finally {
      setProcessing(false)
    }
  }

  const handlePriorityDemo = async () => {
    setDemoRunning(true)
    try {
      const response = await fetch("/api/demo/queue-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: "priority_demo" })
      })
      const result = await response.json()
      
      if (response.ok) {
        setLastProcessed(`Demo created: ${result.campaigns?.length} campaigns queued`)
        await fetchQueueStats()
      } else {
        setLastProcessed(`Demo failed: ${result.error}`)
      }
    } catch (error) {
      console.error("Error running demo:", error)
      setLastProcessed("Demo failed")
    } finally {
      setDemoRunning(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Email Queue Admin</h1>
        <div className="flex gap-2">
          <Button 
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            size="sm"
          >
            <Activity className="mr-2 h-4 w-4" />
            Auto Refresh
          </Button>
          <Button onClick={fetchQueueStats} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Queue Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{queueStats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">Emails waiting</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{queueStats?.processing || 0}</div>
            <p className="text-xs text-muted-foreground">Currently sending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{queueStats?.sent || 0}</div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{queueStats?.failed || 0}</div>
            <p className="text-xs text-muted-foreground">Delivery failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Queue Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Management</CardTitle>
          <CardDescription>Control email queue processing and run demonstrations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={handleProcessQueue}
              disabled={processing}
              className="w-full"
            >
              {processing ? (
                <>
                  <Activity className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Process Queue
                </>
              )}
            </Button>

            <Button
              onClick={handlePriorityDemo}
              disabled={demoRunning}
              variant="outline"
              className="w-full"
            >
              {demoRunning ? (
                <>
                  <Activity className="mr-2 h-4 w-4 animate-spin" />
                  Creating Demo...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Priority Demo
                </>
              )}
            </Button>
          </div>

          {lastProcessed && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 text-sm font-medium">Last Action:</p>
              <p className="text-blue-600 text-sm">{lastProcessed}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Priority Queue Explanation */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Queue System</CardTitle>
          <CardDescription>How our fair email processing works</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">✅ Problem Solved</h4>
              <p className="text-green-700 text-sm">
                User with 100 emails doesn't wait for user with 100,000 emails to finish. 
                Our priority system ensures fair processing for all campaign sizes.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h5 className="font-medium text-blue-800">Priority Factors</h5>
                <ul className="text-blue-700 mt-1 space-y-1">
                  <li>• Campaign urgency level</li>
                  <li>• Recipient count (smaller = higher)</li>
                  <li>• Queue position</li>
                </ul>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <h5 className="font-medium text-purple-800">Load Balancing</h5>
                <ul className="text-purple-700 mt-1 space-y-1">
                  <li>• Concurrent batch processing</li>
                  <li>• Parallel email sending</li>
                  <li>• Resource optimization</li>
                </ul>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <h5 className="font-medium text-orange-800">Reliability</h5>
                <ul className="text-orange-700 mt-1 space-y-1">
                  <li>• Automatic retry logic</li>
                  <li>• Exponential backoff</li>
                  <li>• Error tracking & logging</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}