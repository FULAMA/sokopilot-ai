import { CampaignStatus, Lead, LeadStage } from '../types/domain';
import { isValidDrcPhone } from './format';

export const LEAD_STAGES: LeadStage[] = [
  'Nouveau',
  'Contacté',
  'Qualifié',
  'Proposition envoyée',
  'Gagné',
  'Perdu',
];

const ALLOWED_TRANSITIONS: Record<LeadStage, LeadStage[]> = {
  Nouveau: ['Nouveau', 'Contacté', 'Qualifié', 'Perdu'],
  Contacté: ['Nouveau', 'Contacté', 'Qualifié', 'Proposition envoyée', 'Perdu'],
  Qualifié: ['Contacté', 'Qualifié', 'Proposition envoyée', 'Gagné', 'Perdu'],
  'Proposition envoyée': ['Qualifié', 'Proposition envoyée', 'Gagné', 'Perdu'],
  Gagné: ['Gagné', 'Proposition envoyée'],
  Perdu: ['Perdu', 'Contacté', 'Qualifié'],
};

export function canTransitionStage(from: LeadStage, to: LeadStage): { valid: boolean; reason?: string } {
  if (from === to) return { valid: true };
  const allowed = ALLOWED_TRANSITIONS[from] || [];
  if (!allowed.includes(to)) {
    return {
      valid: false,
      reason: `Transition non autorisée de « ${from} » vers « ${to} ». Étapes autorisées : ${allowed.filter((s) => s !== from).join(', ')}.`,
    };
  }
  return { valid: true };
}

export function validateStageChange(
  from: LeadStage,
  to: LeadStage,
  lossReason?: string
): { valid: boolean; error?: string } {
  const transition = canTransitionStage(from, to);
  if (!transition.valid) {
    return { valid: false, error: transition.reason };
  }
  if (to === 'Perdu' && (!lossReason || lossReason.trim().length < 3)) {
    return {
      valid: false,
      error: 'Un motif de perte (au moins 3 caractères) est obligatoire pour passer un prospect au statut « Perdu ».',
    };
  }
  return { valid: true };
}

export function validateLeadInput(lead: Partial<Lead>): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!lead.fullName || lead.fullName.trim().length < 2) {
    errors.fullName = 'Le nom complet est requis.';
  }
  if (!lead.phone || !isValidDrcPhone(lead.phone)) {
    errors.phone = 'Format attendu : +243 XX XXX XX XX (ex. +243 81 234 56 78).';
  }
  if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    errors.email = 'Adresse email invalide.';
  }
  if (!lead.courseOfInterest || lead.courseOfInterest.trim().length < 2) {
    errors.courseOfInterest = 'Veuillez indiquer la formation ou offre souhaitée.';
  }
  if (lead.expectedValue === undefined || Number.isNaN(lead.expectedValue) || lead.expectedValue < 0) {
    errors.expectedValue = 'La valeur estimée doit être positive ou nulle.';
  }
  if (lead.stage === 'Perdu' && (!lead.lossReason || lead.lossReason.trim().length < 3)) {
    errors.lossReason = 'Le motif de perte est obligatoire au statut Perdu.';
  }
  return errors;
}

export const CAMPAIGN_STATUSES: CampaignStatus[] = [
  'Brouillon',
  'À valider',
  'Approuvée',
  'Programmée',
  'Publiée',
];

export function canTransitionCampaignStatus(from: CampaignStatus, to: CampaignStatus): { valid: boolean; error?: string } {
  if (from === to) return { valid: true };
  const order: Record<CampaignStatus, CampaignStatus[]> = {
    Brouillon: ['À valider'],
    'À valider': ['Brouillon', 'Approuvée'],
    Approuvée: ['À valider', 'Programmée'],
    Programmée: ['Approuvée', 'Publiée'],
    Publiée: [],
  };
  if (!order[from].includes(to)) {
    return {
      valid: false,
      error: `Workflow : passage de « ${from} » à « ${to} » non autorisé.`,
    };
  }
  return { valid: true };
}
