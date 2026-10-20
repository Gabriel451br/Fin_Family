export type MemberRole = "owner" | "admin" | "member" | "viewer";

export type AccountType =
  | "checking"
  | "savings"
  | "investment"
  | "credit_card"
  | "cash"
  | "other";

export type CategoryKind = "expense" | "income" | "investment";

export type TransactionType = "expense" | "income" | "investment" | "transfer";

export type TransactionStatus = "confirmed" | "pending" | "projected";

export type TransactionSource = "manual" | "recurring" | "import" | "open_finance";

export type RecurrenceFrequency = "weekly" | "monthly" | "yearly";

export type GoalKind =
  | "expense_limit"
  | "income_target"
  | "investment_target"
  | "savings_target"
  | "custom";

export type InviteStatus = "pending" | "accepted" | "revoked" | "expired";

export interface Permissions {
  [key: string]: boolean;
  manage_members: boolean;
  manage_accounts: boolean;
  manage_categories: boolean;
  add_transactions: boolean;
  edit_all_transactions: boolean;
  edit_own_transactions: boolean;
  manage_budgets_goals: boolean;
  view_reports: boolean;
}

export const DEFAULT_PERMISSIONS: Record<MemberRole, Permissions> = {
  owner: {
    manage_members: true,
    manage_accounts: true,
    manage_categories: true,
    add_transactions: true,
    edit_all_transactions: true,
    edit_own_transactions: true,
    manage_budgets_goals: true,
    view_reports: true,
  },
  admin: {
    manage_members: true,
    manage_accounts: true,
    manage_categories: true,
    add_transactions: true,
    edit_all_transactions: true,
    edit_own_transactions: true,
    manage_budgets_goals: true,
    view_reports: true,
  },
  member: {
    manage_members: false,
    manage_accounts: false,
    manage_categories: false,
    add_transactions: true,
    edit_all_transactions: false,
    edit_own_transactions: true,
    manage_budgets_goals: false,
    view_reports: true,
  },
  viewer: {
    manage_members: false,
    manage_accounts: false,
    manage_categories: false,
    add_transactions: false,
    edit_all_transactions: false,
    edit_own_transactions: false,
    manage_budgets_goals: false,
    view_reports: true,
  },
};

export interface Family {
  id: string;
  name: string;
  currency: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string | null;
  display_name: string;
  email: string;
  role: MemberRole;
  permissions: Permissions;
  status: string;
  invited_by: string | null;
  created_at: string;
  joined_at: string | null;
}

export interface Invite {
  id: string;
  family_id: string;
  email: string;
  role: MemberRole;
  permissions: Permissions | null;
  token: string;
  status: InviteStatus;
  created_by: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
}

export interface Account {
  id: string;
  family_id: string;
  name: string;
  type: AccountType;
  institution: string | null;
  initial_balance: string;
  color: string;
  icon: string;
  is_archived: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  family_id: string;
  parent_id: string | null;
  name: string;
  kind: CategoryKind;
  color: string;
  icon: string;
  is_default: boolean;
  is_archived: boolean;
  created_by: string | null;
  created_at: string;
}

export interface RecurringRule {
  id: string;
  family_id: string;
  account_id: string | null;
  category_id: string | null;
  description: string;
  amount: string;
  type: TransactionType;
  frequency: RecurrenceFrequency;
  interval_count: number;
  day_of_month: number | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  family_id: string;
  account_id: string | null;
  category_id: string | null;
  member_id: string | null;
  type: TransactionType;
  status: TransactionStatus;
  source: TransactionSource;
  description: string;
  amount: string;
  date: string;
  recurring_rule_id: string | null;
  installment_group_id: string | null;
  installment_number: number | null;
  installment_total: number | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  family_id: string;
  category_id: string;
  kind: CategoryKind;
  amount_limit: string;
  period_month: string;
  is_template: boolean;
  created_by: string;
  created_at: string;
}

export interface Goal {
  id: string;
  family_id: string;
  category_id: string | null;
  name: string;
  kind: GoalKind;
  target_amount: string;
  target_date: string | null;
  is_active: boolean;
  notes: string | null;
  created_by: string;
  created_at: string;
}
