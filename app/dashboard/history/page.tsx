import { createClient } from "@/lib/supabase/server"
import { VisitHistory } from "@/components/dashboard/history/visit-history"

export default async function HistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: visits } = await supabase
    .from("visits")
    .select(
      `
      *,
      customer:customers(id, full_name, phone),
      service:services(name, category)
    `
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Historial de Visitas
        </h1>
        <p className="text-sm text-muted-foreground">
          Registro de todos los servicios realizados
        </p>
      </div>
      <VisitHistory visits={visits || []} />
    </div>
  )
}
