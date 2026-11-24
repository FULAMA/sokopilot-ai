import { createDemoSeed } from '../data/demoSeed';
import {
  ActivityItem,
  Campaign,
  DemoRepositoryState,
  FollowUpTask,
  Lead,
  LeadStage,
  Offer,
  OrganizationSettings,
  TeamRole,
} from '../types/domain';
import { getLocalIsoDate } from '../utils/format';
import { isValidDemoRepositoryState } from './demoStateValidation';

const STORAGE_KEY = 'sokopilot_revenue_hub_demo_v1';
const CORRUPT_BACKUP_KEY = 'sokopilot_revenue_hub_demo_corrupt_backup_v1';

function preserveCorruptData(raw: string): void {
  try {
    localStorage.setItem(CORRUPT_BACKUP_KEY, raw);
  } catch {
    // Recovery must remain possible even when the backup cannot be written.
  }
}

export function loadRepositoryState(): DemoRepositoryState {
  const seed = createDemoSeed();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Preserve invalid JSON too; otherwise a recovery would destroy evidence.
      preserveCorruptData(raw);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }

    if (isValidDemoRepositoryState(parsed, seed)) return parsed;

    // Preserve structurally malformed data before restoring the demo seed.
    preserveCorruptData(raw);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  } catch {
    // If storage is unavailable, keep the app usable in memory.
    return seed;
  }
}

/** Returns false when browser storage is unavailable or quota is exceeded. */
export function saveRepositoryState(state: DemoRepositoryState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sokopilot:persistence-error'));
    }
    return false;
  }
}

function persistOrKeepPrevious(
  previous: DemoRepositoryState,
  next: DemoRepositoryState
): DemoRepositoryState {
  return saveRepositoryState(next) ? next : previous;
}

export function resetRepositoryState(
  previous: DemoRepositoryState
): DemoRepositoryState {
  const fresh = createDemoSeed();
  return persistOrKeepPrevious(previous, fresh);
}

export function exportRepositoryAsJson(state: DemoRepositoryState): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      note: 'Export local de démonstration SOKOPILOT AI — Données fictives',
      ...state,
    },
    null,
    2
  );
}

/**
 * Applies a stage transition to a lead and enforces the business rule:
 * Changing a lead to "Contacté" creates an initial follow-up task ONLY if
 * an open follow-up task does not already exist for that lead.
 */
export function applyLeadStageTransition(
  state: DemoRepositoryState,
  leadId: string,
  newStage: LeadStage,
  actor: string,
  lossReason?: string
): DemoRepositoryState {
  const lead = state.leads.find((l) => l.id === leadId);
  if (!lead) return state;

  const nowIso = new Date().toISOString();
  const today = getLocalIsoDate(0);

  const updatedLead: Lead = {
    ...lead,
    stage: newStage,
    lossReason: newStage === 'Perdu' ? lossReason?.trim() : undefined,
    updatedAt: today,
  };

  let nextFollowUps = state.followUps;
  let createdFollowUpNote = '';

  if (newStage === 'Contacté') {
    const hasOpenFollowUp = state.followUps.some(
      (task) => task.leadId === leadId && !task.completed
    );
    if (!hasOpenFollowUp) {
      const newTask: FollowUpTask = {
        id: `fu-${Date.now()}`,
        leadId: lead.id,
        leadName: lead.fullName,
        leadPhone: lead.phone,
        dueDate: getLocalIsoDate(1),
        channel: 'WhatsApp',
        subject: `Relance initiale — ${lead.courseOfInterest}`,
        messageDraft: `Bonjour ${lead.fullName.split(' ')[0]}, suite à notre premier échange au sujet de « ${lead.courseOfInterest} », je reviens vers vous pour répondre à vos questions et planifier la suite.`,
        completed: false,
        createdAt: today,
      };
      nextFollowUps = [newTask, ...state.followUps];
      createdFollowUpNote = ' (relance initiale créée)';
    }
  }

  const newActivity: ActivityItem = {
    id: `act-${Date.now()}`,
    type: 'stage_changed',
    actor,
    description: `a déplacé le prospect vers « ${newStage} »${createdFollowUpNote}`,
    targetLabel: lead.fullName,
    targetSection: 'prospects',
    targetId: lead.id,
    timestamp: nowIso,
  };

  const nextState: DemoRepositoryState = {
    ...state,
    leads: state.leads.map((l) => (l.id === leadId ? updatedLead : l)),
    followUps: nextFollowUps,
    activities: [newActivity, ...state.activities].slice(0, 30),
  };

  return persistOrKeepPrevious(state, nextState);
}

