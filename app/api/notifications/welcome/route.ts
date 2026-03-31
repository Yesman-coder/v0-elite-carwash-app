import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { sendNotification, buildWelcomeMessage } from "@/lib/notifications"

/**
 * POST /api/notifications/welcome
 * Called after a new customer is created.
 * Sends a welcome SMS with their portal link.
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

  const { data: customer } = await supabase
    .from("customers")
    .select("id, full_name, phone, access_token, owner_id")
    .eq("id", customerId)
    .eq("owner_id", user.id)
    .single()

  if (!customer) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
  }

  const { data: settings } = await supabase
    .from("business_settings")
    .select("welcome_sms_template")
    .eq("owner_id", user.id)
    .single()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://autolimpio.app"
  const portalUrl = `${siteUrl}/portal/${customer.access_token}`

  const template =
    settings?.welcome_sms_template ??
    "¡Bienvenido a AutoLimpio, {name}! Aquí puedes ver tu tarjeta de lealtad: {url}"

  const message = buildWelcomeMessage(template, customer.full_name, portalUrl)

  const result = await sendNotification({
    ownerId: user.id,
    customerId: customer.id,
    type: "welcome",
    recipient: customer.phone,
    message,
  })

  return NextResponse.json({ success: result.success, status: result.status })
}
