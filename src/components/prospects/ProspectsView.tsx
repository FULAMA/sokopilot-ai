import React, { useMemo, useState } from 'react';
import {
  Kanban,
  List,
  Plus,
  Search,
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  MessageSquarePlus,
  Edit3,
  ArrowUpDown,
} from 'lucide-react';
import {
  Currency,
  DemoRepositoryState,
  Lead,
  LeadSource,
  LeadStage,
} from '../../types/domain';
import { formatCurrency, formatDateFr, formatRelativeTimestamp, getLocalIsoDate } from '../../utils/format';
import { LEAD_STAGES, validateLeadInput, validateStageChange } from '../../utils/validation';

interface ProspectsViewProps {
  state: DemoRepositoryState;
  initialSelectedLeadId?: string;
  initialStageFilter?: LeadStage | 'Tous';
  onTransitionStage: (leadId: string, newStage: LeadStage, lossReason?: string) => void;
  onSaveLead: (lead: Lead, isNew: boolean) => void;
  onAddNote: (leadId: string, content: string) => void;
}

const LEAD_SOURCES: LeadSource[] = [
  'Site web',
  'Référencement',
  'Réseaux sociaux',
  'Suggestion',
  'Autre',
];

const STAGE_TEXT_COLORS: Record<LeadStage, string> = {
  Nouveau: 'text-slate-700',
  Contacté: 'text-indigo-700',
  Qualifié: 'text-teal-700',
  'Proposition envoyée': 'text-sky-700',
  Gagné: 'text-emerald-700',
  Perdu: 'text-red-700',
};

