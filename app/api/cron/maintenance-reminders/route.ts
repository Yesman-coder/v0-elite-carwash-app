import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { buildMaintenanceMessage } from "@/lib/notifications"
import twilio from "twilio"

/**
 * GET /api/cron/maintenance-reminders
 * Called nightly by Vercel Cron (see vercel.json).
 * Sends maintenance reminder SMS to customers whose vehicles need attention.
 *
 * Rules:
 *  - Oil change: (last_km - last_oil_change_km) >= 5000
 *  - Tire rotation: (last_km - last_tire_rotation_km) >= 10000
 *
 * Protected by Authorization: Bearer $CRON_SECRET header (set by Vercel automatically).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const supabase = await createClient()

  // Fetch all active customers with mileage data
  const { data: customers, error } = await supabase
    .from("customers")
    .select("id, owner_id, full_name, phone, last_km, last_oil_change_km, last_tire_rotation_km, vehicle_brand, vehicle_model")
    .eq("is_active", true)
    .not("last_km", "is", null)

  if (error) {
    console.error("[Cron] Error fetching customers:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const twilioSid = process.env.TWILIO_ACCOUNT_SID
  const twilioToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER
  const twilioClient = twilioSid && twilioToken ? twilio(twilioSid, twilioToken) : null

  let sent = 0
  let failed = 0
  const processed: string[] = []

  for (const customer of customers ?? []) {
    const lastKm = customer.last_km as number
    const oilChangeKm = customer.last_oil_change_km as number | null
    const tireKm = customer.last_tire_rotation_km as number | null
    const brand = (customer.vehicle_brand as string) || "tu carro"
    const model = (customer.vehicle_model as string) || ""

    let reminderType: "oil_change" | "tire_rotation" | null = null

    if (oilChangeKm !== null && lastKm - oilChangeKm >= 5000) {
      reminderType = "oil_change"
    } else if (tireKm !== null && lastKm - tireKm >= 10000) {
      reminderType = "tire_rotation"
    } else if (oilChangeKm === null && lastKm >= 5000) {
      // No oil change record at all but has significant mileage
      reminderType = "oil_change"
    }

    if (!reminderType) continue

    const message = buildMaintenanceMessage(
      customer.full_name as string,
      brand,
      model,
      reminderType
    )

    let status: "sent" | "failed" | "stubbed" = "stubbed"

    if (twilioClient && fromNumber) {
      try {
        await twilioClient.messages.create({
          body: message,
          from: fromNumber,
          to: customer.phone as string,
        })
        status = "sent"
        sent++
      } catch (err) {
        console.error(`[Cron] Failed to send to ${customer.phone}:`, (err as Error).message)
        status = "failed"
        failed++
      }
    } else {
      console.log(`[Cron DEV] Would send to ${customer.phone}: ${message}`)
      status = "stubbed"
      sent++
    }

    // Log the notification
    await supabase.from("notification_log").insert({
      owner_id: customer.owner_id,
      customer_id: customer.id,
      type: "reminder",
      channel: "sms",
      recipient: customer.phone,
      message,
      status,
      metadata: { reminder_type: reminderType, last_km: lastKm },
    })

    processed.push(customer.id as string)
  }

  console.log(`[Cron] Maintenance reminders: ${sent} sent, ${failed} failed, ${processed.length} processed`)

  return NextResponse.json({
    success: true,
    sent,
    failed,
    total: processed.length,
  })
}
