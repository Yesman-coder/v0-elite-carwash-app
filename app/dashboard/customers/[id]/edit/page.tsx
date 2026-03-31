import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { CustomerForm } from "@/components/dashboard/customers/customer-form"

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single()

  if (!customer) {
    notFound()
  }

  const { data: vehicleTypes } = await supabase
    .from("vehicle_types")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")

  const { data: settings } = await supabase
    .from("business_settings")
    .select("stamps_required")
    .eq("owner_id", user.id)
    .single()

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Editar Cliente
        </h1>
        <p className="text-sm text-muted-foreground">
          Actualiza la informacion de {customer.full_name}
        </p>
      </div>
      <CustomerForm
        vehicleTypes={vehicleTypes || []}
        stampsRequired={settings?.stamps_required || 5}
        customer={customer}
      />
    </div>
  )
}
