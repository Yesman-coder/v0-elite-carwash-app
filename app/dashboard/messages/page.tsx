import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MessagingDashboard } from "@/components/dashboard/messages/messaging-dashboard"

export default async function MessagesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const [campaignsResult, customersResult, settingsResult] = await Promise.all([
    supabase
      .from("sms_campaigns")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("customers")
      .select("id, full_name, phone")
      .eq("owner_id", user.id)
      .eq("is_active", true),
    supabase
      .from("business_settings")
      .select("*")
      .eq("owner_id", user.id)
      .single(),
  ])

  return (
    <MessagingDashboard
      campaigns={campaignsResult.data || []}
      customers={customersResult.data || []}
      settings={settingsResult.data}
    />
  )
}
