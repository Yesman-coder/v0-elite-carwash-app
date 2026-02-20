import { createClient } from "@/lib/supabase/server"
import { CustomerList } from "@/components/dashboard/customers/customer-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function CustomersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: customers } = await supabase
    .from("customers")
    .select(
      `
      *,
      vehicle_type:vehicle_types(*),
      loyalty_cards(*)
    `
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Clientes
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona tus clientes y sus vehiculos
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/customers/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Link>
        </Button>
      </div>
      <CustomerList customers={customers || []} />
    </div>
  )
}
