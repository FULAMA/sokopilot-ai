import React, { useState } from 'react';
import { Download, RotateCcw, Save } from 'lucide-react';
import {
  Currency,
  DemoRepositoryState,
  OrganizationSettings,
  TeamRole,
} from '../../types/domain';
import { exportRepositoryAsJson } from '../../services/storage';

interface ParametresViewProps {
  state: DemoRepositoryState;
  onSaveSettings: (settings: OrganizationSettings, memberId?: string, newRole?: TeamRole) => void;
  onRequestResetDemo: () => void;
}

export const ParametresView: React.FC<ParametresViewProps> = ({
  state,
  onSaveSettings,
  onRequestResetDemo,
}) => {
  const [form, setForm] = useState<OrganizationSettings>({ ...state.settings });

  const handleSaveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(form);
  };

  const handleExportJson = () => {
    const json = exportRepositoryAsJson(state);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sokopilot-demo-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
          Paramètres de l’Espace
        </h1>
        <p className="mt-0.5 text-sm text-slate-600">
          Profil de l’organisation, rôles d’équipe, devises et gestion des données de démonstration
        </p>
      </div>

      {/* Organization Profile & Currency */}
      <form onSubmit={handleSaveOrg} className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Profil de l’organisation & Devise
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Ces informations restent stockées localement dans votre navigateur.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nom de l’espace de travail
            </label>
            <input
              type="text"
              value={form.workspaceName}
              onChange={(e) => setForm({ ...form, workspaceName: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Raison sociale (Démo)
            </label>
            <input
              type="text"
              value={form.legalName}
              onChange={(e) => setForm({ ...form, legalName: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Ville</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Téléphone (+243)</label>
            <input
              type="text"
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:border-teal-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Devise d’affichage par défaut
            </label>
            <select
              value={form.defaultCurrency}
              onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value as Currency })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
            >
              <option value="CDF">CDF — Franc Congolais</option>
              <option value="USD">USD — Dollar Américain</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Taux indicatif (1 USD en CDF)
            </label>
            <input
              type="number"
              min={1}
              value={form.usdToCdfRate}
              onChange={(e) => setForm({ ...form, usdToCdfRate: Number(e.target.value) || 2850 })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:border-teal-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="text-xs text-slate-500">
            Les erreurs de sauvegarde sont signalées dans l’espace de travail.
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
          >
            <Save className="h-4 w-4" />
            <span>Enregistrer</span>
          </button>
        </div>
      </form>

      {/* Team Roles */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Équipe & Rôles (Démo)
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Gestion des accès simulés : Owner, Manager, Sales
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th className="px-6 py-3">Membre</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Ville</th>
                <th className="px-6 py-3">Rôle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.team.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-3 font-medium text-slate-900">{member.name}</td>
                  <td className="px-6 py-3 text-xs text-slate-600">{member.email}</td>
                  <td className="px-6 py-3 text-xs text-slate-600">{member.city}</td>
                  <td className="px-6 py-3">
                    <select
                      value={member.role}
                      onChange={(e) =>
                        onSaveSettings(form, member.id, e.target.value as TeamRole)
                      }
                      aria-label={`Rôle de ${member.name}`}
                      className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 focus:border-teal-600 focus:outline-none"
                    >
                      <option value="Owner">Owner</option>
                      <option value="Manager">Manager</option>
                      <option value="Sales">Sales</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Export & Reset */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900">
            Données locales & Réinitialisation
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Exportez votre jeu de données au format JSON ou restaurez les valeurs initiales de démonstration.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            <span>Exporter JSON</span>
          </button>
          <button
            type="button"
            onClick={onRequestResetDemo}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 whitespace-nowrap"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Réinitialiser démo</span>
          </button>
        </div>
      </section>
    </div>
  );
};
