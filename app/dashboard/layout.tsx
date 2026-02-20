import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // getUser() validates the JWT with Supabase servers - this is the secure check
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch profile and settings in parallel
  const [profileResult, settingsResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("business_settings").select("*").eq("owner_id", user.id).single(),
  ])

  return (
    <DashboardShell
      user={user}
      profile={profileResult.data}
      settings={settingsResult.data}
    >
      {children}
    </DashboardShell>
  )
}
