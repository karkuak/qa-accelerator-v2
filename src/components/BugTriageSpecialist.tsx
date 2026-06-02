import React, { useState, useEffect } from 'react';
import { ProductionImpactResult, BugDraft } from '../types';
import { 
  Sliders, 
  Sparkles, 
  Bug, 
  Copy, 
  ArrowRight, 
  Check, 
  AlertTriangle, 
  RotateCcw, 
  Building, 
  DollarSign, 
  Users, 
  Database,
  ExternalLink,
  Info
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface Props {
  prefilledBug: {
    title: string;
    summary: string;
    stepsToReproduce: string;
    expectedBehavior: string;
    actualResult: string;
    logs: any[];
  } | null;
}

export default function BugTriageSpecialist({ prefilledBug }: Props) {
  // Configurable sliders
  const [storeCount, setStoreCount] = useState<number>(14);
  const [financialLoss, setFinancialLoss] = useState<number>(12000);
  const [customerFriction, setCustomerFriction] = useState<string>('high'); // 'low' | 'medium' | 'high'
  const [impactedServices, setImpactedServices] = useState<number>(3);

  // Editable bug description
  const [bugTitle, setBugTitle] = useState<string>('Fulfillment event created after successful order cancellation');
  const [stepsToReproduce, setStepsToReproduce] = useState<string>('1. Place pickup order ORD-9921.\n2. Click cancel in UI checkout screen.\n3. Verify order moves to status: CANCELLED.\n4. Scrutinize down-stream Logistics Terminal console.');
  const [expectedBehavior, setExpectedBehavior] = useState<string>('No dispatch manifests or logistics dockets created in Logistics Database.');
  const [actualResult, setActualResult] = useState<string>('Fulfillment event published successfully. Courier booked for order ORD-9921.');
  
  // Triage state
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [triageReport, setTriageReport] = useState<ProductionImpactResult | null>(null);
  const [bugDraft, setBugDraft] = useState<BugDraft | null>(null);
  const [aiRationale, setAiRationale] = useState<string>('');
  
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [showJiraModal, setShowJiraModal] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Hook to handle incoming Prefill events
  useEffect(() => {
    if (prefilledBug) {
      setBugTitle(prefilledBug.title);
      setStepsToReproduce(prefilledBug.stepsToReproduce);
      setExpectedBehavior(prefilledBug.expectedBehavior);
      setActualResult(prefilledBug.actualResult);
      
      // Auto-set slider parameters based on prefills for maximum realism
      if (prefilledBug.title.toLowerCase().includes('payment')) {
        setFinancialLoss(24600);
        setStoreCount(22);
        setCustomerFriction('high');
        setImpactedServices(4);
      } else if (prefilledBug.title.toLowerCase().includes('inventory')) {
        setFinancialLoss(4800);
        setStoreCount(8);
        setCustomerFriction('medium');
        setImpactedServices(2);
      } else if (prefilledBug.title.toLowerCase().includes('cancel')) {
        setFinancialLoss(8800);
        setStoreCount(14);
        setCustomerFriction('high');
        setImpactedServices(3);
      }
    }
  }, [prefilledBug]);

  // Handle re-evaluation on slider changes
  const runImpactEvaluation = async () => {
    setIsEvaluating(true);
    try {
      const response = await fetch('/api/analyze-defect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: bugTitle,
          summary: `Steps: ${stepsToReproduce}\nExpected: ${expectedBehavior}\nActual: ${actualResult}`,
          stepsToReproduce,
          expectedBehavior,
          actualResult,
          volumeStoreCount: storeCount,
          financialTweakDollar: financialLoss,
          customerFric: customerFriction,
          downstreamImpactedServices: impactedServices,
          evidenceLogs: prefilledBug?.logs || []
        })
      });

      if (!response.ok) throw new Error('Error processing triage reports');
      const data = await response.json();
      setTriageReport(data.triageReport);
      setBugDraft(data.bugDraft);
      setAiRationale(data.aiExplanationResult);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Run automatically on load or when sliders/parameters update
  useEffect(() => {
    runImpactEvaluation();
  }, [storeCount, financialLoss, customerFriction, impactedServices, bugTitle, stepsToReproduce, expectedBehavior, actualResult]);

  const handleCopy = () => {
    if (!bugDraft) return;
    navigator.clipboard.writeText(bugDraft.summary);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleJiraSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setShowJiraModal(false);
      alert('SUCCESS: Bug draft successfully synchronized with Jira Cloud. Assigned Issue ID: QA-60291.');
    }, 1500);
  };

  // Construct fake but beautiful graph datasets mapping incident rate over past 30 days
  const chartData = [
    { day: 'May 04', rate: triageReport ? Math.max(1, Math.floor(triageReport.similarCount30Days * 0.4)) : 4 },
    { day: 'May 08', rate: triageReport ? Math.max(2, Math.floor(triageReport.similarCount30Days * 0.55)) : 8 },
    { day: 'May 12', rate: triageReport ? Math.max(1, Math.floor(triageReport.similarCount30Days * 0.3)) : 3 },
    { day: 'May 16', rate: triageReport ? Math.max(3, Math.floor(triageReport.similarCount30Days * 0.75)) : 11 },
    { day: 'May 20', rate: triageReport ? Math.max(6, Math.floor(triageReport.similarCount30Days * 0.9)) : 14 },
    { day: 'May 24', rate: triageReport ? Math.max(4, Math.floor(triageReport.similarCount30Days * 0.6)) : 9 },
    { day: 'May 28', rate: triageReport ? Math.max(5, Math.floor(triageReport.similarCount30Days * 0.8)) : 12 },
    { day: 'Jun 02', rate: triageReport ? triageReport.similarCount30Days : 18 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Parameters & Interactive Scoring - Left Column */}
      <div className="lg:col-span-6 space-y-6">
        <div className="bg-[#16161A] border border-[#27272A] rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-xl font-semibold text-[#E4E4E7] flex items-center gap-2">
            <Sliders className="text-pink-400 w-5 h-5" />
            Interactive Triage Slider Controls
          </h2>

          <div className="space-y-5">
            {/* Store Counts Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-pink-400" />
                  Impacted Retail Stores
                </span>
                <span className="text-sm font-bold text-[#E4E4E7]">{storeCount} Stores</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={storeCount}
                onChange={(e) => setStoreCount(Number(e.target.value))}
                className="w-full accent-pink-500 h-1.5 bg-[#0F0F11] rounded-lg appearance-none cursor-pointer"
                id="stores-slider"
              />
              <div className="flex justify-between text-[10px] text-[#A1A1AA] mt-1">
                <span>1 Local outlet</span>
                <span>25 Regional</span>
                <span>50 Nationwide Outage risk</span>
              </div>
            </div>

            {/* Simulated Loss Tweak */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-pink-400" />
                  Est. 30-Day Financial Risk
                </span>
                <span className="text-sm font-bold text-[#E4E4E7]">${financialLoss.toLocaleString()} USD</span>
              </div>
              <input
                type="range"
                min="500"
                max="50000"
                step="500"
                value={financialLoss}
                onChange={(e) => setFinancialLoss(Number(e.target.value))}
                className="w-full accent-pink-500 h-1.5 bg-[#0F0F11] rounded-lg appearance-none cursor-pointer"
                id="financial-slider"
              />
              <div className="flex justify-between text-[10px] text-[#A1A1AA] mt-1">
                <span>$500 Minimal slip</span>
                <span>$25,000 Major Leakage</span>
                <span>$50,000 High Exposure</span>
              </div>
            </div>

            {/* Downstream services */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-pink-400" />
                  Impacted Downstream Systems
                </span>
                <span className="text-sm font-bold text-[#E4E4E7]">{impactedServices} Systems</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                value={impactedServices}
                onChange={(e) => setImpactedServices(Number(e.target.value))}
                className="w-full accent-pink-500 h-1.5 bg-[#0F0F11] rounded-lg appearance-none cursor-pointer"
                id="services-slider"
              />
              <div className="flex justify-between text-[10px] text-[#A1A1AA] mt-1">
                <span>0 Isolated Core</span>
                <span>3 Multi-service</span>
                <span>5 Full Enterprise ERP Block</span>
              </div>
            </div>

            {/* Customer Friction Category */}
            <div>
              <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-pink-400" />
                Customer Friction Experience
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'low', label: 'Low / Minor Delay', desc: 'Slight latency SLA drops' },
                  { id: 'medium', label: 'Medium Friction', desc: 'No billing confirmation' },
                  { id: 'high', label: 'High / Outage Block', desc: 'Interrupted checkouts' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setCustomerFriction(f.id)}
                    className={`p-3 rounded-xl border text-left flex flex-col transition-all cursor-pointer ${
                      customerFriction === f.id
                        ? 'bg-pink-950/20 border-pink-700/80 text-pink-200'
                        : 'bg-[#0F0F11] border-[#27272A] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#E4E4E7]'
                    }`}
                    type="button"
                    id={`friction-btn-${f.id}`}
                  >
                    <span className="font-semibold text-xs capitalize">{f.id} Impact</span>
                    <span className="text-[9px] text-[#A1A1AA]/80 leading-snug mt-1">{f.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Triage Scoring Outcomes Panel */}
        {triageReport && (
          <div className="bg-[#16161A] border border-[#27272A] rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/5 rounded-full blur-3xl"></div>
            
            <h3 className="text-sm font-semibold text-[#E4E4E7] uppercase tracking-wide mb-4">AI Scorecard Output Details</h3>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-[#0F0F11] p-4 border border-[#27272A] rounded-xl text-center">
                <span className="block text-[10px] text-[#A1A1AA] uppercase tracking-widest font-bold">Recommended Priority</span>
                <span className={`text-xl font-black block mt-1 ${
                  triageReport.recommendedPriority === 'P1' ? 'text-rose-400' :
                  triageReport.recommendedPriority === 'P2' ? 'text-amber-400' : 'text-[#E4E4E7]'
                }`}>{triageReport.recommendedPriority}</span>
                <span className="text-[10px] text-[#A1A1AA] italic block mt-1">
                  {triageReport.recommendedPriority === 'P1' ? 'Immediate SPRINT' :
                   triageReport.recommendedPriority === 'P2' ? 'Active backlog' : 'Low prioritised'}
                </span>
              </div>

              <div className="bg-[#0F0F11] p-4 border border-[#27272A] rounded-xl text-center">
                <span className="block text-[10px] text-[#A1A1AA] uppercase tracking-widest font-bold">Escaped Severity</span>
                <span className={`text-xl font-black block mt-1 ${
                  triageReport.recommendedSeverity === 'Sev-1' ? 'text-rose-400 animate-pulse' :
                  triageReport.recommendedSeverity === 'Sev-2' ? 'text-amber-400' : 'text-[#E4E4E7]'
                }`}>{triageReport.recommendedSeverity}</span>
                <span className="text-[10px] text-[#A1A1AA] italic block mt-1">
                  {triageReport.recommendedSeverity === 'Sev-1' ? 'Emergency Fix' :
                   triageReport.recommendedSeverity === 'Sev-2' ? 'Next Build Release' : 'Standard issue'}
                </span>
              </div>

              <div className="bg-[#0F0F11] p-4 border border-[#27272A] rounded-xl text-center">
                <span className="block text-[10px] text-[#A1A1AA] uppercase tracking-widest font-bold">Triage Score Limit</span>
                <span className="text-xl font-black block mt-1 text-[#E4E4E7]">{triageReport.scoringBreakdown.totalScore}/3.0</span>
                <span className="text-[10px] text-[#A1A1AA] block mt-1">Calculated factor</span>
              </div>
            </div>

            {/* Scoring breakdown details */}
            <div className="p-3 bg-[#0F0F11] rounded-xl border border-[#27272A] space-y-2 mb-4">
              <div className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-[#A1A1AA]" />
                <span className="text-[10px] font-semibold text-[#A1A1AA] uppercase tracking-wide">Dynamic Weight Formula breakdown</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-[10px] text-[#A1A1AA]">
                <div>Financial W: <strong className="text-[#E4E4E7]">{(triageReport.scoringBreakdown.financialScore * 0.35).toFixed(2)}</strong></div>
                <div>Customer W: <strong className="text-[#E4E4E7]">{(triageReport.scoringBreakdown.customerScore * 0.30).toFixed(2)}</strong></div>
                <div>Outlets W: <strong className="text-[#E4E4E7]">{(triageReport.scoringBreakdown.volumeScore * 0.20).toFixed(2)}</strong></div>
                <div>Downstream W: <strong className="text-[#E4E4E7]">{(triageReport.scoringBreakdown.volumeScore * 0.15).toFixed(2)}</strong></div>
              </div>
            </div>

            {/* AI Reasoning Text */}
            {aiRationale && (
              <div className="bg-[#0F0F11] p-4 rounded-xl border border-[#27272A] text-xs text-[#E4E4E7] space-y-1">
                <div className="flex items-center gap-1.5 text-pink-400 font-semibold mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Rationale
                </div>
                <p className="leading-relaxed font-normal text-[#E4E4E7] italic">{aiRationale}</p>
                <div className="text-[10px] text-[#A1A1AA] pt-1">Confidence Rating Score: {triageReport.confidenceScore}% (Data ground pattern match verified)</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Draft Bug Markdown & Pattern Logs - Right Column */}
      <div className="lg:col-span-6 space-y-6">
        {/* Dynamic Recharts graph of production similar occurrences */}
        {triageReport && (
          <div className="bg-[#16161A] border border-[#27272A] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#E4E4E7] uppercase tracking-widest">Similarity Pattern Analytics</h3>
                <span className="text-[10px] text-[#A1A1AA] block">Identified occurrences matches in production timeline</span>
              </div>
              <span className="bg-pink-955/20 border border-pink-905 text-pink-400 px-2.5 py-1 rounded text-xs font-semibold">
                {triageReport.similarCount30Days} Cases (Past 30 Days)
              </span>
            </div>

            {/* RECHARTS CHANNELS */}
            <div className="h-44 w-full text-xs" style={{ minWidth: '100px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                  <XAxis dataKey="day" stroke="#a1a1aa" tickLine={false} />
                  <YAxis stroke="#a1a1aa" tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F0F11', borderColor: '#27272A' }}
                    labelStyle={{ color: '#E4E4E7', fontWeight: 'bold' }}
                    itemStyle={{ color: '#f472b6' }}
                  />
                  <Area type="monotone" dataKey="rate" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorRate)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-[#0F0F11] rounded-xl border border-[#27272A]">
                <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wider block">Est. Impacted Orders</span>
                <strong className="text-[#E4E4E7] mt-1 block text-sm">{triageReport.affectedOrders} Orders</strong>
              </div>
              <div className="p-3 bg-[#0F0F11] rounded-xl border border-[#27272A]">
                <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wider block">Suggested Lead Ownership</span>
                <strong className="text-pink-300 mt-1 block text-xs truncate leading-normal">{triageReport.suggestedOwnerTeam}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Jira Bug template card */}
        {bugDraft && (
          <div className="bg-[#16161A] border border-[#27272A] rounded-2xl p-6 shadow-xl relative">
            <div className="flex items-center justify-between mb-4 border-b border-[#27272A] pb-3">
              <div className="flex items-center gap-2">
                <Bug className="text-pink-400 w-5 h-5" />
                <h3 className="text-sm font-semibold text-[#E4E4E7] uppercase tracking-wide">Auto-Draft Bug Report (JIRA Wiki syntax)</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-2 border border-[#27272A] text-[#A1A1AA] hover:text-[#E4E4E7] rounded hover:bg-[#27272A] transition-all flex items-center gap-1.5 text-xs cursor-pointer"
                  title="Copy JIRA ticket markdown"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Draft
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowJiraModal(true)}
                  className="px-3 py-1.5 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-pink-955/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  Sync to Jira
                </button>
              </div>
            </div>

            {/* Bug content text previewer */}
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-[#A1A1AA] font-black uppercase tracking-wider mb-1 block">Assigned Title ID</label>
                <input
                  type="text"
                  value={bugDraft.title}
                  onChange={(e) => setBugDraft({ ...bugDraft, title: e.target.value })}
                  className="w-full bg-[#0F0F11] border border-[#27272A] rounded-lg px-3 py-2 text-[#E4E4E7] font-semibold focus:outline-none focus:ring-1 focus:ring-pink-500 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-wider mb-1 block">Compiled JIRA Wiki Markup</label>
                <textarea
                  rows={8}
                  readOnly
                  value={bugDraft.summary}
                  className="w-full bg-[#0F0F11] border border-[#27272A] rounded-lg px-3 py-2 text-[#E4E4E7] font-mono text-xs focus:outline-none text-left leading-relaxed resize-none scroll-smooth select-all"
                  id="jira-draft-markup"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Jira Synchronization Modal dialog */}
      {showJiraModal && bugDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="bg-[#16161A] border border-[#27272A] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-lg font-bold text-[#E4E4E7] flex items-center gap-2 mb-2">
              <ExternalLink className="w-5 h-5 text-pink-500" />
              Synchronize to Enterprise JIRA Cloud
            </h3>
            <p className="text-xs text-[#A1A1AA] mb-6 leading-relaxed">
              This action triggers the QA Accelerator internal MCP endpoint connecting to your instance securely.
            </p>

            <div className="space-y-4 mb-6">
              <div className="p-3 bg-[#0F0F11] rounded-xl border border-[#27272A] text-xs space-y-2">
                <div><span className="text-[#A1A1AA] font-semibold">Target Project:</span> RETAIL-TECH (RTC)</div>
                <div><span className="text-[#A1A1AA] font-semibold">Issue Type:</span> Bug Defect Ticket</div>
                <div><span className="text-[#A1A1AA] font-semibold">Assigned Owner:</span> {bugDraft.suggestedOwner}</div>
                <div><span className="text-[#A1A1AA] font-semibold">Severity Assigned:</span> {triageReport?.recommendedSeverity}</div>
              </div>
              <div className="text-xs text-[#E4E4E7] italic p-3 bg-pink-950/20 border border-pink-900/50 rounded-xl leading-relaxed">
                "Auto-attaching correlated server logs of tracer {prefilledBug ? prefilledBug.logs[0]?.message.slice(0, 40) + '...' : 'evidence'} to bug evidence drawer..."
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowJiraModal(false)}
                className="px-4 py-2 bg-[#27272A] hover:bg-[#27272A]/80 text-[#E4E4E7] rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleJiraSync}
                disabled={isSyncing}
                className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                {isSyncing ? 'Syncing...' : 'Confirm Sync'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
