import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { PortalView } from "@/components/portal/portal-view"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mi Tarjeta - Elite Carwash",
  description: "Tu tarjeta de fidelidad Elite Carwash",
}

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()

  // Use the RPC functions that return jsonb
  const { data: customerResult } = await supabase.rpc(
    "get_customer_by_token",
    { p_token: token }
  )

  if (
    !customerResult ||
    (typeof customerResult === "object" && !customerResult.success)
  ) {
    notFound()
  }

  const customer = customerResult.customer

  // Get loyalty cards
  const { data: loyaltyResult } = await supabase.rpc("get_loyalty_by_token", {
    p_token: token,
  })

  // Get recent visits
  const { data: visitsResult } = await supabase.rpc("get_visits_by_token", {
    p_token: token,
  })

  return (
    <PortalView
      customer={customer}
      cards={loyaltyResult?.cards || []}
      visits={visitsResult?.visits || []}
    />
  )
}
