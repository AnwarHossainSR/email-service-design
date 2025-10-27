"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Users, Mail, MoreHorizontal, UserPlus, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { AlertDialogCustom } from "@/components/ui/alert-dialog-custom"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Customer {
  id: number
  name: string
  email: string
  status: 'active' | 'inactive' | 'bounced'
  createdAt: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState({ name: "", email: "", status: "active" })
  const itemsPerPage = 20

  useEffect(() => {
    fetchCustomers()
  }, [currentPage])

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/customers?page=${currentPage}&limit=${itemsPerPage}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      setCustomers(data.customers || [])
    } catch (error) {
      console.error("Error fetching customers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      if (response.ok) {
        fetchCustomers()
        setShowAddModal(false)
        setFormData({ name: "", email: "", status: "active" })
      }
    } catch (error) {
      console.error("Error adding customer:", error)
    }
  }

  const handleEdit = async () => {
    if (!selectedCustomer) return
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      if (response.ok) {
        fetchCustomers()
        setShowEditModal(false)
        setSelectedCustomer(null)
      }
    } catch (error) {
      console.error("Error updating customer:", error)
    }
  }

  const handleDelete = async () => {
    if (!selectedCustomer) return
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        fetchCustomers()
        setShowDeleteAlert(false)
        setSelectedCustomer(null)
      }
    } catch (error) {
      console.error("Error deleting customer:", error)
    }
  }

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer)
    setFormData({ name: customer.name, email: customer.email, status: customer.status })
    setShowEditModal(true)
  }

  const openDeleteAlert = (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowDeleteAlert(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'inactive': return 'secondary'
      case 'bounced': return 'destructive'
      default: return 'secondary'
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage)
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  if (loading) return <div>Loading customers...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Customers</h1>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {paginatedCustomers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No customers yet</h3>
              <p className="text-muted-foreground mb-4">Add your first customer to get started</p>
              <Button onClick={() => setShowAddModal(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            </CardContent>
          </Card>
        ) : (
          paginatedCustomers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg">{customer.name}</CardTitle>
                      <Badge variant={getStatusColor(customer.status)}>
                        {customer.status}
                      </Badge>
                    </div>
                    <CardDescription className="mt-1 flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      {customer.email}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditModal(customer)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openDeleteAlert(customer)} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Added on {new Date(customer.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          <Button 
            variant="outline" 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button 
            variant="outline" 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Add Customer Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Customer"
        description="Add a new customer to your email list"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter customer name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="Enter email address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex space-x-2 pt-4">
            <Button onClick={handleAdd}>Add Customer</Button>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Customer"
        description="Update customer information"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter customer name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="Enter email address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex space-x-2 pt-4">
            <Button onClick={handleEdit}>Update Customer</Button>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <AlertDialogCustom
        isOpen={showDeleteAlert}
        onClose={() => setShowDeleteAlert(false)}
        onConfirm={handleDelete}
        title="Delete Customer"
        description={`Are you sure you want to delete ${selectedCustomer?.name}? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  )
}