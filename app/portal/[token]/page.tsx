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

  // Use the RPC function to get customer data
  const { data: customerData, error: customerError } = await supabase.rpc(
    "get_portal_customer",
    { p_token: token }
  )

  if (customerError || !customerData || customerData.length === 0) {
    notFound()
  }

  const customer = customerData[0]

  // Get loyalty cards
  const { data: cardsData } = await supabase.rpc("get_portal_cards", {
    p_token: token,
  })

  // Get recent visits
  const { data: visitsData } = await supabase.rpc("get_portal_visits", {
    p_token: token,
    p_limit: 20,
  })

  return (
    <PortalView
      customer={customer}
      cards={cardsData || []}
      visits={visitsData || []}
    />
  )
}
