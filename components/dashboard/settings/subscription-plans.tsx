"use client"

import type { SubscriptionPlan } from "@/lib/types"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Infinity } from "lucide-react"

interface SubscriptionPlansProps {
  plans: SubscriptionPlan[]
}

export function SubscriptionPlans({ plans: initialPlans }: SubscriptionPlansProps) {
  const router = useRouter()
  const supabase = createClient()
  const [plans, setPlans] = useState<SubscriptionPlan[]>(initialPlans)
  const [open, setOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [ilimitado, setIlimitado] = useState(false)

  function openCreate() {
    setEditingPlan(null)
    setIlimitado(false)
    setOpen(true)
  }

  function openEdit(plan: SubscriptionPlan) {
    setEditingPlan(plan)
    setIlimitado(plan.wash_limit === null)
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const name = form.get("name") as string
    const priceRaw = form.get("price") as string
    const washLimitRaw = form.get("wash_limit") as string

    if (!name || !priceRaw) {
      toast.error("Nombre y precio son requeridos")
      setLoading(false)
      return
    }

    const priceCents = Math.round(parseFloat(priceRaw) * 100)
    const washLimit = ilimitado ? null : (washLimitRaw ? parseInt(washLimitRaw, 10) : null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error("Sesión expirada")
      setLoading(false)
      return
    }

    if (editingPlan) {
      const { error } = await supabase
        .from("subscription_plans")
        .update({ name, price_cents: priceCents, wash_limit: washLimit })
        .eq("id", editingPlan.id)

      if (error) {
        toast.error("Error al actualizar plan: " + error.message)
      } else {
        toast.success("Plan actualizado")
        setPlans((prev) =>
          prev.map((p) =>
            p.id === editingPlan.id
              ? { ...p, name, price_cents: priceCents, wash_limit: washLimit }
              : p
          )
        )
      }
    } else {
      const { data, error } = await supabase
        .from("subscription_plans")
        .insert({ owner_id: user.id, name, price_cents: priceCents, wash_limit: washLimit })
        .select()
        .single()

      if (error || !data) {
        toast.error("Error al crear plan: " + (error?.message ?? ""))
      } else {
        toast.success("Plan creado")
        setPlans((prev) => [...prev, data as SubscriptionPlan])
      }
    }

    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  async function handleDelete(plan: SubscriptionPlan) {
    if (!confirm(`¿Eliminar el plan "${plan.name}"? Los clientes activos no serán afectados.`)) return

    const { error } = await supabase
      .from("subscription_plans")
      .update({ is_active: false })
      .eq("id", plan.id)

    if (error) {
      toast.error("Error al eliminar plan")
    } else {
      toast.success("Plan desactivado")
      setPlans((prev) => prev.filter((p) => p.id !== plan.id))
      router.refresh()
    }
  }

  function formatPrice(cents: number) {
    return `Bs. ${(cents / 100).toFixed(2)}`
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Planes de Suscripción</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Define los planes mensuales que ofrecerás a tus clientes
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingPlan ? "Editar Plan" : "Nuevo Plan de Suscripción"}</DialogTitle>
                <DialogDescription>
                  Los clientes suscritos pagan mensualmente por una cantidad fija de lavados.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Nombre del plan *</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    defaultValue={editingPlan?.name ?? ""}
                    placeholder="Ej: Plan Básico, Plan VIP..."
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="price">Precio mensual (Bs.) *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    defaultValue={editingPlan ? (editingPlan.price_cents / 100).toFixed(2) : ""}
                    placeholder="0.00"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="ilimitado"
                      checked={ilimitado}
                      onCheckedChange={setIlimitado}
                    />
                    <Label htmlFor="ilimitado">Lavados ilimitados</Label>
                  </div>
                  {!ilimitado && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="wash_limit">Número de lavados por mes</Label>
                      <Input
                        id="wash_limit"
                        name="wash_limit"
                        type="number"
                        min="1"
                        defaultValue={editingPlan?.wash_limit ?? ""}
                        placeholder="Ej: 4"
                      />
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Guardando..." : editingPlan ? "Actualizar" : "Crear Plan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {plans.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No tienes planes de suscripción. Crea uno para comenzar a ofrecerlos a tus clientes.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{plan.name}</span>
                    <Badge variant="secondary">{formatPrice(plan.price_cents)}/mes</Badge>
                    <Badge variant="outline" className="gap-1">
                      {plan.wash_limit === null ? (
                        <>
                          <Infinity className="h-3 w-3" />
                          Ilimitado
                        </>
                      ) : (
                        `${plan.wash_limit} lavados`
                      )}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => openEdit(plan)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(plan)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
