import { createClient } from "@/lib/supabase/server"
import { ServiceManager } from "@/components/dashboard/services/service-manager"

export default async function ServicesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("owner_id", user.id)
    .order("category")
    .order("name")

  const { data: vehicleTypes } = await supabase
    .from("vehicle_types")
    .select("*")
    .eq("owner_id", user.id)
    .order("name")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Servicios
        </h1>
        <p className="text-sm text-muted-foreground">
          Gestiona los servicios de lavado que ofreces
        </p>
      </div>
      <ServiceManager
        services={services || []}
        vehicleTypes={vehicleTypes || []}
      />
    </div>
  )
}