export function upsertLead(
  state: DemoRepositoryState,
  lead: Lead,
  isNew: boolean,
  actor: string
): DemoRepositoryState {
  const nowIso = new Date().toISOString();
  let nextFollowUps = state.followUps;

  if (lead.stage === 'Contacté') {
    const hasOpen = state.followUps.some((t) => t.leadId === lead.id && !t.completed);
    if (!hasOpen) {
      nextFollowUps = [
        {
          id: `fu-${Date.now()}`,
          leadId: lead.id,
          leadName: lead.fullName,
          leadPhone: lead.phone,
          dueDate: getLocalIsoDate(1),
          channel: 'WhatsApp',
          subject: `Relance initiale — ${lead.courseOfInterest}`,
          messageDraft: `Bonjour ${lead.fullName.split(' ')[0]}, merci pour notre premier contact concernant « ${lead.courseOfInterest} ». Restons en lien pour la suite.`,
          completed: false,
          createdAt: getLocalIsoDate(0),
        },
        ...state.followUps,
      ];
    }
  }

  const nextLeads = isNew
    ? [lead, ...state.leads]
    : state.leads.map((l) => (l.id === lead.id ? lead : l));

  const activity: ActivityItem = {
    id: `act-${Date.now()}`,
    type: isNew ? 'lead_created' : 'note_added',
    actor,
    description: isNew ? 'a ajouté un nouveau prospect' : 'a mis à jour la fiche de',
    targetLabel: `${lead.fullName} · ${lead.courseOfInterest}`,
    targetSection: 'prospects',
    targetId: lead.id,
    timestamp: nowIso,
  };

  const nextState: DemoRepositoryState = {
    ...state,
    leads: nextLeads,
    followUps: nextFollowUps,
    activities: [activity, ...state.activities].slice(0, 30),
  };
  return persistOrKeepPrevious(state, nextState);
}

export function upsertOffer(
  state: DemoRepositoryState,
  offer: Offer,
  isNew: boolean,
  actor: string
): DemoRepositoryState {
  const nextOffers = isNew
    ? [offer, ...state.offers]
    : state.offers.map((o) => (o.id === offer.id ? offer : o));
  const activity: ActivityItem = {
    id: `act-${Date.now()}`,
    type: 'offer_updated',
    actor,
    description: isNew ? 'a créé une nouvelle offre' : 'a modifié l’offre',
    targetLabel: offer.name,
    targetSection: 'offres',
    targetId: offer.id,
    timestamp: new Date().toISOString(),
  };
  const nextState: DemoRepositoryState = {
    ...state,
    offers: nextOffers,
    activities: [activity, ...state.activities].slice(0, 30),
  };
  return persistOrKeepPrevious(state, nextState);
}

export function upsertCampaign(
  state: DemoRepositoryState,
  campaign: Campaign,
  isNew: boolean,
  actor: string
): DemoRepositoryState {
  const nextCampaigns = isNew
    ? [campaign, ...state.campaigns]
    : state.campaigns.map((c) => (c.id === campaign.id ? campaign : c));
  const activity: ActivityItem = {
    id: `act-${Date.now()}`,
    type: 'campaign_approved',
    actor,
    description:
      campaign.status === 'Approuvée'
        ? 'a approuvé la campagne'
        : isNew
        ? 'a créé un brouillon de campagne'
        : 'a mis à jour la campagne',
    targetLabel: campaign.title,
    targetSection: 'campagnes',
    targetId: campaign.id,
    timestamp: new Date().toISOString(),
  };
  const nextState: DemoRepositoryState = {
    ...state,
    campaigns: nextCampaigns,
    activities: [activity, ...state.activities].slice(0, 30),
  };
  return persistOrKeepPrevious(state, nextState);
}

export function updateSettingsAndRole(
  state: DemoRepositoryState,
  settings: OrganizationSettings,
  memberId?: string,
  newRole?: TeamRole
): DemoRepositoryState {
  const nextTeam =
    memberId && newRole
      ? state.team.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      : state.team;
  const nextState: DemoRepositoryState = {
    ...state,
    settings,
    team: nextTeam,
  };
  return persistOrKeepPrevious(state, nextState);
}