export const ProspectsView: React.FC<ProspectsViewProps> = ({
  state,
  initialSelectedLeadId,
  initialStageFilter = 'Tous',
  onTransitionStage,
  onSaveLead,
  onAddNote,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<LeadStage | 'Tous'>(initialStageFilter);
  const [sourceFilter, setSourceFilter] = useState<LeadSource | 'Toutes'>('Toutes');
  const [ownerFilter, setOwnerFilter] = useState<string>('Tous');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'expectedValue' | 'fullName'>('updatedAt');
  const [sortAsc, setSortAsc] = useState(false);

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(
    initialSelectedLeadId ?? null
  );
  const [noteInput, setNoteInput] = useState('');

  // Form modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formValues, setFormValues] = useState<Partial<Lead>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Transition / Loss reason modal state
  const [pendingLossTransition, setPendingLossTransition] = useState<{
    leadId: string;
    leadName: string;
    fromStage: LeadStage;
  } | null>(null);
  const [lossReasonInput, setLossReasonInput] = useState('');
  const [transitionError, setTransitionError] = useState<string | null>(null);

  const owners = useMemo(() => {
    const set = new Set<string>(state.team.map((t) => t.name));
    state.leads.forEach((l) => set.add(l.assignedOwner));
    return Array.from(set);
  }, [state.leads, state.team]);

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.leads
      .filter((lead) => {
        if (stageFilter !== 'Tous' && lead.stage !== stageFilter) return false;
        if (sourceFilter !== 'Toutes' && lead.source !== sourceFilter) return false;
        if (ownerFilter !== 'Tous' && lead.assignedOwner !== ownerFilter) return false;
        if (q) {
          const hay = `${lead.fullName} ${lead.organization} ${lead.courseOfInterest} ${lead.phone} ${lead.city}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'fullName') {
          cmp = a.fullName.localeCompare(b.fullName, 'fr');
        } else if (sortBy === 'expectedValue') {
          const valA = a.currency === 'USD' ? a.expectedValue * state.settings.usdToCdfRate : a.expectedValue;
          const valB = b.currency === 'USD' ? b.expectedValue * state.settings.usdToCdfRate : b.expectedValue;
          cmp = valA - valB;
        } else {
          cmp = a.updatedAt.localeCompare(b.updatedAt);
        }
        return sortAsc ? cmp : -cmp;
      });
  }, [state.leads, search, stageFilter, sourceFilter, ownerFilter, sortBy, sortAsc, state.settings.usdToCdfRate]);

  const selectedLead = useMemo(
    () => state.leads.find((l) => l.id === selectedLeadId) ?? null,
    [state.leads, selectedLeadId]
  );

  const openCreateModal = () => {
    setEditingLead(null);
    setFormValues({
      fullName: '',
      organization: '',
      city: 'Kinshasa',
      phone: '+243 ',
      email: '',
      source: 'Site web',
      courseOfInterest: state.offers[0]?.name ?? '',
      expectedValue: 1850000,
      currency: state.settings.defaultCurrency,
      stage: 'Nouveau',
      assignedOwner: state.team[0]?.name ?? 'Chantal Mukendi',
      nextAction: 'Premier contact téléphonique',
      nextFollowUpDate: getLocalIsoDate(1),
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setFormValues({ ...lead });
    setFormErrors({});
    setFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateLeadInput(formValues);
    if (editingLead && formValues.stage && formValues.stage !== editingLead.stage) {
      const check = validateStageChange(editingLead.stage, formValues.stage, formValues.lossReason);
      if (!check.valid && check.error) {
        errors.stage = check.error;
      }
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const today = getLocalIsoDate(0);
    const savedLead: Lead = {
      id: editingLead ? editingLead.id : `lead-${Date.now()}`,
      fullName: (formValues.fullName ?? '').trim(),
      organization: (formValues.organization ?? 'Particulier (Démo)').trim(),
      city: (formValues.city ?? 'Kinshasa').trim(),
      phone: (formValues.phone ?? '').trim(),
      email: (formValues.email ?? '').trim(),
      source: (formValues.source ?? 'Site web') as LeadSource,
      courseOfInterest: (formValues.courseOfInterest ?? '').trim(),
      expectedValue: Number(formValues.expectedValue ?? 0),
      currency: (formValues.currency ?? 'CDF') as Currency,
      stage: (formValues.stage ?? 'Nouveau') as LeadStage,
      lossReason: formValues.stage === 'Perdu' ? formValues.lossReason?.trim() : undefined,
      assignedOwner: (formValues.assignedOwner ?? 'Chantal Mukendi').trim(),
      nextAction: (formValues.nextAction ?? 'Suivi commercial').trim(),
      nextFollowUpDate: formValues.nextFollowUpDate ?? getLocalIsoDate(1),
      createdAt: editingLead ? editingLead.createdAt : today,
      updatedAt: today,
      notes: editingLead ? editingLead.notes : [],
    };

    onSaveLead(savedLead, !editingLead);
    setSelectedLeadId(savedLead.id);
    setFormOpen(false);
  };

  const attemptStageChange = (lead: Lead, targetStage: LeadStage) => {
    setTransitionError(null);
    if (lead.stage === targetStage) return;

    if (targetStage === 'Perdu') {
      const checkTransition = validateStageChange(lead.stage, 'Perdu', 'placeholder');
      if (!checkTransition.valid) {
        setTransitionError(checkTransition.error ?? 'Transition non autorisée.');
        return;
      }
      setPendingLossTransition({
        leadId: lead.id,
        leadName: lead.fullName,
        fromStage: lead.stage,
      });
      setLossReasonInput(lead.lossReason ?? '');
      return;
    }

    const result = validateStageChange(lead.stage, targetStage);
    if (!result.valid) {
      setTransitionError(result.error ?? 'Transition non autorisée.');
      return;
    }
    onTransitionStage(lead.id, targetStage);
  };

  const confirmLossTransition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingLossTransition) return;
    const result = validateStageChange(pendingLossTransition.fromStage, 'Perdu', lossReasonInput);
    if (!result.valid) {
      setTransitionError(result.error ?? 'Motif requis.');
      return;
    }
    onTransitionStage(pendingLossTransition.leadId, 'Perdu', lossReasonInput.trim());
    setPendingLossTransition(null);
    setLossReasonInput('');
    setTransitionError(null);
  };

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !noteInput.trim()) return;
    onAddNote(selectedLead.id, noteInput.trim());
    setNoteInput('');
  };

  const toggleSort = (field: 'updatedAt' | 'expectedValue' | 'fullName') => {
    if (sortBy === field) {
      setSortAsc((v) => !v);
    } else {
      setSortBy(field);
      setSortAsc(field === 'fullName');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
            CRM Prospects
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">
            {filteredLeads.length} prospect{filteredLeads.length > 1 ? 's' : ''} affiché{filteredLeads.length > 1 ? 's' : ''} · Données fictives de démonstration
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                viewMode === 'list'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Liste</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                viewMode === 'kanban'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban className="h-3.5 w-3.5" />
              <span>Kanban</span>
            </button>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau prospect</span>
          </button>
        </div>
      </div>

      {/* Validation error alert */}
      {transitionError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{transitionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setTransitionError(null)}
            className="rounded p-1 text-red-600 hover:bg-red-100"
            aria-label="Fermer l'alerte"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Filters bar */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-3.5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, entreprise, formation, +243..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none"
          />
        </div>

        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value as LeadStage | 'Tous')}
          aria-label="Filtrer par étape"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-600 focus:outline-none"
        >
          <option value="Tous">Toutes les étapes</option>
          {LEAD_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as LeadSource | 'Toutes')}
          aria-label="Filtrer par source"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-600 focus:outline-none"
        >
          <option value="Toutes">Toutes les sources</option>
          {LEAD_SOURCES.map((src) => (
            <option key={src} value={src}>
              {src}
            </option>
          ))}
        </select>

        <select
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          aria-label="Filtrer par responsable"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-600 focus:outline-none"
        >
          <option value="Tous">Tous les responsables</option>
          {owners.map((owner) => (
            <option key={owner} value={owner}>
              {owner}
            </option>
          ))}
        </select>
      </div>

      {/* Main Content + Detail Panel */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className={selectedLead ? 'xl:col-span-8' : 'xl:col-span-12'}>
          {viewMode === 'list' ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-500">
                      <th className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleSort('fullName')}
                          className="inline-flex items-center gap-1 hover:text-slate-900"
                        >
                          <span>Prospect</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="px-4 py-3">Formation souhaitée</th>
                      <th className="px-4 py-3">Étape</th>
                      <th className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => toggleSort('expectedValue')}
                          className="inline-flex items-center gap-1 hover:text-slate-900"
                        >
                          <span>Valeur</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="px-4 py-3">Relance</th>
                      <th className="px-4 py-3">Responsable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                          Aucun prospect ne correspond aux filtres actuels.
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map((lead) => {
                        const isSelected = selectedLead?.id === lead.id;
                        return (
                          <tr
                            key={lead.id}
                            onClick={() => setSelectedLeadId(lead.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-teal-50/60' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-900">{lead.fullName}</div>
                              <div className="text-xs text-slate-500">
                                {lead.organization} · {lead.city}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="max-w-[220px] truncate text-slate-700" title={lead.courseOfInterest}>
                                {lead.courseOfInterest}
                              </div>
                              <div className="text-xs text-slate-400">{lead.source}</div>
                            </td>
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={lead.stage}
                                onChange={(e) =>
                                  attemptStageChange(lead, e.target.value as LeadStage)
                                }
                                aria-label={`Étape pour ${lead.fullName}`}
                                className={`rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium ${STAGE_TEXT_COLORS[lead.stage]} focus:border-teal-600 focus:outline-none`}
                              >
                                {LEAD_STAGES.map((st) => (
                                  <option key={st} value={st}>
                                    {st}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                              {formatCurrency(lead.expectedValue, lead.currency)}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap font-mono tabular-nums">
                              {formatDateFr(lead.nextFollowUpDate)}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                              {lead.assignedOwner}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Kanban View */
            <div className="flex gap-4 overflow-x-auto pb-4">
              {LEAD_STAGES.map((stage) => {
                const colLeads = filteredLeads.filter((l) => l.stage === stage);
                return (
                  <div
                    key={stage}
                    className="w-72 shrink-0 rounded-xl border border-slate-200 bg-slate-100/70 p-3"
                  >
                    <div className="mb-3 flex items-center justify-between px-1">
                      <h3 className={`text-xs font-semibold ${STAGE_TEXT_COLORS[stage]}`}>
                        {stage}
                      </h3>
                      <span className="font-mono text-xs font-semibold text-slate-600 tabular-nums">
                        {colLeads.length}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {colLeads.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-200 bg-white/50 p-4 text-center text-xs text-slate-400">
                          Aucun dossier
                        </div>
                      ) : (
                        colLeads.map((lead) => (
                          <div
                            key={lead.id}
                            onClick={() => setSelectedLeadId(lead.id)}
                            className={`cursor-pointer rounded-lg border bg-white p-3 transition-colors ${
                              selectedLead?.id === lead.id
                                ? 'border-teal-600'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="font-medium text-sm text-slate-900 truncate">
                              {lead.fullName}
                            </div>
                            <div className="mt-0.5 text-xs text-slate-500 truncate">
                              {lead.organization}
                            </div>
                            <div className="mt-2 text-xs text-slate-700 line-clamp-1">
                              {lead.courseOfInterest}
                            </div>
                            <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                                {formatCurrency(lead.expectedValue, lead.currency)}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {lead.assignedOwner.split(' ')[0]}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Side Panel */}
        {selectedLead && (
          <aside className="xl:col-span-4 rounded-xl border border-slate-200 bg-white p-5 space-y-5 self-start">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className={`font-semibold ${STAGE_TEXT_COLORS[selectedLead.stage]}`}>
                    {selectedLead.stage}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedLead.source}</span>
                </div>
                <h2 className="mt-1 font-display text-lg font-semibold text-slate-900 truncate">
                  {selectedLead.fullName}
                </h2>
                <p className="text-xs text-slate-600">{selectedLead.organization}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => openEditModal(selectedLead)}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                  aria-label="Modifier le prospect"
                  title="Modifier"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLeadId(null)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                  aria-label="Fermer le panneau"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Key Info */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2.5 text-slate-700">
                <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="font-mono tabular-nums">{selectedLead.phone}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{selectedLead.email || '—'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{selectedLead.city}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700">
                <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>
                  Prochaine relance :{' '}
                  <strong className="font-mono tabular-nums">
                    {formatDateFr(selectedLead.nextFollowUpDate)}
                  </strong>
                </span>
              </div>
            </div>

            {/* Commercial Summary */}
            <div className="rounded-lg bg-slate-50 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Valeur estimée</span>
                <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                  {formatCurrency(selectedLead.expectedValue, selectedLead.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Formation visée</span>
                <span className="font-medium text-slate-800 text-right max-w-[180px] truncate">
                  {selectedLead.courseOfInterest}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Prochaine action</span>
                <span className="text-slate-700 text-right max-w-[180px]">
                  {selectedLead.nextAction}
                </span>
              </div>
              {selectedLead.stage === 'Perdu' && selectedLead.lossReason && (
                <div className="border-t border-slate-200 pt-2 text-red-700">
                  Motif de perte : {selectedLead.lossReason}
                </div>
              )}
            </div>

            {/* Quick Stage Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Changer l’étape du cycle de vente
              </label>
              <select
                value={selectedLead.stage}
                onChange={(e) => attemptStageChange(selectedLead, e.target.value as LeadStage)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:border-teal-600 focus:outline-none"
              >
                {LEAD_STAGES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes & Timeline */}
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-xs font-semibold text-slate-900 mb-3">
                Notes & historique ({selectedLead.notes.length})
              </h3>

              <form onSubmit={handleNoteSubmit} className="space-y-2 mb-4">
                <textarea
                  rows={2}
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Ajouter un compte-rendu d'appel ou une note interne..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!noteInput.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-40"
                >
                  <MessageSquarePlus className="h-3.5 w-3.5" />
                  <span>Enregistrer la note</span>
                </button>
              </form>

              {selectedLead.notes.length === 0 ? (
                <p className="text-xs text-slate-400">Aucune note enregistrée pour ce dossier.</p>
              ) : (
                <ul className="space-y-2.5 max-h-56 overflow-y-auto">
                  {selectedLead.notes.map((note) => (
                    <li key={note.id} className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span className="font-medium text-slate-700">{note.author}</span>
                        <span className="font-mono">{formatRelativeTimestamp(note.createdAt)}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{note.content}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Create / Edit Lead Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="font-display text-lg font-semibold text-slate-900">
                {editingLead ? 'Modifier le prospect' : 'Nouveau prospect (Démo)'}
              </h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nom complet *</label>
                <input
                  type="text"
                  value={formValues.fullName ?? ''}
                  onChange={(e) => setFormValues({ ...formValues, fullName: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                />
                {formErrors.fullName && <p className="mt-1 text-xs text-red-600">{formErrors.fullName}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Organisation / Entreprise</label>
                <input
                  type="text"
                  value={formValues.organization ?? ''}
                  onChange={(e) => setFormValues({ ...formValues, organization: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Téléphone (+243) *</label>
                <input
                  type="text"
                  value={formValues.phone ?? ''}
                  onChange={(e) => setFormValues({ ...formValues, phone: e.target.value })}
                  placeholder="+243 81 234 56 78"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:border-teal-600 focus:outline-none"
                />
                {formErrors.phone && <p className="mt-1 text-xs text-red-600">{formErrors.phone}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formValues.email ?? ''}
                  onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                />
                {formErrors.email && <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Ville</label>
                <input
                  type="text"
                  value={formValues.city ?? ''}
                  onChange={(e) => setFormValues({ ...formValues, city: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Source</label>
                <select
                  value={formValues.source ?? 'Site web'}
                  onChange={(e) => setFormValues({ ...formValues, source: e.target.value as LeadSource })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                >
                  {LEAD_SOURCES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Formation / Offre d’intérêt *</label>
                <input
                  type="text"
                  list="offers-datalist"
                  value={formValues.courseOfInterest ?? ''}
                  onChange={(e) => setFormValues({ ...formValues, courseOfInterest: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                />
                <datalist id="offers-datalist">
                  {state.offers.map((o) => (
                    <option key={o.id} value={o.name} />
                  ))}
                </datalist>
                {formErrors.courseOfInterest && <p className="mt-1 text-xs text-red-600">{formErrors.courseOfInterest}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Valeur estimée</label>
                <input
                  type="number"
                  min={0}
                  value={formValues.expectedValue ?? 0}
                  onChange={(e) => setFormValues({ ...formValues, expectedValue: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:border-teal-600 focus:outline-none"
                />
                {formErrors.expectedValue && <p className="mt-1 text-xs text-red-600">{formErrors.expectedValue}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Devise</label>
                <select
                  value={formValues.currency ?? 'CDF'}
                  onChange={(e) => setFormValues({ ...formValues, currency: e.target.value as Currency })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                >
                  <option value="CDF">CDF (Franc Congolais)</option>
                  <option value="USD">USD (Dollar US)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Étape</label>
                <select
                  value={formValues.stage ?? 'Nouveau'}
                  onChange={(e) => setFormValues({ ...formValues, stage: e.target.value as LeadStage })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                >
                  {LEAD_STAGES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
                {formErrors.stage && <p className="mt-1 text-xs text-red-600">{formErrors.stage}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Responsable</label>
                <select
                  value={formValues.assignedOwner ?? owners[0]}
                  onChange={(e) => setFormValues({ ...formValues, assignedOwner: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                >
                  {owners.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              {formValues.stage === 'Perdu' && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-red-700 mb-1">
                    Motif de perte obligatoire *
                  </label>
                  <input
                    type="text"
                    value={formValues.lossReason ?? ''}
                    onChange={(e) => setFormValues({ ...formValues, lossReason: e.target.value })}
                    placeholder="Ex. Budget reporté, concurrent retenu, délai incompatible..."
                    className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                  />
                  {formErrors.lossReason && <p className="mt-1 text-xs text-red-600">{formErrors.lossReason}</p>}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Prochaine action</label>
                <input
                  type="text"
                  value={formValues.nextAction ?? ''}
                  onChange={(e) => setFormValues({ ...formValues, nextAction: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Date de prochaine relance</label>
                <input
                  type="date"
                  value={formValues.nextFollowUpDate ?? ''}
                  onChange={(e) => setFormValues({ ...formValues, nextFollowUpDate: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 mt-2 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
                >
                  {editingLead ? 'Enregistrer les modifications' : 'Créer le prospect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mandatory Loss Reason Modal */}
      {pendingLossTransition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Motif de perte requis
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Pour passer <strong>{pendingLossTransition.leadName}</strong> au statut « Perdu », veuillez préciser la raison.
            </p>
            <form onSubmit={confirmLossTransition} className="mt-4 space-y-4">
              <textarea
                rows={3}
                value={lossReasonInput}
                onChange={(e) => setLossReasonInput(e.target.value)}
                placeholder="Ex. Contrainte budgétaire, report au prochain trimestre..."
                className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-teal-600 focus:outline-none"
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPendingLossTransition(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Confirmer « Perdu »
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
