import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * TWILIO INTEGRATION PLACEHOLDER
 *
 * When you have a Twilio account, install the package:
 *   pnpm add twilio
 *
 * Then uncomment and configure:
 *
 *   import twilio from "twilio"
 *   const twilioClient = twilio(
 *     process.env.TWILIO_ACCOUNT_SID,
 *     process.env.TWILIO_AUTH_TOKEN
 *   )
 *   const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER
 */

async function sendSmsStub(to: string, message: string) {
  // STUB: Replace with real Twilio call
  // Example Twilio call:
  //   await twilioClient.messages.create({ body: message, from: TWILIO_FROM, to })
  console.log(`[SMS STUB] Sending to ${to}: ${message.substring(0, 50)}...`)
  // Simulate a small delay
  await new Promise((r) => setTimeout(r, 50))
  return { success: true, status: "stubbed" as const }
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
    return NextResponse.json(
      { error: "campaign_id requerido" },
      { status: 400 }
    )
  }

  // Verify campaign belongs to user
  const { data: campaign, error: campError } = await supabase
    .from("sms_campaigns")
    .select("*")
    .eq("id", campaignId)
    .eq("owner_id", user.id)
    .single()

  if (campError || !campaign) {
    return NextResponse.json(
      { error: "Campana no encontrada" },
      { status: 404 }
    )
  }

  if (campaign.status !== "draft") {
    return NextResponse.json(
      { error: "Esta campana ya fue enviada" },
      { status: 400 }
    )
  }

  // Build recipient list based on audience
  let query = supabase
    .from("customers")
    .select("id, full_name, phone")
    .eq("owner_id", user.id)
    .eq("is_active", true)

  if (campaign.audience === "active_card") {
    const { data: cardCustomerIds } = await supabase
      .from("loyalty_cards")
      .select("customer_id")
      .eq("owner_id", user.id)
      .eq("status", "active")
    const ids = cardCustomerIds?.map((c) => c.customer_id) || []
    if (ids.length > 0) {
      query = query.in("id", ids)
    } else {
      query = query.eq("id", "00000000-0000-0000-0000-000000000000") // no results
    }
  } else if (campaign.audience === "completed_card") {
    const { data: cardCustomerIds } = await supabase
      .from("loyalty_cards")
      .select("customer_id")
      .eq("owner_id", user.id)
      .eq("status", "completed")
    const ids = cardCustomerIds?.map((c) => c.customer_id) || []
    if (ids.length > 0) {
      query = query.in("id", ids)
    } else {
      query = query.eq("id", "00000000-0000-0000-0000-000000000000")
    }
  } else if (campaign.audience === "no_visits_30d") {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const { data: recentCustomerIds } = await supabase
      .from("visits")
      .select("customer_id")
      .eq("owner_id", user.id)
      .gte("created_at", thirtyDaysAgo.toISOString())
    const recentIds = [
      ...new Set(recentCustomerIds?.map((v) => v.customer_id) || []),
    ]
    if (recentIds.length > 0) {
      // Supabase doesn't support NOT IN directly, so we fetch all and filter
      const { data: allCustomers } = await query
      const filtered =
        allCustomers?.filter((c) => !recentIds.includes(c.id)) || []
      // Use the filtered list directly instead of modifying query
      return await processSend(supabase, campaign, filtered, user.id, campaignId)
    }
  }

  const { data: recipients } = await query

  return await processSend(
    supabase,
    campaign,
    recipients || [],
    user.id,
    campaignId
  )
}

async function processSend(
  supabase: Awaited<ReturnType<typeof createClient>>,
  campaign: { message: string },
  recipients: { id: string; full_name: string; phone: string }[],
  ownerId: string,
  campaignId: string
) {
  if (recipients.length === 0) {
    return NextResponse.json(
      { error: "No hay destinatarios para esta audiencia" },
      { status: 400 }
    )
  }

  // Mark campaign as sending
  await supabase
    .from("sms_campaigns")
    .update({
      status: "sending",
      recipient_count: recipients.length,
    })
    .eq("id", campaignId)

  let sentCount = 0
  let failedCount = 0

  for (const recipient of recipients) {
    try {
      const personalizedMsg = campaign.message.replace(
        "{name}",
        recipient.full_name
      )
      const result = await sendSmsStub(recipient.phone, personalizedMsg)

      await supabase.from("sms_campaign_recipients").insert({
        campaign_id: campaignId,
        customer_id: recipient.id,
        phone: recipient.phone,
        status: result.status,
        sent_at: new Date().toISOString(),
      })

      // Also log in notification_log
      await supabase.from("notification_log").insert({
        owner_id: ownerId,
        customer_id: recipient.id,
        type: "promo",
        channel: "sms",
        recipient: recipient.phone,
        message: personalizedMsg,
        status: result.status,
        metadata: { campaign_id: campaignId },
      })

      sentCount++
    } catch {
      failedCount++
      await supabase.from("sms_campaign_recipients").insert({
        campaign_id: campaignId,
        customer_id: recipient.id,
        phone: recipient.phone,
        status: "failed",
        error_message: "Send failed",
      })
    }
  }

  // Mark campaign as complete
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
