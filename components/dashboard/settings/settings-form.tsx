"use client"

import type { BusinessSettings, Profile } from "@/lib/types"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Save } from "lucide-react"

interface SettingsFormProps {
  settings: BusinessSettings | null
  profile: Profile | null
}

export function SettingsForm({ settings, profile }: SettingsFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error("Sesion expirada")
      setLoading(false)
      return
    }

    // Update profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: form.get("full_name") as string,
        phone: (form.get("profile_phone") as string) || null,
      })
      .eq("id", user.id)

    if (profileError) {
      toast.error("Error al actualizar perfil: " + profileError.message)
      setLoading(false)
      return
    }

    // Update business settings
    if (settings) {
      const { error: settingsError } = await supabase
        .from("business_settings")
        .update({
          business_name: form.get("business_name") as string,
          phone: (form.get("business_phone") as string) || null,
          address: (form.get("address") as string) || null,
          stamps_required:
            parseInt(form.get("stamps_required") as string) || 5,
          welcome_sms_template: form.get("welcome_sms_template") as string,
          reward_sms_template: form.get("reward_sms_template") as string,
          currency: form.get("currency") as string,
        })
        .eq("id", settings.id)

      if (settingsError) {
        toast.error(
          "Error al actualizar configuracion: " + settingsError.message
        )
        setLoading(false)
        return
      }
    }

    toast.success("Configuracion guardada")
    router.refresh()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tu Perfil</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input
                id="full_name"
                name="full_name"
                defaultValue={profile?.full_name || ""}
                className="bg-secondary"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="profile_phone">Tu telefono</Label>
              <Input
                id="profile_phone"
                name="profile_phone"
                defaultValue={profile?.phone || ""}
                className="bg-secondary"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Negocio</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="business_name">Nombre del negocio</Label>
              <Input
                id="business_name"
                name="business_name"
                defaultValue={settings?.business_name || "Elite Carwash"}
                className="bg-secondary"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="business_phone">Telefono del negocio</Label>
              <Input
                id="business_phone"
                name="business_phone"
                defaultValue={settings?.phone || ""}
                className="bg-secondary"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="address">Direccion</Label>
            <Input
              id="address"
              name="address"
              defaultValue={settings?.address || ""}
              className="bg-secondary"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="stamps_required">
                Sellos requeridos por tarjeta
              </Label>
              <Input
                id="stamps_required"
                name="stamps_required"
                type="number"
                min={2}
                max={20}
                defaultValue={settings?.stamps_required || 5}
                className="bg-secondary"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="currency">Moneda</Label>
              <Input
                id="currency"
                name="currency"
                defaultValue={settings?.currency || "$"}
                className="bg-secondary"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plantillas SMS (Stub)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="welcome_sms_template">Mensaje de bienvenida</Label>
            <Textarea
              id="welcome_sms_template"
              name="welcome_sms_template"
              defaultValue={
                settings?.welcome_sms_template ||
                "Bienvenido {name} a Elite Carwash!"
              }
              rows={2}
              className="bg-secondary"
            />
            <p className="text-xs text-muted-foreground">
              {"Usa {name} para el nombre del cliente"}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reward_sms_template">
              Mensaje de tarjeta completa
            </Label>
            <Textarea
              id="reward_sms_template"
              name="reward_sms_template"
              defaultValue={
                settings?.reward_sms_template ||
                "Felicidades {name}! Tu tarjeta esta completa. Tienes un lavado GRATIS!"
              }
              rows={2}
              className="bg-secondary"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  )
}
