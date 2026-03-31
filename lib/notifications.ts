import { createClient } from "@/lib/supabase/server"
import twilio from "twilio"

/**
 * Twilio SMS integration.
 * Requires env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
 * Falls back to console logging when env vars are not set (development).
 */

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!accountSid || !authToken) return null
  return twilio(accountSid, authToken)
}

interface SendNotificationParams {
  ownerId: string
  customerId?: string
  type: "welcome" | "stamp" | "reward" | "reminder" | "promo" | "general"
  channel?: "sms" | "email" | "push"
  recipient: string
  message: string
  metadata?: Record<string, unknown>
}

export async function sendNotification(params: SendNotificationParams) {
  const supabase = await createClient()
  const twilioClient = getTwilioClient()
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  let status: "sent" | "failed" | "stubbed" = "stubbed"
  let errorMessage: string | null = null

  if (twilioClient && fromNumber) {
    try {
      await twilioClient.messages.create({
        body: params.message,
        from: fromNumber,
        to: params.recipient,
      })
      status = "sent"
    } catch (err) {
      const error = err as Error
      console.error("[Twilio Error]", error.message)
      status = "failed"
      errorMessage = error.message
    }
  } else {
    // Development fallback — no Twilio credentials configured
    console.log(`[SMS DEV] To: ${params.recipient} | Type: ${params.type}`)
    console.log(`[SMS DEV] Message: ${params.message}`)
    status = "stubbed"
  }

  await supabase.from("notification_log").insert({
    owner_id: params.ownerId,
    customer_id: params.customerId ?? null,
    type: params.type,
    channel: params.channel ?? "sms",
    recipient: params.recipient,
    message: params.message,
    status,
    error_message: errorMessage,
    metadata: params.metadata ?? {},
  })

  return { success: status === "sent" || status === "stubbed", status }
}

export function buildWelcomeMessage(
  template: string,
  customerName: string,
  portalUrl: string
): string {
  return template
    .replace("{name}", customerName)
    .replace("{url}", portalUrl)
}

export function buildRewardMessage(
  template: string,
  customerName: string
): string {
  return template.replace("{name}", customerName)
}

export function buildMaintenanceMessage(
  customerName: string,
  vehicleBrand: string,
  vehicleModel: string,
  type: "oil_change" | "tire_rotation"
): string {
  if (type === "oil_change") {
    return `Hola ${customerName}, tu ${vehicleBrand} ${vehicleModel} podría necesitar un cambio de aceite pronto. ¡Pasa por AutoLimpio y lo revisamos!`
  }
  return `Hola ${customerName}, tu ${vehicleBrand} ${vehicleModel} podría necesitar una rotación de cauchos. ¡Pasa por AutoLimpio y te ayudamos!`
}
