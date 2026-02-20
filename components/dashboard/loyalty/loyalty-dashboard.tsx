"use client"

import type { LoyaltyCard, Service } from "@/lib/types"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, CreditCard } from "lucide-react"
import { LoyaltyCardVisual } from "./loyalty-card-visual"
import { AddStampDialog } from "./add-stamp-dialog"
import { RedeemDialog } from "./redeem-dialog"
import Link from "next/link"

interface LoyaltyDashboardProps {
  cards: (LoyaltyCard & { customer: { id: string; full_name: string; phone: string; vehicle_plate: string | null } | null })[]
  services: Service[]
}

export function LoyaltyDashboard({ cards, services }: LoyaltyDashboardProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")

  const activeCards = cards.filter((c) => c.status === "active")
  const completedCards = cards.filter((c) => c.status === "completed")

  function filterCards(cardList: typeof cards) {
    if (!search) return cardList
    const s = search.toLowerCase()
    return cardList.filter(
      (c) =>
        c.customer?.full_name.toLowerCase().includes(s) ||
        c.customer?.phone.includes(s) ||
        c.customer?.vehicle_plate?.toLowerCase().includes(s)
    )
  }

  function CardItem({
    card,
  }: {
    card: (typeof cards)[0]
  }) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <Link
              href={`/dashboard/customers/${card.customer?.id}`}
              className="group flex flex-col"
            >
              <span className="text-sm font-semibold text-foreground group-hover:underline">
                {card.customer?.full_name}
              </span>
              <span className="text-xs text-muted-foreground">
                {card.customer?.phone}
                {card.customer?.vehicle_plate &&
                  ` - ${card.customer.vehicle_plate}`}
              </span>
            </Link>
            <div className="flex items-center gap-2">
              {card.status === "completed" && (
                <RedeemDialog
                  cardId={card.id}
                  customerName={card.customer?.full_name || ""}
                  services={services}
                  onRedeemed={() => router.refresh()}
                />
              )}
              {card.status === "active" && (
                <AddStampDialog
                  cardId={card.id}
                  currentStamps={card.current_stamps}
                  stampsRequired={card.stamps_required}
                  services={services}
                  onStampAdded={() => router.refresh()}
                />
              )}
            </div>
          </div>
          <LoyaltyCardVisual
            currentStamps={card.current_stamps}
            stampsRequired={card.stamps_required}
            cardNumber={card.card_number}
            customerName={card.customer?.full_name || ""}
            status={card.status}
            compact
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Stats bar */}
      <div className="flex gap-3">
        <Badge variant="secondary" className="gap-1 px-3 py-1.5">
          <CreditCard className="h-3.5 w-3.5" />
          {activeCards.length} Activas
        </Badge>
        <Badge className="gap-1 bg-success px-3 py-1.5 text-success-foreground">
          {completedCards.length} Por Canjear
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, telefono o placa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-secondary pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue={completedCards.length > 0 ? "completed" : "active"}>
        <TabsList className="w-full">
          <TabsTrigger value="completed" className="flex-1">
            Por Canjear ({completedCards.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="flex-1">
            Activas ({activeCards.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="completed" className="mt-4">
          {filterCards(completedCards).length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No hay tarjetas completas pendientes de canje
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filterCards(completedCards).map((card) => (
                <CardItem key={card.id} card={card} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-4">
          {filterCards(activeCards).length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No hay tarjetas activas
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filterCards(activeCards).map((card) => (
                <CardItem key={card.id} card={card} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
