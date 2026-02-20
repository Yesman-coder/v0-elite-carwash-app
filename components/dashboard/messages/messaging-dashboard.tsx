"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CampaignCompose } from "./campaign-compose"
import { CampaignHistory } from "./campaign-history"
import { MessageTemplates } from "./message-templates"
import type { SmsCampaign, BusinessSettings } from "@/lib/types"
import { MessageSquare, Send, FileText } from "lucide-react"

interface MessagingDashboardProps {
  campaigns: SmsCampaign[]
  customers: { id: string; full_name: string; phone: string }[]
  settings: BusinessSettings | null
}

export function MessagingDashboard({
  campaigns: initialCampaigns,
  customers,
  settings,
}: MessagingDashboardProps) {
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [activeTab, setActiveTab] = useState("compose")

  function handleCampaignCreated(campaign: SmsCampaign) {
    setCampaigns((prev) => [campaign, ...prev])
    setActiveTab("history")
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mensajes SMS</h1>
        <p className="text-sm text-muted-foreground">
          Envia promociones, descuentos y eventos a tus clientes por SMS
        </p>
      </div>

      {/* Twilio setup notice */}
      <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
        <div className="flex items-start gap-3">
          <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Modo de prueba (Twilio no conectado)
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Los mensajes se registran en el sistema pero no se envian de
              verdad. Cuando tengas tu cuenta de Twilio, conecta las credenciales
              en las variables de entorno:{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                TWILIO_ACCOUNT_SID
              </code>
              ,{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                TWILIO_AUTH_TOKEN
              </code>
              ,{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                TWILIO_PHONE_NUMBER
              </code>
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:flex">
          <TabsTrigger value="compose" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Componer
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Historial ({campaigns.length})
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Plantillas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="mt-4">
          <CampaignCompose
            customers={customers}
            settings={settings}
            onCampaignCreated={handleCampaignCreated}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <CampaignHistory campaigns={campaigns} />
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <MessageTemplates settings={settings} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
