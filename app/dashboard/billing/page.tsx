"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Download, Calendar } from "lucide-react"

export default function BillingPage() {
  const currentPlan = {
    name: "Pro Plan",
    price: "$49",
    period: "month",
    emails: "50,000",
    features: ["Advanced Analytics", "Priority Support", "Custom Templates", "API Access"]
  }

  const invoices = [
    { id: "INV-001", date: "2024-01-01", amount: "$49.00", status: "Paid" },
    { id: "INV-002", date: "2023-12-01", amount: "$49.00", status: "Paid" },
    { id: "INV-003", date: "2023-11-01", amount: "$49.00", status: "Paid" }
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Billing & Subscription</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Manage your subscription and billing details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">{currentPlan.name}</h3>
                <p className="text-muted-foreground">
                  {currentPlan.price}/{currentPlan.period} • {currentPlan.emails} emails
                </p>
                <div className="flex gap-2 mt-2">
                  {currentPlan.features.map((feature, index) => (
                    <Badge key={index} variant="secondary">{feature}</Badge>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <Button variant="outline">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Update Payment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>Download your invoices and view payment history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{invoice.id}</p>
                      <p className="text-sm text-muted-foreground">{invoice.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-medium">{invoice.amount}</span>
                    <Badge variant="secondary">{invoice.status}</Badge>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}