export type UserRole = 'ADMIN' | 'MANAGER' | 'SELLER';
export type UserStatus = 'PENDING_EMAIL_VERIFICATION' | 'ACTIVE' | 'INACTIVE';
export type LeadStage = 'NEW' | 'CONTACTED' | 'NEGOTIATION' | 'CUSTOMER' | 'LOST';
export type LeadOrigin =
  | 'WEBSITE'
  | 'REFERRAL'
  | 'SOCIAL_MEDIA'
  | 'OUTBOUND'
  | 'EVENT'
  | 'PARTNER'
  | 'OTHER';
export type InteractionChannel =
  | 'PHONE'
  | 'WHATSAPP'
  | 'EMAIL'
  | 'MEETING'
  | 'VISIT'
  | 'OTHER';
export type InteractionType =
  | 'FIRST_CONTACT'
  | 'RETURN'
  | 'PRESENTATION'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'FOLLOW_UP'
  | 'CLOSING'
  | 'NO_RESPONSE';
export type TaskStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
export type ScoreOperation = 'ADD' | 'SUBTRACT' | 'SET';
export type ScoreRuleStatus = 'ACTIVE' | 'INACTIVE';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  companyId: number;
  companyName: string;
  primaryBranchId?: number;
  primaryBranchName?: string;
  authorizedBranchIds: number[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface RegisterResponse {
  message: string;
  email: string;
}

export interface MessageResponse {
  message: string;
}

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export interface InvitationResponse {
  id: number; name: string; email: string; role: UserRole; status: InvitationStatus;
  companyId: number; companyName: string; primaryBranchId?: number; primaryBranchName?: string;
  managerId?: number; managerName?: string; authorizedBranchIds: number[]; expiresAt: string; createdAt: string;
}

export interface InvitationValidationResponse {
  valid: boolean; name: string; email: string; companyName: string; role: UserRole;
  primaryBranchName?: string; expiresAt: string;
}

export interface InvitationAcceptResponse {
  message: string;
  email: string;
}

export interface ApiEnvelope<T> {
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiErrorPayload {
  timestamp: string;
  status: number;
  code: string;
  message: string;
  fieldErrors?: FieldError[];
}

export interface LeadSummary {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  origin: LeadOrigin;
  stage: LeadStage;
  score: number;
  branchId: number;
  branchName: string;
  responsibleUserId: number;
  responsibleUserName: string;
  lastInteractionAt?: string;
  createdAt: string;
  overdueTasks: number;
}

export interface LeadResponse extends LeadSummary {
  cep?: string;
  updatedAt: string;
  pendingTasks: number;
}

export interface HistoryResponse {
  id: number;
  eventType: string;
  previousValue?: string;
  newValue?: string;
  performedById: number;
  performedByName: string;
  description?: string;
  createdAt: string;
}

export interface InteractionResponse {
  id: number;
  leadId: number;
  leadName: string;
  branchId: number;
  branchName: string;
  responsibleUserId: number;
  responsibleUserName: string;
  channel: InteractionChannel;
  type: InteractionType;
  notes?: string;
  scoreApplied: number;
  scoreRuleName?: string;
  stage: LeadStage;
  createdAt: string;
}

export interface ScorePreviewResponse {
  leadId: number;
  currentScore: number;
  interactionType: InteractionType;
  operation?: ScoreOperation;
  ruleValue?: number;
  ruleName?: string;
  projectedScore: number;
  scoreDelta: number;
}

export interface TaskResponse {
  id: number;
  title: string;
  description?: string;
  leadId: number;
  leadName: string;
  responsibleUserId: number;
  responsibleUserName: string;
  branchId: number;
  branchName: string;
  dueAt: string;
  status: TaskStatus;
  completedAt?: string;
  createdAt: string;
}

export interface BranchSummary {
  id: number;
  name: string;
  active: boolean;
  activeLeads: number;
  newLeads: number;
  interactions: number;
  points: number;
  conversions: number;
  conversionRate: number;
  members: number;
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface StagePoint {
  stage: string;
  value: number;
}

export interface OriginPoint {
  origin: string;
  value: number;
}

export interface SellerRanking {
  userId: number;
  name: string;
  leads: number;
  interactions: number;
  conversions: number;
  points: number;
}

export interface BranchDetails extends BranchSummary {
  pointsEvolution: ChartPoint[];
  conversionsEvolution: ChartPoint[];
  stageDistribution: StagePoint[];
  originDistribution: OriginPoint[];
  teamRanking: SellerRanking[];
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  primaryBranchId?: number;
  primaryBranchName?: string;
  managerId?: number;
  managerName?: string;
  authorizedBranchIds: number[];
  activeLeads: number;
  lastLoginAt?: string;
  createdAt: string;
}

export interface ScoreRuleResponse {
  id: number;
  name: string;
  interactionType: InteractionType;
  operation: ScoreOperation;
  value: number;
  status: ScoreRuleStatus;
  updatedAt: string;
}

export interface Kpi {
  value: number;
  variation: number;
}

export interface EvolutionPoint {
  label: string;
  leads: number;
  interactions: number;
  points: number;
}

export interface StageDistribution {
  stage: LeadStage;
  value: number;
}

export interface RankingItem {
  branchId: number;
  branchName: string;
  points: number;
  conversions: number;
  conversionRate: number;
  trend: number;
}

export interface DashboardResponse {
  activeLeads: Kpi;
  newLeads: Kpi;
  interactions: Kpi;
  generatedPoints: Kpi;
  commercialEvolution: EvolutionPoint[];
  stageDistribution: StageDistribution[];
  branchRanking: RankingItem[];
  recentLeads: LeadSummary[];
}

export interface BranchRankingResponse {
  position: number;
  branchId: number;
  branchName: string;
  points: number;
  interactions: number;
  activeLeads: number;
  newLeads: number;
  conversions: number;
  conversionRate: number;
  trend: number;
}

export interface NotificationResponse {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  referenceType?: string;
  referenceId?: number;
  createdAt: string;
}

export interface NotificationListResponse {
  unreadCount: number;
  notifications: NotificationResponse[];
}

export interface SettingsResponse {
  companyId: number;
  companyName: string;
  cnpj: string;
  companyEmail?: string;
  companyPhone?: string;
  website?: string;
  postalCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  defaultPeriodDays: number;
  timezone: string;
}

export interface PasswordChangeRequestResponse {
  maskedEmail: string;
  expiresInSeconds: number;
}

export interface PasswordResetRequestResponse {
  message: string;
  expiresInSeconds: number;
}
