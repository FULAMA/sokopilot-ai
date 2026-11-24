export type Currency = 'CDF' | 'USD';

export type LeadStage =
  | 'Nouveau'
  | 'Contacté'
  | 'Qualifié'
  | 'Proposition envoyée'
  | 'Gagné'
  | 'Perdu';

export type LeadSource =
  | 'Site web'
  | 'Référencement'
  | 'Réseaux sociaux'
  | 'Suggestion'
  | 'Autre';

export type FollowUpChannel = 'WhatsApp' | 'Appel' | 'Email' | 'SMS';

export type CampaignStatus =
  | 'Brouillon'
  | 'À valider'
  | 'Approuvée'
  | 'Programmée'
  | 'Publiée';

export type TeamRole = 'Owner' | 'Manager' | 'Sales';

export type NavSection =
  | 'dashboard'
  | 'prospects'
  | 'offres'
  | 'relances'
  | 'campagnes'
  | 'assistant'
  | 'automatisations'
  | 'integrations'
  | 'parametres';

export interface LeadNote {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  fullName: string;
  organization: string;
  city: string;
  phone: string;
  email: string;
  source: LeadSource;
  courseOfInterest: string;
  expectedValue: number;
  currency: Currency;
  stage: LeadStage;
  lossReason?: string;
  assignedOwner: string;
  nextAction: string;
  nextFollowUpDate: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
  notes: LeadNote[];
}

export interface Offer {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  currency: Currency;
  duration: string;
  active: boolean;
  updatedAt: string;
}

export interface FollowUpTask {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  dueDate: string; // YYYY-MM-DD
  channel: FollowUpChannel;
  subject: string;
  messageDraft: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  title: string;
  channel: string;
  targetAudience: string;
  scheduledDate: string; // YYYY-MM-DD
  status: CampaignStatus;
  contentDraft: string;
  owner: string;
  approvedBy?: string;
  approvedAt?: string;
  updatedAt: string;
}

export interface ActivityItem {
  id: string;
  type: 'lead_created' | 'stage_changed' | 'followup_done' | 'offer_updated' | 'campaign_approved' | 'note_added';
  actor: string;
  description: string;
  targetLabel: string;
  targetSection: NavSection;
  targetId?: string;
  timestamp: string; // ISO string
}

export interface AutomationAuditEntry {
  id: string;
  ruleName: string;
  status: string;
  note: string;
  timestamp: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
  requirements: string[];
  safetyNotice: string;
}

export interface IntegrationProvider {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'Non connecté';
  requiredScope: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  city: string;
}

export interface OrganizationSettings {
  workspaceName: string;
  legalName: string;
  city: string;
  country: string;
  defaultCurrency: Currency;
  usdToCdfRate: number;
  contactPhone: string;
  contactEmail: string;
}

export interface DashboardBaseline {
  newLeadsCount: number;
  qualifiedOpportunitiesCount: number;
  pipelineValueCdf: number;
  conversionRatePct: number;
  stageCounts: Record<LeadStage, number>;
  sourcePercentages: Array<{ source: LeadSource; percentage: number }>;
}

export interface DemoRepositoryState {
  version: number;
  leads: Lead[];
  offers: Offer[];
  followUps: FollowUpTask[];
  campaigns: Campaign[];
  activities: ActivityItem[];
  automations: AutomationRule[];
  automationAudit: AutomationAuditEntry[];
  integrations: IntegrationProvider[];
  team: TeamMember[];
  settings: OrganizationSettings;
  baseline: DashboardBaseline;
}
