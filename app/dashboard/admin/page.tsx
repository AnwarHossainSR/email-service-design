"use client";

import { useEffect, useState } from "react";

interface QueueStats {
  pending: number;
  processing: number;
  sent: number;
  failed: number;
}

export default function Admin() {
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [lastProcessed, setLastProcessed] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchQueueStats(token);
    }
  }, []);

  const fetchQueueStats = async (token: string) => {
    try {
      const response = await fetch("/api/queue/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setQueueStats(data);
    } catch (error) {
      console.error("Error fetching queue stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessQueue = async () => {
    setProcessing(true);
    try {
      const response = await fetch("/api/queue/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();

      setLastProcessed(
        `Processed: ${result.processed}, Success: ${result.success}, Failed: ${result.failed}`
      );

      // Refresh stats
      const token = localStorage.getItem("token");
      if (token) {
        await fetchQueueStats(token);
      }
    } catch (error) {
      console.error("Error processing queue:", error);
      setLastProcessed("Error processing queue");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>

      {/* Queue Management */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Email Queue Management
        </h2>

        {queueStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <p className="text-yellow-700 text-sm font-medium">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {queueStats.pending}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-blue-700 text-sm font-medium">Processing</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {queueStats.processing}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-green-700 text-sm font-medium">Sent</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {queueStats.sent}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <p className="text-red-700 text-sm font-medium">Failed</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {queueStats.failed}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleProcessQueue}
            disabled={processing}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
          >
            {processing ? "Processing..." : "Process Email Queue"}
          </button>

          {lastProcessed && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {lastProcessed}
            </div>
          )}
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          System Information
        </h2>

        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-gray-200">
            <span className="text-gray-700 font-medium">Application</span>
            <span className="text-gray-900">EmailFlow v1.0</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-200">
            <span className="text-gray-700 font-medium">Database</span>
            <span className="text-gray-900">PostgreSQL with Drizzle ORM</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-200">
            <span className="text-gray-700 font-medium">Queue System</span>
            <span className="text-gray-900">Priority-based Email Queue</span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-gray-700 font-medium">
              Max Retry Attempts
            </span>
            <span className="text-gray-900">3</span>
          </div>
        </div>
      </div>

      {/* Configuration Guide */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          Setup Instructions
        </h3>
        <ol className="space-y-2 text-blue-900 text-sm">
          <li>1. Set up your PostgreSQL database and configure DATABASE_URL</li>
          <li>2. Run database migrations: npm run db:migrate</li>
          <li>3. Configure JWT_SECRET for authentication</li>
          <li>4. Set up a cron job to call /api/queue/process periodically</li>
          <li>
            5. Integrate with your email provider (SendGrid, AWS SES, etc.)
          </li>
          <li>6. Monitor queue status from this admin panel</li>
        </ol>
      </div>
    </div>
  );
}
