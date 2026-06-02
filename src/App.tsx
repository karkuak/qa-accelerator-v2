import React, { useState } from 'react';
import TestAutomationCompanion from './components/TestAutomationCompanion';
import BugTriageSpecialist from './components/BugTriageSpecialist';
import ValidationPacksViewer from './components/ValidationPacksViewer';
import { 
  Sparkles, 
  Cpu, 
  Layers, 
  FileCheck, 
  AlertOctagon, 
  Bug, 
  Database,
  ArrowRight,
  BookOpen,
  FolderLock
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'validation' | 'triage' | 'packs'>('validation');
  
  // Shared state to route parameters between Engine 1 and Engine 2
  const [prefilledBug, setPrefilledBug] = useState<{
    title: string;
    summary: string;
    stepsToReproduce: string;
    expectedBehavior: string;
    actualResult: string;
    logs: any[];
  } | null>(null);

  const handleSendToTriage = (bugData: typeof prefilledBug) => {
    setPrefilledBug(bugData);
    setActiveTab('triage');
  };

  return (
    <div className="min-h-screen bg-[#0F0F11] text-[#E4E4E7] flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Sleek Enterprise Top Banner Header */}
      <header className="border-b border-[#27272A] bg-[#0F0F11]/85 sticky top-0 backdrop-blur-md z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          
          {/* Logo Brand Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#16161A] border border-[#27272A] flex items-center justify-center shadow-xl shrink-0">
              <Cpu className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold tracking-tight text-[#E4E4E7]">QA ACCELERATOR</h1>
                <span className="bg-[#27272A] text-emerald-400 font-extrabold px-2 py-0.5 rounded text-[9px] border border-[#27272A] tracking-wider">MVP</span>
              </div>
              <p className="text-[10px] text-[#A1A1AA] font-medium">Agentic AI Platform for Test Validation & Defect Intelligence</p>
            </div>
          </div>

          {/* Real-time details */}
          <div className="flex items-center gap-4 text-xs font-mono text-[#A1A1AA]">
            <div className="hidden md:flex items-center gap-1.5 bg-[#16161A] px-3 py-1.5 border border-[#27272A] rounded-lg">
              <FolderLock className="w-3.5 h-3.5 text-[#A1A1AA]" />
              <span>Context: <strong className="text-[#E4E4E7]">Enterprise Sandbox</strong></span>
            </div>
            <div>UTC T: <strong>2026-06-02</strong></div>
          </div>

        </div>
      </header>

      {/* Primary Landing Dashboard Layout */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-8">
        
        {/* Core Description Lead Block */}
        <div className="bg-[#16161A] border border-[#27272A] rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2 max-w-2xl">
              <h2 className="text-lg font-semibold text-[#E4E4E7]">Continuous AI-Powered Quality Assurance Loop</h2>
              <p className="text-xs text-[#A1A1AA] leading-relaxed font-normal">
                An integrated agile workspace mapping physical test verification to immediate defect risk mapping. 
                Execute validating trace assertion checklists (Engine 1) to identify discrepancies, and optionally route failure patterns 
                straight to the interactive defect severity risk calculator (Engine 2) to draft enriched Jira bug descriptions.
              </p>
            </div>
            
            {/* Quick stats indicators */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div className="p-3 bg-[#0F0F11] rounded-xl border border-[#27272A] text-center min-w-[124px]">
                <span className="text-[8px] text-[#A1A1AA] block uppercase font-bold tracking-widest leading-none">MCP APIs Active</span>
                <span className="text-sm font-bold text-emerald-400 block mt-1.5">6 Core Tools</span>
              </div>
              <div className="p-3 bg-[#0F0F11] rounded-xl border border-[#27272A] text-center min-w-[124px]">
                <span className="text-[8px] text-[#A1A1AA] block uppercase font-bold tracking-widest leading-none">LLM Configured</span>
                <span className="text-sm font-bold text-indigo-400 block mt-1.5">Gemini 3.5</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Nav Tabs Bar */}
        <div className="flex border-b border-[#27272A] gap-2 overflow-x-auto pb-px">
          {[
            { id: 'validation', label: 'AI Test Validation', icon: FileCheck, activeColor: 'border-emerald-500 text-emerald-400 bg-[#16161A]' },
            { id: 'triage', label: 'Bug Triage & Impact Analyzer', icon: Bug, activeColor: 'border-pink-500 text-pink-400 bg-[#16161A]' },
            { id: 'packs', label: 'Validation Packs Library', icon: BookOpen, activeColor: 'border-emerald-500 text-emerald-400 bg-[#16161A]' }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 shrink-0 cursor-pointer ${
                  isActive
                    ? `${tab.activeColor} rounded-t-lg`
                    : 'border-transparent text-[#A1A1AA] hover:text-[#E4E4E7] hover:border-[#27272A]'
                }`}
                type="button"
                id={`tab-nav-${tab.id}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${
                  isActive ? '' : 'text-[#71717A]'
                }`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic tab contents panel */}
        <div className="animate-fadeIn">
          {activeTab === 'validation' && (
            <TestAutomationCompanion onSendToTriage={handleSendToTriage} />
          )}
          {activeTab === 'triage' && (
            <BugTriageSpecialist prefilledBug={prefilledBug} />
          )}
          {activeTab === 'packs' && (
            <ValidationPacksViewer />
          )}
        </div>

      </main>

      {/* Symmetrical Footer */}
      <footer className="border-t border-[#27272A] mt-12 py-6 px-6 text-center text-xs bg-[#16161A]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-[#A1A1AA]">
          <p>© {new Date().getFullYear()} QA Accelerator Enterprise Platform. Read-Scope DRY active.</p>
          <div className="flex gap-4">
            <span className="hover:text-[#E4E4E7] transition-colors">Copilot Studio Integration</span>
            <span>•</span>
            <span className="hover:text-[#E4E4E7] transition-colors">MCP Protocol v1.4</span>
            <span>•</span>
            <span className="hover:text-[#E4E4E7] transition-colors">Retail Tech Standard</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
