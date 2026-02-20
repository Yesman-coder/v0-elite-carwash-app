"use client"

import type { PortalCard } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Droplets, Check, Gift } from "lucide-react"

interface PortalLoyaltyCardProps {
  card: PortalCard
  customerName: string
}

export function PortalLoyaltyCard({
  card,
  customerName,
}: PortalLoyaltyCardProps) {
  const slots = Array.from({ length: card.stamps_required }, (_, i) => i + 1)
  const isComplete = card.status === "completed"

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border-2 p-5",
        isComplete
          ? "border-success/50 bg-success/5"
          : "border-primary/30 bg-card"
      )}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              isComplete ? "bg-success/20" : "bg-primary/20"
            )}
          >
            {isComplete ? (
              <Gift className="h-5 w-5 text-success" />
            ) : (
              <Droplets className="h-5 w-5 text-primary" />
            )}
          </div>
          <div>
            <p
              className={cn(
                "text-sm font-bold uppercase tracking-wider",
                isComplete ? "text-success" : "text-primary"
              )}
            >
              {isComplete ? "Tarjeta Completa!" : "Mi Tarjeta"}
            </p>
            <p className="text-xs text-muted-foreground">
              #{card.card_number} - {customerName}
            </p>
          </div>
        </div>
      </div>

      {/* Stamp Grid */}
      <div
        className={cn(
          "grid gap-3",
          card.stamps_required <= 5
            ? "grid-cols-5"
            : card.stamps_required <= 8
              ? "grid-cols-4"
              : card.stamps_required <= 10
                ? "grid-cols-5"
                : "grid-cols-6"
        )}
      >
        {slots.map((num) => {
          const isStamped = num <= card.current_stamps
          const isLastSlot = num === card.stamps_required

          return (
            <div
              key={num}
              className={cn(
                "flex aspect-square items-center justify-center rounded-xl border-2 transition-all",
                isStamped
                  ? "border-primary bg-primary/20"
                  : isLastSlot
                    ? "border-dashed border-success/50 bg-success/5"
                    : "border-dashed border-border bg-muted/50"
              )}
            >
              {isStamped ? (
                <Check className="h-6 w-6 text-primary" strokeWidth={3} />
              ) : isLastSlot ? (
                <Gift className="h-5 w-5 text-success/50" />
              ) : (
                <span className="font-mono text-sm text-muted-foreground/40">
                  {num}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Progress */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          {card.current_stamps}/{card.stamps_required} sellos
        </span>
        <span
          className={cn(
            "text-sm font-bold",
            isComplete ? "text-success" : "text-primary"
          )}
        >
          {isComplete
            ? "Lavado Gratis!"
            : `Faltan ${card.stamps_required - card.current_stamps}`}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isComplete ? "bg-success" : "bg-primary"
          )}
          style={{
            width: `${(card.current_stamps / card.stamps_required) * 100}%`,
          }}
        />
      </div>
    </div>
  )
}
