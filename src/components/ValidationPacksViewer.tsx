import React, { useState } from 'react';
import { VALIDATION_PACKS } from '../validationPacks';
import { ValidationPack } from '../types';
import { Bookmark, ClipboardList, ShieldCheck, Cpu, Code, BookOpen } from 'lucide-react';

export default function ValidationPacksViewer() {
  const [activePackId, setActivePackId] = useState<string>('payments');
  const activePack = VALIDATION_PACKS.find(p => p.id === activePackId) || VALIDATION_PACKS[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
      {/* Packs Navigation Directory - Left Sidebar */}
      <div className="md:col-span-4 space-y-3">
        <div className="bg-[#16161A] border border-[#27272A] rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#27272A]">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-widest">Enterprise Library Directory</h3>
          </div>
          
          <div className="space-y-1.5">
            {VALIDATION_PACKS.map((pack) => (
              <button
                key={pack.id}
                onClick={() => setActivePackId(pack.id)}
                className={`w-full text-left p-3.5 rounded-xl flex items-center justify-between border transition-all cursor-pointer ${
                  activePackId === pack.id
                    ? 'bg-emerald-950/20 border-emerald-800 text-emerald-300 shadow-md shadow-emerald-950/5'
                    : 'bg-[#0F0F11] border-[#27272A] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#E4E4E7]'
                }`}
                type="button"
                id={`pack-tab-${pack.id}`}
              >
                <div>
                  <span className="font-semibold text-xs block leading-tight">{pack.name}</span>
                  <span className="text-[10px] text-[#A1A1AA]/80 font-medium block mt-1">{pack.category}</span>
                </div>
                <Bookmark className={`w-3.5 h-3.5 shrink-0 ${activePackId === pack.id ? 'text-emerald-400 fill-emerald-500/20' : 'text-slate-600'}`} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Pack Constraints Specs - Right Column */}
      <div className="md:col-span-8">
        <div className="bg-[#16161A] border border-[#27272A] rounded-2xl p-6 shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>

          {/* Title Area */}
          <div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">Validation Spec Sheet</span>
            <h2 className="text-xl font-bold text-[#E4E4E7]">{activePack.name}</h2>
            <p className="text-xs text-[#A1A1AA] mt-2 leading-relaxed italic">{activePack.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Required Input Headers */}
            <div className="space-y-3 bg-[#0F0F11] p-4 border border-[#27272A] rounded-xl">
              <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center gap-1.5 leading-tight">
                <Code className="w-3.5 h-3.5 text-emerald-400" />
                Required Pipeline Inputs
              </span>
              <div className="space-y-1.5 pt-1">
                {activePack.requiredFields.map((field) => (
                  <div key={field} className="flex items-center justify-between text-xs py-1 border-b border-[#27272A]/40 last:border-0">
                    <span className="text-[#A1A1AA] font-mono italic">{field}</span>
                    <span className="bg-[#16161A] text-[#A1A1AA] px-1.5 py-0.5 rounded text-[9px] font-bold border border-[#27272A]">MANDATORY</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulated MCP Integrations */}
            <div className="space-y-3 bg-[#0F0F11] p-4 border border-[#27272A] rounded-xl">
              <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center gap-1.5 leading-tight">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                Integrated MCP Schema Mappings
              </span>
              <div className="space-y-1 text-xs pt-1 text-[#A1A1AA]">
                <div className="flex justify-between py-1 border-b border-[#27272A]/40">
                  <span>Primary DB Catalog</span>
                  <span className="text-[#A1A1AA] font-mono">{activePack.id === 'payments' ? 'payments_db' : 'logistics_db'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#27272A]/40">
                  <span>Message Queue Channel</span>
                  <span className="text-[#A1A1AA] font-mono">kafka.retail.{activePack.id}.events</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Dry API Read-Scope</span>
                  <span className="text-emerald-500 font-mono text-[10px] font-bold">AUTHORIZED_RO</span>
                </div>
              </div>
            </div>
          </div>

          {/* System checklists Assert constraints */}
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-[#27272A]">
              <ClipboardList className="w-4 h-4 text-emerald-400" />
              Pre-Configured Domain State Expectations
            </span>

            <div className="space-y-2">
              {activePack.expectedChecks.map((chk, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-[#0F0F11] border border-[#27272A] text-xs">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-[#E4E4E7] block leading-tight">{chk.system}</span>
                      <span className="text-[#A1A1AA] text-[10px] font-mono mt-0.5 block">{chk.check}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[9px] text-[#A1A1AA] uppercase tracking-wider block">EXPECTED VAL</span>
                    <span className="bg-[#16161A] text-[#E4E4E7] font-bold px-2 py-0.5 rounded text-[10px] border border-[#27272A]">
                      {String(chk.expected).toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
