"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { SmsCampaign, BusinessSettings } from "@/lib/types"
import { Send, Users, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

interface CampaignComposeProps {
  customers: { id: string; full_name: string; phone: string }[]
  settings: BusinessSettings | null
  onCampaignCreated: (campaign: SmsCampaign) => void
}

const AUDIENCE_OPTIONS = [
  {
    value: "all",
    label: "Todos los clientes",
    description: "Enviar a todos los clientes activos",
  },
  {
    value: "active_card",
    label: "Con tarjeta activa",
    description: "Clientes con tarjeta de fidelidad en progreso",
  },
  {
    value: "completed_card",
    label: "Tarjeta completada",
    description: "Clientes con lavado gratis pendiente",
  },
  {
    value: "no_visits_30d",
    label: "Sin visita reciente",
    description: "Clientes que no han venido en 30 dias",
  },
]

const QUICK_TEMPLATES = [
  {
    label: "Promocion fin de semana",
    title: "Promo Fin de Semana",
    message:
      "Hola {name}! Este fin de semana en Elite Carwash tenemos 20% de descuento en todos nuestros servicios. Te esperamos!",
  },
  {
    label: "Lavado gratis listo",
    title: "Lavado Gratis Disponible",
    message:
      "Felicidades {name}! Tu tarjeta de fidelidad esta completa. Ven a reclamar tu lavado GRATIS en Elite Carwash!",
  },
  {
    label: "Te extraniamos",
    title: "Te Extraniamos",
    message:
      "Hola {name}! Hace tiempo que no nos visitas. Pasa por Elite Carwash y recibe un descuento especial. Te esperamos!",
  },
  {
    label: "Evento especial",
    title: "Evento Especial",
    message:
      "Hola {name}! Elite Carwash te invita a nuestro evento especial este sabado. Habra promociones, regalos y mucho mas!",
  },
]

export function CampaignCompose({
  customers,
  settings,
  onCampaignCreated,
}: CampaignComposeProps) {
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [audience, setAudience] = useState("all")
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{
    sent: number
    failed: number
    total: number
  } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const charCount = message.length
  const smsSegments = Math.ceil(charCount / 160) || 0

  function applyTemplate(template: (typeof QUICK_TEMPLATES)[number]) {
    setTitle(template.title)
    setMessage(template.message)
  }

  async function handleSend() {
    if (!title.trim() || !message.trim()) {
      toast.error("Completa el titulo y mensaje")
      return
    }

    setSending(true)
    setResult(null)

    try {
      // Get current user for owner_id
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Sesion expirada. Inicia sesion de nuevo.")
        setSending(false)
        return
      }

      // Create campaign
      const { data: campaign, error: createError } = await supabase
        .from("sms_campaigns")
        .insert({
          owner_id: user.id,
          title: title.trim(),
          message: message.trim(),
          audience,
          status: "draft",
        })
        .select()
        .single()

      if (createError || !campaign) {
        toast.error("Error al crear la campana: " + (createError?.message || ""))
        setSending(false)
        return
      }

      // Send campaign via API
      const response = await fetch("/api/campaigns/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: campaign.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Error al enviar la campana")
        setSending(false)
        return
      }

      setResult(data)
      onCampaignCreated({
        ...campaign,
        status: "sent",
        sent_count: data.sent,
        failed_count: data.failed,
        recipient_count: data.total,
        sent_at: new Date().toISOString(),
      })

      toast.success(
        `Campana enviada: ${data.sent}/${data.total} mensajes (modo prueba)`
      )

      // Reset form
      setTitle("")
      setMessage("")
      router.refresh()
    } catch {
      toast.error("Error de conexion al enviar la campana")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Compose area */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Componer Mensaje</CardTitle>
          <CardDescription>
            Crea y envia mensajes SMS a tus clientes. Usa{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              {"{name}"}
            </code>{" "}
            para personalizar con el nombre del cliente.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Titulo de la campana</Label>
            <Input
              id="title"
              placeholder="ej: Promo Fin de Semana"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="audience">Audiencia</Label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div>
                      <span>{opt.label}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        - {opt.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="message">Mensaje</Label>
            <Textarea
              id="message"
              placeholder="Escribe tu mensaje aqui... Usa {name} para personalizar."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {charCount} caracteres / {smsSegments} segmento
                {smsSegments !== 1 ? "s" : ""} SMS
              </span>
              {charCount > 160 && (
                <span className="text-warning">
                  Mas de 160 caracteres = multiples SMS
                </span>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{customers.length} clientes activos</span>
          </div>
          <Button
            onClick={handleSend}
            disabled={sending || !title.trim() || !message.trim()}
            className="gap-2"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {sending ? "Enviando..." : "Enviar Campana"}
          </Button>
        </CardFooter>
      </Card>

      {/* Right sidebar - templates & preview */}
      <div className="flex flex-col gap-4">
        {/* Send result */}
        {result && (
          <Card className="border-success/30 bg-success/5">
            <CardContent className="flex items-start gap-3 pt-6">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
              <div>
                <p className="text-sm font-medium">Campana enviada</p>
                <p className="text-xs text-muted-foreground">
                  {result.sent} de {result.total} mensajes enviados
                  {result.failed > 0 && ` (${result.failed} fallidos)`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Modo prueba: Los SMS no se enviaron de verdad.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick templates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plantillas Rapidas</CardTitle>
            <CardDescription>
              Selecciona una plantilla para empezar
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {QUICK_TEMPLATES.map((tpl, i) => (
              <button
                key={i}
                onClick={() => applyTemplate(tpl)}
                className="rounded-md border border-border p-3 text-left transition-colors hover:bg-accent"
              >
                <p className="text-sm font-medium">{tpl.label}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {tpl.message}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Preview */}
        {message && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vista Previa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted p-4">
                <p className="whitespace-pre-wrap text-sm">
                  {message.replace("{name}", "Juan Perez")}
                </p>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <AlertTriangle className="h-3 w-3" />
                Vista previa con nombre de ejemplo
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
