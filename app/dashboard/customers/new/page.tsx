import { createClient } from "@/lib/supabase/server"
import { CustomerForm } from "@/components/dashboard/customers/customer-form"

export default async function NewCustomerPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: vehicleTypes } = await supabase
    .from("vehicle_types")
    .select("*")
    .eq("owner_id", user.id)
    .eq("is_active", true)
    .order("name")

  const { data: settings } = await supabase
    .from("business_settings")
    .select("stamps_required")
    .eq("owner_id", user.id)
    .single()

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Nuevo Cliente
        </h1>
        <p className="text-sm text-muted-foreground">
          Registra un nuevo cliente y crea su tarjeta de fidelidad
        </p>
      </div>
      <CustomerForm
        vehicleTypes={vehicleTypes || []}
        stampsRequired={settings?.stamps_required || 5}
      />
    </div>
  )
}
