export type MemberRole = "owner" | "admin" | "member" | "viewer";

export type CategoryKind = "expense" | "income" | "investment";

export type TransactionType = "expense" | "income" | "investment" | "transfer";

export type TransactionStatus = "confirmed" | "pending" | "projected";

export type TransactionSource = "manual" | "recurring" | "import" | "open_finance";

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
  /** 'cash' = dinheiro/conta, 'benefit' = vale (VA/VR) */
  wallet: "cash" | "benefit";
  recurring_rule_id: string | null;
  installment_group_id: string | null;
  installment_number: number | null;
  installment_total: number | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}
