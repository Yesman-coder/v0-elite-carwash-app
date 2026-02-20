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
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Gift } from "lucide-react"

interface RedeemDialogProps {
  cardId: string
  customerName: string
  services: Service[]
  onRedeemed: () => void
}

export function RedeemDialog({
  cardId,
  customerName,
  services,
  onRedeemed,
}: RedeemDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serviceId, setServiceId] = useState<string>("")

  async function handleRedeem() {
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

    const { data, error } = await supabase.rpc("redeem_card", {
      p_card_id: cardId,
      p_owner_id: user.id,
      p_service_id: serviceId && serviceId !== "none" ? serviceId : null,
    })

    if (error) {
      toast.error("Error al canjear: " + error.message)
      setLoading(false)
      return
    }

    const result = data as { success: boolean; error?: string; customer_name?: string }

    if (!result.success) {
      toast.error(result.error || "Error desconocido")
      setLoading(false)
      return
    }

    toast.success(
      `Lavado gratis canjeado para ${customerName}. Nueva tarjeta creada automaticamente.`
    )

    setServiceId("")
    setOpen(false)
    setLoading(false)
    onRedeemed()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90">
          <Gift className="mr-2 h-4 w-4" />
          Canjear Gratis
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Canjear Lavado Gratis</DialogTitle>
          <DialogDescription>
            {customerName} ha completado su tarjeta de fidelidad. Al canjear, se
            creara una nueva tarjeta automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label>Servicio a canjear (opcional)</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger className="bg-secondary">
                <SelectValue placeholder="Seleccionar servicio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Lavado basico</SelectItem>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleRedeem}
            disabled={loading}
            className="bg-success text-success-foreground hover:bg-success/90"
          >
            {loading ? "Canjeando..." : "Confirmar Canje"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
