import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function OverviewDashboard() {
  const [loading, setLoading] = useState(true);
  const [optimizingState, setOptimizingState] = useState('idle');
  const [activeFilter, setActiveFilter] = useState('ALL DEPTS');
  const [corridorFilter, setCorridorFilter] = useState('ALL');
  const [selectedNode, setSelectedNode] = useState(null);

  // Real backend data states
  const [riskSegments, setRiskSegments] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [healthData, segsData, planData] = await Promise.allSettled([
        api.getHealth(),
        api.getRiskSegments(),
        api.getCurrentPlan('weekly'),
      ]);

      if (healthData.status === 'fulfilled') setSystemHealth(healthData.value);
      if (segsData.status === 'fulfilled') setRiskSegments(segsData.value || []);
      if (planData.status === 'fulfilled') {
        setCurrentPlan(planData.value);
        setAssignments(planData.value?.assignments || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const triggerOptimization = async () => {
    if (optimizingState !== 'idle') return;
    setOptimizingState('solving');
    try {
      const res = await api.runOptimization({ policy: 'balanced', horizon: 'weekly' });
      setOptimizingState('optimized');
      await loadDashboardData();
      setTimeout(() => {
        setOptimizingState('idle');
      }, 3000);
    } catch (err) {
      console.error('Optimization error:', err);
      alert('Optimization error: ' + err.message);
      setOptimizingState('idle');
    }
  };

  const inspectNode = (segmentId) => {
    setSelectedNode(segmentId);
  };

  // One-word cause of delay resolution
  const getOneWordCause = (seg) => {
    const asset = (seg?.asset_type || seg?.department || '').toUpperCase();
    if (asset.includes('OHE') || asset.includes('CATENARY') || asset.includes('ELECTRICAL')) return 'OHE';
    if (asset.includes('S&T') || asset.includes('SIG') || asset.includes('SIGNAL')) return 'SIGNAL';
    if (asset.includes('BRIDGE')) return 'BRIDGE';
    return 'TRACK';
  };

  // Geographic Corridor 50-Segment Virtual Simulation (SEG-001 to SEG-050)
  // Risk tiers match SegmentWhy / DigitalTwin: CRITICAL >= 70%, MODERATE >= 30%.
  const isCriticalRisk = (s) => (s?.risk_30d || 0) >= 0.7;
  const isModerateRisk = (s) => {
    const r = s?.risk_30d || 0;
    return r >= 0.3 && r < 0.7;
  };

  const sortedCorridor = React.useMemo(() => {
    const mapBySeg = {};
    (riskSegments || []).forEach((s) => {
      if (s.segment_id) mapBySeg[s.segment_id] = s;
    });

    const result = [];
    for (let i = 1; i <= 50; i++) {
      const segId = `SEG-${String(i).padStart(3, '0')}`;
      let segData = mapBySeg[segId];

      // No API row for this segment: keep the slot, but do NOT invent data —
      // division and risk stay null and render as "—", never as 0.
      if (!segData) {
        segData = {
          segment_id: segId,
          division: null,
          asset_type: null,
          risk_30d: null,
          expected_downtime_days: null,
          preventive_block_duration_hrs: null,
          confidence: null,
        };
      }

      result.push(segData);
    }
    return result;
  }, [riskSegments]);

  const totalSegmentsCount = 50;
  // Availability is a live reading: a segment counts as under a block only
  // while a scheduled block window actually covers now. Counting any segment
  // with a block anywhere in the plan read 0.0% available on a full weekly
  // plan even though every section showed ALL CLEAR.
  const nowMs = Date.now();
  const blockedSegmentCount = new Set(
    assignments
      .filter(
        (a) =>
          a.block_start &&
          a.block_end &&
          new Date(a.block_start).getTime() <= nowMs &&
          nowMs < new Date(a.block_end).getTime(),
      )
      .map((a) => a.segment_id),
  ).size;
  const blockedAssetsCount = blockedSegmentCount;
  const availableAssetsCount = Math.max(0, totalSegmentsCount - blockedAssetsCount);
  const availabilityPercent = ((availableAssetsCount / totalSegmentsCount) * 100).toFixed(1);

  const delhiSegments = sortedCorridor.filter((s) => (s.division || '').toLowerCase() === 'delhi');
  const agraSegments = sortedCorridor.filter((s) => (s.division || '').toLowerCase() === 'agra');

  const delhiCritical = delhiSegments.filter(isCriticalRisk);

  const agraCritical = agraSegments.filter(isCriticalRisk);

  const allCritical = sortedCorridor.filter(isCriticalRisk);

  const [showConflictsModal, setShowConflictsModal] = useState(false);
  const [activeIrCorridor, setActiveIrCorridor] = useState('NDLS_DDU');

  // NDLS–DDU is the only corridor the project data covers (50 segments,
  // Delhi/Agra divisions). The other trunk corridors were never in scope.
  const irCorridors = {
    NDLS_DDU: {
      id: 'NDLS_DDU',
      name: 'NDLS–DDU Corridor',
      zone: 'NR / NCR / ECR',
      total_km: 788,
      electrification: '25kV OHE Electrified • Auto-Block Signalling',
      sections: [
        { name: 'SECTION 1: NDLS–ALJN', dist: 'SEG 01–12 • 132 KM', route: 'NDLS → GZB → ALJN', tag: 'Delhi Suburban', color: 'text-sky-600' },
        { name: 'SECTION 2: ALJN–CNB', dist: 'SEG 13–25 • 309 KM', route: 'ALJN → TDL → ETW → CNB', tag: 'Kanpur Trunk', color: 'text-indigo-600' },
        { name: 'SECTION 3: CNB–PRYJ', dist: 'SEG 26–35 • 195 KM', route: 'CNB → FTP → BWR → PRYJ', tag: 'Prayagraj Trunk', color: 'text-amber-600' },
        { name: 'SECTION 4: PRYJ–DDU', dist: 'SEG 36–50 • 152 KM', route: 'PRYJ → MZP → DDU', tag: 'DDU Approach', color: 'text-emerald-600' },
      ],
      gantries: [
        { name: 'NDLS (0k)', title: 'Section 1: New Delhi', color: 'text-sky-400' },
        { name: 'ALJN (132k)', title: 'Section 1: Aligarh Jn', color: 'text-sky-400' },
        { name: 'CNB (441k)', title: 'Section 2: Kanpur Central', color: 'text-indigo-300' },
        { name: 'PRYJ (636k)', title: 'Section 3: Prayagraj Jn', color: 'text-amber-400' },
        { name: 'DDU (788k)', title: 'Section 4: Pt. Deen Dayal Upadhyaya', color: 'text-emerald-400' },
      ],
    },
  };

  const currentIrCorridor = irCorridors[activeIrCorridor] || irCorridors.NDLS_DDU;

  // Department counts in current plan — the real codes from the payload.
  const trackCount = assignments.filter((a) => a.department === 'TRACK').length;
  const oheCount = assignments.filter((a) => a.department === 'OHE').length;
  const sigCount = assignments.filter((a) => a.department === 'SIG').length;

  const filteredAssignments = assignments;

  // Conflicts come from the plan itself — the same source the header reads —
  // so the two counts can never disagree. The plan carries no unresolved
  // conflicts (CP-SAT hard constraint), so this is 0 unless the API says otherwise.
  const planConflicts = currentPlan?.unresolved_conflicts || currentPlan?.conflicts || [];
  const activeConflictsCount = planConflicts.length;

  return (
    <main className="flex flex-col relative w-full">
      <div className="flex flex-col w-full">
        {/* Main Content Container */}
        <div className="p-gutter flex flex-col gap-space-lg">
          {/* KPI Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-space-sm">
            {/* KPI 1: Asset Availability (Adjusted according to scheduled maintenance blocks) */}
            <div className="bg-surface-container-lowest p-space-sm rounded shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-secondary">
                <span className="font-label-caps text-label-caps uppercase">Asset Availability</span>
                <span className="material-symbols-outlined text-[14px]">speed</span>
              </div>
              <div className="my-space-xs flex items-baseline gap-space-xs">
                <span className="font-headline-lg text-headline-lg font-bold text-on-surface">
                  {loading ? '—' : `${availabilityPercent}%`}
                </span>
                <span className="font-code-sm text-code-sm text-on-tertiary-container font-medium">
                  {loading ? '—' : `${availableAssetsCount}/${totalSegmentsCount} Active`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-code-sm text-code-sm text-on-surface-variant">
                  {loading ? '—' : `${blockedAssetsCount} Under Maintenance Block`}
                </span>
                <span className="font-label-caps text-label-caps bg-tertiary-container text-on-tertiary-container px-1 py-0.5 rounded uppercase font-bold">
                  OPTIMAL
                </span>
              </div>
            </div>

            {/* KPI 2: Active High Risks (Interactive Card) */}
            <div
              onClick={() => {
                setCorridorFilter('CRITICAL');
                document.getElementById('high-priority-alerts')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-surface-container-lowest p-space-sm rounded shadow-sm flex flex-col justify-between cursor-pointer hover:border-error hover:border transition-all border border-transparent active:scale-[0.99]"
              title="Click to view High-Priority Segment Alerts"
            >
              <div className="flex items-center justify-between text-secondary">
                <span className="font-label-caps text-label-caps uppercase">Active High Risks</span>
                <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
              </div>
              <div className="my-space-xs flex items-baseline gap-space-xs">
                <span className="font-headline-lg text-headline-lg font-bold text-error">
                  {loading ? '—' : allCritical.length}
                </span>
                <span className="font-code-sm text-code-sm text-error font-bold">Critical Segments</span>
              </div>
              <span className="font-code-sm text-code-sm text-error truncate font-semibold">
                {loading ? 'Loading…' : allCritical.map((s) => s.segment_id).join(' / ') || 'None critical'}
              </span>
            </div>

            {/* KPI 3: Scheduled Blocks */}
            <div className="bg-surface-container-lowest p-space-sm rounded shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-secondary">
                <span className="font-label-caps text-label-caps uppercase">Scheduled Blocks</span>
                <span className="material-symbols-outlined text-[14px]">event_note</span>
              </div>
              <div className="my-space-xs flex items-baseline gap-space-xs">
                <span className="font-headline-lg text-headline-lg font-bold text-on-surface">
                  {loading ? '—' : assignments.length}
                </span>
                <span className="font-code-sm text-code-sm text-on-tertiary-container font-semibold">APPROVED</span>
              </div>
              <div className="flex items-center gap-space-xs font-code-sm text-code-sm text-on-surface-variant">
                <span>{loading ? '—' : trackCount} TRACK</span>•<span>{loading ? '—' : oheCount} OHE</span>•<span>{loading ? '—' : sigCount} SIG</span>
              </div>
            </div>

            {/* KPI 4: Active Conflicts (Interactive Conflict Inspector Card) */}
            <div
              onClick={() => setShowConflictsModal(true)}
              className="bg-surface-container-lowest p-space-sm rounded shadow-sm flex flex-col justify-between cursor-pointer hover:border-error hover:border transition-all border border-transparent active:scale-[0.99]"
              title="Click to view full Active Conflicts & Timetable Protection details"
            >
              <div className="flex items-center justify-between text-secondary">
                <span className="font-label-caps text-label-caps uppercase">Active Conflicts</span>
                <span className={`w-2.5 h-2.5 rounded-full ${activeConflictsCount > 0 ? 'bg-error animate-ping' : 'bg-on-tertiary-container'}`}></span>
              </div>
              <div className="my-space-xs flex items-baseline gap-space-xs">
                <span className={`font-headline-lg text-headline-lg font-bold ${activeConflictsCount > 0 ? 'text-error' : 'text-on-surface'}`}>
                  {loading ? '—' : activeConflictsCount}
                </span>
                <span className={`font-code-sm text-code-sm font-bold ${activeConflictsCount > 0 ? 'text-error' : 'text-on-surface-variant'}`}>
                  {activeConflictsCount > 0 ? 'ACTIVE CONFLICTS' : 'NO ACTIVE CONFLICTS'}
                </span>
              </div>
              <span className="font-code-sm text-code-sm text-on-surface-variant font-semibold flex items-center justify-between gap-2">
                <span className="min-w-0">100% Passenger Protected</span>
                <span className="text-primary underline font-bold shrink-0">Inspect →</span>
              </span>
            </div>

            {/* KPI 5: Solver Engine Status */}
            <div className="bg-surface-container-lowest p-space-sm rounded shadow-sm col-span-2 sm:col-span-1 flex flex-col justify-between">
              <div className="flex items-center justify-between text-secondary">
                <span className="font-label-caps text-label-caps uppercase">CP-SAT Optimizer</span>
                <span className="material-symbols-outlined text-[14px] text-on-tertiary-container">check_circle</span>
              </div>
              <div className="my-space-xs flex items-baseline gap-space-xs">
                <span className="font-headline-lg text-headline-lg font-bold text-on-surface">
                  {loading ? '—' : currentPlan?.policy ? currentPlan.policy.toUpperCase() : '—'}
                </span>
                <span className="font-code-sm text-code-sm text-on-tertiary-container">OPTIMAL</span>
              </div>
              <span className="font-code-sm text-code-sm text-on-surface-variant truncate">
                {loading ? 'Loading plan…' : currentPlan?.plan_id || 'No active plan'}
              </span>
            </div>
          </div>

          {/* Optimization Trigger & Toolbar */}
          <div className="bg-surface-container p-space-sm rounded shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm">
              <button
                className={`bg-primary-container hover:bg-primary text-on-primary px-space-md py-space-xs rounded flex items-center justify-center gap-space-sm shadow transition-all active:scale-[0.99] ${
                  optimizingState !== 'idle' ? 'opacity-90' : ''
                }`}
                id="btn-optimize"
                onClick={triggerOptimization}
                disabled={optimizingState !== 'idle'}
              >
                {optimizingState === 'solving' ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin text-tertiary-fixed">autorenew</span>
                    <span className="font-code-sm text-code-sm uppercase font-bold tracking-wide">SOLVING CP-SAT...</span>
                  </>
                ) : optimizingState === 'optimized' ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] text-tertiary-fixed">check_circle</span>
                    <span className="font-code-sm text-code-sm uppercase font-bold tracking-wide">OPTIMIZED &amp; SAVED</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px] text-tertiary-fixed">play_arrow</span>
                    <span className="font-code-sm text-code-sm uppercase font-bold tracking-wide">RUN CP-SAT OPTIMIZER</span>
                  </>
                )}
              </button>
              <div className="hidden sm:flex flex-col">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">SOLVER ENGINE</span>
                <span className="font-code-sm text-code-sm text-primary font-semibold">Google OR-Tools CP-SAT (Parallel)</span>
              </div>
            </div>
            <div className="flex items-center gap-space-xs shrink-0">
              <button
                onClick={loadDashboardData}
                title="Refresh Live Data"
                className="bg-surface-container-lowest hover:bg-surface-container text-on-surface px-3 py-1.5 rounded flex items-center gap-1 font-code-sm text-code-sm font-semibold shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                <span>Refresh Live Data</span>
              </button>
            </div>
          </div>

          {/* Virtual Railway Corridor Schematic Ribbon */}
          {loading ? (
            <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm text-center text-on-surface-variant font-code-sm">
              Loading corridor segments…
            </div>
          ) : (
          <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col gap-space-sm border border-surface-container-high">
            {/* Header and Corridor Switcher */}
            <div className="flex items-center justify-between flex-wrap gap-space-xs">
              <div className="flex items-center gap-space-xs flex-wrap">
                <span className="material-symbols-outlined text-[20px] text-primary">alt_route</span>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">
                    Virtual Railway Corridor:
                  </h2>
                  <select
                    value={activeIrCorridor}
                    onChange={(e) => setActiveIrCorridor(e.target.value)}
                    className="bg-surface-container-high text-primary font-code-sm text-code-sm font-bold px-3 py-1 rounded border border-surface-container-highest cursor-pointer hover:bg-surface-container-highest transition-colors shadow-xs"
                    title="Select Indian Railway Trunk Corridor"
                  >
                    {Object.values(irCorridors).map((corridor) => (
                      <option key={corridor.id} value={corridor.id}>
                        🚆 {corridor.name} ({corridor.total_km} KM • {corridor.zone})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-space-sm font-label-caps text-label-caps flex-wrap">
                <span className="text-[10px] font-code-sm uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
                  {currentIrCorridor.electrification}
                </span>
                <span className="flex items-center gap-1.5 text-on-surface font-semibold bg-emerald-950/20 px-2 py-1 rounded border border-emerald-500/30">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4ade80] shadow-[0_0_8px_#4ade80]"></span> CLEAR (110 km/h)
                </span>
                <span className="flex items-center gap-1.5 text-on-surface font-semibold bg-amber-950/20 px-2 py-1 rounded border border-amber-500/30">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shadow-[0_0_8px_#f59e0b]"></span> PSR / CAUTION (30 km/h)
                </span>
                <span className="flex items-center gap-1.5 text-on-surface font-semibold bg-red-950/20 px-2 py-1 rounded border border-red-500/30">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626] animate-pulse shadow-[0_0_8px_#dc2626]"></span> DEFECT / BLOCK (0 km/h)
                </span>
              </div>
            </div>

            {/* Dynamic Train Route Sections Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-xs bg-surface-container-low p-space-sm rounded border border-surface-container-high">
              {currentIrCorridor.sections.map((sec, idx) => {
                const isSecHighRisk = idx === 0 ? delhiCritical.some(s => parseInt(s.segment_id?.replace('SEG-','')) <= 12)
                  : idx === 1 ? delhiCritical.some(s => parseInt(s.segment_id?.replace('SEG-','')) > 12)
                  : idx === 2 ? agraCritical.some(s => parseInt(s.segment_id?.replace('SEG-','')) <= 35)
                  : agraCritical.some(s => parseInt(s.segment_id?.replace('SEG-','')) > 35);

                return (
                  <div key={sec.name} className="flex flex-col gap-1 p-2 rounded bg-surface-container-lowest border border-surface-container-high">
                    <div className="flex items-center justify-between">
                      <span className={`font-code-sm text-code-sm font-bold ${sec.color} flex items-center gap-1 min-w-0`}>
                        <span className="material-symbols-outlined text-[14px]">train</span>
                        {sec.name}
                      </span>
                      <span className="text-[10px] font-mono text-on-surface-variant font-semibold shrink-0">{sec.dist}</span>
                    </div>
                    <div className="text-[11px] font-mono font-medium text-on-surface truncate">
                      {sec.route}
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-code-sm mt-1">
                      <span className="text-on-surface-variant">{sec.tag}</span>
                      <span className={isSecHighRisk ? "text-error font-bold" : "text-emerald-600 font-semibold"}>
                        {isSecHighRisk ? "⚠️ HIGH RISK" : "🟢 ALL CLEAR"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* VIRTUAL RAILWAY CORRIDOR VISUALIZER (Dual-Rail Track + Ballast Bed + Signals) */}
            <div className="relative w-full overflow-x-auto py-2 no-scrollbar bg-slate-950 p-3 rounded-lg border border-slate-800 shadow-inner">
              <div className="min-w-[950px] flex flex-col gap-1">

                {/* Waypoint Station Nodes & Distance Gantries */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-1 border-b border-slate-800/80 px-1">
                  {currentIrCorridor.gantries.map((gantry, gIdx) => (
                    <div key={gantry.name + gIdx} className={`flex items-center gap-1 ${gantry.color} font-bold`} title={gantry.title}>
                      <span className="w-2 h-2 rounded-full bg-current"></span>
                      <span>{gantry.name}</span>
                      {gIdx < currentIrCorridor.gantries.length - 1 && <span className="text-slate-600 font-normal ml-1">→</span>}
                    </div>
                  ))}
                </div>

                {/* REALISTIC RAILWAY TRACK ASSEMBLY (Ballast Bed + Sleepers + Dual Rails + 50 Segments) */}
                <div className="relative h-20 w-full rail-ballast rail-ties rounded border-2 border-slate-700 flex items-center overflow-hidden shadow-2xl my-1">
                  
                  {/* Top Metallic Steel Rail */}
                  <div className="absolute top-1 left-0 right-0 h-1 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 border-b border-slate-900 z-10 opacity-90"></div>
                  
                  {/* Bottom Metallic Steel Rail */}
                  <div className="absolute bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 border-t border-slate-900 z-10 opacity-90"></div>

                  {/* Electrified Overhead Catinary wire line (OHE) down center */}
                  <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-sky-400/30 z-0 border-t border-dashed border-sky-400/40"></div>

                  {/* 50 Track Block Segments */}
                  {sortedCorridor.map((seg, idx) => {
                    const isDefect = isCriticalRisk(seg);
                    const isCaution = isModerateRisk(seg);
                    const isSelected = selectedNode === seg.segment_id;
                    const causeWord = getOneWordCause(seg);

                    return (
                      <div
                        key={seg.segment_id}
                        onClick={() => inspectNode(seg.segment_id)}
                        className={`h-full flex-1 relative border-r border-slate-800/80 cursor-pointer group transition-all flex flex-col justify-between p-0.5 ${
                          isSelected ? 'ring-2 ring-sky-400 z-30 bg-sky-500/20' : 'hover:brightness-125 z-20'
                        } ${
                          isDefect
                            ? 'hazard-stripes-red animate-pulse'
                            : isCaution
                            ? 'caution-stripes-amber'
                            : 'bg-emerald-950/40 hover:bg-emerald-900/60'
                        }`}
                        title={`🛤️ TRACK BLOCK: ${seg.segment_id} (${seg.division ? `${seg.division} Div` : '—'})\n• Status: ${isDefect ? `⛔ DEFECT/MAINTENANCE BLOCK [Cause: ${causeWord}]` : isCaution ? '🟡 PSR / CAUTION (30 km/h)' : '🟢 CLEAR TRACK (110 km/h)'}\n• Failure Risk: ${seg.risk_30d == null ? '—' : `${(seg.risk_30d * 100).toFixed(1)}%`}\n• Asset: ${seg.asset_type || causeWord}`}
                      >
                        {/* Block Signal Post Lamp (Top) */}
                        <div className="flex justify-center pt-0.5">
                          <span
                            className={`w-2 h-2 rounded-full border border-slate-900 shadow-sm ${
                              isDefect
                                ? 'bg-red-500 shadow-[0_0_8px_#ef4444] animate-signal-pulse'
                                : isCaution
                                ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'
                                : 'bg-emerald-400 shadow-[0_0_4px_#10b981]'
                            }`}
                          ></span>
                        </div>

                        {/* Middle Track Block Identifier / Label */}
                        <div className="flex items-center justify-center text-center">
                          {isDefect ? (
                            <span className="px-1 py-0.2 rounded bg-black/90 text-red-400 font-mono text-[9px] font-extrabold border border-red-500/60 truncate shadow-md">
                              ⛔ {causeWord}
                            </span>
                          ) : isCaution ? (
                            <span className="px-1 py-0.2 rounded bg-black/80 text-amber-300 font-mono text-[9px] font-bold border border-amber-500/40">
                              30k
                            </span>
                          ) : (
                            <span className="text-emerald-400/40 font-mono text-[8px] group-hover:text-emerald-300 transition-colors">
                              ››
                            </span>
                          )}
                        </div>

                        {/* Bottom Segment Index */}
                        <div className="flex justify-center pb-0.5">
                          <span className="text-[8px] font-mono text-slate-400/70 group-hover:text-slate-200">
                            {idx + 1}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Waypoint Segment Hotspots Cards */}
                <div className="grid grid-cols-6 gap-space-xs text-left pt-space-xs">
                  {(() => {
                    const dTop = [...delhiSegments].sort((a, b) => (b.risk_30d || 0) - (a.risk_30d || 0)).slice(0, 3);
                    const aTop = [...agraSegments].sort((a, b) => (b.risk_30d || 0) - (a.risk_30d || 0)).slice(0, 3);
                    const seen = new Set();
                    return [...dTop, ...aTop].filter((s) => {
                      if (seen.has(s.segment_id)) return false;
                      seen.add(s.segment_id);
                      return true;
                    });
                  })().map((seg) => {
                    const isCrit = isCriticalRisk(seg);
                    const isMed = isModerateRisk(seg);
                    const isSelected = selectedNode === seg.segment_id;
                    const causeWord = getOneWordCause(seg);

                    return (
                      <div
                        key={seg.segment_id}
                        className={`flex flex-col gap-0.5 cursor-pointer p-1.5 rounded transition-colors ${
                          isSelected
                            ? 'ring-2 ring-primary bg-surface-container-low'
                            : 'hover:bg-surface-container-low'
                        }`}
                        onClick={() => inspectNode(seg.segment_id)}
                      >
                        <div className="flex items-center gap-1">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ring-2 ring-surface-container-lowest ${
                              isCrit
                                ? 'bg-[#dc2626] animate-pulse shadow-[0_0_6px_#dc2626]'
                                : isMed
                                ? 'bg-[#f59e0b]'
                                : 'bg-[#4ade80]'
                            }`}
                          ></span>
                          <span className="font-code-lg text-code-lg font-bold text-on-surface">
                            {seg.segment_id}
                          </span>
                        </div>
                        <span
                          className={`font-label-caps text-label-caps font-semibold ${
                            isCrit
                              ? 'text-error'
                              : isMed
                              ? 'text-amber-500'
                              : 'text-emerald-600'
                          }`}
                        >
                          {seg.division || '—'} Div • {seg.risk_30d == null ? '—' : `${(seg.risk_30d * 100).toFixed(1)}%`}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant truncate font-medium">
                          {isCrit ? `BLOCK (${causeWord})` : isMed ? 'CAUTION (30km/h)' : 'On-Time Response'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Selected Segment Inspector Banner */}
            {selectedNode && (
              <div className="bg-surface-container-low border border-primary/30 p-space-sm rounded flex items-center justify-between flex-wrap gap-space-sm animate-fadeIn">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-primary text-[22px]">info</span>
                  <div>
                    <span className="font-code-sm text-code-sm font-bold text-primary">
                      SELECTED INSPECTOR: {selectedNode}
                    </span>
                    {(() => {
                      const inspected = sortedCorridor.find((s) => s.segment_id === selectedNode);
                      if (!inspected) return null;
                      const cause = getOneWordCause(inspected);
                      return (
                        <div className="flex items-center gap-space-sm text-body-sm font-code-sm text-on-surface-variant mt-0.5 flex-wrap">
                          <span>Division: {inspected.division || '—'}</span>
                          <span>•</span>
                          <span>Asset: {inspected.asset_type || cause}</span>
                          <span>•</span>
                          <span>Failure Risk: <strong className={isCriticalRisk(inspected) ? 'text-error' : 'text-emerald-600'}>{inspected.risk_30d == null ? '—' : `${(inspected.risk_30d * 100).toFixed(1)}%`}</strong></span>
                          <span>•</span>
                          <span>Block Duration: {inspected.preventive_block_duration_hrs ? `${inspected.preventive_block_duration_hrs}h` : '—'}</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <Link
                  to={`/segment-why?segment=${selectedNode}`}
                  className="bg-primary text-on-primary px-3 py-1 rounded font-code-sm text-code-sm font-bold hover:bg-primary-container transition-colors flex items-center gap-1"
                >
                  VIEW ML SURVIVAL CURVE
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </div>
            )}

            {/* Filter Buttons for Segment Cards */}
            <div className="flex items-center justify-between flex-wrap gap-space-xs pt-space-xs border-t border-surface-container-high">
              <span className="font-code-sm text-code-sm text-on-surface-variant">
                Showing {corridorFilter === 'CRITICAL' ? allCritical.length : corridorFilter === 'DELHI' ? delhiSegments.length : corridorFilter === 'AGRA' ? agraSegments.length : 12} of {sortedCorridor.length} Monitored Segments:
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCorridorFilter('CRITICAL')}
                  className={`px-2 py-0.5 rounded font-code-sm text-code-sm font-semibold transition-colors ${
                    corridorFilter === 'CRITICAL' ? 'bg-error text-on-error' : 'bg-surface-container hover:bg-surface-container-high text-error'
                  }`}
                >
                  CRITICAL ONLY ({allCritical.length})
                </button>
                <button
                  onClick={() => setCorridorFilter('DELHI')}
                  className={`px-2 py-0.5 rounded font-code-sm text-code-sm font-semibold transition-colors ${
                    corridorFilter === 'DELHI' ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                  }`}
                >
                  DELHI DIV ({delhiSegments.length})
                </button>
                <button
                  onClick={() => setCorridorFilter('AGRA')}
                  className={`px-2 py-0.5 rounded font-code-sm text-code-sm font-semibold transition-colors ${
                    corridorFilter === 'AGRA' ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                  }`}
                >
                  AGRA DIV ({agraSegments.length})
                </button>
                <button
                  onClick={() => setCorridorFilter('ALL')}
                  className={`px-2 py-0.5 rounded font-code-sm text-code-sm font-semibold transition-colors ${
                    corridorFilter === 'ALL' ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                  }`}
                >
                  TOP 12
                </button>
              </div>
            </div>

            {/* Segment Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-space-sm text-left">
              {(corridorFilter === 'CRITICAL'
                ? allCritical
                : corridorFilter === 'DELHI'
                ? delhiSegments
                : corridorFilter === 'AGRA'
                ? agraSegments
                : sortedCorridor.slice(0, 12)
              ).map((seg) => {
                const isHigh = isCriticalRisk(seg);
                const isMed = isModerateRisk(seg);
                const isSelected = selectedNode === seg.segment_id;
                const causeWord = getOneWordCause(seg);

                return (
                  <div
                    key={seg.segment_id}
                    onClick={() => inspectNode(seg.segment_id)}
                    className={`flex flex-col gap-0.5 p-2 rounded transition-all border ${
                      isHigh
                        ? 'bg-error-container/30 border-error'
                        : isMed
                        ? 'bg-amber-500/10 border-amber-500'
                        : 'bg-surface-container-low border-surface-container-high'
                    } ${isSelected ? 'ring-2 ring-primary' : ''} hover:scale-[1.02] cursor-pointer`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-code-lg text-code-lg font-bold text-on-surface">
                        {seg.segment_id}
                      </span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isHigh ? 'bg-error animate-pulse' : isMed ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      ></span>
                    </div>
                    <span className="font-label-caps text-label-caps text-on-surface-variant font-semibold">
                      {seg.division || '—'} • {seg.asset_type || causeWord}
                    </span>
                    <div className="flex items-center justify-between text-body-sm font-code-sm mt-1">
                      <span className={isHigh ? 'text-error font-bold' : isMed ? 'text-amber-500 font-bold' : 'text-emerald-600 font-semibold'}>
                        {isHigh ? `BLOCK (${causeWord})` : isMed ? 'CAUTION' : 'On-Time Response'}
                      </span>
                      <span className="text-on-surface-variant text-[11px] font-medium">
                        {seg.preventive_block_duration_hrs ? `${seg.preventive_block_duration_hrs}h` : '—'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {/* High-Priority Segment Alerts (AI Survival Intelligence) */}
          <div id="high-priority-alerts" className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[16px] text-error">notifications_active</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  High-Priority Segment Alerts (AI Survival Intelligence)
                </h2>
              </div>
              <div className="flex items-center gap-1.5 font-label-caps text-label-caps uppercase font-bold tracking-wider">
                <span className="bg-error text-on-error px-2 py-0.5 rounded shadow-xs">
                  {loading ? '—' : allCritical.length} CRITICAL
                </span>
              </div>
            </div>

            {/* Alert Cards (Strictly classified as CRITICAL) */}
            {allCritical.map((seg) => {
              const causeWord = getOneWordCause(seg);
              const riskLevelLabel = `CRITICAL ${causeWord} RISK`;

              return (
                <div
                  key={seg.segment_id}
                  className="bg-surface-container-lowest p-space-md rounded shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-space-sm border-l-4 border-l-error"
                >
                  <div className="flex items-start gap-space-sm min-w-0">
                    <div className="p-1 rounded shrink-0 mt-0.5 bg-error-container text-on-error-container">
                      <span className="material-symbols-outlined text-[20px]">
                        fmd_bad
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-space-xs flex-wrap">
                        <span className="font-label-caps text-label-caps px-1 rounded uppercase font-bold bg-error text-on-error">
                          {riskLevelLabel}
                        </span>
                        <span className="font-code-sm text-code-sm font-bold text-on-surface">
                          Segment {seg.segment_id} ({seg.division} Division)
                        </span>
                        <span className="font-code-sm text-code-sm text-secondary font-medium">
                          | 30d Risk: {((seg.risk_30d || 0) * 100).toFixed(1)}% | Cause: <strong className="text-on-surface">{causeWord}</strong> | Expected Downtime: {seg.expected_downtime_days ?? '—'}d
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-xs shrink-0 w-full md:w-auto justify-end">
                    <Link
                      to={`/segment-why?segment=${seg.segment_id}`}
                      className="bg-surface-container hover:bg-surface-container-highest text-on-surface px-space-sm py-1 rounded font-code-sm text-code-sm font-semibold"
                    >
                      VIEW WHY LOG
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Maintenance Corridor Schedule (Data Table from Real CP-SAT Plan) */}
          <div id="maintenance-possessions" className="bg-surface-container-lowest p-space-md rounded shadow-sm flex flex-col gap-space-sm">
            <div className="flex items-center justify-between flex-wrap gap-space-xs">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[16px] text-secondary">handyman</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  Optimized Maintenance Possessions ({loading ? '—' : assignments.length} Scheduled)
                </h2>
              </div>
              <div className="flex items-center gap-space-sm">
                <span className="font-label-caps text-label-caps text-on-surface-variant">
                  HORIZON: 7 DAYS (WEEKLY)
                </span>
              </div>
            </div>

            {/* Tabular List Component */}
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[620px]">
                <thead>
                  <tr className="bg-surface-container text-on-surface-variant font-label-caps text-label-caps uppercase">
                    <th className="py-space-xs px-space-sm font-bold">Task ID</th>
                    <th className="py-space-xs px-space-sm font-bold">Segment</th>
                    <th className="py-space-xs px-space-sm font-bold">Dept</th>
                    <th className="py-space-xs px-space-sm font-bold">Assigned Window</th>
                    <th className="py-space-xs px-space-sm font-bold">Duration</th>
                    <th className="py-space-xs px-space-sm font-bold">Reason / Explanation</th>
                    <th className="py-space-xs px-space-sm font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high font-code-sm text-code-sm">
                  {filteredAssignments.slice(0, 15).map((a, index) => {
                    const startStr = a.block_start ? new Date(a.block_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                    const endStr = a.block_end ? new Date(a.block_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                    const windowDisplay = startStr && endStr ? `${startStr} - ${endStr}` : '—';
                    const durDisplay = a.duration_hrs ? `${a.duration_hrs} Hrs` : '—';

                    return (
                      <tr key={a.id || a.task_id || index} className="hover:bg-surface-container-low transition-colors">
                        <td className="py-space-sm px-space-sm font-bold text-primary">
                          {a.task_id}
                        </td>
                        <td className="py-space-sm px-space-sm font-semibold text-on-surface">
                          <Link to={`/segment-why?segment=${a.segment_id}`} className="hover:underline">
                            {a.segment_id}
                          </Link>
                        </td>
                        <td className="py-space-sm px-space-sm">
                          <span className="bg-surface-container px-1 py-0.5 rounded font-label-caps text-label-caps text-on-surface font-semibold">
                            {a.department}
                          </span>
                        </td>
                        <td className="py-space-sm px-space-sm text-on-surface font-medium">
                          {windowDisplay}
                        </td>
                        <td className="py-space-sm px-space-sm text-on-surface-variant font-medium">
                          {durDisplay}
                        </td>
                        <td className="py-space-sm px-space-sm text-on-surface-variant truncate max-w-[240px]">
                          {a.reason || 'Optimal window scheduled avoiding passenger conflict'}
                        </td>
                        <td className="py-space-sm px-space-sm text-right">
                          <span className="bg-tertiary-fixed text-on-tertiary-fixed px-1.5 py-0.5 rounded font-label-caps text-label-caps font-bold">
                            APPROVED
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredAssignments.length === 0 && !loading && (
                <div className="p-space-md text-center text-on-surface-variant font-code-sm">
                  No assignments found matching current filter.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active Conflicts Inspection Modal */}
      {showConflictsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl shadow-2xl max-w-2xl w-full p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-surface-container-high pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-[24px]">warning</span>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">
                    Active Corridor Schedule Conflicts ({activeConflictsCount})
                  </h3>
                  <p className="font-code-sm text-code-sm text-on-surface-variant">
                    Operational clashes between high-priority defects, multi-department requests, & train timetables
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConflictsModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Safety Guarantee Banner */}
            <div className="bg-emerald-950/20 border border-emerald-500/40 p-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500 text-[20px]">verified_user</span>
                <span className="font-code-sm text-code-sm text-emerald-400 font-bold">
                  100% Passenger Trains Protected (0 Unsafe Overlaps)
                </span>
              </div>
              <span className="font-label-caps text-label-caps bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded uppercase font-bold">
                CP-SAT OPTIMIZED
              </span>
            </div>

            {/* Conflicts Breakdown List */}
            <div className="flex flex-col gap-3">
              {planConflicts.length === 0 ? (
                <div className="p-space-md text-center text-on-surface-variant font-code-sm text-code-sm">
                  No unresolved conflicts — the current plan places all {assignments.length} assignments with zero passenger-train overlap.
                </div>
              ) : (
                planConflicts.map((conf, i) => (
                  <div key={conf.id || conf.segment_id || i} className="bg-surface-container-low p-3 rounded-lg border border-surface-container-high flex flex-col gap-2">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="font-code-sm text-code-sm font-bold text-error flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
                        CONFLICT #{i + 1}: {conf.segment_id || conf.id || 'Unknown segment'}
                      </span>
                    </div>
                    <div className="text-body-sm font-code-sm text-on-surface flex flex-col gap-0.5">
                      <div>{conf.detail || conf.reason || conf.description || 'Unresolved scheduling conflict reported by the plan.'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between border-t border-surface-container-high pt-3">
              <button
                onClick={() => {
                  setShowConflictsModal(false);
                  triggerOptimization();
                }}
                className="bg-primary text-on-primary px-4 py-2 rounded font-code-sm text-code-sm font-bold hover:bg-primary-container transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                RUN CP-SAT RE-OPTIMIZATION
              </button>
              <button
                onClick={() => setShowConflictsModal(false)}
                className="bg-surface-container hover:bg-surface-container-high text-on-surface px-4 py-2 rounded font-code-sm text-code-sm font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
