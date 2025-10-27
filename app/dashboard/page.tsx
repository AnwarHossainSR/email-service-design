"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Eye,
  Mail,
  Plus,
  TrendingUp,
  Users,
  RefreshCw
} from "lucide-react"
import Link from "next/link"

interface DashboardStats {
  totalCampaigns: number
  totalCustomers: number
  emailsSent: number
  queuePending: number
  openRate: number
  clickRate: number
  revenue: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return
      
      const response = await fetch("/api/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const getMetrics = () => {
    if (!stats) return []
    
    return [
      {
        title: "Total Campaigns",
        value: (stats.totalCampaigns || 0).toLocaleString(),
        change: "+12%",
        trend: "up",
        icon: Mail,
        description: "Active email campaigns"
      },
      {
        title: "Total Subscribers",
        value: (stats.totalCustomers || 0).toLocaleString(),
        change: "+8.2%",
        trend: "up",
        icon: Users,
        description: "Active subscribers"
      },
      {
        title: "Open Rate",
        value: `${stats.openRate || 0}%`,
        change: "+2.1%",
        trend: "up",
        icon: Eye,
        description: "Average open rate"
      },
      {
        title: "Revenue",
        value: `$${(stats.revenue || 0).toLocaleString()}`,
        change: "-3.2%",
        trend: "down",
        icon: DollarSign,
        description: "This month's revenue"
      }
    ]
  }

  const recentCampaigns = [
    {
      name: "Summer Sale 2024",
      status: "Active",
      sent: "12,543",
      opens: "3,124",
      clicks: "456",
      date: "2024-01-15"
    },
    {
      name: "Product Launch",
      status: "Completed",
      sent: "8,921",
      opens: "2,847",
      clicks: "623",
      date: "2024-01-12"
    },
    {
      name: "Newsletter #45",
      status: "Draft",
      sent: "0",
      opens: "0",
      clicks: "0",
      date: "2024-01-10"
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your email campaigns today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchStats} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/analytics">
              <TrendingUp className="mr-2 h-4 w-4" />
              Analytics
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/campaigns/new">
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          getMetrics().map((metric, index) => {
            const Icon = metric.icon
            const TrendIcon = metric.trend === "up" ? ArrowUpRight : ArrowDownRight
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <TrendIcon
                      className={`h-3 w-3 ${
                        metric.trend === "up" ? "text-green-500" : "text-red-500"
                      }`}
                    />
                    <span
                      className={
                        metric.trend === "up" ? "text-green-500" : "text-red-500"
                      }
                    >
                      {metric.change}
                    </span>
                    <span>from last month</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metric.description}
                  </p>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Campaigns */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Campaigns</CardTitle>
                  <CardDescription>
                    Your latest email campaigns and their performance
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/campaigns">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCampaigns.map((campaign, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{campaign.name}</h4>
                        <Badge
                          variant={
                            campaign.status === "Active"
                              ? "default"
                              : campaign.status === "Completed"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {campaign.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                        <span>Sent: {campaign.sent}</span>
                        <span>Opens: {campaign.opens}</span>
                        <span>Clicks: {campaign.clicks}</span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(campaign.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>This month's overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Open Rate</span>
                  <span>{stats?.openRate || 0}%</span>
                </div>
                <Progress value={stats?.openRate || 0} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Click Rate</span>
                  <span>{stats?.clickRate || 0}%</span>
                </div>
                <Progress value={stats?.clickRate || 0} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Queue Pending</span>
                  <span>{stats?.queuePending || 0}</span>
                </div>
                <Progress value={Math.min((stats?.queuePending || 0) / 100, 100)} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/dashboard/campaigns/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Campaign
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/dashboard/customers/import">
                  <Users className="mr-2 h-4 w-4" />
                  Import Contacts
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/dashboard/analytics">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Analytics
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}