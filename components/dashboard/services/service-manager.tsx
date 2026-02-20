"use client"

import type { Service, VehicleType } from "@/lib/types"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
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
import { toast } from "sonner"
import { Plus, Droplets, Sparkles, Wrench, Crown, Stamp } from "lucide-react"

interface ServiceManagerProps {
  services: Service[]
  vehicleTypes: VehicleType[]
}

const categoryInfo: Record<
  string,
  { label: string; icon: React.ElementType }
> = {
  wash: { label: "Lavado", icon: Droplets },
  detail: { label: "Detallado", icon: Sparkles },
  addon: { label: "Adicional", icon: Wrench },
  premium: { label: "Premium", icon: Crown },
}

export function ServiceManager({ services }: ServiceManagerProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error("Sesion expirada")
      setLoading(false)
      return
    }

    const { error } = await supabase.from("services").insert({
      owner_id: user.id,
      name: form.get("name") as string,
      description: (form.get("description") as string) || null,
      base_price: parseFloat(form.get("base_price") as string) || 0,
      duration_minutes: parseInt(form.get("duration_minutes") as string) || 30,
      category: form.get("category") as string,
      earns_stamp: form.get("earns_stamp") === "on",
    })

    if (error) {
      toast.error("Error: " + error.message)
      setLoading(false)
      return
    }

    toast.success("Servicio creado")
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  async function toggleActive(service: Service) {
    const supabase = createClient()
    const { error } = await supabase
      .from("services")
      .update({ is_active: !service.is_active })
      .eq("id", service.id)

    if (error) {
      toast.error("Error: " + error.message)
      return
    }

    toast.success(
      service.is_active ? "Servicio desactivado" : "Servicio activado"
    )
    router.refresh()
  }

  const grouped = Object.entries(categoryInfo).map(([key, info]) => ({
    key,
    ...info,
    items: services.filter((s) => s.category === key),
  }))

  return (
    <div className="flex flex-col gap-6">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="self-end">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Servicio
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Nuevo Servicio</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="svc-name">Nombre *</Label>
                <Input
                  id="svc-name"
                  name="name"
                  required
                  placeholder="Lavado Express"
                  className="bg-secondary"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="svc-desc">Descripcion</Label>
                <Input
                  id="svc-desc"
                  name="description"
                  placeholder="Descripcion del servicio"
                  className="bg-secondary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="svc-price">Precio ($)</Label>
                  <Input
                    id="svc-price"
                    name="base_price"
                    type="number"
                    step="0.01"
                    defaultValue="5.00"
                    className="bg-secondary"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="svc-dur">Duracion (min)</Label>
                  <Input
                    id="svc-dur"
                    name="duration_minutes"
                    type="number"
                    defaultValue="30"
                    className="bg-secondary"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Categoria</Label>
                <Select name="category" defaultValue="wash">
                  <SelectTrigger className="bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wash">Lavado</SelectItem>
                    <SelectItem value="detail">Detallado</SelectItem>
                    <SelectItem value="addon">Adicional</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="earns-stamp" name="earns_stamp" defaultChecked />
                <Label htmlFor="earns-stamp">Otorga sello de fidelidad</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Creando..." : "Crear Servicio"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {grouped.map(({ key, label, icon: Icon, items }) => (
        <div key={key}>
          <div className="mb-3 flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </h2>
            <Badge variant="secondary" className="text-xs">
              {items.length}
            </Badge>
          </div>
          {items.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No hay servicios en esta categoria
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((service) => (
                <Card
                  key={service.id}
                  className={!service.is_active ? "opacity-60" : ""}
                >
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div>
                      <CardTitle className="text-sm font-semibold text-foreground">
                        {service.name}
                      </CardTitle>
                      {service.description && (
                        <p className="text-xs text-muted-foreground">
                          {service.description}
                        </p>
                      )}
                    </div>
                    <Switch
                      checked={service.is_active}
                      onCheckedChange={() => toggleActive(service)}
                      aria-label="Toggle active"
                    />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-foreground">
                        ${Number(service.base_price).toFixed(2)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {service.duration_minutes} min
                        </span>
                        {service.earns_stamp && (
                          <Badge
                            variant="outline"
                            className="gap-1 text-xs text-primary"
                          >
                            <Stamp className="h-3 w-3" />
                            Sello
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
