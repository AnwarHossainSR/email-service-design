import { Spinner } from "@/components/ui/spinner"

export default function GlobalLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="text-center">
        <Spinner className="h-12 w-12 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading EmailFlow Pro</h2>
        <p className="text-muted-foreground">Please wait while we prepare your experience...</p>
      </div>
    </div>
  )
}