import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { sendNotification, buildRewardMessage } from "@/lib/notifications"

/**
 * POST /api/notifications/reward
 * Called after a loyalty card is completed (stamp count reaches required).
 * Sends a reward SMS to the customer.
 */
export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { customerId } = await request.json()
  if (!customerId) {
    return NextResponse.json({ error: "customerId requerido" }, { status: 400 })
  }

  // Fetch customer + business settings
  const { data: customer } = await supabase
    .from("customers")
    .select("id, full_name, phone, owner_id")
    .eq("id", customerId)
    .eq("owner_id", user.id)
    .single()

  if (!customer) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
  }

  const { data: settings } = await supabase
    .from("business_settings")
    .select("reward_sms_template")
    .eq("owner_id", user.id)
    .single()

  const template =
    settings?.reward_sms_template ??
    "¡Felicidades {name}! Has ganado un lavado gratis en AutoLimpio. Muéstrale este mensaje al cajero para redimirlo. ¡Chévere!"

  const message = buildRewardMessage(template, customer.full_name)

  const result = await sendNotification({
    ownerId: user.id,
    customerId: customer.id,
    type: "reward",
    recipient: customer.phone,
    message,
  })

  return NextResponse.json({ success: result.success, status: result.status })
}
