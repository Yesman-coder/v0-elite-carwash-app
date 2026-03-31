export interface Profile {
  id: string
  full_name: string | null
  business_name: string | null
  phone: string | null
  role: "owner" | "cashier"
  created_at: string
  updated_at: string
}

export interface BusinessSettings {
  id: string
  owner_id: string
  business_name: string
  phone: string | null
  address: string | null
  stamps_required: number
  welcome_sms_template: string
  reward_sms_template: string
  reminder_sms_template: string
  currency: string
  created_at: string
  updated_at: string
}

export interface VehicleType {
  id: string
  name: string
  description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface Service {
  id: string
  owner_id: string | null
  name: string
  description: string | null
  base_price: number
  duration_minutes: number
  category: "wash" | "detail" | "addon" | "premium"
  is_active: boolean
  earns_stamp: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  owner_id: string
  full_name: string
  phone: string
  email: string | null
  vehicle_type_id: string | null
  vehicle_plate: string | null
  vehicle_brand: string | null
  vehicle_model: string | null
  vehicle_color: string | null
  last_km: number | null
  last_oil_change_km: number | null
  last_oil_change_date: string | null
  last_tire_rotation_km: number | null
  access_token: string
  account_type: "loyalty" | "subscription"
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // joined data
  vehicle_type?: VehicleType | null
  loyalty_cards?: LoyaltyCard[]
  visits?: Visit[]
  active_subscription?: Subscription | null
}

export interface LoyaltyCard {
  id: string
  owner_id: string
  customer_id: string
  card_number: number
  stamps_required: number
  current_stamps: number
  is_complete: boolean
  is_redeemed: boolean
  status: "active" | "completed" | "redeemed" | "expired"
  completed_at: string | null
  redeemed_at: string | null
  created_at: string
  updated_at: string
  // joined
  stamps?: LoyaltyStamp[]
  customer?: Customer
}

export interface LoyaltyStamp {
  id: string
  owner_id: string | null
  loyalty_card_id: string
  service_id: string | null
  stamp_number: number
  stamped_by: string | null
  notes: string | null
  stamped_at: string
  service_name?: string
}

export interface Visit {
  id: string
  owner_id: string
  customer_id: string
  service_id: string | null
  vehicle_type_id: string | null
  loyalty_card_id: string | null
  service_name: string | null
  vehicle_type_name: string | null
  price: number
  final_price: number
  amount: number
  is_free_wash: boolean
  km_reading: number | null
  payment_method: "cash" | "transfer" | "card" | "free" | "free_wash" | "pago_movil" | "pending"
  payment_status: "pending" | "paid" | "free"
  notes: string | null
  served_by: string | null
  created_at: string
  updated_at: string
  // joined
  customer?: Customer
  service?: Service
}

export interface Redemption {
  id: string
  owner_id: string
  card_id: string
  customer_id: string
  redeemed_by: string | null
  service_id: string | null
  notes: string | null
  created_at: string
}

export interface NotificationLog {
  id: string
  owner_id: string
  customer_id: string | null
  type: "welcome" | "stamp" | "reward" | "reminder" | "promo" | "general"
  channel: "sms" | "email" | "push"
  recipient: string
  message: string
  status: "pending" | "sent" | "failed" | "stubbed"
  error_message: string | null
  metadata: Record<string, unknown>
  created_at: string
}

// Subscription types
export interface SubscriptionPlan {
  id: string
  owner_id: string
  name: string
  price_cents: number
  wash_limit: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  customer_id: string
  plan_id: string
  owner_id: string
  start_date: string
  next_billing_date: string
  washes_used_this_period: number
  is_active: boolean
  pago_movil_phone: string | null
  pago_movil_bank: string | null
  pago_movil_reference: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
  // joined
  plan?: SubscriptionPlan
  customer?: Customer
}

// Portal types (returned by RPC functions)
export interface PortalCustomer {
  id: string
  full_name: string
  phone: string
  email: string | null
  vehicle_brand: string | null
  vehicle_model: string | null
  vehicle_color: string | null
  vehicle_plate: string | null
  last_km: number | null
  last_oil_change_km: number | null
  is_active: boolean
  created_at: string
  vehicle_type: string | null
  business_name: string | null
  account_type: "loyalty" | "subscription"
}

export interface PortalCard {
  id: string
  card_number: number
  stamps_required: number
  current_stamps: number
  is_complete: boolean
  is_redeemed: boolean
  status: string
  completed_at: string | null
  redeemed_at: string | null
  created_at: string
  stamps: {
    id: string
    stamp_number: number
    stamped_at: string
    service_name: string | null
  }[]
}

export interface PortalVisit {
  id: string
  service_name: string | null
  price: number
  final_price: number
  amount: number
  payment_method: string
  payment_status: string
  is_free_wash: boolean
  km_reading: number | null
  notes: string | null
  created_at: string
}

export interface PortalSubscription {
  id: string
  plan_name: string
  price_cents: number
  wash_limit: number | null
  washes_used: number
  next_billing_date: string
  start_date: string
  is_active: boolean
}

// SMS Campaign types
export interface SmsCampaign {
  id: string
  owner_id: string
  title: string
  message: string
  audience: "all" | "active_card" | "completed_card" | "no_visits_30d" | "custom"
  recipient_count: number
  sent_count: number
  failed_count: number
  status: "draft" | "sending" | "sent" | "failed"
  scheduled_at: string | null
  sent_at: string | null
  created_at: string
  updated_at: string
}

export interface SmsCampaignRecipient {
  id: string
  campaign_id: string
  customer_id: string
  phone: string
  status: "pending" | "sent" | "failed" | "stubbed"
  error_message: string | null
  sent_at: string | null
  created_at: string
  customer?: Customer
}

// Add stamp response
export interface AddStampResponse {
  success: boolean
  error?: string
  stamp_number?: number
  stamps_required?: number
  is_complete?: boolean
  card_status?: string
}

// Redeem card response
export interface RedeemCardResponse {
  success: boolean
  error?: string
  redeemed_card_id?: string
  new_card_id?: string
  customer_name?: string
}
