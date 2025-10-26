"use client"

import { useEffect, useState } from "react"
import CreateCampaignModal from "./create-campaign-modal"

interface Campaign {
  id: number
  name: string
  subject: string
  status: string
  totalRecipients: number
  sentCount: number
  failedCount: number
  createdAt: string
}

export default function CampaignsList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/campaigns", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setCampaigns(data)
    } catch (error) {
      console.error("Error fetching campaigns:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-800"
      case "sending":
        return "bg-blue-100 text-blue-800"
      case "scheduled":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) return <div className="text-center py-8">Loading campaigns...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Campaigns</h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Create Campaign
        </button>
      </div>

      {showModal && (
        <CreateCampaignModal
          onClose={() => {
            setShowModal(false)
            fetchCampaigns()
          }}
        />
      )}

      {campaigns.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600">No campaigns yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Recipients</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Sent</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Failed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{campaign.name}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{campaign.totalRecipients}</td>
                  <td className="px-6 py-4 text-sm text-green-600 font-medium">{campaign.sentCount}</td>
                  <td className="px-6 py-4 text-sm text-red-600 font-medium">{campaign.failedCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
