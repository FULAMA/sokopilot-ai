import React, { useMemo, useState } from 'react';
import { Bot, CheckSquare, ShieldAlert, FileCheck2 } from 'lucide-react';
import { Campaign, DemoRepositoryState, FollowUpTask } from '../../types/domain';
import { formatCurrency, getLocalIsoDate } from '../../utils/format';

interface AssistantViewProps {
  state: DemoRepositoryState;
  onSaveDraftToFollowUp: (task: FollowUpTask) => void;
  onSaveDraftToCampaign: (campaign: Campaign) => void;
}

type AssistantPersonaId =
  | 'qualifier'
  | 'sales'
  | 'coach'
  | 'planner'
  | 'analyst';

interface PersonaConfig {
  id: AssistantPersonaId;
  title: string;
  subtitle: string;
  recommendation: string;
  draftTitle: string;
  draftText: string;
  targetActionLabel: string;
  targetType: 'followup' | 'campaign' | 'readonly';
}

export const AssistantView: React.FC<AssistantViewProps> = ({
  state,
  onSaveDraftToFollowUp,
  onSaveDraftToCampaign,
}) => {
  const [activePersona, setActivePersona] = useState<AssistantPersonaId>('qualifier');
  const [selectedLeadId, setSelectedLeadId] = useState<string>(state.leads[0]?.id ?? '');
  const [humanApproved, setHumanApproved] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const selectedLead =
    state.leads.find((l) => l.id === selectedLeadId) ?? state.leads[0];

  const personas = useMemo<PersonaConfig[]>(() => {
    const leadName = selectedLead?.fullName ?? 'Grace Mbuyi Kalonji';
    const leadCourse = selectedLead?.courseOfInterest ?? 'Certification Comptabilité OHADA';
    const leadValue = selectedLead
      ? formatCurrency(selectedLead.expectedValue, selectedLead.currency)
      : '18 500 000 CDF';

    return [
      {
        id: 'qualifier',
        title: 'Lead Qualifier',
        subtitle: 'Analyse simulée de complétude et priorité commerciale',
        recommendation: `Dossier « ${leadName} » (${leadValue}) : le besoin sur « ${leadCourse} » correspond à une offre active. Priorité suggérée : confirmer le nombre exact de participants et le calendrier souhaité avant d’émettre une offre formelle.`,
        draftTitle: `Note de qualification proposée — ${leadName}`,
        draftText: `Bonjour ${leadName.split(' ')[0]}, merci pour votre intérêt pour ${leadCourse}. Pour vous orienter au mieux au Centre de Formation Horizon, pourriez-vous nous préciser le nombre de participants prévu ainsi que la période idéale de démarrage ?`,
        targetActionLabel: 'Créer un brouillon dans Relances',
        targetType: 'followup',
      },
      {
        id: 'sales',
        title: 'Sales Assistant',
        subtitle: 'Préparation de proposition et argumentaire adapté',
        recommendation: `Pour « ${leadName} », mettre en avant le format pratique (études de cas RDC / OHADA), la flexibilité présentiel ou hybride à ${selectedLead?.city ?? 'Kinshasa'}, et la possibilité d’un échelonnement en ${selectedLead?.currency ?? 'CDF'}.`,
        draftTitle: `Proposition d’accompagnement — ${leadCourse}`,
        draftText: `Bonjour ${leadName.split(' ')[0]}, suite à nos échanges, vous trouverez ci-après les modalités pour « ${leadCourse} » (montant indicatif : ${leadValue}). Nos formateurs peuvent intervenir en intra-entreprise ou en cohorte ouverte selon vos disponibilités.`,
        targetActionLabel: 'Enregistrer le brouillon dans Relances',
        targetType: 'followup',
      },
      {
        id: 'coach',
        title: 'Follow-up Coach',
        subtitle: 'Relance douce des opportunités en attente',
        recommendation: `${state.followUps.filter((t) => !t.completed).length} relances sont actuellement ouvertes. Privilégier un message WhatsApp court le matin entre 08h30 et 11h00 avec une question fermée simple.`,
        draftTitle: `Message de suivi recommandé — ${leadName}`,
        draftText: `Bonjour ${leadName.split(' ')[0]}, je me permets de revenir brièvement vers vous au sujet de votre projet de formation (${leadCourse}). Souhaitez-vous que nous bloquions un créneau de 10 minutes cette semaine pour faire le point ?`,
        targetActionLabel: 'Ajouter à la file Relances',
        targetType: 'followup',
      },
      {
        id: 'planner',
        title: 'Campaign Planner',
        subtitle: 'Suggestion de contenu éditorial pour le trimestre',
        recommendation: `Le canal Site web (35%) et Référencement (25%) génèrent la majorité des demandes. Opportunité détectée : publier une étude de cas chiffrée sur les cohortes Power BI et OHADA à Kinshasa et Lubumbashi.`,
        draftTitle: 'Brouillon campagne — Atelier Décideurs Power BI & OHADA',
        draftText: `Vous dirigez une équipe financière ou opérationnelle en RDC ? Rejoignez notre prochaine session d’information en ligne : 45 minutes pour découvrir nos parcours certifiants Power BI & OHADA adaptés aux réalités locales.`,
        targetActionLabel: 'Créer un brouillon dans Campagnes',
        targetType: 'campaign',
      },
      {
        id: 'analyst',
        title: 'Revenue Analyst',
        subtitle: 'Synthèse simulée du pipeline et des conversions',
        recommendation: `Pipeline consolidé de démonstration : 485 000 000 CDF avec un taux de conversion de 23,5 %. Les dossiers au stade « Proposition envoyée » représentent le levier le plus rapide pour les encaissements du mois.`,
        draftTitle: 'Synthèse analytique hebdomadaire (Simulation)',
        draftText: `1. Prioriser les relances sur les dossiers « Proposition envoyée » datant de plus de 48h.\n2. Vérifier les motifs de perte récurrents (budget / calendrier) pour ajuster les facilités de paiement.\n3. Maintenir la qualité de suivi sur les leads issus du Site web et du Référencement.`,
        targetActionLabel: 'Rapport consultatif uniquement',
        targetType: 'readonly',
      },
    ];
  }, [selectedLead, state.followUps]);

  const currentPersona = personas.find((p) => p.id === activePersona) ?? personas[0];
  const [editableDraft, setEditableDraft] = useState(currentPersona.draftText);

  const handleSelectPersona = (id: AssistantPersonaId) => {
    setActivePersona(id);
    setHumanApproved(false);
    setFeedbackMsg(null);
    const next = personas.find((p) => p.id === id);
    if (next) setEditableDraft(next.draftText);
  };

  const handleLeadChange = (leadId: string) => {
    setSelectedLeadId(leadId);
    setHumanApproved(false);
    setFeedbackMsg(null);
    const nextLead = state.leads.find((l) => l.id === leadId);
    if (nextLead) {
      const first = nextLead.fullName.split(' ')[0];
      const val = formatCurrency(nextLead.expectedValue, nextLead.currency);
      if (activePersona === 'qualifier') {
        setEditableDraft(
          `Bonjour ${first}, merci pour votre intérêt pour ${nextLead.courseOfInterest}. Pour vous orienter au mieux au Centre de Formation Horizon, pourriez-vous nous préciser le nombre de participants prévu ainsi que la période idéale de démarrage ?`
        );
      } else if (activePersona === 'sales') {
        setEditableDraft(
          `Bonjour ${first}, suite à nos échanges, vous trouverez ci-après les modalités pour « ${nextLead.courseOfInterest} » (montant indicatif : ${val}). Nos formateurs peuvent intervenir en intra-entreprise ou en cohorte ouverte selon vos disponibilités.`
        );
      } else if (activePersona === 'coach') {
        setEditableDraft(
          `Bonjour ${first}, je me permets de revenir brièvement vers vous au sujet de votre projet de formation (${nextLead.courseOfInterest}). Souhaitez-vous que nous bloquions un créneau de 10 minutes cette semaine pour faire le point ?`
        );
      }
    }
  };

  const handleApplyWithApproval = () => {
    if (!humanApproved) return;
    const today = getLocalIsoDate(0);

    if (currentPersona.targetType === 'followup' && selectedLead) {
      onSaveDraftToFollowUp({
        id: `fu-sim-${Date.now()}`,
        leadId: selectedLead.id,
        leadName: selectedLead.fullName,
        leadPhone: selectedLead.phone,
        dueDate: getLocalIsoDate(1),
        channel: 'WhatsApp',
        subject: `[Simulation IA] ${currentPersona.draftTitle}`,
        messageDraft: editableDraft,
        completed: false,
        createdAt: today,
      });
      setFeedbackMsg('Brouillon enregistré dans « Relances ». Aucun message envoyé.');
      setHumanApproved(false);
    } else if (currentPersona.targetType === 'campaign') {
      onSaveDraftToCampaign({
        id: `camp-sim-${Date.now()}`,
        title: currentPersona.draftTitle,
        channel: 'LinkedIn & Email',
        targetAudience: 'Directions Financières & PME (Démo)',
        scheduledDate: getLocalIsoDate(7),
        status: 'Brouillon',
        contentDraft: editableDraft,
        owner: 'Chantal Mukendi',
        updatedAt: today,
      });
      setFeedbackMsg('Brouillon enregistré dans « Campagnes » au statut Brouillon.');
      setHumanApproved(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
            Assistant IA — Établi de Simulation
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Recommandations simulées localement · Validation humaine requise avant toute action
          </p>
        </div>
        <span className="rounded border border-amber-300 bg-amber-50 px-2.5 py-1 font-mono text-xs font-semibold text-amber-800 w-fit">
          SIMULATION LOCALE
        </span>
      </div>

      <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-700">
        <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
        <span>
          <strong>Aucun modèle externe connecté :</strong> cet espace génère uniquement des exemples de recommandations et de brouillons locaux. Aucune action externe n’est exécutée sans votre approbation explicite.
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Persona Selector */}
        <div className="lg:col-span-4 space-y-2">
          {personas.map((p) => {
            const isActive = p.id === activePersona;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPersona(p.id)}
                className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                  isActive
                    ? 'border-teal-600 bg-white'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <Bot className={`mt-0.5 h-4 w-4 shrink-0 ${isActive ? 'text-teal-700' : 'text-slate-400'}`} />
                <div>
                  <div className="text-sm font-semibold text-slate-900">{p.title}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{p.subtitle}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Simulation Output & Human Approval Workbench */}
        <div className="lg:col-span-8 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="font-mono text-[11px] font-semibold text-teal-700">
                MODE SIMULATION · {currentPersona.title}
              </span>
              <h2 className="mt-0.5 font-display text-lg font-semibold text-slate-900">
                {currentPersona.draftTitle}
              </h2>
            </div>

            {currentPersona.targetType === 'followup' && (
              <select
                value={selectedLead?.id ?? ''}
                onChange={(e) => handleLeadChange(e.target.value)}
                aria-label="Choisir un prospect de contexte"
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-teal-600 focus:outline-none"
              >
                {state.leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.fullName} ({l.stage})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="rounded-lg bg-slate-50 p-4">
            <div className="text-xs font-semibold text-slate-700 mb-1">
              Recommandation simulée
            </div>
            <p className="text-sm leading-relaxed text-slate-700">
              {currentPersona.recommendation}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Texte proposé (modifiable avant validation)
            </label>
            <textarea
              rows={5}
              value={editableDraft}
              onChange={(e) => setEditableDraft(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-900 focus:border-teal-600 focus:outline-none"
            />
          </div>

          {currentPersona.targetType !== 'readonly' && (
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={humanApproved}
                  onChange={(e) => setHumanApproved(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                />
                <span>
                  J’ai relu ce texte généré en simulation et j’approuve explicitement son enregistrement en tant que brouillon interne (aucune diffusion externe).
                </span>
              </label>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={!humanApproved}
                  onClick={handleApplyWithApproval}
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <CheckSquare className="h-4 w-4" />
                  <span>{currentPersona.targetActionLabel}</span>
                </button>

                {feedbackMsg && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                    <FileCheck2 className="h-4 w-4" />
                    {feedbackMsg}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
