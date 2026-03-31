"use client"

import type { Customer } from "@/lib/types"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, User, Car, CreditCard, ExternalLink } from "lucide-react"
import Link from "next/link"

interface CustomerListProps {
  customers: Customer[]
}

export function CustomerList({ customers }: CustomerListProps) {
  const [search, setSearch] = useState("")

  const filtered = customers.filter(
    (c) =>
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.vehicle_brand?.toLowerCase().includes(search.toLowerCase())
  )

  const getActiveCard = (customer: Customer) => {
    return customer.loyalty_cards?.find((c) => c.status === "active")
  }

  const getCompletedCard = (customer: Customer) => {
    return customer.loyalty_cards?.find((c) => c.status === "completed")
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, telefono o vehiculo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-secondary pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {customers.length === 0
                ? "No hay clientes registrados"
                : "No se encontraron resultados"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((customer) => {
            const activeCard = getActiveCard(customer)
            const completedCard = getCompletedCard(customer)
            return (
              <Link
                key={customer.id}
                href={`/dashboard/customers/${customer.id}`}
              >
                <Card className="cursor-pointer transition-colors hover:bg-accent/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {customer.full_name}
                          </span>
                          {!customer.is_active && (
                            <Badge variant="secondary" className="text-xs">
                              Inactivo
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {customer.phone}
                        </span>
                      </div>
                      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>

                    {(customer.vehicle_brand || customer.last_km) && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <Car className="h-3.5 w-3.5" />
                        <span>
                          {[
                            customer.vehicle_brand,
                            customer.vehicle_model,
                            customer.vehicle_color,
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          {customer.last_km != null &&
                            ` - ${customer.last_km.toLocaleString()} km`}
                        </span>
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                      {activeCard && (
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-medium text-foreground">
                            {activeCard.current_stamps}/
                            {activeCard.stamps_required}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            sellos
                          </span>
                        </div>
                      )}
                      {completedCard && (
                        <Badge className="bg-success text-success-foreground text-xs">
                          Lavado Gratis
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {filtered.length} de {customers.length} clientes
      </p>
    </div>
  )
}
