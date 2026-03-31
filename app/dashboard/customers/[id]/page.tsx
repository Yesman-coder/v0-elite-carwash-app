import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { CustomerDetail } from "@/components/dashboard/customers/customer-detail"

export default async function CustomerDetailPage({
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
    .select(
      `
      *,
      vehicle_type:vehicle_types(*),
      loyalty_cards(*, stamps:loyalty_stamps(*, service:services(name)))
    `
    )
    .eq("id", id)
    .eq("owner_id", user.id)
    .single()

  if (!customer) {
    notFound()
  }

  const { data: visits } = await supabase
    .from("visits")
    .select("*, service:services(name)")
    .eq("customer_id", id)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("owner_id", user.id)
    .eq("is_active", true)
    .order("name")

  const { data: settings } = await supabase
    .from("business_settings")
    .select("stamps_required")
    .eq("owner_id", user.id)
    .single()

  const { data: plans } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("owner_id", user.id)
    .eq("is_active", true)
    .order("price_cents")

  const { data: activeSubscription } = await supabase
    .from("subscriptions")
    .select("*, plan:subscription_plans(*)")
    .eq("customer_id", id)
    .eq("owner_id", user.id)
    .eq("is_active", true)
    .single()

  return (
    <CustomerDetail
      customer={customer}
      visits={visits || []}
      services={services || []}
      stampsRequired={settings?.stamps_required || 5}
      subscriptionPlans={plans || []}
      activeSubscription={activeSubscription || null}
    />
  )
}
