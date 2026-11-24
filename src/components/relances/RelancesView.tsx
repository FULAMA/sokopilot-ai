import React, { useMemo, useState } from 'react';
import { Check, Copy, ShieldAlert, Clock, CheckCircle2 } from 'lucide-react';
import { DemoRepositoryState, FollowUpChannel, FollowUpTask } from '../../types/domain';
import { formatDateFr, getLocalIsoDate } from '../../utils/format';

interface RelancesViewProps {
  state: DemoRepositoryState;
  onToggleComplete: (taskId: string) => void;
  onUpdateTask: (task: FollowUpTask) => void;
}

type FollowUpFilter = 'all' | 'overdue' | 'today' | 'upcoming' | 'completed';

export const RelancesView: React.FC<RelancesViewProps> = ({
  state,
  onToggleComplete,
  onUpdateTask,
}) => {
  const [filter, setFilter] = useState<FollowUpFilter>('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    state.followUps[0]?.id ?? null
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const today = getLocalIsoDate(0);

  const counts = useMemo(() => {
    return {
      all: state.followUps.filter((t) => !t.completed).length,
      overdue: state.followUps.filter((t) => !t.completed && t.dueDate < today).length,
      today: state.followUps.filter((t) => !t.completed && t.dueDate === today).length,
      upcoming: state.followUps.filter((t) => !t.completed && t.dueDate > today).length,
      completed: state.followUps.filter((t) => t.completed).length,
    };
  }, [state.followUps, today]);

  const visibleTasks = useMemo(() => {
    return state.followUps
      .filter((t) => {
        if (filter === 'completed') return t.completed;
        if (t.completed) return false;
        if (filter === 'overdue') return t.dueDate < today;
        if (filter === 'today') return t.dueDate === today;
        if (filter === 'upcoming') return t.dueDate > today;
        return true;
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [state.followUps, filter, today]);

  const selectedTask =
    state.followUps.find((t) => t.id === selectedTaskId) ?? visibleTasks[0] ?? null;

  const handleCopyDraft = (task: FollowUpTask) => {
    navigator.clipboard?.writeText(task.messageDraft).catch(() => {});
    setCopiedId(task.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const getDueLabel = (task: FollowUpTask) => {
    if (task.completed) return { label: 'Terminée', cls: 'text-emerald-700' };
    if (task.dueDate < today) return { label: 'En retard', cls: 'text-red-700' };
    if (task.dueDate === today) return { label: 'Aujourd’hui', cls: 'text-amber-700' };
    return { label: 'À venir', cls: 'text-slate-600' };
  };

  const filterButtons: Array<{ id: FollowUpFilter; label: string; count: number }> = [
    { id: 'all', label: 'À traiter', count: counts.all },
    { id: 'overdue', label: 'En retard', count: counts.overdue },
    { id: 'today', label: 'Aujourd’hui', count: counts.today },
    { id: 'upcoming', label: 'À venir', count: counts.upcoming },
    { id: 'completed', label: 'Terminées', count: counts.completed },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
          File des Relances
        </h1>
        <p className="mt-0.5 text-sm text-slate-600">
          Préparez et suivez vos messages de relance en français · Aucun envoi automatique
        </p>
      </div>

      {/* Explicit safety notice */}
      <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-700">
        <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
        <span>
          <strong>Contrôle humain obligatoire :</strong> les brouillons ci-dessous ne sont jamais envoyés automatiquement par SOKOPILOT AI. Copiez le texte ou validez manuellement votre appel/message.
        </span>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 w-fit">
        {filterButtons.map((btn) => (
          <button
            key={btn.id}
            type="button"
            onClick={() => setFilter(btn.id)}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              filter === btn.id
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span>{btn.label}</span>
            <span className="font-mono text-[11px] tabular-nums opacity-80">{btn.count}</span>
          </button>
        ))}
      </div>

      {/* Two-column queue & draft editor */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Queue list */}
        <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white overflow-hidden">
          {visibleTasks.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              Aucune relance dans cette vue.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {visibleTasks.map((task) => {
                const due = getDueLabel(task);
                const isSelected = selectedTask?.id === task.id;
                return (
                  <li
                    key={task.id}
                    className={`flex items-start gap-3 p-4 transition-colors ${
                      isSelected ? 'bg-teal-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onToggleComplete(task.id)}
                      aria-label={task.completed ? 'Marquer comme non terminée' : 'Marquer comme terminée'}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                        task.completed
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300 bg-white hover:border-teal-600'
                      }`}
                    >
                      {task.completed && <Check className="h-3.5 w-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedTaskId(task.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-sm font-semibold truncate ${
                            task.completed ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {task.leadName}
                        </span>
                        <span className={`font-mono text-[11px] font-medium shrink-0 ${due.cls}`}>
                          {due.label} · {formatDateFr(task.dueDate)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-700 truncate">{task.subject}</p>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                        <span>{task.channel}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{task.leadPhone}</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Draft editor */}
        <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 self-start">
          {!selectedTask ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Sélectionnez une relance pour afficher ou modifier le brouillon.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="font-display text-base font-semibold text-slate-900">
                    {selectedTask.leadName}
                  </h2>
                  <p className="mt-0.5 font-mono text-xs text-slate-500">
                    {selectedTask.leadPhone}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleComplete(selectedTask.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    selectedTask.completed
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'bg-teal-700 text-white hover:bg-teal-800'
                  }`}
                >
                  {selectedTask.completed ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Clôturée</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-3.5 w-3.5" />
                      <span>Marquer effectuée</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Canal prévu
                  </label>
                  <select
                    value={selectedTask.channel}
                    onChange={(e) =>
                      onUpdateTask({
                        ...selectedTask,
                        channel: e.target.value as FollowUpChannel,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Appel">Appel</option>
                    <option value="Email">Email</option>
                    <option value="SMS">SMS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Date d’échéance
                  </label>
                  <input
                    type="date"
                    value={selectedTask.dueDate}
                    onChange={(e) =>
                      onUpdateTask({ ...selectedTask, dueDate: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Objet de la relance
                </label>
                <input
                  type="text"
                  value={selectedTask.subject}
                  onChange={(e) =>
                    onUpdateTask({ ...selectedTask, subject: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-700">
                    Brouillon de message (modifiable)
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCopyDraft(selectedTask)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>{copiedId === selectedTask.id ? 'Copié !' : 'Copier le texte'}</span>
                  </button>
                </div>
                <textarea
                  rows={5}
                  value={selectedTask.messageDraft}
                  onChange={(e) =>
                    onUpdateTask({ ...selectedTask, messageDraft: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
