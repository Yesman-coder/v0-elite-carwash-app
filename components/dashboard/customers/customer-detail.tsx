"use client"

import type { Customer, Visit, Service } from "@/lib/types"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  Car,
  CreditCard,
  Copy,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { LoyaltyCardVisual } from "@/components/dashboard/loyalty/loyalty-card-visual"
import { AddStampDialog } from "@/components/dashboard/loyalty/add-stamp-dialog"
import { RedeemDialog } from "@/components/dashboard/loyalty/redeem-dialog"

interface CustomerDetailProps {
  customer: Customer
  visits: Visit[]
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
  const [copying, setCopying] = useState(false)

  const activeCard = customer.loyalty_cards?.find(
    (c) => c.status === "active"
  )
  const completedCard = customer.loyalty_cards?.find(
    (c) => c.status === "completed"
  )

  const portalUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/portal/${customer.portal_token}`
      : ""

  async function copyPortalLink() {
    setCopying(true)
    try {
      await navigator.clipboard.writeText(portalUrl)
      toast.success("Enlace copiado al portapapeles")
    } catch {
      toast.error("No se pudo copiar el enlace")
    }
    setCopying(false)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/customers">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {customer.full_name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Cliente desde{" "}
              {new Date(customer.created_at).toLocaleDateString("es-VE")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyPortalLink}>
            <Copy className="mr-2 h-4 w-4" />
            {copying ? "Copiado!" : "Copiar Portal"}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={portalUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver Portal
            </a>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/dashboard/customers/${customer.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informacion</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{customer.phone}</span>
            </div>
            {customer.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{customer.email}</span>
              </div>
            )}
            {(customer.vehicle_make || customer.vehicle_plate) && (
              <div className="flex items-center gap-2 text-sm">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">
                  {[
                    customer.vehicle_make,
                    customer.vehicle_model,
                    customer.vehicle_color,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  {customer.vehicle_plate && ` - ${customer.vehicle_plate}`}
                </span>
              </div>
            )}
            {customer.vehicle_type && (
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary">{customer.vehicle_type.name}</Badge>
              </div>
            )}
            {customer.notes && (
              <p className="mt-2 text-xs text-muted-foreground">
                {customer.notes}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Loyalty Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Tarjeta de Fidelidad</CardTitle>
            <div className="flex items-center gap-2">
              {completedCard && (
                <RedeemDialog
                  cardId={completedCard.id}
                  customerName={customer.full_name}
                  services={services}
                  onRedeemed={() => router.refresh()}
                />
              )}
              {activeCard && (
                <AddStampDialog
                  cardId={activeCard.id}
                  currentStamps={activeCard.current_stamps}
                  stampsRequired={activeCard.stamps_required}
                  services={services}
                  onStampAdded={() => router.refresh()}
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {activeCard ? (
              <LoyaltyCardVisual
                currentStamps={activeCard.current_stamps}
                stampsRequired={activeCard.stamps_required}
                cardNumber={activeCard.card_number}
                customerName={customer.full_name}
                status={activeCard.status}
              />
            ) : completedCard ? (
              <div>
                <LoyaltyCardVisual
                  currentStamps={completedCard.current_stamps}
                  stampsRequired={completedCard.stamps_required}
                  cardNumber={completedCard.card_number}
                  customerName={customer.full_name}
                  status={completedCard.status}
                />
                <p className="mt-2 text-center text-sm font-medium text-success">
                  Tarjeta completa - Lavado gratis disponible
                </p>
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No hay tarjeta activa
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Visits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visitas Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {visits.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Sin visitas registradas
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {visits.map((visit) => (
                <div
                  key={visit.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">
                      {visit.service_name ||
                        visit.service?.name ||
                        "Servicio"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(visit.created_at).toLocaleDateString("es-VE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {visit.is_free_wash ? (
                      <Badge className="bg-success text-success-foreground">GRATIS</Badge>
                    ) : (
                      <span className="text-sm font-medium text-foreground">
                        ${Number(visit.final_price).toFixed(2)}
                      </span>
                    )}
                    <Badge
                      variant={
                        visit.payment_status === "paid" || visit.payment_status === "free"
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {visit.payment_status === "paid"
                        ? "Pagado"
                        : visit.payment_status === "free"
                          ? "Gratis"
                          : "Pendiente"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
