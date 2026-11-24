import { DemoRepositoryState } from '../types/domain';

/**
 * Validate persisted demo data against the canonical seed shape.
 * This is a runtime guard, not a security boundary. Server-side validation
 * and database constraints are mandatory once real customer data is used.
 */
function matchesTemplate(value: unknown, template: unknown): boolean {
  if (template === null) return value === null;

  if (Array.isArray(template)) {
    return (
      Array.isArray(value) &&
      (template.length === 0 ||
        value.every((item) => matchesTemplate(item, template[0])))
    );
  }

  if (typeof template === 'string') return typeof value === 'string';
  if (typeof template === 'number') {
    return typeof value === 'number' && Number.isFinite(value);
  }
  if (typeof template === 'boolean') return typeof value === 'boolean';

  if (typeof template === 'object' && template !== null) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return false;
    }

    return Object.entries(template).every(([key, expected]) => {
      const record = value as Record<string, unknown>;
      const actual = record[key];

      if (expected === undefined) {
        return actual === undefined || typeof actual === 'string';
      }

      return matchesTemplate(actual, expected);
    });
  }

  return value === template;
}

const CURRENCIES = ['CDF', 'USD'];
const LEAD_STAGES = [
  'Nouveau',
  'Contacté',
  'Qualifié',
  'Proposition envoyée',
  'Gagné',
  'Perdu',
];
const LEAD_SOURCES = [
  'Site web',
  'Référencement',
  'Réseaux sociaux',
  'Suggestion',
  'Autre',
];
const FOLLOW_UP_CHANNELS = ['WhatsApp', 'Appel', 'Email', 'SMS'];
const CAMPAIGN_STATUSES = [
  'Brouillon',
  'À valider',
  'Approuvée',
  'Programmée',
  'Publiée',
];
const TEAM_ROLES = ['Owner', 'Manager', 'Sales'];
const ACTIVITY_TYPES = [
  'lead_created',
  'stage_changed',
  'followup_done',
  'offer_updated',
  'campaign_approved',
  'note_added',
];
const NAV_SECTIONS = [
  'dashboard',
  'prospects',
  'offres',
  'relances',
  'campagnes',
  'assistant',
  'automatisations',
  'integrations',
  'parametres',
];

function isOneOf(value: unknown, allowed: string[]): boolean {
  return typeof value === 'string' && allowed.includes(value);
}

function isNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function isDateOnly(value: unknown): boolean {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isTimestamp(value: unknown): boolean {
  return (
    typeof value === 'string' &&
    value.includes('T') &&
    Number.isFinite(Date.parse(value))
  );
}

function hasUniqueIds(items: unknown[]): boolean {
  const ids = items.map((item) =>
    typeof item === 'object' && item !== null
      ? (item as Record<string, unknown>).id
      : undefined
  );
  return (
    ids.every((id) => typeof id === 'string' && id.trim().length > 0) &&
    new Set(ids).size === ids.length
  );
}

function isNonNegativeFinite(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function hasNonEmptyStrings(values: unknown): boolean {
  return Array.isArray(values) && values.every(isNonEmptyString);
}

function hasValidSemantics(value: DemoRepositoryState): boolean {
  const state = value as DemoRepositoryState;

  if (
    !hasUniqueIds(state.leads) ||
    !hasUniqueIds(state.offers) ||
    !hasUniqueIds(state.followUps) ||
    !hasUniqueIds(state.campaigns) ||
    !hasUniqueIds(state.activities) ||
    !hasUniqueIds(state.automations) ||
    !hasUniqueIds(state.automationAudit) ||
    !hasUniqueIds(state.integrations) ||
    !hasUniqueIds(state.team)
  ) return false;

  if (!state.leads.every((lead) =>
    isNonEmptyString(lead.fullName) &&
    isNonEmptyString(lead.organization) &&
    isNonEmptyString(lead.city) &&
    isNonEmptyString(lead.phone) &&
    isNonEmptyString(lead.courseOfInterest) &&
    isNonEmptyString(lead.assignedOwner) &&
    isNonEmptyString(lead.nextAction) &&
    (lead.email === '' || typeof lead.email === 'string') &&
    isOneOf(lead.stage, LEAD_STAGES) &&
    isOneOf(lead.source, LEAD_SOURCES) &&
    isOneOf(lead.currency, CURRENCIES) &&
    isNonNegativeFinite(lead.expectedValue) &&
    isDateOnly(lead.nextFollowUpDate) &&
    isDateOnly(lead.createdAt) &&
    isDateOnly(lead.updatedAt) &&
    (lead.stage !== 'Perdu' || isNonEmptyString(lead.lossReason)) &&
    hasUniqueIds(lead.notes) &&
    lead.notes.every((note) =>
      isNonEmptyString(note.author) &&
      isNonEmptyString(note.content) &&
      isTimestamp(note.createdAt)
    )
  )) return false;

  if (!state.offers.every((offer) =>
    isNonEmptyString(offer.name) &&
    isNonEmptyString(offer.category) &&
    isNonEmptyString(offer.description) &&
    isNonEmptyString(offer.duration) &&
    typeof offer.active === 'boolean' &&
    isOneOf(offer.currency, CURRENCIES) &&
    isNonNegativeFinite(offer.price) &&
    isDateOnly(offer.updatedAt)
  )) return false;

  const leadIds = new Set(state.leads.map((lead) => lead.id));
  if (!state.followUps.every((task) =>
    leadIds.has(task.leadId) &&
    isNonEmptyString(task.leadName) &&
    isNonEmptyString(task.leadPhone) &&
    isNonEmptyString(task.subject) &&
    isNonEmptyString(task.messageDraft) &&
    typeof task.completed === 'boolean' &&
    isOneOf(task.channel, FOLLOW_UP_CHANNELS) &&
    isDateOnly(task.dueDate) &&
    isDateOnly(task.createdAt) &&
    (task.completedAt === undefined || isDateOnly(task.completedAt))
  )) return false;

  if (!state.campaigns.every((campaign) =>
    isNonEmptyString(campaign.title) &&
    isNonEmptyString(campaign.channel) &&
    isNonEmptyString(campaign.targetAudience) &&
    isNonEmptyString(campaign.contentDraft) &&
    isNonEmptyString(campaign.owner) &&
    isOneOf(campaign.status, CAMPAIGN_STATUSES) &&
    isDateOnly(campaign.scheduledDate) &&
    isDateOnly(campaign.updatedAt) &&
    (campaign.approvedAt === undefined || isDateOnly(campaign.approvedAt)) &&
    (campaign.approvedBy === undefined || isNonEmptyString(campaign.approvedBy))
  )) return false;

  if (!state.activities.every((activity) =>
    isNonEmptyString(activity.actor) &&
    isNonEmptyString(activity.description) &&
    isNonEmptyString(activity.targetLabel) &&
    isOneOf(activity.type, ACTIVITY_TYPES) &&
    isOneOf(activity.targetSection, NAV_SECTIONS) &&
    isTimestamp(activity.timestamp) &&
    (activity.targetId === undefined || isNonEmptyString(activity.targetId))
  )) return false;

  if (!state.automations.every((rule) =>
    isNonEmptyString(rule.name) &&
    isNonEmptyString(rule.trigger) &&
    isNonEmptyString(rule.action) &&
    typeof rule.enabled === 'boolean' &&
    hasNonEmptyStrings(rule.requirements) &&
    isNonEmptyString(rule.safetyNotice)
  )) return false;

  if (!state.automationAudit.every((entry) =>
    isNonEmptyString(entry.ruleName) &&
    isNonEmptyString(entry.status) &&
    isNonEmptyString(entry.note) &&
    isTimestamp(entry.timestamp)
  )) return false;

  if (!state.integrations.every((integration) =>
    isNonEmptyString(integration.name) &&
    isNonEmptyString(integration.category) &&
    isNonEmptyString(integration.description) &&
    integration.status === 'Non connecté' &&
    isNonEmptyString(integration.requiredScope)
  )) return false;

  if (!state.team.every((member) =>
    isNonEmptyString(member.name) &&
    isNonEmptyString(member.email) &&
    isNonEmptyString(member.city) &&
    isOneOf(member.role, TEAM_ROLES)
  )) return false;

  if (
    !isNonEmptyString(state.settings.workspaceName) ||
    !isNonEmptyString(state.settings.legalName) ||
    !isNonEmptyString(state.settings.city) ||
    !isNonEmptyString(state.settings.country) ||
    !isNonEmptyString(state.settings.contactPhone) ||
    typeof state.settings.contactEmail !== 'string' ||
    !isOneOf(state.settings.defaultCurrency, CURRENCIES) ||
    !Number.isFinite(state.settings.usdToCdfRate) ||
    state.settings.usdToCdfRate <= 0
  ) return false;

  const baselineCounts = [
    state.baseline.newLeadsCount,
    state.baseline.qualifiedOpportunitiesCount,
    state.baseline.pipelineValueCdf,
    ...Object.values(state.baseline.stageCounts),
  ];
  const percentageTotal = state.baseline.sourcePercentages.reduce(
    (total, item) => total + item.percentage,
    0
  );

  if (
    !baselineCounts.every(isNonNegativeFinite) ||
    !Number.isFinite(state.baseline.conversionRatePct) ||
    state.baseline.conversionRatePct < 0 ||
    state.baseline.conversionRatePct > 100 ||
    !Object.values(state.baseline.stageCounts).every(isNonNegativeFinite) ||
    !state.baseline.sourcePercentages.every((item) =>
      isOneOf(item.source, LEAD_SOURCES) &&
      Number.isFinite(item.percentage) &&
      item.percentage >= 0 &&
      item.percentage <= 100
    ) ||
    Math.abs(percentageTotal - 100) > 0.01
  ) return false;

  return true;
}

export function isValidDemoRepositoryState(
  value: unknown,
  canonicalSeed: DemoRepositoryState
): value is DemoRepositoryState {
  return (
    matchesTemplate(value, canonicalSeed) &&
    hasValidSemantics(value as DemoRepositoryState)
  );
}
