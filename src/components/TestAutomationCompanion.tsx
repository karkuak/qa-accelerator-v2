import React, { useState, useEffect } from 'react';
import { VALIDATION_PACKS } from '../validationPacks';
import { ValidationPack, TestValidationResponse, ResultStatus } from '../types';
import { 
  Play, 
  Cpu, 
  Layers, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  HelpCircle, 
  Terminal, 
  ChevronRight, 
  Send,
  Sliders,
  RotateCcw,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Props {
  onSendToTriage: (bugDetails: {
    title: string;
    summary: string;
    stepsToReproduce: string;
    expectedBehavior: string;
    actualResult: string;
    logs: any[];
  }) => void;
}

export default function TestAutomationCompanion({ onSendToTriage }: Props) {
  const [selectedPackId, setSelectedPackId] = useState<string>('payments');
  const [orderId, setOrderId] = useState<string>('ORD-98211-PAY');
  const [transactionId, setTransactionId] = useState<string>('TXN-PAY-88219x');
  const [environment, setEnvironment] = useState<string>('QA');
  const [uiObservedResult, setUiObservedResult] = useState<string>('UI showed Payment Declined. Order cancellation error');
  const [simulateFail, setSimulateFail] = useState<boolean>(true);
  const [customLogs, setCustomLogs] = useState<string>('');
  
  // Running state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runLogs, setRunLogs] = useState<string[]>([]);
  const [currentLogIndex, setCurrentLogIndex] = useState<number>(0);
  const [validationResult, setValidationResult] = useState<TestValidationResponse | null>(null);
  
  const currentPack = VALIDATION_PACKS.find(p => p.id === selectedPackId) || VALIDATION_PACKS[0];

  // Pick a pre-seeded scenario
  const applyPreset = (title: string, inputs: any, shouldFail: boolean) => {
    if (inputs.orderId) setOrderId(inputs.orderId);
    if (inputs.transactionId) setTransactionId(inputs.transactionId);
    else setTransactionId('N/A');
    setEnvironment(inputs.environment);
    setUiObservedResult(inputs.uiObservedResult);
    setSimulateFail(shouldFail);
  };

  const handleRunValidation = async () => {
    setIsRunning(true);
    setValidationResult(null);
    setRunLogs([]);
    setCurrentLogIndex(0);

    const steps = [
      `[COPILOT STUDIO] Spawning Agent Thread. Target: ${currentPack.name}...`,
      `[COPILOT STUDIO] Negotiating handshake with Secure MCP Core endpoints...`,
      `[MCP SERVER] Tool selection engaged: 'classify_test_case' matching domain: [${currentPack.category}]`,
      `[MCP SERVER] Invoking 'select_validation_pack' rule definitions...`,
      `[SECURE API] Querying curated database views for identifier validation matching: ${orderId}...`,
      `[SECURE API] Success. Retrieved multi-system correlation trace buffers.`,
      `[MCP SERVER] Invoking 'fetch_correlated_logs' targeting telemetry store.`,
      `[COPILOT STUDIO] Correlating logs. Processing Expected Assertions state checks...`,
      `[COPILOT STUDIO] Asserting discrepancies. Dispatching state models to Gemini 3.5...`
    ];

    // Simulate logs appearing step by step for visual realism
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setRunLogs(prev => [...prev, steps[i]]);
    }

    try {
      const response = await fetch('/api/validate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          validationPackId: selectedPackId,
          orderId,
          transactionId,
          environment,
          uiObservedResult,
          simulateFail,
          customLogs,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error('Failed to validate test parameters');
      const data: TestValidationResponse = await response.json();
      
      await new Promise(resolve => setTimeout(resolve, 400));
      setValidationResult(data);
    } catch (err) {
      console.error(err);
      alert('Error validating test case pipeline.');
    } finally {
      setIsRunning(false);
    }
  };

  // Pre-fill fields on validation pack change
  useEffect(() => {
    if (currentPack.sampleCases && currentPack.sampleCases.length > 0) {
      const first = currentPack.sampleCases[0];
      applyPreset(first.title, first.inputs, first.simulateFail);
    }
  }, [selectedPackId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Configuration & Inputs - Left Column */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-[#16161A] border border-[#27272A] rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
          
          <h2 className="text-xl font-semibold text-[#E4E4E7] flex items-center gap-2 mb-6">
            <Sliders className="w-5 h-5 text-emerald-400" />
            1. Configure Test Parameters
          </h2>

          <div className="space-y-5">
            {/* Validation Pack Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">Select Validation Pack</label>
              <select
                value={selectedPackId}
                onChange={(e) => setSelectedPackId(e.target.value)}
                className="w-full bg-[#0F0F11] border border-[#27272A] rounded-lg px-3 py-2 text-[#E4E4E7] focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm transition-colors"
                id="validation-pack-dropdown"
              >
                {VALIDATION_PACKS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[#A1A1AA] mt-2 italic leading-relaxed">
                {currentPack.description}
              </p>
            </div>

            {/* Quick Presets */}
            {currentPack.sampleCases && currentPack.sampleCases.length > 0 && (
              <div className="bg-[#0F0F11] rounded-lg p-3 border border-[#27272A]">
                <span className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-widest mb-2">Pre-configured Demo Presets</span>
                <div className="space-y-2">
                  {currentPack.sampleCases.map((sc, idx) => (
                    <button
                      key={idx}
                      onClick={() => applyPreset(sc.title, sc.inputs, sc.simulateFail)}
                      className={`w-full text-left p-2.5 rounded text-xs transition-all border flex items-start gap-2 cursor-pointer ${
                        simulateFail === sc.simulateFail
                          ? 'bg-emerald-950/20 border-emerald-800 text-emerald-200'
                          : 'bg-[#16161A]/40 border-[#27272A] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#E4E4E7]'
                      }`}
                      type="button"
                    >
                      <Sparkles className="w-3.5 h-3.5 mt-0.5 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-semibold">{sc.title}</div>
                        <div className="text-[10px] text-[#A1A1AA]/80 line-clamp-2 mt-0.5">{sc.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Inputs form */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">Order ID</label>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full bg-[#0F0F11] border border-[#27272A] rounded-lg px-3 py-2 text-[#E4E4E7] focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm transition-colors"
                  id="order-id-input"
                />
              </div>

              {currentPack.requiredFields.includes('transactionId') && (
                <div>
                  <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">Transaction ID</label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full bg-[#0F0F11] border border-[#27272A] rounded-lg px-3 py-2 text-[#E4E4E7] focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm transition-colors"
                    id="transaction-id-input"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">Test Environment</label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="w-full bg-[#0F0F11] border border-[#27272A] rounded-lg px-3 py-2 text-[#E4E4E7] focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm transition-colors"
                  id="env-select"
                >
                  <option value="QA">QA (Branch-Local)</option>
                  <option value="Stage">Stage (Integration)</option>
                  <option value="Hotfix">Hotfix-Sand</option>
                  <option value="Prod">Prod (Read-only Dry)</option>
                </select>
              </div>

              <div className="flex items-center pt-6">
                <button
                  type="button"
                  onClick={() => setSimulateFail(prev => !prev)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${
                    simulateFail ? 'bg-rose-600' : 'bg-[#27272A]'
                  }`}
                  id="simulate-fail-toggle"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      simulateFail ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <div className="ml-3">
                  <span className="text-sm font-semibold text-[#E4E4E7]">Simulate Backend Failure</span>
                  <span className="block text-[10px] text-[#A1A1AA] font-normal">Forces state-leak assertions</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">Observed UI Outcome</label>
              <textarea
                rows={2}
                value={uiObservedResult}
                onChange={(e) => setUiObservedResult(e.target.value)}
                placeholder="Describe what the UI screen/action returned..."
                className="w-full bg-[#0F0F11] border border-[#27272A] rounded-lg px-3 py-2 text-[#E4E4E7] focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm transition-colors resize-none"
                id="ui-result-textarea"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider">Custom Log Context (Optional)</label>
                <span className="text-[10px] text-[#A1A1AA]/80">Injects custom warning string</span>
              </div>
              <textarea
                rows={2}
                value={customLogs}
                onChange={(e) => setCustomLogs(e.target.value)}
                placeholder="Paste database dumps, event packets, or local terminal output keys here..."
                className="w-full bg-[#0F0F11] border border-[#27272A] rounded-lg px-3 py-2 text-[#E4E4E7] focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm font-mono transition-colors resize-none"
                id="custom-logs-textarea"
              />
            </div>

            <button
              onClick={handleRunValidation}
              disabled={isRunning}
              className={`w-full py-3 h-12 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                isRunning 
                  ? 'bg-[#27272A] text-[#A1A1AA] cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-600/10 hover:scale-[1.01] active:scale-[0.99]'
              }`}
              type="button"
              id="validate-action-button"
            >
              {isRunning ? (
                <>
                  <Cpu className="w-5 h-5 animate-spin text-emerald-300" />
                  Orchestrating AI Asserter...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 text-emerald-300" />
                  Assert Trace Verification
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Action Progress & Validation Output - Right Column */}
      <div className="lg:col-span-7 space-y-6">
        {/* Real-time Agent Progress Console */}
        {isRunning && (
          <div className="bg-[#0F0F11] border border-[#27272A] rounded-2xl p-5 font-mono shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#27272A] text-xs font-semibold text-[#A1A1AA]">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>QA EXECUTOR AGENT CONSOLE</span>
              <span className="ml-auto flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                ACTIVE RUN
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-[#E4E4E7]">
              {runLogs.map((log, index) => (
                <div key={index} className="flex gap-2 leading-relaxed animate-fadeIn">
                  <span className="text-[#A1A1AA] shrink-0">{`[${new Date().toLocaleTimeString()}]`}</span>
                  <span>{log}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5 pt-1 text-emerald-400">
                <span className="animate-pulse">❯</span>
                <span className="text-[10px] tracking-widest text-emerald-400/80 uppercase">Gemini modeling evaluation running...</span>
              </div>
            </div>
          </div>
        )}

        {/* Ready / Waiting State */}
        {!isRunning && !validationResult && (
          <div className="bg-[#16161A] border border-dashed border-[#27272A] rounded-2xl p-12 text-center h-full flex flex-col justify-center items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/5 flex items-center justify-center border border-[#27272A] mb-4 shadow-xl">
              <Cpu className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-[#E4E4E7] mb-2">Intelligence Evidence Center</h3>
            <p className="text-sm text-[#A1A1AA] max-w-sm leading-relaxed mb-6">
              Configure parameters on the left and click **Assert Trace Verification** to launch the MCP Agent pipeline scan.
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              <span className="bg-[#0F0F11] text-[#A1A1AA] border border-[#27272A] px-2.5 py-1 rounded-lg text-xs">Verify API Logs</span>
              <span className="bg-[#0F0F11] text-[#A1A1AA] border border-[#27272A] px-2.5 py-1 rounded-lg text-xs">Ledger Reconciliation</span>
              <span className="bg-[#0F0F11] text-[#A1A1AA] border border-[#27272A] px-2.5 py-1 rounded-lg text-xs">Downstream Sync</span>
              <span className="bg-[#0F0F11] text-[#A1A1AA] border border-[#27272A] px-2.5 py-1 rounded-lg text-xs">Draft Jira Defect</span>
            </div>
          </div>
        )}

        {/* Validation Result Payload */}
        {!isRunning && validationResult && (
          <div className="space-y-6">
            {/* Header Result Card */}
            <div className={`border rounded-2xl p-6 shadow-xl relative overflow-hidden ${
              validationResult.status === 'PASS' 
                ? 'bg-emerald-950/20 border-emerald-800/80 shadow-emerald-950/5' 
                : validationResult.status === 'WARNING'
                ? 'bg-amber-950/20 border-amber-800/80 shadow-amber-950/5'
                : 'bg-rose-950/20 border-rose-800/80 shadow-rose-950/5'
            }`}>
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">Validation Result Status</span>
                  <h3 className="text-2xl font-bold flex items-center gap-3 mt-1">
                    {validationResult.status === 'PASS' && (
                      <>
                        <CheckCircle className="w-7 h-7 text-emerald-400 shrink-0" />
                        <span className="text-emerald-400 tracking-tight">PASS</span>
                      </>
                    )}
                    {validationResult.status === 'WARNING' && (
                      <>
                        <AlertTriangle className="w-7 h-7 text-amber-400 shrink-0" />
                        <span className="text-amber-400 tracking-tight">WARNING</span>
                      </>
                    )}
                    {validationResult.status === 'FAIL' && (
                      <>
                        <XCircle className="w-7 h-7 text-rose-400 shrink-0" />
                        <span className="text-rose-400 tracking-tight">FAIL</span>
                      </>
                    )}
                  </h3>
                  <p className="text-xs text-[#A1A1AA] mt-2">
                    Scope: <strong className="text-[#E4E4E7]">{validationResult.validationPackName}</strong> | Case ID: {orderId}
                  </p>
                </div>

                {validationResult.status !== 'PASS' && (
                  <button
                    onClick={() => onSendToTriage({
                      title: `[DEFECT] Downstream dispatch mismatch: ${validationResult.validationPackName}`,
                      summary: `Auto-generated by AI Test Validation Companion during ${validationResult.validationPackName} execution.\n\n` +
                                `* *Order ID:* ${orderId}\n` +
                                `* *Environment:* ${environment}\n` +
                                `* *Status:* ${validationResult.status}\n` +
                                `* *Evidence Summary:* ${validationResult.analysis.replace(/###/g, '')}`,
                      stepsToReproduce: `1. Setup test in ${environment}.\n2. Configure parameters for ${validationResult.validationPackName}.\n3. Trigger Action: observed outcome "${uiObservedResult}".`,
                      expectedBehavior: `Actions properly halted or authorized under standard business contract structures.`,
                      actualResult: `Verification Assertions failure in backend queues. Event pipeline mismatch reported.`,
                      logs: validationResult.logs
                    })}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 rounded-lg text-slate-100 text-xs font-semibold shadow-lg shadow-rose-955/40 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                    type="button"
                    id="route-to-triage"
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    Load to AI Bug Triage
                  </button>
                )}
              </div>
            </div>

            {/* Checklist of Assert State Checks */}
            <div className="bg-[#16161A] border border-[#27272A] rounded-2xl p-6 shadow-xl">
              <h4 className="text-sm font-semibold text-[#E4E4E7] uppercase tracking-wide mb-4">Backend Assertion Checklist</h4>
              <div className="space-y-3">
                {validationResult.checks.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#0F0F11] border border-[#27272A] text-xs">
                    <div className="flex items-start gap-3">
                      {c.status === 'PASS' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      ) : c.status === 'WARNING' ? (
                        <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <span className="font-semibold text-[#E4E4E7] block">{c.system}</span>
                        <span className="text-[#A1A1AA] font-mono tracking-wider text-[10px]">{c.check}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[#A1A1AA] uppercase tracking-widest text-[9px] block">EXPECTED vs ACTUAL</span>
                      <span className="font-semibold tracking-tight text-[#E4E4E7]">
                        {String(c.expected).toUpperCase()} vs{' '}
                        <span className={c.status === 'PASS' ? 'text-emerald-400' : 'text-rose-400'}>
                          {String(c.actual).toUpperCase()}
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulated Server logs trace feed */}
            <div className="bg-[#0F0F11] border border-[#27272A] rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3 border-b border-[#27272A] pb-2 text-xs font-semibold text-[#A1A1AA] font-mono">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  CORRELATED SYSTEMS LOG TRACE FEED
                </span>
                <span className="text-[10px] text-[#A1A1AA]">Trace: {orderId}</span>
              </div>
              <div className="space-y-1.5 font-mono text-[11px] max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 select-text leading-relaxed">
                {validationResult.logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 border-b border-[#27272A] pb-1 hover:bg-[#16161A] p-0.5 rounded transition-colors">
                    <span className="text-[#A1A1AA] font-light shrink-0 text-[10px]">{log.timestamp.slice(11, 19)}</span>
                    <span className={`text-[10px] uppercase font-bold shrink-0 w-32 border-r border-[#27272A] pr-1.5 text-right ${
                      log.service.includes('Gateway') ? 'text-cyan-400' : 'text-emerald-400'
                    }`}>{log.service.slice(0, 18)}</span>
                    <span className={`font-semibold shrink-0 uppercase text-[9px] px-1 rounded ${
                      log.level === 'error' ? 'bg-rose-950/60 text-rose-400 border border-rose-900/50' : 
                      log.level === 'warn' ? 'bg-amber-950/60 text-amber-400 border border-amber-900/50' : 
                      'bg-[#27272A] text-[#E4E4E7]'
                    }`}>{log.level}</span>
                    <span className={`flex-1 text-[#E4E4E7] leading-snug break-all ${log.level === 'error' ? 'text-rose-100 font-normal' : ''}`}>{log.message}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Reasoning Summary Cards */}
            <div className="bg-[#16161A] border border-[#27272A] rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-semibold text-[#E4E4E7]">Agentic AI Quality Analysis</h4>
              </div>
              <div className="text-[#E4E4E7] text-sm leading-relaxed p-4 bg-[#0F0F11] rounded-lg border border-[#27272A] prose prose-invert max-w-none prose-xs font-normal">
                {/* Visual rendering of clean custom markdown blocks */}
                {validationResult.analysis.split('\n\n').map((block, bIdx) => {
                  if (block.startsWith('###')) {
                    const title = block.replace('###', '').trim();
                    return <h5 key={bIdx} className="text-xs uppercase font-bold text-emerald-400 tracking-wider mb-2 mt-4 first:mt-0">{title}</h5>;
                  }
                  return <p key={bIdx} className="text-xs text-[#E4E4E7] leading-relaxed mb-3 whitespace-pre-wrap">{block}</p>;
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
