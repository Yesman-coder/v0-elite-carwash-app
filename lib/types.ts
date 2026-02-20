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
  currency: string
  created_at: string
  updated_at: string
}

export interface VehicleType {
  id: string
  owner_id: string
  name: string
  description: string | null
  price_multiplier: number
  is_active: boolean
  created_at: string
}

export interface Service {
  id: string
  owner_id: string
  name: string
  description: string | null
  base_price: number
  duration_minutes: number
  category: "wash" | "detail" | "addon" | "premium"
  is_active: boolean
  earns_stamp: boolean
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
  vehicle_make: string | null
  vehicle_model: string | null
  vehicle_color: string | null
  vehicle_plate: string | null
  portal_token: string
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // joined data
  vehicle_type?: VehicleType | null
  loyalty_cards?: LoyaltyCard[]
  visits?: Visit[]
}

export interface LoyaltyCard {
  id: string
  owner_id: string
  customer_id: string
  card_number: number
  stamps_required: number
  current_stamps: number
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
  owner_id: string
  card_id: string
  customer_id: string
  service_id: string | null
  visit_id: string | null
  stamp_number: number
  awarded_by: string | null
  notes: string | null
  created_at: string
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
  is_free_wash: boolean
  payment_method: "cash" | "transfer" | "card" | "free" | "pending"
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

// Portal types (returned by RPC functions)
export interface PortalCustomer {
  id: string
  full_name: string
  phone: string
  email: string | null
  vehicle_make: string | null
  vehicle_model: string | null
  vehicle_color: string | null
  vehicle_plate: string | null
  is_active: boolean
  created_at: string
  vehicle_type: string | null
  business_name: string | null
}

export interface PortalCard {
  id: string
  card_number: number
  stamps_required: number
  current_stamps: number
  status: string
  completed_at: string | null
  redeemed_at: string | null
  created_at: string
  stamps: {
    id: string
    stamp_number: number
    created_at: string
    service_name: string | null
  }[]
}

export interface PortalVisit {
  id: string
  service_name: string | null
  price: number
  final_price: number
  payment_method: string
  payment_status: string
  is_free_wash: boolean
  notes: string | null
  created_at: string
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
