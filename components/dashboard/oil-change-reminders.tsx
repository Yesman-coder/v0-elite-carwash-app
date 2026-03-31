"use client"

import type { Customer } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Droplets, Phone, ChevronRight } from "lucide-react"
import Link from "next/link"

interface OilChangeReminder {
  id: string
  full_name: string
  phone: string
  vehicle_brand: string | null
  vehicle_model: string | null
  last_km: number
  last_oil_change_km: number
  km_since_change: number
}

interface OilChangeRemindersProps {
  reminders: OilChangeReminder[]
}

export function OilChangeReminders({ reminders }: OilChangeRemindersProps) {
  if (reminders.length === 0) return null

  return (
    <Card className="border-warning/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Recordatorios de Cambio de Aceite
          <Badge variant="outline" className="ml-auto border-warning/50 text-warning">
            {reminders.length}
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Clientes con 5,000 km o mas desde su ultimo cambio de aceite
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {reminders.map((r) => (
            <Link
              key={r.id}
              href={`/dashboard/customers/${r.id}`}
              className="group"
            >
              <div className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors group-hover:bg-accent/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning/10">
                    <Droplets className="h-4 w-4 text-warning" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">
                      {r.full_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {[r.vehicle_brand, r.vehicle_model]
                        .filter(Boolean)
                        .join(" ") || "Vehiculo"}{" "}
                      - {r.last_km.toLocaleString()} km actual
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-sm font-bold text-warning">
                      {r.km_since_change.toLocaleString()} km
                    </p>
                    <p className="text-xs text-muted-foreground">
                      sin cambio
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
