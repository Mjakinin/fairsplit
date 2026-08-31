export type CurrencyCode = 
  | 'EUR' 
  | 'USD' 
  | 'CHF' 
  | 'GBP' 
  | 'JPY' 
  | 'CAD' 
  | 'AUD' 
  | 'SEK' 
  | 'NOK' 
  | 'DKK' 
  | 'PLN' 
  | 'CZK' 
  | 'TRY';

export type SplitMode = 'equal' | 'exact' | 'percentage' | 'shares' | 'itemized';
export type TipType = 'fixed' | 'percentage';
export type SurchargeSplitMode = 'proportional' | 'equal';
export type PaymentMethod = 'paypal' | 'cash' | 'transfer' | 'other';

export type ExpenseCategory = 
  | 'restaurant' 
  | 'groceries' 
  | 'transport' 
  | 'hotel' 
  | 'entertainment' 
  | 'cafe' 
  | 'household' 
  | 'general' 
  | 'other';

export interface Profile {
  id: string;
  auth_user_id?: string | null;
  email?: string | null;
  display_name: string;
  avatar_url?: string | null;
  avatar_emoji?: string | null;
  is_guest: boolean;
  paypal_me_handle?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Group {
  id: string;
  name: string;
  emoji?: string;
  description?: string | null;
  currency: CurrencyCode;
  invite_token: string;
  simplify_debts: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at?: string;
  members?: GroupMember[];
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  profile: Profile;
}

export interface ExpensePayer {
  id?: string;
  expense_id?: string;
  user_id: string;
  amount_paid: number;
  profile?: Profile;
}

export interface ExpenseItemAssignment {
  id?: string;
  item_id?: string;
  user_id: string;
  share_count: number;
  profile?: Profile;
}

export interface ExpenseItem {
  id: string;
  expense_id?: string;
  name: string;
  price: number;
  quantity: number;
  assignments: ExpenseItemAssignment[];
}

export interface ExpenseSplit {
  id?: string;
  expense_id?: string;
  user_id: string;
  owed_amount: number;
  shares?: number;
  percentage?: number;
  profile?: Profile;
}

export interface Expense {
  id: string;
  group_id: string;
  title: string;
  description?: string | null;
  category: ExpenseCategory;
  split_mode: SplitMode;
  total_amount: number;
  currency: CurrencyCode;
  tip_amount?: number;
  tip_type?: TipType;
  tip_percentage?: number;
  service_charge?: number;
  surcharge_split_mode?: SurchargeSplitMode;
  expense_date: string;
  receipt_url?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at?: string;
  payers: ExpensePayer[];
  items?: ExpenseItem[];
  splits: ExpenseSplit[];
}

export interface Settlement {
  id: string;
  group_id: string;
  payer_id: string; // The debtor
  payee_id: string; // The creditor
  amount: number;
  currency: CurrencyCode;
  payment_method: PaymentMethod;
  notes?: string | null;
  settlement_date: string;
  created_by?: string | null;
  created_at: string;
  payer?: Profile;
  payee?: Profile;
}

export interface ActivityLog {
  id: string;
  group_id: string;
  user_id?: string | null;
  action_type: 
    | 'expense_created' 
    | 'expense_updated' 
    | 'expense_deleted' 
    | 'settlement_created' 
    | 'settlement_deleted'
    | 'member_joined' 
    | 'member_removed'
    | 'group_updated';
  entity_type: 'expense' | 'settlement' | 'group_member' | 'group';
  entity_id?: string;
  title: string;
  description?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
  profile?: Profile;
}

export interface SimplifiedDebt {
  fromUser: Profile;
  toUser: Profile;
  amount: number;
  currency: CurrencyCode;
}

export interface UserBalance {
  user: Profile;
  netBalance: number;
  totalPaid: number;
  totalOwed: number;
  totalSettledPaid: number;
  totalSettledReceived: number;
}
