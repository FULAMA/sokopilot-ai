import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, History } from 'lucide-react';
import { AutomationRule, DemoRepositoryState } from '../../types/domain';
import { formatRelativeTimestamp } from '../../utils/format';

interface AutomatisationsViewProps {
  state: DemoRepositoryState;
  onToggleRule: (ruleId: string) => void;
}

export const AutomatisationsView: React.FC<AutomatisationsViewProps> = ({
  state,
  onToggleRule,
}) => {
  const [confirmingRule, setConfirmingRule] = useState<AutomationRule | null>(null);

  const handleRequestToggle = (rule: AutomationRule) => {
    if (!rule.enabled) {
      setConfirmingRule(rule);
    } else {
      onToggleRule(rule.id);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
          Automatisations & Règles Sûres
        </h1>
        <p className="mt-0.5 text-sm text-slate-600">
          Modèles de règles désactivés par défaut · Préparation interne uniquement (aucun envoi externe)
        </p>
      </div>

      {/* Rules list */}
      <div className="space-y-4">
        {state.automations.map((rule) => (
          <div key={rule.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`font-mono font-semibold ${
                      rule.enabled ? 'text-teal-700' : 'text-slate-500'
                    }`}
                  >
                    {rule.enabled ? 'ACTIVÉE (SIMULATION)' : 'DÉSACTIVÉE PAR DÉFAUT'}
                  </span>
                </div>
                <h2 className="font-display text-base font-semibold text-slate-900">
                  {rule.name}
                </h2>
                <div className="text-xs text-slate-600 space-y-1">
                  <p>
                    <strong className="text-slate-800">Déclencheur :</strong> {rule.trigger}
                  </p>
                  <p>
                    <strong className="text-slate-800">Action interne :</strong> {rule.action}
                  </p>
                </div>

                <div className="pt-2">
                  <div className="text-xs font-medium text-slate-700 mb-1">
                    Prérequis d’activation :
                  </div>
                  <ul className="space-y-1 text-xs text-slate-600">
                    {rule.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="flex items-center gap-1.5 pt-1 text-xs text-amber-700">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{rule.safetyNotice}</span>
                </p>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => handleRequestToggle(rule)}
                  className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                    rule.enabled
                      ? 'border border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200'
                      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {rule.enabled ? 'Désactiver la règle' : 'Tester en simulation'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Audit Trail */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <History className="h-4 w-4 text-slate-500" />
          <h2 className="font-display text-base font-semibold text-slate-900">
            Journal d’audit des automatisations
          </h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {state.automationAudit.map((entry) => (
            <li key={entry.id} className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs">
                <span className="font-semibold text-slate-900">{entry.ruleName}</span>
                <span className="mx-1.5 text-slate-300">·</span>
                <span className="font-mono text-slate-600">{entry.status}</span>
                <p className="mt-0.5 text-slate-500">{entry.note}</p>
              </div>
              <span className="font-mono text-[11px] text-slate-400 shrink-0">
                {formatRelativeTimestamp(entry.timestamp)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Activation Requirements Confirmation Modal */}
      {confirmingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Confirmer l’activation en mode simulation
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Vous activez uniquement la trace locale pour « {confirmingRule.name} ». Aucun appel API, webhook ou message client ne sera envoyé.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmingRule(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  onToggleRule(confirmingRule.id);
                  setConfirmingRule(null);
                }}
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
              >
                Activer (Simulation)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
