"use client"

import type { Customer, Visit, Service, LoyaltyCard } from "@/lib/types"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoyaltyCardVisual } from "@/components/dashboard/loyalty/loyalty-card-visual"
import { AddStampDialog } from "@/components/dashboard/loyalty/add-stamp-dialog"
import { RedeemDialog } from "@/components/dashboard/loyalty/redeem-dialog"
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
}

export function CustomerDetail({
  customer,
  visits,
  services,
  stampsRequired,
}: CustomerDetailProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const activeCard = customer.loyalty_cards?.find(
    (c) => c.status === "active"
  )
  const completedCard = customer.loyalty_cards?.find(
    (c) => c.status === "completed"
  )
  const displayCard = completedCard || activeCard

  const portalUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/portal/${customer.portal_token}`
      : `/portal/${customer.portal_token}`

  function copyPortalLink() {
    navigator.clipboard.writeText(portalUrl)
    setCopied(true)
    toast.success("Enlace copiado al portapapeles")
    setTimeout(() => setCopied(false), 2000)
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
              {!customer.is_active && (
                <Badge variant="secondary">Inactivo</Badge>
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
        {/* Left column - Info */}
        <div className="flex flex-col gap-4">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-primary" />
                Informacion de Contacto
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

          {/* Vehicle Info */}
          {(customer.vehicle_make || customer.last_km != null) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Car className="h-4 w-4 text-primary" />
                  Vehiculo
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
                  {customer.vehicle_make && (
                    <div>
                      <p className="text-xs text-muted-foreground">Marca</p>
                      <p className="text-sm font-medium text-foreground">
                        {customer.vehicle_make}
                      </p>
                    </div>
                  )}
                  {customer.vehicle_model && (
                    <div>
                      <p className="text-xs text-muted-foreground">Modelo</p>
                      <p className="text-sm font-medium text-foreground">
                        {customer.vehicle_model}
                      </p>
                    </div>
                  )}
                  {customer.vehicle_color && (
                    <div>
                      <p className="text-xs text-muted-foreground">Color</p>
                      <p className="text-sm font-medium text-foreground">
                        {customer.vehicle_color}
                      </p>
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
                      <p className="text-xs text-muted-foreground">Ultimo cambio de aceite</p>
                      <p className="text-sm font-medium text-foreground">
                        {customer.last_oil_change_km.toLocaleString()} km
                      </p>
                    </div>
                  )}
                </div>

                {/* Oil Change Reminder Alert */}
                {customer.last_km != null &&
                  customer.last_oil_change_km != null &&
                  customer.last_km - customer.last_oil_change_km >= 5000 && (
                    <div className="rounded-lg border-2 border-warning/50 bg-warning/10 p-3">
                      <p className="text-sm font-semibold text-warning">
                        Cambio de aceite recomendado
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(customer.last_km - customer.last_oil_change_km).toLocaleString()} km
                        desde el ultimo cambio de aceite
                      </p>
                    </div>
                  )}
                {customer.last_km != null && customer.last_oil_change_km == null && (
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">
                      Sin registro de cambio de aceite. El sistema alertara cuando se
                      registren 5,000 km o mas desde el ultimo cambio.
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
                de fidelidad desde su telefono.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg bg-muted/50 px-3 py-2 font-mono text-xs text-foreground">
                  {portalUrl}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyPortalLink}
                >
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
                          {visit.service_name ||
                            visit.service?.name ||
                            "Servicio"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(visit.created_at).toLocaleDateString(
                            "es-VE",
                            {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>
                      {visit.is_free_wash ? (
                        <Badge className="bg-success text-success-foreground">
                          GRATIS
                        </Badge>
                      ) : (
                        <span className="text-sm font-semibold text-foreground">
                          ${Number(visit.final_price).toFixed(2)}
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
