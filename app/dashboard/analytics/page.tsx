"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface CampaignStat {
  id: number;
  name: string;
  status: string;
  totalRecipients: number;
  sent: number;
  failed: number;
  successRate: number;
  createdAt: string;
}

interface AnalyticsData {
  totalSent: number;
  totalFailed: number;
  totalBounced: number;
  successRate: number;
  campaignStats: CampaignStat[];
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchAnalytics(token);
    }
  }, []);

  const fetchAnalytics = async (token: string) => {
    try {
      const response = await fetch("/api/analytics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No analytics data available yet.</p>
      </div>
    );
  }

  const pieData = [
    { name: "Sent", value: analytics.totalSent },
    { name: "Failed", value: analytics.totalFailed },
    { name: "Bounced", value: analytics.totalBounced },
  ];

  const COLORS = ["#3b82f6", "#ef4444", "#f59e0b"];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Total Sent</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {analytics.totalSent}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Total Failed</p>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {analytics.totalFailed}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Total Bounced</p>
          <p className="text-3xl font-bold text-amber-600 mt-2">
            {analytics.totalBounced}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Success Rate</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {analytics.successRate}%
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Email Status Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Campaign Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Campaign Success Rates
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.campaignStats.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="successRate" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Campaign Details Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Campaign Details
          </h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Campaign
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Recipients
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Sent
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Failed
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Success Rate
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {analytics.campaignStats.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">
                  {campaign.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {campaign.totalRecipients}
                </td>
                <td className="px-6 py-4 text-sm text-green-600 font-medium">
                  {campaign.sent}
                </td>
                <td className="px-6 py-4 text-sm text-red-600 font-medium">
                  {campaign.failed}
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${campaign.successRate}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {campaign.successRate}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
