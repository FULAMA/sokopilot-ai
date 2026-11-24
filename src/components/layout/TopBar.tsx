import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  Bell,
  ChevronDown,
  Menu,
  RotateCcw,
  Search,
  Building2,
  UserCheck,
  X,
} from 'lucide-react';
import { DemoRepositoryState, NavSection } from '../../types/domain';
import { formatDateFr, getLocalIsoDate } from '../../utils/format';

interface TopBarProps {
  state: DemoRepositoryState;
  activeSection: NavSection;
  onNavigate: (section: NavSection, itemId?: string) => void;
  onOpenMobileMenu: () => void;
  onRequestResetDemo: () => void;
}

const SECTION_TITLES: Record<NavSection, string> = {
  dashboard: 'Dashboard',
  prospects: 'Prospects & Pipeline',
  offres: 'Catalogue des Offres',
  relances: 'Relances Commerciales',
  campagnes: 'Campagnes & Contenus',
  assistant: 'Assistant IA (Simulation)',
  automatisations: 'Automatisations',
  integrations: 'Intégrations',
  parametres: 'Paramètres',
};

export const TopBar: React.FC<TopBarProps> = ({
  state,
  activeSection,
  onNavigate,
  onOpenMobileMenu,
  onRequestResetDemo,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) setSearchFocused(false);
      if (notifRef.current && !notifRef.current.contains(target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(target)) setProfileOpen(false);
      if (workspaceRef.current && !workspaceRef.current.contains(target)) setWorkspaceOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results: Array<{
      id: string;
      title: string;
      subtitle: string;
      section: NavSection;
    }> = [];

    state.leads.forEach((lead) => {
      if (
        lead.fullName.toLowerCase().includes(q) ||
        lead.organization.toLowerCase().includes(q) ||
        lead.courseOfInterest.toLowerCase().includes(q) ||
        lead.phone.toLowerCase().includes(q)
      ) {
        results.push({
          id: lead.id,
          title: lead.fullName,
          subtitle: `Prospect · ${lead.stage} · ${lead.city}`,
          section: 'prospects',
        });
      }
    });

    state.offers.forEach((offer) => {
      if (
        offer.name.toLowerCase().includes(q) ||
        offer.category.toLowerCase().includes(q)
      ) {
        results.push({
          id: offer.id,
          title: offer.name,
          subtitle: `Offre · ${offer.category}`,
          section: 'offres',
        });
      }
    });

    state.campaigns.forEach((camp) => {
      if (camp.title.toLowerCase().includes(q)) {
        results.push({
          id: camp.id,
          title: camp.title,
          subtitle: `Campagne · ${camp.status}`,
          section: 'campagnes',
        });
      }
    });

    return results.slice(0, 7);
  }, [searchQuery, state.leads, state.offers, state.campaigns]);

  const notifications = useMemo(() => {
    const today = getLocalIsoDate(0);
    const items: Array<{
      id: string;
      title: string;
      detail: string;
      section: NavSection;
      targetId?: string;
    }> = [];

    state.followUps
      .filter((t) => !t.completed && t.dueDate <= today)
      .slice(0, 4)
      .forEach((t) => {
        items.push({
          id: t.id,
          title: t.dueDate < today ? `Relance en retard : ${t.leadName}` : `Relance du jour : ${t.leadName}`,
          detail: `${t.channel} · Échéance ${formatDateFr(t.dueDate)}`,
          section: 'relances',
          targetId: t.id,
        });
      });

    state.campaigns
      .filter((c) => c.status === 'À valider')
      .forEach((c) => {
        items.push({
          id: c.id,
          title: `Campagne à valider : ${c.title}`,
          detail: `Prévue le ${formatDateFr(c.scheduledDate)}`,
          section: 'campagnes',
          targetId: c.id,
        });
      });

    return items;
  }, [state.followUps, state.campaigns]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 lg:px-6">
      {/* Left: Mobile trigger + Workspace Switcher + Page Context */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="flex lg:hidden h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          aria-label="Ouvrir le menu de navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative" ref={workspaceRef}>
          <button
            type="button"
            onClick={() => setWorkspaceOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-left transition-colors hover:bg-slate-100 whitespace-nowrap"
          >
            <Building2 className="h-4 w-4 shrink-0 text-teal-700" />
            <span className="max-w-[170px] sm:max-w-[260px] truncate text-sm font-medium text-slate-800">
              {state.settings.workspaceName}
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          </button>

          {workspaceOpen && (
            <div className="absolute left-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-lg z-40">
              <div className="px-2.5 py-1.5 text-xs font-medium text-slate-400">
                Espace actif (environnement démo)
              </div>
              <button
                type="button"
                onClick={() => setWorkspaceOpen(false)}
                className="flex w-full items-center justify-between rounded-lg bg-teal-50/70 px-2.5 py-2 text-left text-sm font-medium text-teal-900"
              >
                <span className="truncate">{state.settings.workspaceName}</span>
                <span className="font-mono text-[11px] text-teal-700">Actif</span>
              </button>
              <div className="mt-1 border-t border-slate-100 px-2.5 py-2 text-xs text-slate-500">
                Devise d’affichage : <strong className="text-slate-700">{state.settings.defaultCurrency}</strong> · {state.settings.city}
              </div>
            </div>
          )}
        </div>

        <span className="hidden xl:inline text-slate-300" aria-hidden="true">
          /
        </span>
        <span className="hidden xl:inline text-sm font-medium text-slate-600 truncate">
          {SECTION_TITLES[activeSection]}
        </span>
      </div>

      {/* Center/Right: Global Search + Notifications + Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Global search */}
        <div className="relative hidden md:block w-64 lg:w-80" ref={searchRef}>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setSearchFocused(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchFocused(true);
            }}
            placeholder="Rechercher prospect, offre, +243..."
            aria-label="Recherche globale"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Effacer la recherche"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {searchFocused && searchQuery.trim().length > 0 && (
            <div className="absolute right-0 mt-2 w-96 rounded-xl border border-slate-200 bg-white p-2 shadow-lg z-40">
              {searchResults.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-slate-500">
                  Aucun résultat pour « {searchQuery} »
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {searchResults.map((res) => (
                    <li key={`${res.section}-${res.id}`}>
                      <button
                        type="button"
                        onClick={() => {
                          onNavigate(res.section, res.id);
                          setSearchFocused(false);
                          setSearchQuery('');
                        }}
                        className="flex w-full flex-col items-start rounded-lg px-3 py-2 text-left transition-colors hover:bg-slate-50"
                      >
                        <span className="text-sm font-medium text-slate-900">{res.title}</span>
                        <span className="text-xs text-slate-500">{res.subtitle}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {notifications.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-teal-700 px-1 font-mono text-[10px] font-semibold text-white tabular-nums">
                {notifications.length}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-lg z-40">
              <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                <span className="text-xs font-semibold text-slate-900">Rappels & validations</span>
                <span className="font-mono text-[11px] text-slate-400">DEMO</span>
              </div>
              {notifications.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-slate-500">
                  Aucune alerte en attente.
                </div>
              ) : (
                <ul className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onNavigate(n.section, n.targetId);
                          setNotifOpen(false);
                        }}
                        className="flex w-full flex-col items-start rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
                      >
                        <span className="text-xs font-medium text-slate-900">{n.title}</span>
                        <span className="mt-0.5 text-[11px] text-slate-500">{n.detail}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Demo user profile */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 transition-colors hover:bg-slate-50"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-950 font-display text-xs font-semibold text-white">
              CM
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-900 leading-tight">
                Chantal Mukendi
              </div>
              <div className="text-[11px] text-slate-500 leading-tight">
                Owner · Démo
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg z-40">
              <div className="border-b border-slate-100 px-3 py-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                  <UserCheck className="h-3.5 w-3.5 text-teal-700" />
                  <span>Profil démonstration</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  c.mukendi@horizon-demo.cd · Rôle Owner
                </p>
              </div>
              <div className="pt-1 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('parametres');
                    setProfileOpen(false);
                  }}
                  className="flex w-full items-center rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Paramètres & équipe
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onRequestResetDemo();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Réinitialiser les données démo</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
