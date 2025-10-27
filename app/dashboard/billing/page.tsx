"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Check, Crown, Zap, Star, CreditCard } from "lucide-react"

interface UserSubscription {
  plan: string
  emailsSent: number
  emailLimit: number
  expiresAt?: string
}

const plans = [
  {
    name: "Free",
    price: 0,
    emailLimit: 20,
    features: ["20 emails/month", "Basic templates", "Email support"],
    icon: <Star className="h-6 w-6" />,
    color: "text-gray-600"
  },
  {
    name: "Pro",
    price: 29,
    emailLimit: 10000,
    features: ["10,000 emails/month", "Advanced templates", "Priority support", "Analytics"],
    icon: <Zap className="h-6 w-6" />,
    color: "text-blue-600",
    popular: true
  },
  {
    name: "Enterprise",
    price: 99,
    emailLimit: 100000,
    features: ["100,000 emails/month", "Custom templates", "24/7 support", "Advanced analytics", "API access"],
    icon: <Crown className="h-6 w-6" />,
    color: "text-purple-600"
  }
]

export default function BillingPage() {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/subscription", {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      setSubscription(data)
    } catch (error) {
      console.error("Error fetching subscription:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (planName: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/subscription/upgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ plan: planName.toLowerCase() })
      })
      
      if (response.ok) {
        fetchSubscription()
      }
    } catch (error) {
      console.error("Error upgrading subscription:", error)
    }
  }

  if (loading) return <div>Loading subscription...</div>

  const currentPlan = plans.find(p => p.name.toLowerCase() === subscription?.plan)
  const usagePercentage = subscription ? (subscription.emailsSent / subscription.emailLimit) * 100 : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-2">Manage your subscription and billing information</p>
      </div>

      {/* Current Plan */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {currentPlan?.icon}
              <span>Current Plan: {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}</span>
            </CardTitle>
            <CardDescription>Your current subscription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Emails sent this month</span>
                <span>{subscription.emailsSent.toLocaleString()} / {subscription.emailLimit.toLocaleString()}</span>
              </div>
              <Progress value={usagePercentage} className="h-2" />
              {usagePercentage > 80 && (
                <p className="text-sm text-orange-600 mt-2">
                  You're approaching your email limit. Consider upgrading your plan.
                </p>
              )}
            </div>
            {subscription.expiresAt && (
              <div className="text-sm text-muted-foreground">
                Expires on: {new Date(subscription.expiresAt).toLocaleDateString()}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Available Plans</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.name} className={`relative ${plan.popular ? 'border-blue-500 shadow-lg' : ''}`}>
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center">
                <div className={`mx-auto mb-4 ${plan.color}`}>
                  {plan.icon}
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="text-3xl font-bold">
                  ${plan.price}
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                </div>
                <CardDescription>{plan.emailLimit.toLocaleString()} emails per month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full" 
                  variant={subscription?.plan === plan.name.toLowerCase() ? "outline" : "default"}
                  disabled={subscription?.plan === plan.name.toLowerCase()}
                  onClick={() => handleUpgrade(plan.name)}
                >
                  {subscription?.plan === plan.name.toLowerCase() ? (
                    "Current Plan"
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      {plan.price === 0 ? "Downgrade" : "Upgrade"}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
          <CardDescription>Your email sending activity this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{subscription?.emailsSent || 0}</div>
              <div className="text-sm text-muted-foreground">Emails Sent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{subscription ? subscription.emailLimit - subscription.emailsSent : 0}</div>
              <div className="text-sm text-muted-foreground">Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{usagePercentage.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Usage</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}