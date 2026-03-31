"use client"

import type { VehicleType, Customer } from "@/lib/types"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

interface CustomerFormProps {
  vehicleTypes: VehicleType[]
  stampsRequired: number
  customer?: Customer
}

export function CustomerForm({
  vehicleTypes,
  stampsRequired,
  customer,
}: CustomerFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const isEditing = !!customer

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const fullName = form.get("full_name") as string
    const phone = form.get("phone") as string
    const email = (form.get("email") as string) || null
    const vehicleTypeId = (form.get("vehicle_type_id") as string) || null
    const vehicleMake = (form.get("vehicle_brand") as string) || null
    const vehicleModel = (form.get("vehicle_model") as string) || null
    const vehicleColor = (form.get("vehicle_color") as string) || null
    const lastKmRaw = form.get("last_km") as string
    const lastKm = lastKmRaw ? parseInt(lastKmRaw, 10) : null
    const notes = (form.get("notes") as string) || null

    if (!fullName || !phone) {
      toast.error("Nombre y telefono son requeridos")
      setLoading(false)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error("Sesion expirada")
      setLoading(false)
      return
    }

    if (isEditing) {
      const { error } = await supabase
        .from("customers")
        .update({
          full_name: fullName,
          phone,
          email,
          vehicle_type_id: vehicleTypeId === "none" ? null : vehicleTypeId,
          vehicle_brand: vehicleMake,
          vehicle_model: vehicleModel,
          vehicle_color: vehicleColor,
          last_km: lastKm,
          notes,
        })
        .eq("id", customer.id)

      if (error) {
        toast.error("Error al actualizar cliente: " + error.message)
        setLoading(false)
        return
      }

      toast.success("Cliente actualizado correctamente")
      router.push(`/dashboard/customers/${customer.id}`)
    } else {
      // Create customer
      const { data: newCustomer, error: customerError } = await supabase
        .from("customers")
        .insert({
          owner_id: user.id,
          full_name: fullName,
          phone,
          email,
          vehicle_type_id: vehicleTypeId === "none" ? null : vehicleTypeId,
          vehicle_brand: vehicleMake,
          vehicle_model: vehicleModel,
          vehicle_color: vehicleColor,
          last_km: lastKm,
          notes,
        })
        .select("id")
        .single()

      if (customerError || !newCustomer) {
        toast.error(
          "Error al crear cliente: " + (customerError?.message || "Unknown")
        )
        setLoading(false)
        return
      }

      // Create initial loyalty card
      const { error: cardError } = await supabase
        .from("loyalty_cards")
        .insert({
          owner_id: user.id,
          customer_id: newCustomer.id,
          stamps_required: stampsRequired,
        })

      if (cardError) {
        toast.error("Cliente creado pero error al crear tarjeta: " + cardError.message)
      } else {
        toast.success("Cliente y tarjeta de fidelidad creados")
      }

      // Send welcome SMS (fire-and-forget — don't block navigation on failure)
      fetch("/api/notifications/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: newCustomer.id }),
      }).catch(() => null)

      router.push(`/dashboard/customers/${newCustomer.id}`)
    }

    router.refresh()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informacion Personal</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="full_name">Nombre completo *</Label>
              <Input
                id="full_name"
                name="full_name"
                required
                defaultValue={customer?.full_name || ""}
                placeholder="Nombre del cliente"
                className="bg-secondary"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Telefono *</Label>
              <Input
                id="phone"
                name="phone"
                required
                defaultValue={customer?.phone || ""}
                placeholder="+58 412 1234567"
                className="bg-secondary"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email (opcional)</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={customer?.email || ""}
              placeholder="cliente@email.com"
              className="bg-secondary"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vehiculo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {vehicleTypes.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="vehicle_type_id">Tipo de vehiculo</Label>
              <Select
                name="vehicle_type_id"
                defaultValue={customer?.vehicle_type_id || "none"}
              >
                <SelectTrigger className="bg-secondary">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin tipo</SelectItem>
                  {vehicleTypes.map((vt) => (
                    <SelectItem key={vt.id} value={vt.id}>
                      {vt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="vehicle_brand">Marca</Label>
              <Input
                id="vehicle_brand"
                name="vehicle_brand"
                defaultValue={customer?.vehicle_brand || ""}
                placeholder="Toyota, Ford..."
                className="bg-secondary"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="vehicle_model">Modelo</Label>
              <Input
                id="vehicle_model"
                name="vehicle_model"
                defaultValue={customer?.vehicle_model || ""}
                placeholder="Corolla, F-150..."
                className="bg-secondary"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="vehicle_color">Color</Label>
              <Input
                id="vehicle_color"
                name="vehicle_color"
                defaultValue={customer?.vehicle_color || ""}
                placeholder="Blanco, Negro..."
                className="bg-secondary"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="last_km">Kilometraje</Label>
              <Input
                id="last_km"
                name="last_km"
                type="number"
                min={0}
                defaultValue={customer?.last_km ?? ""}
                placeholder="85000"
                className="bg-secondary"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notas</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            name="notes"
            defaultValue={customer?.notes || ""}
            placeholder="Notas adicionales sobre el cliente..."
            className="bg-secondary"
            rows={3}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/customers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <Button type="submit" disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading
            ? "Guardando..."
            : isEditing
              ? "Actualizar"
              : "Crear Cliente"}
        </Button>
      </div>
    </form>
  )
}
