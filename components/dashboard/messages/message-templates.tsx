"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import type { BusinessSettings } from "@/lib/types"
import { Save, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface MessageTemplatesProps {
  settings: BusinessSettings | null
}

export function MessageTemplates({ settings }: MessageTemplatesProps) {
  const [welcomeTemplate, setWelcomeTemplate] = useState(
    settings?.welcome_sms_template ||
      "Bienvenido/a {name} a Elite Carwash! Tu tarjeta de fidelidad ya esta activa."
  )
  const [rewardTemplate, setRewardTemplate] = useState(
    settings?.reward_sms_template ||
      "Felicidades {name}! Has completado tu tarjeta. Ven a reclamar tu lavado GRATIS!"
  )
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleSave() {
    if (!settings) return
    setSaving(true)
    const { error } = await supabase
      .from("business_settings")
      .update({
        welcome_sms_template: welcomeTemplate,
        reward_sms_template: rewardTemplate,
      })
      .eq("id", settings.id)

    if (error) {
      toast.error("Error al guardar las plantillas")
    } else {
      toast.success("Plantillas guardadas")
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mensaje de Bienvenida</CardTitle>
          <CardDescription>
            Se envia automaticamente cuando registras un cliente nuevo. Usa{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">{"{name}"}</code>{" "}
            para el nombre.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="welcome-tpl">Plantilla</Label>
            <Textarea
              id="welcome-tpl"
              value={welcomeTemplate}
              onChange={(e) => setWelcomeTemplate(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {welcomeTemplate.length} caracteres
            </p>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs font-medium text-muted-foreground">Vista previa:</p>
            <p className="mt-1 text-sm">
              {welcomeTemplate.replace("{name}", "Maria Garcia")}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mensaje de Recompensa</CardTitle>
          <CardDescription>
            Se envia cuando un cliente completa su tarjeta de fidelidad. Usa{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">{"{name}"}</code>{" "}
            para el nombre.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="reward-tpl">Plantilla</Label>
            <Textarea
              id="reward-tpl"
              value={rewardTemplate}
              onChange={(e) => setRewardTemplate(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {rewardTemplate.length} caracteres
            </p>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs font-medium text-muted-foreground">Vista previa:</p>
            <p className="mt-1 text-sm">
              {rewardTemplate.replace("{name}", "Carlos Rodriguez")}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Guardar Plantillas
        </Button>
      </div>
    </div>
  )
}
