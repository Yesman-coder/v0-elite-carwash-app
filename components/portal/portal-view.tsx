"use client"

import type { PortalCustomer, PortalCard, PortalVisit } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PortalLoyaltyCard } from "./portal-loyalty-card"
import { User, CalendarDays, Droplets } from "lucide-react"

interface PortalViewProps {
  customer: PortalCustomer
  cards: PortalCard[]
  visits: PortalVisit[]
}

export function PortalView({ customer, cards, visits }: PortalViewProps) {
  const activeCard = cards.find((c) => c.status === "active")
  const completedCard = cards.find((c) => c.status === "completed")
  const displayCard = completedCard || activeCard

  return (
    <main className="min-h-screen bg-background px-4 pb-8 pt-6">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <img
            src="/images/logo.png"
            alt="Elite Carwash"
            style={{ width: 180, height: "auto" }}
          />
          {customer.business_name && (
            <p className="text-xs text-muted-foreground">
              {customer.business_name}
            </p>
          )}
        </div>

        {/* Welcome */}
        <div className="mb-6 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <User className="h-7 w-7 text-primary" />
          </div>
          <h1 className="mt-2 text-xl font-bold text-foreground">
            Hola, {customer.full_name.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            {customer.vehicle_make &&
              `${customer.vehicle_make} ${customer.vehicle_model || ""}`}
            {customer.vehicle_plate && ` - ${customer.vehicle_plate}`}
          </p>
        </div>

        {/* Loyalty Card */}
        {displayCard && (
          <div className="mb-6">
            <PortalLoyaltyCard
              card={displayCard}
              customerName={customer.full_name}
            />
          </div>
        )}

        {completedCard && (
          <div className="mb-6 rounded-xl border-2 border-success/50 bg-success/5 p-4 text-center">
            <p className="text-lg font-bold text-success">
              Lavado GRATIS disponible
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Presentale esta pantalla al encargado
            </p>
          </div>
        )}

        {/* Recent Visits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-primary" />
              Mis Visitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {visits.length === 0 ? (
              <div className="flex flex-col items-center py-6">
                <Droplets className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Aun no hay visitas registradas
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {visits.map((visit) => (
                  <div
                    key={visit.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {visit.service_name || "Servicio"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(visit.created_at).toLocaleDateString(
                          "es-VE",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>
                    {visit.is_free_wash ? (
                      <Badge className="bg-success text-success-foreground">GRATIS</Badge>
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

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Elite Carwash - Programa de Fidelidad
          </p>
        </div>
      </div>
    </main>
  )
}
