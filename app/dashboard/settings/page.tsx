import { createClient } from "@/lib/supabase/server"
import { SettingsForm } from "@/components/dashboard/settings/settings-form"
import { SubscriptionPlans } from "@/components/dashboard/settings/subscription-plans"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: settings } = await supabase
    .from("business_settings")
    .select("*")
    .eq("owner_id", user.id)
    .single()

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const { data: plans } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Configuración
        </h1>
        <p className="text-sm text-muted-foreground">
          Ajustes de tu negocio y perfil
        </p>
      </div>
      <SettingsForm settings={settings} profile={profile} />
      <SubscriptionPlans plans={plans ?? []} />
    </div>
  )
}
