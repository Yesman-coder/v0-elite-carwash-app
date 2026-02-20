"use client"

import type { SmsCampaign } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  MessageSquare,
} from "lucide-react"

interface CampaignHistoryProps {
  campaigns: SmsCampaign[]
}

function getStatusBadge(status: SmsCampaign["status"]) {
  switch (status) {
    case "draft":
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" /> Borrador
        </Badge>
      )
    case "sending":
      return (
        <Badge className="gap-1 bg-warning text-warning-foreground">
          <Send className="h-3 w-3" /> Enviando
        </Badge>
      )
    case "sent":
      return (
        <Badge className="gap-1 bg-success text-success-foreground">
          <CheckCircle2 className="h-3 w-3" /> Enviada
        </Badge>
      )
    case "failed":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" /> Fallida
        </Badge>
      )
  }
}

function getAudienceLabel(audience: SmsCampaign["audience"]) {
  switch (audience) {
    case "all":
      return "Todos los clientes"
    case "active_card":
      return "Con tarjeta activa"
    case "completed_card":
      return "Tarjeta completada"
    case "no_visits_30d":
      return "Sin visita reciente"
    case "custom":
      return "Personalizado"
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-VE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function CampaignHistory({ campaigns }: CampaignHistoryProps) {
  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-sm font-medium text-muted-foreground">
            No hay campanas enviadas
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Compone tu primer mensaje para empezar
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {campaigns.map((campaign) => (
        <Card key={campaign.id}>
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
            <div className="flex-1">
              <CardTitle className="text-base">{campaign.title}</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {campaign.sent_at
                  ? formatDate(campaign.sent_at)
                  : formatDate(campaign.created_at)}
              </p>
            </div>
            {getStatusBadge(campaign.status)}
          </CardHeader>
          <CardContent>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {campaign.message}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {getAudienceLabel(campaign.audience)}
              </span>
              {campaign.recipient_count > 0 && (
                <span className="flex items-center gap-1">
                  <Send className="h-3.5 w-3.5" />
                  {campaign.sent_count}/{campaign.recipient_count} enviados
                </span>
              )}
              {campaign.failed_count > 0 && (
                <span className="flex items-center gap-1 text-destructive">
                  <XCircle className="h-3.5 w-3.5" />
                  {campaign.failed_count} fallidos
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
