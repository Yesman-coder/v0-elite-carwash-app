"use client"

import { cn } from "@/lib/utils"
import { Droplets, Check, Gift } from "lucide-react"

interface LoyaltyCardVisualProps {
  currentStamps: number
  stampsRequired: number
  cardNumber: number
  customerName: string
  status: "active" | "completed" | "redeemed" | "expired"
  compact?: boolean
}

export function LoyaltyCardVisual({
  currentStamps,
  stampsRequired,
  cardNumber,
  customerName,
  status,
  compact = false,
}: LoyaltyCardVisualProps) {
  const slots = Array.from({ length: stampsRequired }, (_, i) => i + 1)
  const isComplete = status === "completed" || status === "redeemed"

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border-2 p-4",
        isComplete
          ? "border-success/50 bg-success/5"
          : "border-primary/30 bg-card",
        compact && "p-3"
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full",
              isComplete ? "bg-success/20" : "bg-primary/20"
            )}
          >
            {isComplete ? (
              <Gift className="h-4 w-4 text-success" />
            ) : (
              <Droplets className="h-4 w-4 text-primary" />
            )}
          </div>
          <div>
            <p
              className={cn(
                "text-xs font-bold uppercase tracking-wider",
                isComplete ? "text-success" : "text-primary"
              )}
            >
              {isComplete ? "Lavado Gratis" : "Elite Carwash"}
            </p>
            <p className="text-xs text-muted-foreground">
              Tarjeta #{cardNumber}
            </p>
          </div>
        </div>
        {!compact && (
          <span className="text-xs text-muted-foreground">{customerName}</span>
        )}
      </div>

      {/* Stamp Grid */}
      <div
        className={cn(
          "grid gap-2",
          stampsRequired <= 5
            ? "grid-cols-5"
            : stampsRequired <= 8
              ? "grid-cols-4"
              : stampsRequired <= 10
                ? "grid-cols-5"
                : "grid-cols-6"
        )}
      >
        {slots.map((num) => {
          const isStamped = num <= currentStamps
          const isLastSlot = num === stampsRequired

          return (
            <div
              key={num}
              className={cn(
                "relative flex aspect-square items-center justify-center rounded-lg border-2 transition-all",
                compact ? "rounded-md" : "rounded-lg",
                isStamped
                  ? "border-primary bg-primary/20"
                  : isLastSlot
                    ? "border-dashed border-success/50 bg-success/5"
                    : "border-dashed border-border bg-muted/50"
              )}
            >
              {isStamped ? (
                <Check
                  className={cn(
                    "text-primary",
                    compact ? "h-4 w-4" : "h-5 w-5"
                  )}
                  strokeWidth={3}
                />
              ) : isLastSlot ? (
                <Gift
                  className={cn(
                    "text-success/50",
                    compact ? "h-3 w-3" : "h-4 w-4"
                  )}
                />
              ) : (
                <span
                  className={cn(
                    "font-mono text-muted-foreground/50",
                    compact ? "text-xs" : "text-sm"
                  )}
                >
                  {num}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {currentStamps}/{stampsRequired} sellos
        </span>
        <span
          className={cn(
            "text-xs font-medium",
            isComplete ? "text-success" : "text-primary"
          )}
        >
          {status === "active"
            ? `Faltan ${stampsRequired - currentStamps}`
            : status === "completed"
              ? "Listo para canjear"
              : status === "redeemed"
                ? "Canjeada"
                : "Expirada"}
        </span>
      </div>
    </div>
  )
}
