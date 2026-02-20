import { createClient } from "@/lib/supabase/server"
import { LoyaltyDashboard } from "@/components/dashboard/loyalty/loyalty-dashboard"

export default async function LoyaltyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: cards } = await supabase
    .from("loyalty_cards")
    .select(
      `
      *,
      customer:customers(id, full_name, phone, last_km),
      stamps:loyalty_stamps(*)
    `
    )
    .eq("owner_id", user.id)
    .in("status", ["active", "completed"])
    .order("updated_at", { ascending: false })

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("owner_id", user.id)
    .eq("is_active", true)
    .order("name")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Tarjetas de Fidelidad
        </h1>
        <p className="text-sm text-muted-foreground">
          Gestiona sellos y canjea lavados gratis
        </p>
      </div>
      <LoyaltyDashboard cards={cards || []} services={services || []} />
    </div>
  )
}
