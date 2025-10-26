"use client"

import type React from "react"

import { useState, useEffect } from "react"

interface Customer {
  id: number
  name: string
  email: string
}

export default function CreateCampaignModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [priority, setPriority] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/customers", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error("Error fetching customers:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          subject,
          content,
          recipientIds: selectedCustomers,
          priority,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Failed to create campaign")
        return
      }

      onClose()
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Create Campaign</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Summer Sale"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Email subject"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
              placeholder="Email body content"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority (0-10)</label>
            <input
              type="number"
              min="0"
              max="10"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Recipients</label>
            <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
              {customers.length === 0 ? (
                <p className="text-gray-500 text-sm">No customers available</p>
              ) : (
                customers.map((customer) => (
                  <label key={customer.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.includes(customer.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCustomers([...selectedCustomers, customer.id])
                        } else {
                          setSelectedCustomers(selectedCustomers.filter((id) => id !== customer.id))
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">
                      {customer.name} ({customer.email})
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              {loading ? "Creating..." : "Create Campaign"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
