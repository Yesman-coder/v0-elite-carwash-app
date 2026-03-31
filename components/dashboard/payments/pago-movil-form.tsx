"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Smartphone } from "lucide-react"

const VENEZUELAN_BANKS = [
  "Banesco",
  "Banco de Venezuela",
  "Mercantil",
  "BBVA Provincial",
  "Banco Exterior",
  "Banplus",
  "Bancamiga",
  "Fondo Común",
  "BNC (Banco Nacional de Crédito)",
  "Bicentenario",
  "Del Tesoro",
  "Otro",
]

interface PagoMovilFormProps {
  visitId: string
  amount: number
  onConfirmed: () => void
}

export function PagoMovilForm({ visitId, amount, onConfirmed }: PagoMovilFormProps) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [bank, setBank] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const phone = form.get("phone") as string
    const reference = form.get("reference") as string

    if (!bank || !phone || !reference) {
      toast.error("Completa todos los campos del Pago Móvil")
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from("visits")
      .update({
        payment_method: "pago_movil",
        payment_status: "paid",
        notes: `Pago Móvil | Banco: ${bank} | Tel: ${phone} | Ref: ${reference}`,
      })
      .eq("id", visitId)

    if (error) {
      toast.error("Error al registrar pago: " + error.message)
    } else {
      toast.success("Pago Móvil registrado correctamente")
      setOpen(false)
      onConfirmed()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <Smartphone className="h-4 w-4" />
          Pago Móvil
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Registrar Pago Móvil</DialogTitle>
            <DialogDescription>
              Ingresa los datos del Pago Móvil recibido para este servicio.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            {/* Amount display */}
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Monto a cobrar</span>
              <Badge className="text-base font-bold px-3 py-1">
                Bs. {Number(amount).toFixed(2)}
              </Badge>
            </div>

            <div className="rounded-lg border border-warning/30 bg-warning/10 p-3">
              <p className="text-xs text-muted-foreground">
                ⚠️ Verifica el pago en tu aplicación bancaria <strong>antes</strong> de confirmar.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="bank">Banco *</Label>
              <Select value={bank} onValueChange={setBank} required>
                <SelectTrigger id="bank">
                  <SelectValue placeholder="Seleccionar banco" />
                </SelectTrigger>
                <SelectContent>
                  {VENEZUELAN_BANKS.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Teléfono del cliente *</Label>
              <Input
                id="phone"
                name="phone"
                required
                placeholder="04XX-XXXXXXX"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="reference">Número de referencia *</Label>
              <Input
                id="reference"
                name="reference"
                required
                placeholder="Ej: 123456789"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Confirmando..." : "Confirmar Pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
