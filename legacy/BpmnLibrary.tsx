import React, { useState } from 'react';
import { BPMN_DOCUMENTS } from '../data/trainingData';
import { BpmnDocument, BpmnStep } from '../types';
import { 
  GitFork, 
  Layers, 
  ShieldAlert, 
  CheckCircle, 
  HelpCircle, 
  Play, 
  RotateCcw, 
  ArrowLeft, 
  Tag, 
  FileSpreadsheet,
  AlertTriangle,
  Lightbulb,
  Building2,
  Truck,
  UserCheck,
  Cpu
} from 'lucide-react';

interface BpmnLibraryProps {
  initialBpmnId?: string;
}

export const BpmnLibrary: React.FC<BpmnLibraryProps> = ({ initialBpmnId }) => {
  const [selectedDocId, setSelectedDocId] = useState<string>(initialBpmnId || 'receiving');
  const [simulatingStepIndex, setSimulatingStepIndex] = useState<number | null>(null);
  const [decisionHistory, setDecisionHistory] = useState<Record<number, boolean>>({});

  const activeDoc: BpmnDocument = BPMN_DOCUMENTS.find(d => d.id === selectedDocId) || BPMN_DOCUMENTS[0];

  const handleStartSim = () => {
    setSimulatingStepIndex(0);
    setDecisionHistory({});
  };

  const handleNextStep = () => {
    if (simulatingStepIndex !== null && simulatingStepIndex < activeDoc.steps.length - 1) {
      setSimulatingStepIndex(simulatingStepIndex + 1);
    } else {
      setSimulatingStepIndex(null);
    }
  };

  const handleResetSim = () => {
    setSimulatingStepIndex(null);
    setDecisionHistory({});
  };

  const getActorIcon = (actor: string) => {
    if (actor.includes('راننده')) return <Truck className="w-4 h-4 text-amber-600" />;
    if (actor.includes('انباردار') || actor.includes('پرسنل')) return <UserCheck className="w-4 h-4 text-blue-600" />;
    if (actor.includes('سرپرست')) return <Building2 className="w-4 h-4 text-purple-600" />;
    return <Cpu className="w-4 h-4 text-emerald-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs px-2.5 py-0.5 rounded-full font-bold">
                کتابخانه فرآیندها و فلوچارت‌های BPMN
              </span>
              <span className="text-slate-400 text-xs">• ۴ سند مرجع عملیاتی OE</span>
            </div>
            <h2 className="text-2xl font-black text-white">
              کتابخانه تعاملی فلوچارت‌های استاندارد عملیاتی (SOP)
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              این ۴ فلوچارت از روی اسناد بصری BPMN اسنپ‌کیچن استخراج و مدل‌سازی شده‌اند: فرآیند دریافت کالا از راننده، کنترل و امحای ضایعات، چیدمان و قفسه‌بندی (Stow)، و رویه‌های اختصاصی شعب ایرانسل.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStartSim}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all"
            >
              <Play className="w-4 h-4" />
              <span>شروع شبیه‌سازی گام‌به‌گام</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Process Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {BPMN_DOCUMENTS.map((doc) => {
          const isSelected = doc.id === selectedDocId;
          return (
            <button
              key={doc.id}
              onClick={() => {
                setSelectedDocId(doc.id);
                handleResetSim();
              }}
              className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-white border-rose-500 shadow-md shadow-rose-500/10 ring-2 ring-rose-500/20'
                  : 'bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {doc.code}
                  </span>
                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                    {doc.mappedModule}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 leading-snug">
                  {doc.title}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5 dir-ltr text-right truncate">
                  {doc.englishTitle}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">{doc.steps.length} گام فرآیندی</span>
                <span className={`font-semibold ${
                  doc.importance === 'حیاتی' ? 'text-red-600' : 'text-slate-700'
                }`}>
                  اهمیت {doc.importance}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Simulation Controller (When Active) */}
      {simulatingStepIndex !== null && (
        <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10 border-2 border-rose-500 rounded-3xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <span className="text-xs font-black text-rose-800">
                در حال شبیه‌سازی گام‌به‌گام: گام {simulatingStepIndex + 1} از {activeDoc.steps.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetSim}
                className="text-xs bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded-xl font-medium flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>پایان شبیه‌سازی</span>
              </button>
              <button
                onClick={handleNextStep}
                className="text-xs bg-rose-600 hover:bg-rose-500 text-white px-4 py-1.5 rounded-xl font-bold flex items-center gap-1 shadow-xs"
              >
                <span>گام بعدی</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Active Step Highlight Card */}
          <div className="bg-white border border-rose-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-rose-600 text-white text-xs font-black px-2 py-0.5 rounded-lg">
                گام {activeDoc.steps[simulatingStepIndex].stepNumber}
              </span>
              <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1.5">
                {getActorIcon(activeDoc.steps[simulatingStepIndex].actor)}
                مسئول اجرا: {activeDoc.steps[simulatingStepIndex].actor}
              </span>
            </div>

            <h4 className="text-sm font-bold text-slate-900 mb-1">
              {activeDoc.steps[simulatingStepIndex].title}
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed mb-3">
              {activeDoc.steps[simulatingStepIndex].action}
            </p>

            {/* Decision Gate Prompt if exists */}
            {activeDoc.steps[simulatingStepIndex].decisionGate && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs mb-3">
                <span className="font-bold text-amber-900 block mb-1 flex items-center gap-1">
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                  تصمیم‌گیری شرطی (Decision Gateway BPMN):
                </span>
                <p className="text-amber-800 mb-2 font-medium">
                  {activeDoc.steps[simulatingStepIndex].decisionGate?.condition}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDecisionHistory(prev => ({ ...prev, [simulatingStepIndex]: true }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      decisionHistory[simulatingStepIndex] === true
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                    }`}
                  >
                    بله: {activeDoc.steps[simulatingStepIndex].decisionGate?.yesNext}
                  </button>
                  <button
                    onClick={() => setDecisionHistory(prev => ({ ...prev, [simulatingStepIndex]: false }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      decisionHistory[simulatingStepIndex] === false
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-red-700 border-red-300 hover:bg-red-50'
                    }`}
                  >
                    خیر: {activeDoc.steps[simulatingStepIndex].decisionGate?.noNext}
                  </button>
                </div>
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>
                <strong>کنترل حیاتی کیفیت:</strong> {activeDoc.steps[simulatingStepIndex].criticalCheck}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Selected Document Details & Swimlanes Visualizer */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
        {/* Document Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-slate-900 text-white px-2.5 py-0.5 rounded-lg">
                {activeDoc.code}
              </span>
              <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                متناظر با: {activeDoc.mappedModuleName} ({activeDoc.mappedModule})
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {activeDoc.title}
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              {activeDoc.englishTitle}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl pt-1">
              {activeDoc.summary}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 min-w-[220px]">
            <span className="text-[11px] font-bold text-slate-700 block mb-2">
              نقش‌ها و لاین‌های اجرایی (Lanes):
            </span>
            <div className="space-y-1.5">
              {activeDoc.lanes.map((lane, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                  {getActorIcon(lane)}
                  <span>{lane}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BPMN Step Flowchart Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <GitFork className="w-4 h-4 text-rose-600" />
              توالی گام‌های فرآیند و شرط‌های تصمیم‌گیری (BPMN Workflow)
            </h3>
            <span className="text-xs text-slate-500">
              {activeDoc.steps.length} گام تعریف شده
            </span>
          </div>

          <div className="relative space-y-4 before:absolute before:right-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
            {activeDoc.steps.map((step, idx) => {
              const isSimActive = simulatingStepIndex === idx;
              return (
                <div
                  key={step.stepNumber}
                  className={`relative pr-12 transition-all ${
                    isSimActive ? 'scale-[1.01]' : ''
                  }`}
                >
                  {/* Step Node Dot */}
                  <div className={`absolute right-4 top-4 -translate-y-1/2 w-5 h-5 rounded-full border-4 transition-all flex items-center justify-center text-[10px] font-bold z-10 ${
                    isSimActive
                      ? 'bg-rose-600 border-white ring-4 ring-rose-300 text-white'
                      : 'bg-white border-slate-400 text-slate-700'
                  }`}>
                    {step.stepNumber}
                  </div>

                  {/* Step Card */}
                  <div className={`border rounded-2xl p-4 transition-all ${
                    isSimActive
                      ? 'bg-rose-50/50 border-rose-400 shadow-md ring-2 ring-rose-500/20'
                      : 'bg-slate-50/70 hover:bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                          {step.oeStandardCode}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">
                          {step.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg">
                        {getActorIcon(step.actor)}
                        <span>{step.actor}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed mb-3">
                      {step.action}
                    </p>

                    {/* Decision Gateway */}
                    {step.decisionGate && (
                      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs mb-2">
                        <span className="font-bold text-amber-900 block mb-1 flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                          شرط دروازه تصمیم (Decision Gateway):
                        </span>
                        <p className="text-amber-800 mb-1.5 font-medium">
                          {step.decisionGate.condition}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-1.5 rounded-lg flex items-center gap-1">
                            <span className="font-bold">✓ مسیر تایید:</span>
                            <span>{step.decisionGate.yesNext}</span>
                          </div>
                          <div className="bg-red-50 text-red-800 border border-red-200 p-1.5 rounded-lg flex items-center gap-1">
                            <span className="font-bold">✗ مسیر عدم انطباق:</span>
                            <span>{step.decisionGate.noNext}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Critical Check */}
                    <div className="flex items-start gap-2 text-[11px] text-slate-600 bg-white border border-slate-200 rounded-xl p-2.5">
                      <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-slate-900">کنترل بحرانی (Critical Checkpoint):</strong> {step.criticalCheck}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Golden Rules Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <h4 className="text-xs font-bold text-amber-900 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            قوانین طلایی و خطوط قرمز این فرآیند در اسنپ‌کیچن:
          </h4>
          <ul className="space-y-1.5">
            {activeDoc.goldenRules.map((rule, idx) => (
              <li key={idx} className="text-xs text-amber-800 flex items-start gap-2 bg-white/70 p-2 rounded-xl border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 flex-shrink-0" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
