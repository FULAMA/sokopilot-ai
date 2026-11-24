import React, { useState } from 'react';
import { Edit3, Plus, X, Clock } from 'lucide-react';
import { Currency, DemoRepositoryState, Offer } from '../../types/domain';
import { formatCurrency, getLocalIsoDate } from '../../utils/format';

interface OffresViewProps {
  state: DemoRepositoryState;
  onSaveOffer: (offer: Offer, isNew: boolean) => void;
}

export const OffresView: React.FC<OffresViewProps> = ({ state, onSaveOffer }) => {
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [form, setForm] = useState<Partial<Offer>>({});

  const filteredOffers = state.offers.filter((o) => {
    if (filterActive === 'active') return o.active;
    if (filterActive === 'inactive') return !o.active;
    return true;
  });

  const openCreate = () => {
    setEditingOffer(null);
    setForm({
      name: '',
      category: 'Finance & Conformité',
      description: '',
      price: 1500000,
      currency: state.settings.defaultCurrency,
      duration: '5 jours (35 heures)',
      active: true,
    });
    setModalOpen(true);
  };

  const openEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setForm({ ...offer });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) return;
    const saved: Offer = {
      id: editingOffer ? editingOffer.id : `offer-${Date.now()}`,
      name: form.name.trim(),
      category: (form.category ?? 'Formation').trim(),
      description: (form.description ?? '').trim(),
      price: Math.max(0, Number(form.price ?? 0)),
      currency: (form.currency ?? 'CDF') as Currency,
      duration: (form.duration ?? 'À définir').trim(),
      active: Boolean(form.active),
      updatedAt: getLocalIsoDate(0),
    };
    onSaveOffer(saved, !editingOffer);
    setModalOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
            Catalogue des Offres
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Formations et programmes professionnels · Tarifs en CDF et USD (Démo)
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Nouvelle offre</span>
        </button>
      </div>

      {/* Filter buttons */}
      <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 w-fit">
        {[
          { id: 'all', label: `Toutes (${state.offers.length})` },
          { id: 'active', label: `Actives (${state.offers.filter((o) => o.active).length})` },
          { id: 'inactive', label: `Inactives (${state.offers.filter((o) => !o.active).length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterActive(tab.id as 'all' | 'active' | 'inactive')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              filterActive === tab.id
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredOffers.map((offer) => (
          <article
            key={offer.id}
            className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5"
          >
            <div>
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                <span className="font-medium text-teal-800">{offer.category}</span>
                <span className={offer.active ? 'text-emerald-700 font-medium' : 'text-slate-400 font-medium'}>
                  {offer.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <h2 className="mt-2 font-display text-base font-semibold text-slate-900">
                {offer.name}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                {offer.description}
              </p>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-lg font-semibold text-slate-900 tabular-nums">
                  {formatCurrency(offer.price, offer.currency)}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  {offer.duration}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onSaveOffer({ ...offer, active: !offer.active, updatedAt: getLocalIsoDate(0) }, false)
                  }
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  {offer.active ? 'Désactiver' : 'Activer'}
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(offer)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Modifier</span>
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="font-display text-lg font-semibold text-slate-900">
                {editingOffer ? 'Modifier l’offre' : 'Nouvelle offre de formation'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Intitulé de l’offre *</label>
                <input
                  type="text"
                  required
                  value={form.name ?? ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Catégorie</label>
                  <input
                    type="text"
                    value={form.category ?? ''}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Durée</label>
                  <input
                    type="text"
                    value={form.duration ?? ''}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Tarif</label>
                  <input
                    type="number"
                    min={0}
                    value={form.price ?? 0}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Devise</label>
                  <select
                    value={form.currency ?? 'CDF'}
                    onChange={(e) => setForm({ ...form, currency: e.target.value as Currency })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                  >
                    <option value="CDF">CDF</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description ?? ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(form.active)}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                />
                <span>Offre active dans le catalogue commercial</span>
              </label>

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
