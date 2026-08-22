export type UserRole = 'lord' | 'admin' | 'staff' | 'pending';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
}

export type LeadStatus = 'Leads' | 'Chated' | 'Responsed' | 'Set Meeting' | 'Hold' | 'Close Win' | 'Close Lost' | 'Failed';
export type InterestLevel = 'HOT' | 'WARM' | 'COLD' | '-';
export type ProductOffered = 'Basemen' | 'TNT' | 'HYPE';

export interface Note {
  id?: string;
  text: string;
  author: string;
  timestamp: string;
  isLog?: boolean;
  type?: 'note' | 'action_plan';
}

export interface FunnelHistory {
  id?: string;
  stage: string;
  date: string;
  by: string;
  timestamp: number;
  note?: string;
  assignedBy?: string;
  dealValue?: number;
  campaignNumber?: number;
}

export type LeadSource = 'Shopee' | 'Tokopedia' | 'TikTok Shop' | 'TikTok Partner Center' | 'Lainnya' | '-';
export const LEAD_SOURCES = ['Shopee', 'Tokopedia', 'TikTok Shop', 'TikTok Partner Center', 'Lainnya'];

export interface Lead {
  id: string;
  dateInput: string;
  category: string;
  brandName: string;
  contact: string;
  leadSource?: string;
  email?: string;
  status: LeadStatus;
  interestLevel: InterestLevel;
  productOffered?: ProductOffered[];
  actionPlan?: string;
  notes: Note[];
  funnelHistory: FunnelHistory[];
  dateChated?: string;
  dateResponsed?: string;
  dateSetMeeting?: string;
  dateClosed?: string;
  dateFailed?: string;
  dealValue?: number;
  
  // Soft Delete Fields
  isDeleted?: boolean;
  deletedAt?: string;
  autoDeleteAt?: string;

  picName?: string;
  owner?: string;
}


export interface EditRequest {
  id: string;
  leadId: string;
  oldBrand: string;
  newBrand: string;
  oldContact: string;
  newContact: string;
  requestedBy: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
}

export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Todo' | 'In Progress' | 'Done';

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo: string;
  assignedToName: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  leadId?: string;
  leadName?: string;
}

export interface GlobalTarget {
  id: string;
  monthYear: string;
  targetChat: number;
  targetMeeting: number;
  targetRevenue: number;
  updatedAt: string;
  updatedBy: string;
}

export interface IndividualTarget {
  id: string; // {monthYear}_{userId}
  userId: string;
  userName: string;
  monthYear: string;
  targetChat: number;
  targetMeeting: number;
  targetRevenue: number;
  updatedAt: string;
  updatedBy: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  user: string;
  targetId?: string;
  timestamp: string;
}

export interface OITarget {
  id: string;
  monthYear: string;
  product: ProductOffered;
  targetValue: number;
  updatedAt: string;
}

export type ForecastStatus = 'WIN' | 'OPEN' | 'LOSE';

export interface OIForecast {
  id: string;
  leadId: string;
  monthYear: string;
  product: ProductOffered;
  
  value: number;
  campaignNumber?: number;
  budgetAds: number;
  budgetCreator: number;
  grossMargin: number;
  
  realMargin: number;
  realPayment: number;
  
  targetGMV?: number;
  targetCreator?: number;
  targetVideoAffiliate?: number;
  targetVideoInternal?: number;
  targetViews?: number;
  
  successRate: number;
  status: ForecastStatus;
  tier: 'A' | 'B' | 'C' | 'D' | '-';
  category: string;
  lastFollowUp: string | null;
  noteSales: string;
  
  dateQuotation?: string | null;
  picQuotation?: string;
  dateInvoice?: string | null;
  picInvoice?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface PermissionSet {
  canManageUsers: boolean;
  canSetTargets: boolean;
  canApproveEdits: boolean;
  canAssignPIC: boolean;
  canDeleteLeads: boolean;
  canBulkDelete: boolean;
  canEditFunnelHistory: boolean;
  canDeleteFunnelHistory: boolean;
  canClearAllHistory: boolean;
  canDeleteNotes: boolean;
  canEditDealValue: boolean;
  canImportCSV: boolean;
}

export interface RolePermissions {
  admin: PermissionSet;
  staff: PermissionSet;
}

export const DEFAULT_PERMISSIONS: RolePermissions = {
  admin: {
    canManageUsers: false,
    canSetTargets: false,
    canApproveEdits: true,
    canAssignPIC: true,
    canDeleteLeads: true,
    canBulkDelete: true,
    canEditFunnelHistory: false,
    canDeleteFunnelHistory: false,
    canClearAllHistory: false,
    canDeleteNotes: false,
    canEditDealValue: true,
    canImportCSV: true,
  },
  staff: {
    canManageUsers: false,
    canSetTargets: false,
    canApproveEdits: false,
    canAssignPIC: false,
    canDeleteLeads: false,
    canBulkDelete: false,
    canEditFunnelHistory: false,
    canDeleteFunnelHistory: false,
    canClearAllHistory: false,
    canDeleteNotes: false,
    canEditDealValue: false,
    canImportCSV: true,
  }
};

// Lord always gets ALL permissions
export const LORD_PERMISSIONS: PermissionSet = {
  canManageUsers: true,
  canSetTargets: true,
  canApproveEdits: true,
  canAssignPIC: true,
  canDeleteLeads: true,
  canBulkDelete: true,
  canEditFunnelHistory: true,
  canDeleteFunnelHistory: true,
  canClearAllHistory: true,
  canDeleteNotes: true,
  canEditDealValue: true,
  canImportCSV: true,
};
