import CustomersList from "@/components/customers-list"

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Customers</h1>
      <CustomersList />
    </div>
  )
}