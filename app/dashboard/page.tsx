import { createClient } from "@/lib/supabase/server"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch counts
  const [customersRes, visitsRes, cardsRes, redeemRes] = await Promise.all([
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id),
    supabase
      .from("visits")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id),
    supabase
      .from("loyalty_cards")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .eq("status", "active"),
    supabase
      .from("loyalty_cards")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .eq("status", "completed"),
  ])

  // Recent visits today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { count: todayVisits } = await supabase
    .from("visits")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id)
    .gte("created_at", today.toISOString())

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Resumen de tu negocio
        </p>
      </div>
      <DashboardStats
        totalCustomers={customersRes.count || 0}
        totalVisits={visitsRes.count || 0}
        activeCards={cardsRes.count || 0}
        pendingRedemptions={redeemRes.count || 0}
        todayVisits={todayVisits || 0}
      />
    </div>
  )
}
