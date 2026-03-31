"use client"

import type { Service } from "@/lib/types"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Stamp } from "lucide-react"

interface AddStampDialogProps {
  cardId: string
  customerId: string
  currentStamps: number
  stampsRequired: number
  services: Service[]
  onStampAdded: () => void
}

export function AddStampDialog({
  cardId,
  customerId,
  currentStamps,
  stampsRequired,
  services,
  onStampAdded,
}: AddStampDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serviceId, setServiceId] = useState<string>("")
  const [kmReading, setKmReading] = useState<string>("")
  const [notes, setNotes] = useState("")

  async function handleAddStamp() {
    setLoading(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error("Sesion expirada")
      setLoading(false)
      return
    }

    const { data, error } = await supabase.rpc("add_stamp", {
      p_card_id: cardId,
      p_owner_id: user.id,
      p_service_id: serviceId && serviceId !== "none" ? serviceId : null,
      p_notes: notes || null,
    })

    if (error) {
      toast.error("Error al agregar sello: " + error.message)
      setLoading(false)
      return
    }

    const result = data as { success: boolean; error?: string; is_complete?: boolean; stamp_number?: number; stamps_required?: number }

    if (!result.success) {
      toast.error(result.error || "Error desconocido")
      setLoading(false)
      return
    }

    if (result.is_complete) {
      toast.success(
        `Sello ${result.stamp_number}/${result.stamps_required} agregado - Tarjeta COMPLETA! Lavado gratis disponible.`
      )
      // Send reward SMS (fire-and-forget)
      fetch("/api/notifications/reward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId }),
      }).catch(() => null)
    } else {
      toast.success(
        `Sello ${result.stamp_number}/${result.stamps_required} agregado`
      )
    }

    // Update customer km if provided
    const km = kmReading ? parseInt(kmReading, 10) : null
    if (km && km > 0) {
      // Get the customer_id from the card
      const { data: cardData } = await supabase
        .from("loyalty_cards")
        .select("customer_id")
        .eq("id", cardId)
        .single()

      if (cardData) {
        const updateFields: Record<string, unknown> = { last_km: km }
        // Check if service is oil-change related
        const selectedService = services.find((s) => s.id === serviceId)
        if (
          selectedService &&
          (selectedService.name.toLowerCase().includes("aceite") ||
            selectedService.name.toLowerCase().includes("oil"))
        ) {
          updateFields.last_oil_change_km = km
        }
        await supabase
          .from("customers")
          .update(updateFields)
          .eq("id", cardData.customer_id)

        // Also create a visit record with km
        if (selectedService) {
          await supabase.from("visits").insert({
            owner_id: user.id,
            customer_id: cardData.customer_id,
            service_id: serviceId,
            service_name: selectedService.name,
            price: selectedService.base_price,
            final_price: selectedService.base_price,
            km_reading: km,
            payment_method: "pending",
            payment_status: "pending",
            loyalty_card_id: cardId,
            served_by: user.id,
          })
        }
      }
    } else if (serviceId && serviceId !== "none") {
      // No km but service selected - still create visit
      const selectedService = services.find((s) => s.id === serviceId)
      const { data: cardData } = await supabase
        .from("loyalty_cards")
        .select("customer_id")
        .eq("id", cardId)
        .single()

      if (selectedService && cardData) {
        await supabase.from("visits").insert({
          owner_id: user.id,
          customer_id: cardData.customer_id,
          service_id: serviceId,
          service_name: selectedService.name,
          price: selectedService.base_price,
          final_price: selectedService.base_price,
          payment_method: "pending",
          payment_status: "pending",
          loyalty_card_id: cardId,
          served_by: user.id,
        })
      }
    }

    setServiceId("")
    setKmReading("")
    setNotes("")
    setOpen(false)
    setLoading(false)
    onStampAdded()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Stamp className="mr-2 h-4 w-4" />
          Agregar Sello
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Sello</DialogTitle>
          <DialogDescription>
            Sello {currentStamps + 1} de {stampsRequired}
            {currentStamps + 1 >= stampsRequired &&
              " - Este sello completara la tarjeta!"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label>Servicio realizado (opcional)</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger className="bg-secondary">
                <SelectValue placeholder="Seleccionar servicio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin servicio especifico</SelectItem>
                {services
                  .filter((s) => s.earns_stamp)
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} - ${Number(s.base_price).toFixed(2)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Kilometraje actual (opcional)</Label>
            <Input
              type="number"
              min={0}
              value={kmReading}
              onChange={(e) => setKmReading(e.target.value)}
              placeholder="85000"
              className="bg-secondary"
            />
            <p className="text-xs text-muted-foreground">
              Registrar km del vehiculo para recordatorios de cambio de aceite
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Notas (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas sobre el servicio..."
              className="bg-secondary"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAddStamp} disabled={loading}>
            {loading ? "Agregando..." : "Confirmar Sello"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
