import { createClient } from "@/lib/supabase/server"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { OilChangeReminders } from "@/components/dashboard/oil-change-reminders"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch counts + oil change candidates in parallel
  const [customersRes, visitsRes, cardsRes, redeemRes, oilChangeRes] =
    await Promise.all([
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
      // Fetch customers that have both last_km and last_oil_change_km
      supabase
        .from("customers")
        .select(
          "id, full_name, phone, vehicle_make, vehicle_model, last_km, last_oil_change_km"
        )
        .eq("owner_id", user.id)
        .eq("is_active", true)
        .not("last_km", "is", null)
        .not("last_oil_change_km", "is", null)
        .order("full_name"),
    ])

  // Recent visits today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { count: todayVisits } = await supabase
    .from("visits")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id)
    .gte("created_at", today.toISOString())

  // Filter oil change reminders: >= 5000 km since last change
  const oilChangeReminders = (oilChangeRes.data || [])
    .filter(
      (c) =>
        c.last_km != null &&
        c.last_oil_change_km != null &&
        c.last_km - c.last_oil_change_km >= 5000
    )
    .map((c) => ({
      id: c.id,
      full_name: c.full_name,
      phone: c.phone,
      vehicle_make: c.vehicle_make,
      vehicle_model: c.vehicle_model,
      last_km: c.last_km as number,
      last_oil_change_km: c.last_oil_change_km as number,
      km_since_change: (c.last_km as number) - (c.last_oil_change_km as number),
    }))
    .sort((a, b) => b.km_since_change - a.km_since_change)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">Resumen de tu negocio</p>
      </div>
      <DashboardStats
        totalCustomers={customersRes.count || 0}
        totalVisits={visitsRes.count || 0}
        activeCards={cardsRes.count || 0}
        pendingRedemptions={redeemRes.count || 0}
        todayVisits={todayVisits || 0}
      />
      <OilChangeReminders reminders={oilChangeReminders} />
    </div>
  )
}
