import React from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Clock,
  Megaphone,
  Bot,
  Workflow,
  Plug,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import { NavSection } from '../../types/domain';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  pendingFollowUpsCount: number;
}

interface NavItemConfig {
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  pendingFollowUpsCount,
}) => {
  const navItems: NavItemConfig[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'prospects', label: 'Prospects', icon: Users },
    { id: 'offres', label: 'Offres', icon: Briefcase },
    {
      id: 'relances',
      label: 'Relances',
      icon: Clock,
      badge: pendingFollowUpsCount > 0 ? pendingFollowUpsCount : undefined,
    },
    { id: 'campagnes', label: 'Campagnes', icon: Megaphone },
    { id: 'assistant', label: 'Assistant IA', icon: Bot },
    { id: 'automatisations', label: 'Automatisations', icon: Workflow },
    { id: 'integrations', label: 'Intégrations', icon: Plug },
    { id: 'parametres', label: 'Paramètres', icon: Settings },
  ];

  const handleNavClick = (id: NavSection) => {
    onSelectSection(id);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0F172A] text-slate-200 border-r border-slate-800/80">
      {/* Brand header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-600 font-display text-sm font-bold text-white">
            SP
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate font-display text-sm font-semibold tracking-tight text-white">
                SOKOPILOT AI
              </div>
              <div className="truncate text-[11px] font-medium text-slate-400">
                Revenue Hub
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          aria-label={collapsed ? 'Déplier le menu' : 'Réduire le menu'}
          title={collapsed ? 'Déplier le menu' : 'Réduire le menu'}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>

        <button
          type="button"
          onClick={onCloseMobile}
          className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          aria-label="Fermer le menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Navigation principale">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              title={collapsed ? item.label : undefined}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              } ${collapsed ? 'justify-center px-2' : ''}`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate text-left">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="font-mono text-[11px] tabular-nums text-teal-300">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Subtle environment notice */}
      {!collapsed && (
        <div className="border-t border-slate-800/80 px-4 py-3">
          <p className="text-[11px] leading-relaxed text-slate-400">
            Mode démonstration local
            <span className="block text-slate-500">Données fictives · Stockage navigateur</span>
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop fixed/collapsible sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-[width] duration-200 ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 w-64 max-w-[80vw] h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
