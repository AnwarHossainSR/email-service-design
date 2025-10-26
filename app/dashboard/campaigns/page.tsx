"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, Send, Users, Eye, MousePointer, Calendar, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Campaign {
  id: number
  name: string
  subject: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused'
  recipients: number
  sent: number
  opens: number
  clicks: number
  createdAt: string
  scheduledAt?: string
  priority: 'low' | 'normal' | 'high'
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/campaigns", {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      setCampaigns(data.campaigns || [])
    } catch (error) {
      console.error("Error fetching campaigns:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary'
      case 'scheduled': return 'outline'
      case 'sending': return 'default'
      case 'sent': return 'secondary'
      case 'paused': return 'destructive'
      default: return 'secondary'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600'
      case 'normal': return 'text-blue-600'
      case 'low': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.subject.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div>Loading campaigns...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Email Campaigns</h1>
        <Button asChild>
          <Link href="/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Link>
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredCampaigns.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Send className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground mb-4">Create your first email campaign to get started</p>
              <Button asChild>
                <Link href="/campaigns/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Campaign
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <Badge variant={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                      <span className={`text-xs font-medium ${getPriorityColor(campaign.priority)}`}>
                        {campaign.priority.toUpperCase()}
                      </span>
                    </div>
                    <CardDescription className="mt-1">
                      {campaign.subject}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Duplicate</DropdownMenuItem>
                      <DropdownMenuItem>View Report</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{campaign.recipients.toLocaleString()}</p>
                      <p className="text-muted-foreground">Recipients</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Send className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{campaign.sent.toLocaleString()}</p>
                      <p className="text-muted-foreground">Sent</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{campaign.opens.toLocaleString()}</p>
                      <p className="text-muted-foreground">Opens</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MousePointer className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{campaign.clicks.toLocaleString()}</p>
                      <p className="text-muted-foreground">Clicks</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-muted-foreground">Created</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}