import { useEffect, useState } from 'react';
import {
  ActivityItem,
  Campaign,
  DemoRepositoryState,
  FollowUpTask,
  Lead,
  LeadStage,
  NavSection,
  Offer,
  OrganizationSettings,
  TeamRole,
} from './types/domain';
import {
  applyLeadStageTransition,
  loadRepositoryState,
  resetRepositoryState,
  saveRepositoryState,
  updateSettingsAndRole,
  upsertCampaign,
  upsertLead,
  upsertOffer,
} from './services/storage';
import { getLocalIsoDate } from './utils/format';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { ConfirmDialog } from './components/common/ConfirmDialog';
import { DashboardView } from './components/dashboard/DashboardView';
import { ProspectsView } from './components/prospects/ProspectsView';
import { OffresView } from './components/offres/OffresView';
import { RelancesView } from './components/relances/RelancesView';
import { CampagnesView } from './components/campagnes/CampagnesView';
import { AssistantView } from './components/assistant/AssistantView';
import { AutomatisationsView } from './components/automatisations/AutomatisationsView';
import { IntegrationsView } from './components/integrations/IntegrationsView';
import { ParametresView } from './components/parametres/ParametresView';

export default function App() {
  const [state, setState] = useState<DemoRepositoryState>(() => loadRepositoryState());
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [focusedLeadId, setFocusedLeadId] = useState<string | undefined>(undefined);
  const [prospectsStageFilter, setProspectsStageFilter] = useState<LeadStage | 'Tous'>('Tous');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [persistenceError, setPersistenceError] = useState(false);

  useEffect(() => {
    const handlePersistenceError = () => setPersistenceError(true);
    window.addEventListener('sokopilot:persistence-error', handlePersistenceError);
    return () => window.removeEventListener('sokopilot:persistence-error', handlePersistenceError);
  }, []);

  const currentActor = 'Chantal Mukendi';

  const handleNavigate = (
    section: NavSection,
    itemId?: string,
    stageFilter?: LeadStage
  ) => {
    setActiveSection(section);
    if (section === 'prospects') {
      setFocusedLeadId(itemId);
      setProspectsStageFilter(stageFilter ?? 'Tous');
    } else {
      setFocusedLeadId(undefined);
    }
  };

  const handleTransitionStage = (leadId: string, newStage: LeadStage, lossReason?: string) => {
    setState((prev) => applyLeadStageTransition(prev, leadId, newStage, currentActor, lossReason));
  };

  const handleSaveLead = (lead: Lead, isNew: boolean) => {
    setState((prev) => upsertLead(prev, lead, isNew, currentActor));
  };

  const handleAddLeadNote = (leadId: string, content: string) => {
    setState((prev) => {
      const nowIso = new Date().toISOString();
      const targetLead = prev.leads.find((l) => l.id === leadId);
      if (!targetLead) return prev;

      const updatedLeads = prev.leads.map((l) =>
        l.id === leadId
          ? {
              ...l,
              updatedAt: getLocalIsoDate(0),
              notes: [
                {
                  id: `note-${Date.now()}`,
                  author: currentActor,
                  content,
                  createdAt: nowIso,
                },
                ...l.notes,
              ],
            }
          : l
      );

      const newActivity: ActivityItem = {
        id: `act-${Date.now()}`,
        type: 'note_added',
        actor: currentActor,
        description: 'a ajouté une note sur le dossier',
        targetLabel: targetLead.fullName,
        targetSection: 'prospects',
        targetId: targetLead.id,
        timestamp: nowIso,
      };

      const next: DemoRepositoryState = {
        ...prev,
        leads: updatedLeads,
        activities: [newActivity, ...prev.activities].slice(0, 30),
      };
      if (!saveRepositoryState(next)) return prev;
      return next;
    });
  };

  const handleToggleFollowUpComplete = (taskId: string) => {
    setState((prev) => {
      const target = prev.followUps.find((t) => t.id === taskId);
      if (!target) return prev;
      const nextCompleted = !target.completed;
      const nowIso = new Date().toISOString();
      const nextFollowUps = prev.followUps.map((t) =>
        t.id === taskId
          ? {
              ...t,
              completed: nextCompleted,
              completedAt: nextCompleted ? getLocalIsoDate(0) : undefined,
            }
          : t
      );

      const nextActivities = nextCompleted
        ? [
            {
              id: `act-${Date.now()}`,
              type: 'followup_done' as const,
              actor: currentActor,
              description: `a clôturé la relance (${target.channel}) auprès de`,
              targetLabel: target.leadName,
              targetSection: 'relances' as const,
              targetId: target.id,
              timestamp: nowIso,
            },
            ...prev.activities,
          ].slice(0, 30)
        : prev.activities;

      const next = { ...prev, followUps: nextFollowUps, activities: nextActivities };
      if (!saveRepositoryState(next)) return prev;
      return next;
    });
  };

  const handleUpdateFollowUp = (updated: FollowUpTask) => {
    setState((prev) => {
      const next: DemoRepositoryState = {
        ...prev,
        followUps: prev.followUps.map((t) => (t.id === updated.id ? updated : t)),
      };
      if (!saveRepositoryState(next)) return prev;
      return next;
    });
  };

  const handleAddFollowUpFromAssistant = (task: FollowUpTask) => {
    setState((prev) => {
      const next: DemoRepositoryState = {
        ...prev,
        followUps: [task, ...prev.followUps],
      };
      if (!saveRepositoryState(next)) return prev;
      return next;
    });
  };

  const handleSaveOffer = (offer: Offer, isNew: boolean) => {
    setState((prev) => upsertOffer(prev, offer, isNew, currentActor));
  };

  const handleSaveCampaign = (campaign: Campaign, isNew: boolean) => {
    setState((prev) => upsertCampaign(prev, campaign, isNew, currentActor));
  };

  const handleToggleAutomationRule = (ruleId: string) => {
    setState((prev) => {
      const rule = prev.automations.find((r) => r.id === ruleId);
      if (!rule) return prev;
      const nextEnabled = !rule.enabled;
      const next: DemoRepositoryState = {
        ...prev,
        automations: prev.automations.map((r) =>
          r.id === ruleId ? { ...r, enabled: nextEnabled } : r
        ),
        automationAudit: [
          {
            id: `aud-${Date.now()}`,
            ruleName: rule.name,
            status: nextEnabled ? 'Activée (Simulation)' : 'Désactivée',
            note: nextEnabled
              ? 'Activée manuellement en mode simulation locale (aucun envoi externe).'
              : 'Règle désactivée par l’utilisateur.',
            timestamp: new Date().toISOString(),
          },
          ...prev.automationAudit,
        ],
      };
      if (!saveRepositoryState(next)) return prev;
      return next;
    });
  };

  const handleSaveSettings = (
    settings: OrganizationSettings,
    memberId?: string,
    newRole?: TeamRole
  ) => {
    setState((prev) => updateSettingsAndRole(prev, settings, memberId, newRole));
  };

  const handleConfirmResetDemo = () => {
    const fresh = resetRepositoryState(state);
    if (fresh === state) return;
    setState(fresh);
    setFocusedLeadId(undefined);
    setProspectsStageFilter('Tous');
    setResetConfirmOpen(false);
  };

  const pendingFollowUpsCount = state.followUps.filter((t) => !t.completed).length;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {persistenceError && (
        <div role="alert" className="fixed bottom-4 right-4 z-[100] max-w-md rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-lg">
          Échec de sauvegarde locale : vos modifications n’ont pas été enregistrées. Vérifiez l’espace disponible et les autorisations de stockage de votre navigateur.
          <button type="button" onClick={() => setPersistenceError(false)} className="ml-3 font-semibold underline">Fermer</button>
        </div>
      )}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={(sec) => handleNavigate(sec)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        pendingFollowUpsCount={pendingFollowUpsCount}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          state={state}
          activeSection={activeSection}
          onNavigate={(sec, id) => handleNavigate(sec, id)}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onRequestResetDemo={() => setResetConfirmOpen(true)}
        />

        <main className="flex-1 px-4 py-6 lg:px-8">
          <div className="mx-auto max-w-[1320px]">
            {activeSection === 'dashboard' && (
              <DashboardView
                state={state}
                onNavigate={handleNavigate}
                onRequestResetDemo={() => setResetConfirmOpen(true)}
              />
            )}

            {activeSection === 'prospects' && (
              <ProspectsView
                key={`${focusedLeadId ?? 'none'}-${prospectsStageFilter}`}
                state={state}
                initialSelectedLeadId={focusedLeadId}
                initialStageFilter={prospectsStageFilter}
                onTransitionStage={handleTransitionStage}
                onSaveLead={handleSaveLead}
                onAddNote={handleAddLeadNote}
              />
            )}

            {activeSection === 'offres' && (
              <OffresView state={state} onSaveOffer={handleSaveOffer} />
            )}

            {activeSection === 'relances' && (
              <RelancesView
                state={state}
                onToggleComplete={handleToggleFollowUpComplete}
                onUpdateTask={handleUpdateFollowUp}
              />
            )}

            {activeSection === 'campagnes' && (
              <CampagnesView state={state} onSaveCampaign={handleSaveCampaign} />
            )}

            {activeSection === 'assistant' && (
              <AssistantView
                state={state}
                onSaveDraftToFollowUp={handleAddFollowUpFromAssistant}
                onSaveDraftToCampaign={(camp) => handleSaveCampaign(camp, true)}
              />
            )}

            {activeSection === 'automatisations' && (
              <AutomatisationsView
                state={state}
                onToggleRule={handleToggleAutomationRule}
              />
            )}

            {activeSection === 'integrations' && <IntegrationsView state={state} />}

            {activeSection === 'parametres' && (
              <ParametresView
                state={state}
                onSaveSettings={handleSaveSettings}
                onRequestResetDemo={() => setResetConfirmOpen(true)}
              />
            )}
          </div>
        </main>
      </div>

      <ConfirmDialog
        open={resetConfirmOpen}
        title="Réinitialiser les données de démonstration ?"
        description="Cette action restaure les 12 prospects, 6 offres, 8 relances et 4 campagnes fictives d'origine dans votre navigateur. Vos modifications locales actuelles seront effacées."
        confirmLabel="Réinitialiser"
        tone="danger"
        onConfirm={handleConfirmResetDemo}
        onCancel={() => setResetConfirmOpen(false)}
      />
    </div>
  );
}
