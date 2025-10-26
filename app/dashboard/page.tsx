"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import DashboardLayout from "@/components/dashboard-layout"
import CampaignsList from "@/components/campaigns-list"
import CustomersList from "@/components/customers-list"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("campaigns")
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (!token || !userData) {
      router.push("/")
      return
    }

    setUser(JSON.parse(userData))
  }, [router])

  if (!user) return null

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex gap-2">
            <Link
              href="/analytics"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
            >
              Analytics
            </Link>
            <Link
              href="/admin"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
            >
              Admin
            </Link>
          </div>
        </div>

        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("campaigns")}
            className={`px-4 py-2 font-medium transition ${
              activeTab === "campaigns"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Campaigns
          </button>
          <button
            onClick={() => setActiveTab("customers")}
            className={`px-4 py-2 font-medium transition ${
              activeTab === "customers"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Customers
          </button>
        </div>

        {activeTab === "campaigns" && <CampaignsList />}
        {activeTab === "customers" && <CustomersList />}
      </div>
    </DashboardLayout>
  )
}
