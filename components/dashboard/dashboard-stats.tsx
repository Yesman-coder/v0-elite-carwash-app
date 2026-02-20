import { Users, ClipboardList, CreditCard, Gift, CalendarDays } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DashboardStatsProps {
  totalCustomers: number
  totalVisits: number
  activeCards: number
  pendingRedemptions: number
  todayVisits: number
}

export function DashboardStats({
  totalCustomers,
  totalVisits,
  activeCards,
  pendingRedemptions,
  todayVisits,
}: DashboardStatsProps) {
  const stats = [
    {
      title: "Clientes",
      value: totalCustomers,
      icon: Users,
      description: "Total registrados",
    },
    {
      title: "Visitas Hoy",
      value: todayVisits,
      icon: CalendarDays,
      description: "Servicios del dia",
    },
    {
      title: "Tarjetas Activas",
      value: activeCards,
      icon: CreditCard,
      description: "En progreso",
    },
    {
      title: "Por Canjear",
      value: pendingRedemptions,
      icon: Gift,
      description: "Lavados gratis",
    },
    {
      title: "Total Visitas",
      value: totalVisits,
      icon: ClipboardList,
      description: "Historico",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stat.value}
            </div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
