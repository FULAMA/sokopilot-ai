import React, { useState } from 'react';
import { Lock, Plug } from 'lucide-react';
import { DemoRepositoryState, IntegrationProvider } from '../../types/domain';

interface IntegrationsViewProps {
  state: DemoRepositoryState;
}

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({ state }) => {
  const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
          Intégrations Candidates
        </h1>
        <p className="mt-0.5 text-sm text-slate-600">
          Catalogue des connecteurs compatibles · Aucune connexion OAuth ou clé API active en mode démo
        </p>
      </div>

      <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-700">
        <Lock className="h-4 w-4 shrink-0 text-slate-500" />
        <span>
          <strong>Isolation de sécurité :</strong> l’environnement de démonstration n’accepte aucune clé API ni jeton OAuth. Tous les fournisseurs restent au statut « Non connecté ».
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {state.integrations.map((provider) => (
          <article
            key={provider.id}
            className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5"
          >
            <div>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-slate-500">{provider.category}</span>
                <span className="font-mono font-medium text-slate-600">
                  {provider.status}
                </span>
              </div>
              <div className="mt-2.5 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Plug className="h-4 w-4" />
                </div>
                <h2 className="font-display text-base font-semibold text-slate-900">
                  {provider.name}
                </h2>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                {provider.description}
              </p>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <div className="text-[11px] text-slate-500 mb-3">
                Prérequis : {provider.requiredScope}
              </div>
              <button
                type="button"
                onClick={() => setSelectedProvider(provider)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
              >
                Voir les détails de connexion
              </button>
            </div>
          </article>
        ))}
      </div>

      {selectedProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="font-display text-base font-semibold text-slate-900">
              {selectedProvider.name} — Non connecté
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Dans cette version de démonstration autonome, la connexion à{' '}
              <strong>{selectedProvider.name}</strong> est volontairement désactivée afin de garantir l’absence de flux OAuth externes ou de stockage de secrets.
            </p>
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
              <span className="font-semibold">Portée requise en production :</span>{' '}
              {selectedProvider.requiredScope}
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedProvider(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
