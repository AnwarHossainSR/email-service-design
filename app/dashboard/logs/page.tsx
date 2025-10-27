"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Filter, 
  RefreshCw, 
  AlertTriangle, 
  Info, 
  AlertCircle, 
  Bug,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

interface SystemLog {
  id: number
  level: string
  category: string
  message: string
  userId?: number
  campaignId?: number
  metadata?: any
  ipAddress?: string
  createdAt: string
}

export default function LogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    level: '',
    category: '',
    search: '',
    page: 1
  })
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    fetchLogs()
  }, [filters])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.level) params.append('level', filters.level)
      if (filters.category) params.append('category', filters.category)
      if (filters.search) params.append('search', filters.search)
      params.append('page', filters.page.toString())

      const response = await fetch(`/api/logs?${params}`)
      const data = await response.json()
      
      setLogs(data.logs || [])
      setPagination(data.pagination || { page: 1, total: 0, pages: 0 })
    } catch (error) {
      console.error("Error fetching logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warn': return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'debug': return <Bug className="h-4 w-4 text-purple-500" />
      default: return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'destructive'
      case 'warn': return 'secondary'
      case 'debug': return 'outline'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">System Logs</h1>
        <Button onClick={fetchLogs} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                className="pl-10"
              />
            </div>
            
            <select 
              value={filters.level} 
              onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value, page: 1 }))}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Levels</option>
              <option value="error">Error</option>
              <option value="warn">Warning</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>

            <select 
              value={filters.category} 
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value, page: 1 }))}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Categories</option>
              <option value="queue">Queue</option>
              <option value="auth">Authentication</option>
              <option value="api">API</option>
              <option value="email">Email</option>
              <option value="system">System</option>
              <option value="campaign">Campaign</option>
            </select>

            <Button 
              variant="outline" 
              onClick={() => setFilters({ level: '', category: '', search: '', page: 1 })}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Logs ({pagination.total})</CardTitle>
          <CardDescription>
            System activity and error logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No logs found</div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getLevelIcon(log.level)}
                        <Badge variant={getLevelColor(log.level) as any}>
                          {log.level.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{log.category}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-1">{log.message}</p>
                      {log.metadata && (
                        <details className="text-xs text-muted-foreground">
                          <summary className="cursor-pointer hover:text-foreground">
                            View Details
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      {log.userId && <div>User: {log.userId}</div>}
                      {log.campaignId && <div>Campaign: {log.campaignId}</div>}
                      {log.ipAddress && <div>IP: {log.ipAddress}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.pages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.pages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}