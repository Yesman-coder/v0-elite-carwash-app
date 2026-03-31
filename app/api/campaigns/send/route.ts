import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import twilio from "twilio"

function getTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !token) return null
  return twilio(sid, token)
}

async function sendSms(to: string, body: string): Promise<{ success: boolean; status: string }> {
  const client = getTwilioClient()
  const from = process.env.TWILIO_PHONE_NUMBER

  if (client && from) {
    try {
      await client.messages.create({ body, from, to })
      return { success: true, status: "sent" }
    } catch (err) {
      const error = err as Error
      console.error("[Twilio Campaign Error]", error.message)
      return { success: false, status: "failed" }
    }
  }

  // Dev fallback
  console.log(`[SMS DEV] To: ${to} | ${body.substring(0, 60)}...`)
  return { success: true, status: "stubbed" }
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { campaignId } = await request.json()

  if (!campaignId) {
    return NextResponse.json({ error: "campaign_id requerido" }, { status: 400 })
  }

  const { data: campaign, error: campError } = await supabase
    .from("sms_campaigns")
    .select("*")
    .eq("id", campaignId)
    .eq("owner_id", user.id)
    .single()

  if (campError || !campaign) {
    return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 })
  }

  if (campaign.status !== "draft") {
    return NextResponse.json({ error: "Esta campaña ya fue enviada" }, { status: 400 })
  }

  // Build recipient list based on audience
  type Recipient = { id: string; full_name: string; phone: string }
  let recipients: Recipient[] = []

  const baseQuery = () =>
    supabase
      .from("customers")
      .select("id, full_name, phone")
      .eq("owner_id", user.id)
      .eq("is_active", true)

  if (campaign.audience === "all") {
    const { data } = await baseQuery()
    recipients = data ?? []
  } else if (campaign.audience === "active_card") {
    const { data: cards } = await supabase
      .from("loyalty_cards")
      .select("customer_id")
      .eq("owner_id", user.id)
      .eq("status", "active")
    const ids = cards?.map((c) => c.customer_id) ?? []
    if (ids.length > 0) {
      const { data } = await baseQuery().in("id", ids)
      recipients = data ?? []
    }
  } else if (campaign.audience === "completed_card") {
    const { data: cards } = await supabase
      .from("loyalty_cards")
      .select("customer_id")
      .eq("owner_id", user.id)
      .eq("status", "completed")
    const ids = cards?.map((c) => c.customer_id) ?? []
    if (ids.length > 0) {
      const { data } = await baseQuery().in("id", ids)
      recipients = data ?? []
    }
  } else if (campaign.audience === "no_visits_30d") {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const { data: recentVisits } = await supabase
      .from("visits")
      .select("customer_id")
      .eq("owner_id", user.id)
      .gte("created_at", thirtyDaysAgo.toISOString())
    const recentIds = new Set(recentVisits?.map((v) => v.customer_id) ?? [])
    const { data: all } = await baseQuery()
    recipients = (all ?? []).filter((c) => !recentIds.has(c.id))
  }

  if (recipients.length === 0) {
    return NextResponse.json(
      { error: "No hay destinatarios para esta audiencia" },
      { status: 400 }
    )
  }

  // Mark campaign as sending
  await supabase
    .from("sms_campaigns")
    .update({ status: "sending", recipient_count: recipients.length })
    .eq("id", campaignId)

  let sentCount = 0
  let failedCount = 0

  for (const recipient of recipients) {
    const personalizedMsg = campaign.message.replace("{name}", recipient.full_name)
    const result = await sendSms(recipient.phone, personalizedMsg)

    await supabase.from("sms_campaign_recipients").insert({
      campaign_id: campaignId,
      customer_id: recipient.id,
      phone: recipient.phone,
      status: result.status,
      sent_at: new Date().toISOString(),
    })

    await supabase.from("notification_log").insert({
      owner_id: user.id,
      customer_id: recipient.id,
      type: "promo",
      channel: "sms",
      recipient: recipient.phone,
      message: personalizedMsg,
      status: result.status,
      metadata: { campaign_id: campaignId },
    })

    if (result.success) {
      sentCount++
    } else {
      failedCount++
    }
  }

  await supabase
    .from("sms_campaigns")
    .update({
      status: "sent",
      sent_count: sentCount,
      failed_count: failedCount,
      sent_at: new Date().toISOString(),
    })
    .eq("id", campaignId)

  return NextResponse.json({
    success: true,
    sent: sentCount,
    failed: failedCount,
    total: recipients.length,
  })
}
