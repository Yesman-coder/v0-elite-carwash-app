import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const { data: settings } = await supabase
    .from("business_settings")
    .select("*")
    .eq("owner_id", user.id)
    .single()

  return (
    <DashboardShell
      user={user}
      profile={profile}
      settings={settings}
    >
      {children}
    </DashboardShell>
  )
}
