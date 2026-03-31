"use client"

import type { Customer, Visit, Service, LoyaltyCard, SubscriptionPlan, Subscription } from "@/lib/types"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoyaltyCardVisual } from "@/components/dashboard/loyalty/loyalty-card-visual"
import { AddStampDialog } from "@/components/dashboard/loyalty/add-stamp-dialog"
import { RedeemDialog } from "@/components/dashboard/loyalty/redeem-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import Link from "next/link"
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  Car,
  CreditCard,
  CalendarDays,
  Copy,
  ExternalLink,
  User,
  Star,
  XCircle,
} from "lucide-react"

interface CustomerDetailProps {
  customer: Customer & {
    vehicle_type?: { name: string } | null
    loyalty_cards?: (LoyaltyCard & {
      stamps?: { id: string; stamp_number: number; created_at: string; service?: { name: string } | null }[]
    })[]
  }
  visits: (Visit & { service?: { name: string } | null })[]
  services: Service[]
  stampsRequired: number
  subscriptionPlans: SubscriptionPlan[]
  activeSubscription: (Subscription & { plan?: SubscriptionPlan }) | null
}

export function CustomerDetail({
  customer,
  visits,
  services,
  stampsRequired,
  subscriptionPlans,
  activeSubscription,
}: CustomerDetailProps) {
  const router = useRouter()
  const supabase = createClient()
  const [copied, setCopied] = useState(false)
  const [subOpen, setSubOpen] = useState(false)
  const [subLoading, setSubLoading] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<string>("")

  const activeCard = customer.loyalty_cards?.find((c) => c.status === "active")
  const completedCard = customer.loyalty_cards?.find((c) => c.status === "completed")
  const displayCard = completedCard || activeCard

  const portalUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/portal/${customer.access_token}`
      : `/portal/${customer.access_token}`

  function copyPortalLink() {
    navigator.clipboard.writeText(portalUrl)
    setCopied(true)
    toast.success("Enlace copiado al portapapeles")
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleAssignSubscription(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubLoading(true)

    const form = new FormData(e.currentTarget)
    const planId = selectedPlanId
    const pagoMovilPhone = form.get("pago_movil_phone") as string
    const pagoMovilBank = form.get("pago_movil_bank") as string
    const pagoMovilRef = form.get("pago_movil_reference") as string

    if (!planId) {
      toast.error("Selecciona un plan")
      setSubLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error("Sesión expirada"); setSubLoading(false); return }

    const today = new Date()
    const nextBilling = new Date(today)
    nextBilling.setMonth(nextBilling.getMonth() + 1)

    const { error } = await supabase.from("subscriptions").insert({
      customer_id: customer.id,
      plan_id: planId,
      owner_id: user.id,
      start_date: today.toISOString().split("T")[0],
      next_billing_date: nextBilling.toISOString().split("T")[0],
      pago_movil_phone: pagoMovilPhone || null,
      pago_movil_bank: pagoMovilBank || null,
      pago_movil_reference: pagoMovilRef || null,
    })

    if (error) {
      toast.error("Error al asignar suscripción: " + error.message)
    } else {
      // Update customer account_type
      await supabase
        .from("customers")
        .update({ account_type: "subscription" })
        .eq("id", customer.id)

      toast.success("Suscripción asignada correctamente")
      setSubOpen(false)
      router.refresh()
    }
    setSubLoading(false)
  }

  async function handleCancelSubscription() {
    if (!activeSubscription) return
    if (!confirm("¿Cancelar la suscripción activa de este cliente?")) return

    const { error } = await supabase
      .from("subscriptions")
      .update({ is_active: false, cancelled_at: new Date().toISOString() })
      .eq("id", activeSubscription.id)

    if (error) {
      toast.error("Error al cancelar suscripción")
    } else {
      await supabase
        .from("customers")
        .update({ account_type: "loyalty" })
        .eq("id", customer.id)
      toast.success("Suscripción cancelada")
      router.refresh()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/customers">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {customer.full_name}
              </h1>
              {!customer.is_active && <Badge variant="secondary">Inactivo</Badge>}
              {customer.account_type === "subscription" ? (
                <Badge className="bg-primary text-primary-foreground gap-1">
                  <Star className="h-3 w-3" /> Suscriptor
                </Badge>
              ) : (
                <Badge variant="outline">Lealtad</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Cliente desde{" "}
              {new Date(customer.created_at).toLocaleDateString("es-VE", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/customers/${customer.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="flex flex-col gap-4">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-primary" />
                Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{customer.email}</span>
                </div>
              )}
              {customer.notes && (
                <p className="mt-1 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                  {customer.notes}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Star className="h-4 w-4 text-primary" />
                Suscripción
              </CardTitle>
              {!activeSubscription && subscriptionPlans.length > 0 && (
                <Dialog open={subOpen} onOpenChange={setSubOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      Asignar Suscripción
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleAssignSubscription}>
                      <DialogHeader>
                        <DialogTitle>Asignar Suscripción</DialogTitle>
                        <DialogDescription>
                          Selecciona un plan y registra los datos del pago por Pago Móvil.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col gap-4 py-4">
                        <div className="flex flex-col gap-2">
                          <Label>Plan *</Label>
                          <Select value={selectedPlanId} onValueChange={setSelectedPlanId} required>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar plan" />
                            </SelectTrigger>
                            <SelectContent>
                              {subscriptionPlans.map((plan) => (
                                <SelectItem key={plan.id} value={plan.id}>
                                  {plan.name} — Bs. {(plan.price_cents / 100).toFixed(2)}/mes
                                  {plan.wash_limit ? ` (${plan.wash_limit} lavados)` : " (Ilimitado)"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="rounded-lg border border-border bg-muted/30 p-3">
                          <p className="text-xs font-medium text-foreground mb-2">Datos de Pago Móvil</p>
                          <div className="flex flex-col gap-2">
                            <Input name="pago_movil_bank" placeholder="Banco (Ej: Banesco, Mercantil)" />
                            <Input name="pago_movil_phone" placeholder="Teléfono del cliente" />
                            <Input name="pago_movil_reference" placeholder="Referencia / confirmación" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Verifica el pago en tu app bancaria antes de confirmar.
                          </p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setSubOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={subLoading}>
                          {subLoading ? "Asignando..." : "Confirmar Suscripción"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {activeSubscription ? (
                <div className="flex flex-col gap-3">
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-foreground">
                        {activeSubscription.plan?.name}
                      </span>
                      <Badge className="bg-primary text-primary-foreground">Activa</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Lavados usados</p>
                        <p className="font-medium">
                          {activeSubscription.washes_used_this_period}
                          {activeSubscription.plan?.wash_limit
                            ? ` / ${activeSubscription.plan.wash_limit}`
                            : " / Ilimitado"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Próximo cobro</p>
                        <p className="font-medium">
                          {new Date(activeSubscription.next_billing_date).toLocaleDateString("es-VE")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Precio</p>
                        <p className="font-medium">
                          Bs. {activeSubscription.plan ? (activeSubscription.plan.price_cents / 100).toFixed(2) : "—"}/mes
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive self-start"
                    onClick={handleCancelSubscription}
                  >
                    <XCircle className="mr-1 h-4 w-4" />
                    Cancelar suscripción
                  </Button>
                </div>
              ) : subscriptionPlans.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No hay planes de suscripción configurados.{" "}
                  <Link href="/dashboard/settings" className="underline">
                    Crear un plan
                  </Link>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground py-2">
                  Este cliente no tiene suscripción activa.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Vehicle Info */}
          {(customer.vehicle_brand || customer.last_km != null) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Car className="h-4 w-4 text-primary" />
                  Vehículo
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  {customer.vehicle_type && (
                    <div>
                      <p className="text-xs text-muted-foreground">Tipo</p>
                      <p className="text-sm font-medium text-foreground">
                        {(customer.vehicle_type as { name: string }).name}
                      </p>
                    </div>
                  )}
                  {customer.vehicle_brand && (
                    <div>
                      <p className="text-xs text-muted-foreground">Marca</p>
                      <p className="text-sm font-medium text-foreground">{customer.vehicle_brand}</p>
                    </div>
                  )}
                  {customer.vehicle_model && (
                    <div>
                      <p className="text-xs text-muted-foreground">Modelo</p>
                      <p className="text-sm font-medium text-foreground">{customer.vehicle_model}</p>
                    </div>
                  )}
                  {customer.vehicle_color && (
                    <div>
                      <p className="text-xs text-muted-foreground">Color</p>
                      <p className="text-sm font-medium text-foreground">{customer.vehicle_color}</p>
                    </div>
                  )}
                  {customer.last_km != null && (
                    <div>
                      <p className="text-xs text-muted-foreground">Kilometraje</p>
                      <p className="text-sm font-bold text-foreground">
                        {customer.last_km.toLocaleString()} km
                      </p>
                    </div>
                  )}
                  {customer.last_oil_change_km != null && (
                    <div>
                      <p className="text-xs text-muted-foreground">Último cambio aceite</p>
                      <p className="text-sm font-medium text-foreground">
                        {customer.last_oil_change_km.toLocaleString()} km
                      </p>
                    </div>
                  )}
                </div>

                {customer.last_km != null &&
                  customer.last_oil_change_km != null &&
                  customer.last_km - customer.last_oil_change_km >= 5000 && (
                    <div className="rounded-lg border-2 border-warning/50 bg-warning/10 p-3">
                      <p className="text-sm font-semibold text-warning">
                        Cambio de aceite recomendado
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(customer.last_km - customer.last_oil_change_km).toLocaleString()} km
                        desde el último cambio de aceite
                      </p>
                    </div>
                  )}
              </CardContent>
            </Card>
          )}

          {/* Portal Link */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ExternalLink className="h-4 w-4 text-primary" />
                Enlace del Portal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-xs text-muted-foreground">
                Comparte este enlace con el cliente para que pueda ver su tarjeta
                de fidelidad desde su teléfono.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg bg-muted/50 px-3 py-2 font-mono text-xs text-foreground">
                  {portalUrl}
                </code>
                <Button variant="outline" size="sm" onClick={copyPortalLink}>
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  {copied ? "Copiado" : "Copiar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Loyalty & Visits */}
        <div className="flex flex-col gap-4">
          {/* Loyalty Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Tarjeta de Fidelidad
                </span>
                <div className="flex items-center gap-2">
                  {displayCard?.status === "completed" && (
                    <RedeemDialog
                      cardId={displayCard.id}
                      customerName={customer.full_name}
                      services={services}
                      onRedeemed={() => router.refresh()}
                    />
                  )}
                  {displayCard?.status === "active" && (
                    <AddStampDialog
                      cardId={displayCard.id}
                      customerId={customer.id}
                      currentStamps={displayCard.current_stamps}
                      stampsRequired={displayCard.stamps_required}
                      services={services}
                      onStampAdded={() => router.refresh()}
                    />
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {displayCard ? (
                <LoyaltyCardVisual
                  currentStamps={displayCard.current_stamps}
                  stampsRequired={displayCard.stamps_required}
                  cardNumber={displayCard.card_number}
                  customerName={customer.full_name}
                  status={displayCard.status}
                />
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No hay tarjeta activa
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Visits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4 text-primary" />
                Visitas Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {visits.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No hay visitas registradas
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {visits.slice(0, 8).map((visit) => (
                    <div
                      key={visit.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                          {visit.service_name || visit.service?.name || "Servicio"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(visit.created_at).toLocaleDateString("es-VE", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {visit.is_free_wash ? (
                        <Badge className="bg-success text-success-foreground">GRATIS</Badge>
                      ) : (
                        <span className="text-sm font-semibold text-foreground">
                          ${Number(visit.final_price || visit.price || 0).toFixed(2)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
