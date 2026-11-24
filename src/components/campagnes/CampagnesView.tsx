import React, { useState } from 'react';
import { Calendar, CheckCircle2, Edit3, Plus, ShieldAlert, X } from 'lucide-react';
import { Campaign, CampaignStatus, DemoRepositoryState } from '../../types/domain';
import { formatDateFr, getLocalIsoDate } from '../../utils/format';
import { CAMPAIGN_STATUSES, canTransitionCampaignStatus } from '../../utils/validation';

interface CampagnesViewProps {
  state: DemoRepositoryState;
  onSaveCampaign: (campaign: Campaign, isNew: boolean) => void;
}

const STATUS_STYLE: Record<CampaignStatus, string> = {
  Brouillon: 'text-slate-600',
  'À valider': 'text-amber-700',
  Approuvée: 'text-teal-700',
  Programmée: 'text-indigo-700',
  Publiée: 'text-emerald-700',
};

export const CampagnesView: React.FC<CampagnesViewProps> = ({ state, onSaveCampaign }) => {
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'Toutes'>('Toutes');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [form, setForm] = useState<Partial<Campaign>>({});
  const [workflowError, setWorkflowError] = useState<string | null>(null);

  const visibleCampaigns = state.campaigns
    .filter((c) => statusFilter === 'Toutes' || c.status === statusFilter)
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: '',
      channel: 'LinkedIn & Email',
      targetAudience: '',
      scheduledDate: getLocalIsoDate(4),
      status: 'Brouillon',
      contentDraft: '',
      owner: 'Chantal Mukendi',
    });
    setModalOpen(true);
  };

  const openEdit = (camp: Campaign) => {
    setEditing(camp);
    setForm({ ...camp });
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim()) return;
    const today = getLocalIsoDate(0);
    const saved: Campaign = {
      id: editing ? editing.id : `camp-${Date.now()}`,
      title: form.title.trim(),
      channel: (form.channel ?? 'Email B2B').trim(),
      targetAudience: (form.targetAudience ?? '').trim(),
      scheduledDate: form.scheduledDate ?? today,
      status: editing ? editing.status : 'Brouillon',
      contentDraft: (form.contentDraft ?? '').trim(),
      owner: form.owner ?? 'Chantal Mukendi',
      approvedBy: editing?.approvedBy,
      approvedAt: editing?.approvedAt,
      updatedAt: today,
    };
    onSaveCampaign(saved, !editing);
    setModalOpen(false);
  };

  const advanceStatus = (camp: Campaign, nextStatus: CampaignStatus) => {
    setWorkflowError(null);
    const check = canTransitionCampaignStatus(camp.status, nextStatus);
    if (!check.valid) {
      setWorkflowError(check.error ?? 'Transition invalide.');
      return;
    }
    const today = getLocalIsoDate(0);
    onSaveCampaign(
      {
        ...camp,
        status: nextStatus,
        approvedBy: nextStatus === 'Approuvée' ? 'Chantal Mukendi' : camp.approvedBy,
        approvedAt: nextStatus === 'Approuvée' ? today : camp.approvedAt,
        updatedAt: today,
      },
      false
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
            Campagnes & Calendrier Éditorial
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Préparation et circuit de validation interne · Aucune publication externe automatique
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Nouveau brouillon</span>
        </button>
      </div>

      <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-700">
        <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
        <span>
          <strong>Workflow d’approbation uniquement :</strong> les statuts « Programmée » et « Publiée » servent au suivi éditorial interne. Aucun post ou email n’est diffusé à l’extérieur.
        </span>
      </div>

      {workflowError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
          {workflowError}
        </div>
      )}

      {/* Status filter */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 w-fit">
        <button
          type="button"
          onClick={() => setStatusFilter('Toutes')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            statusFilter === 'Toutes' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Toutes ({state.campaigns.length})
        </button>
        {CAMPAIGN_STATUSES.map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              statusFilter === st ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {visibleCampaigns.map((camp) => (
          <article key={camp.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className={`font-semibold ${STATUS_STYLE[camp.status]}`}>
                    {camp.status}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{camp.channel}</span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDateFr(camp.scheduledDate)}
                  </span>
                </div>

                <h2 className="mt-1.5 font-display text-base font-semibold text-slate-900">
                  {camp.title}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Cible : {camp.targetAudience} · Responsable : {camp.owner}
                </p>
                <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
                  {camp.contentDraft}
                </p>

                {camp.approvedBy && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-teal-800">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approuvée par {camp.approvedBy} ({formatDateFr(camp.approvedAt ?? '')})
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(camp)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Éditer</span>
                </button>

                {camp.status === 'Brouillon' && (
                  <button
                    type="button"
                    onClick={() => advanceStatus(camp, 'À valider')}
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                  >
                    Soumettre à validation
                  </button>
                )}
                {camp.status === 'À valider' && (
                  <>
                    <button
                      type="button"
                      onClick={() => advanceStatus(camp, 'Brouillon')}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Renvoyer en brouillon
                    </button>
                    <button
                      type="button"
                      onClick={() => advanceStatus(camp, 'Approuvée')}
                      className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800"
                    >
                      Approuver
                    </button>
                  </>
                )}
                {camp.status === 'Approuvée' && (
                  <button
                    type="button"
                    onClick={() => advanceStatus(camp, 'Programmée')}
                    className="rounded-lg bg-indigo-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-800"
                  >
                    Marquer Programmée (interne)
                  </button>
                )}
                {camp.status === 'Programmée' && (
                  <button
                    type="button"
                    onClick={() => advanceStatus(camp, 'Publiée')}
                    className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
                  >
                    Marquer Publiée (journal)
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="font-display text-lg font-semibold text-slate-900">
                {editing ? 'Modifier la campagne' : 'Nouvelle campagne (Brouillon)'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Titre *</label>
                <input
                  type="text"
                  required
                  value={form.title ?? ''}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Canal</label>
                  <input
                    type="text"
                    value={form.channel ?? ''}
                    onChange={(e) => setForm({ ...form, channel: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Date prévue</label>
                  <input
                    type="date"
                    value={form.scheduledDate ?? ''}
                    onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Audience cible</label>
                <input
                  type="text"
                  value={form.targetAudience ?? ''}
                  onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Contenu / Message</label>
                <textarea
                  rows={4}
                  value={form.contentDraft ?? ''}
                  onChange={(e) => setForm({ ...form, contentDraft: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
