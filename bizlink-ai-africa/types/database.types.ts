/**
 * Types de départ, écrits à la main à partir de 001_schema.sql.
 * Dès que le projet Supabase existe, remplacer ce fichier par :
 *   npx supabase gen types typescript --project-id <id> > types/database.types.ts
 */

export type UserRole = 'admin' | 'staff'
export type SubscriptionPlan = 'free' | 'starter' | 'pro'
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type DebtStatus = 'open' | 'partial' | 'paid'
export type SalePaymentStatus = 'paid' | 'partial' | 'unpaid'
export type NotificationType =
  | 'stock_low'
  | 'subscription'
  | 'sale'
  | 'debt'
  | 'payment'
  | 'commission'
  | 'referral_reward'
  | 'system'
export type AffiliateStatus = 'pending' | 'approved' | 'suspended'
export type CommissionStatus = 'pending' | 'validated' | 'paid' | 'rejected'
export type ReferralStatus = 'pending' | 'converted' | 'rewarded'
export type WithdrawalStatus = 'pending' | 'processing' | 'paid' | 'rejected'

export interface Organization {
  id: string
  name: string
  slug: string
  owner_id: string | null
  plan: SubscriptionPlan
  currency: string
  phone: string | null
  address: string | null
  logo_url: string | null
  referred_by_affiliate_id: string | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  organization_id: string | null
  full_name: string | null
  email: string
  phone: string | null
  avatar_url: string | null
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  organization_id: string
  name: string
  description: string | null
  created_at: string
}

export interface Supplier {
  id: string
  organization_id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  created_at: string
}

export interface Customer {
  id: string
  organization_id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  created_at: string
}

export interface Product {
  id: string
  organization_id: string
  category_id: string | null
  name: string
  sku: string | null
  barcode: string | null
  description: string | null
  unit: string
  purchase_price: number
  sale_price: number
  stock_quantity: number
  min_stock_alert: number
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Purchase {
  id: string
  organization_id: string
  supplier_id: string | null
  purchase_date: string
  total_amount: number
  status: string
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface PurchaseItem {
  id: string
  purchase_id: string
  product_id: string
  quantity: number
  unit_cost: number
  subtotal: number
}

export interface Sale {
  id: string
  organization_id: string
  customer_id: string | null
  sale_date: string
  subtotal: number
  discount: number
  total_amount: number
  profit: number
  payment_status: SalePaymentStatus
  payment_method: string | null
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  quantity: number
  unit_price: number
  unit_cost: number
  subtotal: number
  profit: number
}

export interface Expense {
  id: string
  organization_id: string
  category: string
  description: string | null
  amount: number
  expense_date: string
  receipt_url: string | null
  created_by: string | null
  created_at: string
}

export interface Debt {
  id: string
  organization_id: string
  customer_id: string
  sale_id: string | null
  original_amount: number
  remaining_amount: number
  status: DebtStatus
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface DebtPayment {
  id: string
  debt_id: string
  amount: number
  payment_date: string
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface InventoryReport {
  id: string
  organization_id: string
  period_start: string
  period_end: string
  opening_stock_value: number
  purchases_value: number
  sales_value: number
  closing_stock_value: number
  losses: number
  discrepancies: number
  generated_at: string
}

export interface ChatLog {
  id: string
  organization_id: string
  user_id: string | null
  role: 'user' | 'assistant'
  message: string
  created_at: string
}

export interface Subscription {
  id: string
  organization_id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  current_period_start: string
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

export interface PaymentTransaction {
  id: string
  organization_id: string
  subscription_id: string | null
  amount: number
  currency: string
  status: PaymentStatus
  provider: string
  provider_transaction_id: string | null
  invoice_url: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ReferralCode {
  id: string
  organization_id: string
  code: string
  created_at: string
}

export interface Referral {
  id: string
  referral_code_id: string
  referrer_organization_id: string
  referred_organization_id: string | null
  status: ReferralStatus
  reward_granted: boolean
  created_at: string
}

export interface AffiliateAccount {
  id: string
  user_id: string
  affiliate_code: string
  status: AffiliateStatus
  total_clicks: number
  total_conversions: number
  total_earnings: number
  created_at: string
}

export interface AffiliateCommission {
  id: string
  affiliate_account_id: string
  source_organization_id: string | null
  amount: number
  status: CommissionStatus
  created_at: string
}

export interface AffiliateWithdrawal {
  id: string
  affiliate_account_id: string
  amount: number
  status: WithdrawalStatus
  requested_at: string
  processed_at: string | null
}

export interface Notification {
  id: string
  organization_id: string
  user_id: string | null
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  metadata: Record<string, unknown>
  created_at: string
}

export interface ActivityLog {
  id: string
  organization_id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

/**
 * Placeholder minimal compatible avec le typage attendu par
 * @supabase/ssr (createBrowserClient<Database>, createServerClient<Database>).
 * À remplacer par le type généré automatiquement dès que possible.
 */
export type Database = {
  public: {
    Tables: Record<string, { Row: unknown; Insert: unknown; Update: unknown }>
  }
}
