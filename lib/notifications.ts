import { createClient } from "@/lib/supabase/server"

/**
 * SMS Notification Stub
 * This is a placeholder for the actual SMS provider integration.
 * Replace with a real provider (Twilio, Venezuelan bulk SMS API, etc.)
 */

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

  // STUB: Log the notification instead of actually sending
  console.log(`[SMS STUB] To: ${params.recipient} | Type: ${params.type}`)
  console.log(`[SMS STUB] Message: ${params.message}`)

  const { error } = await supabase.from("notification_log").insert({
    owner_id: params.ownerId,
    customer_id: params.customerId || null,
    type: params.type,
    channel: params.channel || "sms",
    recipient: params.recipient,
    message: params.message,
    status: "stubbed",
    metadata: params.metadata || {},
  })

  if (error) {
    console.error("[Notification Error]", error)
  }

  return { success: !error, status: "stubbed" as const }
}

export function buildWelcomeMessage(
  template: string,
  customerName: string
): string {
  return template.replace("{name}", customerName)
}

export function buildRewardMessage(
  template: string,
  customerName: string
): string {
  return template.replace("{name}", customerName)
}
