"use client"

import type { Visit } from "@/lib/types"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, ClipboardList } from "lucide-react"
import Link from "next/link"

interface VisitHistoryProps {
  visits: (Visit & {
    customer?: { id: string; full_name: string; phone: string } | null
    service?: { name: string; category: string } | null
  })[]
}

export function VisitHistory({ visits }: VisitHistoryProps) {
  const [search, setSearch] = useState("")

  const filtered = visits.filter((v) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      v.customer?.full_name.toLowerCase().includes(s) ||
      v.customer?.phone.includes(s) ||
      v.service_name?.toLowerCase().includes(s)
    )
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente o servicio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-secondary pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No se encontraron visitas
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((visit) => (
            <Card key={visit.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex flex-col gap-0.5">
                  {visit.customer ? (
                    <Link
                      href={`/dashboard/customers/${visit.customer.id}`}
                      className="text-sm font-semibold text-foreground hover:underline"
                    >
                      {visit.customer.full_name}
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold text-foreground">
                      Cliente desconocido
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {visit.service_name || visit.service?.name || "Servicio"} -{" "}
                    {new Date(visit.created_at).toLocaleDateString("es-VE", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {visit.is_free_wash ? (
                    <Badge className="bg-success text-success-foreground">GRATIS</Badge>
                  ) : (
                    <span className="text-sm font-bold text-foreground">
                      ${Number(visit.final_price).toFixed(2)}
                    </span>
                  )}
                  <Badge
                    variant={
                      visit.payment_status === "paid" ||
                      visit.payment_status === "free"
                        ? "default"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {visit.payment_method === "cash"
                      ? "Efectivo"
                      : visit.payment_method === "transfer"
                        ? "Transfer."
                        : visit.payment_method === "card"
                          ? "Tarjeta"
                          : visit.payment_method === "free"
                            ? "Gratis"
                            : "Pendiente"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Mostrando {filtered.length} visitas
      </p>
    </div>
  )
}
