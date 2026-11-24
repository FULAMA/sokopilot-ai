import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Info,
  RotateCcw,
  TrendingUp,
  Users,
  CheckCircle2,
  Wallet,
  Percent,
} from 'lucide-react';
import { DemoRepositoryState, LeadSource, LeadStage, NavSection } from '../../types/domain';
import { formatCurrency, formatRelativeTimestamp, toCdfEquivalent } from '../../utils/format';

interface DashboardViewProps {
  state: DemoRepositoryState;
  onNavigate: (section: NavSection, itemId?: string, stageFilter?: LeadStage) => void;
  onRequestResetDemo: () => void;
}

const STAGE_ORDER: LeadStage[] = [
  'Nouveau',
  'Contacté',
  'Qualifié',
  'Proposition envoyée',
  'Gagné',
  'Perdu',
];

const STAGE_BAR_COLORS: Record<LeadStage, string> = {
  Nouveau: '#475569',
  Contacté: '#4F46E5',
  Qualifié: '#0D9488',
  'Proposition envoyée': '#0284C7',
  Gagné: '#16A34A',
  Perdu: '#94A3B8',
};

const SOURCE_COLORS: Record<LeadSource, string> = {
  'Site web': '#0D9488',
  Référencement: '#4338CA',
  'Réseaux sociaux': '#0284C7',
  Suggestion: '#0F172A',
  Autre: '#94A3B8',
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  onNavigate,
  onRequestResetDemo,
}) => {
  const [hoveredStage, setHoveredStage] = useState<LeadStage | null>(null);
  const [hoveredSource, setHoveredSource] = useState<LeadSource | null>(null);

  // Compute live deltas relative to the initial 12 seeded leads so that
  // on initial load the Dashboard displays the exact requested figures:
  // 42, 18, 485 000 000 CDF, 23.5%, and 12/8/5/3/4/2 stage counts.
  const metrics = useMemo(() => {
    const initialLeadCount = 12;
    const initialStageSeedCounts: Record<LeadStage, number> = {
      Nouveau: 2,
      Contacté: 3,
      Qualifié: 2,
      'Proposition envoyée': 2,
      Gagné: 2,
      Perdu: 1,
    };

    const currentStageCounts: Record<LeadStage, number> = {
      Nouveau: 0,
      Contacté: 0,
      Qualifié: 0,
      'Proposition envoyée': 0,
      Gagné: 0,
      Perdu: 0,
    };

    let currentLeadsTotalCdf = 0;
    state.leads.forEach((lead) => {
      currentStageCounts[lead.stage] += 1;
      if (lead.stage !== 'Perdu') {
        currentLeadsTotalCdf += toCdfEquivalent(
          lead.expectedValue,
          lead.currency,
          state.settings.usdToCdfRate
        );
      }
    });

    // Initial seeded non-lost value in CDF at default 2850 rate
    const initialSeedNonLostCdf = 146020000;
    const deltaCdf = currentLeadsTotalCdf - initialSeedNonLostCdf;

    const stageDistribution = STAGE_ORDER.map((stage) => {
      const delta = currentStageCounts[stage] - initialStageSeedCounts[stage];
      return {
        stage,
        count: Math.max(0, state.baseline.stageCounts[stage] + delta),
      };
    });

    const newLeadsDelta = state.leads.length - initialLeadCount;
    const qualifiedDelta =
      currentStageCounts['Qualifié'] +
      currentStageCounts['Proposition envoyée'] -
      (initialStageSeedCounts['Qualifié'] + initialStageSeedCounts['Proposition envoyée']);
    const wonDelta = currentStageCounts['Gagné'] - initialStageSeedCounts['Gagné'];

    const newLeadsCount = Math.max(0, state.baseline.newLeadsCount + newLeadsDelta);
    const qualifiedCount = Math.max(0, state.baseline.qualifiedOpportunitiesCount + qualifiedDelta);
    const pipelineCdf = Math.max(0, state.baseline.pipelineValueCdf + deltaCdf);
    const conversionRate = Math.max(
      0,
      Math.min(100, Number((state.baseline.conversionRatePct + wonDelta * 0.8).toFixed(1)))
    );

    return {
      newLeadsCount,
      qualifiedCount,
      pipelineCdf,
      conversionRate,
      stageDistribution,
    };
  }, [state.leads, state.baseline, state.settings.usdToCdfRate]);

  const maxStageCount = Math.max(...metrics.stageDistribution.map((s) => s.count), 1);
  const totalPipelineLeads = metrics.stageDistribution.reduce((acc, s) => acc + s.count, 0);

  // Pie chart geometry calculations
  const pieSlices = useMemo(() => {
    const radius = 74;
    const innerRadius = 46;
    const cx = 100;
    const cy = 100;
    let cumulativeAngle = -Math.PI / 2;

    return state.baseline.sourcePercentages.map((item) => {
      const sliceAngle = (item.percentage / 100) * Math.PI * 2;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + sliceAngle;
      cumulativeAngle = endAngle;

      const x1 = cx + radius * Math.cos(startAngle);
      const y1 = cy + radius * Math.sin(startAngle);
      const x2 = cx + radius * Math.cos(endAngle);
      const y2 = cy + radius * Math.sin(endAngle);

      const ix1 = cx + innerRadius * Math.cos(endAngle);
      const iy1 = cy + innerRadius * Math.sin(endAngle);
      const ix2 = cx + innerRadius * Math.cos(startAngle);
      const iy2 = cy + innerRadius * Math.sin(startAngle);

      const largeArc = sliceAngle > Math.PI ? 1 : 0;

      const pathData = [
        `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
        `L ${ix1.toFixed(2)} ${iy1.toFixed(2)}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2.toFixed(2)} ${iy2.toFixed(2)}`,
        'Z',
      ].join(' ');

      return {
        ...item,
        color: SOURCE_COLORS[item.source],
        pathData,
      };
    });
  }, [state.baseline.sourcePercentages]);

  const recentFiveActivities = state.activities.slice(0, 5);

  const kpiCards = [
    {
      id: 'new-leads',
      label: 'Nouveaux Prospects',
      value: metrics.newLeadsCount.toString(),
      context: 'Portefeuille mensuel consolidé',
      icon: Users,
      accentText: 'text-slate-900',
      onClick: () => onNavigate('prospects'),
    },
    {
      id: 'qualified',
      label: 'Opportunités Qualifiées',
      value: metrics.qualifiedCount.toString(),
      context: 'Qualifié & Proposition envoyée',
      icon: CheckCircle2,
      accentText: 'text-teal-700',
      onClick: () => onNavigate('prospects', undefined, 'Qualifié'),
    },
    {
      id: 'pipeline-value',
      label: 'Valeur du Pipeline',
      value: formatCurrency(metrics.pipelineCdf, 'CDF'),
      context: `≈ ${formatCurrency(metrics.pipelineCdf / state.settings.usdToCdfRate, 'USD')}`,
      icon: Wallet,
      accentText: 'text-slate-900',
      onClick: () => onNavigate('prospects'),
    },
    {
      id: 'conversion-rate',
      label: 'Taux de Conversion',
      value: `${metrics.conversionRate}%`,
      context: 'Prospects convertis en inscriptions',
      icon: Percent,
      accentText: 'text-indigo-700',
      onClick: () => onNavigate('prospects', undefined, 'Gagné'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header & demo transparency banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
            Tableau de bord Revenus
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Vue consolidée du pipeline commercial · {state.settings.workspaceName}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('prospects')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 whitespace-nowrap shrink-0"
          >
            <span>Voir le CRM Prospects</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRequestResetDemo}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            <span>Réinitialiser démo</span>
          </button>
        </div>
      </div>

      {/* Explicit Demo Notice */}
      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start sm:items-center gap-2.5 text-xs text-slate-600">
          <Info className="mt-0.5 sm:mt-0 h-4 w-4 shrink-0 text-teal-700" />
          <span>
            <strong className="font-semibold text-slate-900">Environnement de démonstration fictif :</strong>{' '}
            toutes les données affichées sont simulées localement dans votre navigateur (aucune connexion externe).
          </span>
        </div>
        <span className="font-mono text-[11px] font-medium text-slate-500 shrink-0">
          {state.leads.length} fiches actives · {state.followUps.filter((f) => !f.completed).length} relances ouvertes
        </span>
      </div>

      {/* 1. 4 KPI Cards */}
      <section aria-label="Indicateurs clés de performance" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <button
              key={kpi.id}
              type="button"
              onClick={kpi.onClick}
              className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 text-left transition-colors hover:border-teal-600/50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-500">{kpi.label}</span>
                <div className="flex items-center gap-2">
                  <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-slate-600">
                    DEMO
                  </span>
                  <Icon className="h-4 w-4 text-slate-400 transition-colors group-hover:text-teal-700" />
                </div>
              </div>

              <div className={`mt-3 font-display text-2xl font-semibold tracking-tight tabular-nums ${kpi.accentText}`}>
                {kpi.value}
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span className="truncate">{kpi.context}</span>
                <TrendingUp className="h-3.5 w-3.5 shrink-0 text-teal-600 opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </button>
          );
        })}
      </section>

      {/* 2 & 3. Pipeline Distribution Chart + Source Breakdown Pie Chart */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Pipeline Distribution Chart */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Répartition du pipeline par étape
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Volume d’opportunités suivies · Cliquez sur une étape pour ouvrir les fiches
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600">
                DEMO
              </span>
              <span className="font-mono text-xs font-medium text-slate-700 tabular-nums">
                Total : {totalPipelineLeads}
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-3.5">
            {metrics.stageDistribution.map((item) => {
              const widthPct = Math.round((item.count / maxStageCount) * 100);
              const sharePct =
                totalPipelineLeads > 0
                  ? ((item.count / totalPipelineLeads) * 100).toFixed(1)
                  : '0.0';
              const isHovered = hoveredStage === item.stage;

              return (
                <button
                  key={item.stage}
                  type="button"
                  onMouseEnter={() => setHoveredStage(item.stage)}
                  onMouseLeave={() => setHoveredStage(null)}
                  onClick={() => onNavigate('prospects', undefined, item.stage)}
                  className="block w-full rounded-lg p-1.5 -mx-1.5 text-left transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-slate-800">{item.stage}</span>
                    <span className="font-mono tabular-nums text-slate-600">
                      <strong className="font-semibold text-slate-900">{item.count}</strong>
                      <span className="ml-2 text-slate-400">({sharePct}%)</span>
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-md bg-slate-100">
                    <div
                      className="h-full rounded-md transition-all duration-200"
                      style={{
                        width: `${Math.max(widthPct, item.count > 0 ? 4 : 0)}%`,
                        backgroundColor: STAGE_BAR_COLORS[item.stage],
                        opacity: hoveredStage && !isHovered ? 0.55 : 1,
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Numeric Summary Strip */}
          <div className="mt-6 grid grid-cols-3 sm:grid-cols-6 gap-2 border-t border-slate-100 pt-4">
            {metrics.stageDistribution.map((item) => (
              <div key={`summary-${item.stage}`} className="text-center">
                <div className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                  {item.count}
                </div>
                <div className="truncate text-[11px] text-slate-500" title={item.stage}>
                  {item.stage}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Source Breakdown Pie Chart */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Origine des prospects
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Répartition par canal d’acquisition
              </p>
            </div>
            <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600">
              DEMO
            </span>
          </div>

          <div className="my-5 flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center justify-center gap-6">
            {/* SVG Pie/Donut Chart */}
            <div className="relative h-48 w-48 shrink-0">
              <svg
                viewBox="0 0 200 200"
                className="h-full w-full"
                role="img"
                aria-label="Graphique circulaire de répartition des sources de prospects"
              >
                {pieSlices.map((slice) => {
                  const isActive = hoveredSource === slice.source;
                  return (
                    <path
                      key={slice.source}
                      d={slice.pathData}
                      fill={slice.color}
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="cursor-pointer transition-opacity duration-150"
                      style={{
                        opacity: hoveredSource && !isActive ? 0.45 : 1,
                        transform: isActive ? 'scale(1.03)' : 'scale(1)',
                        transformOrigin: '100px 100px',
                      }}
                      onMouseEnter={() => setHoveredSource(slice.source)}
                      onMouseLeave={() => setHoveredSource(null)}
                    >
                      <title>{`${slice.source} : ${slice.percentage}%`}</title>
                    </path>
                  );
                })}
              </svg>

              {/* Center label inside donut */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-mono text-lg font-semibold text-slate-900 tabular-nums">
                  {hoveredSource
                    ? `${pieSlices.find((s) => s.source === hoveredSource)?.percentage ?? 0}%`
                    : '100%'}
                </span>
                <span className="max-w-[82px] truncate text-[11px] font-medium text-slate-500">
                  {hoveredSource ?? 'Sources'}
                </span>
              </div>
            </div>

            {/* Structured Legend */}
            <ul className="w-full flex-1 space-y-2">
              {pieSlices.map((slice) => {
                const isActive = hoveredSource === slice.source;
                return (
                  <li
                    key={`legend-${slice.source}`}
                    onMouseEnter={() => setHoveredSource(slice.source)}
                    onMouseLeave={() => setHoveredSource(null)}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-default ${
                      isActive ? 'bg-slate-100' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-sm"
                        style={{ backgroundColor: slice.color }}
                        aria-hidden="true"
                      />
                      <span className="truncate font-medium text-slate-700">{slice.source}</span>
                    </div>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums ml-3">
                      {slice.percentage}%
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="border-t border-slate-100 pt-3 text-xs text-slate-500 flex items-center justify-between">
            <span>Canal principal : Site web (35%)</span>
            <button
              type="button"
              onClick={() => onNavigate('campagnes')}
              className="font-medium text-teal-700 hover:text-teal-800 hover:underline"
            >
              Voir les campagnes
            </button>
          </div>
        </div>
      </section>

      {/* 4. Recent Activity Feed (last 5 activities) */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Activités récentes
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              5 dernières actions enregistrées dans l’espace de travail
            </p>
          </div>
          <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600">
            DEMO
          </span>
        </div>

        {recentFiveActivities.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            Aucune activité récente enregistrée.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentFiveActivities.map((act) => (
              <li key={act.id}>
                <button
                  type="button"
                  onClick={() => onNavigate(act.targetSection, act.targetId)}
                  className="flex w-full flex-col gap-1 px-5 py-3.5 text-left transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="text-sm text-slate-700 min-w-0">
                    <span className="font-semibold text-slate-900">{act.actor}</span>{' '}
                    <span>{act.description}</span>{' '}
                    <span className="font-medium text-teal-800">{act.targetLabel}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-xs text-slate-500">
                    <span className="font-mono tabular-nums">
                      {formatRelativeTimestamp(act.timestamp)}
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
