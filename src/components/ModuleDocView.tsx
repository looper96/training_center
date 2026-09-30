import React, { useState, useEffect } from 'react';
import { DOCS_DATA } from '../data/pipelineDocContent';
import { MODS } from '../data/pipelineSeed';
import { ModuleComponentData, TrainingModule } from '../types/pipeline';
import { BookOpen, ArrowLeft, Layers, FileText } from 'lucide-react';

interface ModuleDocViewProps {
  moduleId: string;
  onNavigateToExplorer: () => void;
  components?: ModuleComponentData[];
  modules?: TrainingModule[];
}

export const ModuleDocView: React.FC<ModuleDocViewProps> = ({ moduleId, onNavigateToExplorer, components, modules }) => {
  const [selectedDocIndex, setSelectedDocIndex] = useState<number>(0);

  const allMods = modules || MODS;
  const moduleInfo = allMods.find(m => m.id === moduleId) || allMods[0] || { id: moduleId, name: moduleId, loc: '' };
  const docsList = DOCS_DATA[moduleId] || [];

  const dynamicModuleComps = (components || []).filter(c => c['ماژول'] === moduleId);

  // Reset index when moduleId changes
  useEffect(() => {
    setSelectedDocIndex(0);
  }, [moduleId]);

  const activeDoc = docsList[selectedDocIndex] || docsList[0];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#835500] text-white px-2.5 py-0.5 rounded-lg font-mono font-bold text-xs">
              {moduleInfo.id}
            </span>
            <span className="text-xs text-[#524534]">{moduleInfo.loc}</span>
          </div>
          <h1 className="text-2xl font-black text-[#1A1B1F]">
            {moduleInfo.id} — {moduleInfo.name}
          </h1>
          <p className="text-xs text-[#524534] mt-1">
            داک آموزشی تفصیلی شامل {docsList.length} جزء و استاندارد عملیاتی
          </p>
        </div>

        <button
          onClick={onNavigateToExplorer}
          className="text-xs text-[#835500] hover:text-[#5c3c00] font-bold flex items-center gap-1.5 self-start md:self-auto bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3.5 py-2 rounded-xl transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>مشاهده جدول کلی اجزا</span>
        </button>
      </div>

      {/* Selector Toolbar */}
      <div className="bg-white border border-[#E3E2E7] rounded-3xl p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <label className="text-xs font-bold text-[#524534] whitespace-nowrap">انتخاب سند یا جزء آموزشی:</label>
        <select
          value={selectedDocIndex}
          onChange={e => setSelectedDocIndex(Number(e.target.value))}
          className="bg-[#FAF8FE] border border-[#D7C3AE] text-[#1A1B1F] rounded-xl px-3 py-2 text-xs flex-1 w-full focus:outline-none focus:border-[#F5A623]"
        >
          {docsList.map((doc, idx) => (
            <option key={idx} value={idx}>
              {idx + 1}. {doc.t}
            </option>
          ))}
        </select>
        <span className="bg-amber-50 text-[#835500] border border-amber-200 px-3 py-1.5 rounded-full font-bold text-xs whitespace-nowrap">
          {docsList.length} سند
        </span>
      </div>

      {/* Rendered Document Body */}
      {activeDoc ? (
        <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E3E2E7] pb-3">
            <FileText className="w-5 h-5 text-[#835500]" />
            <h2 className="text-lg font-bold text-[#1A1B1F]">
              {activeDoc.t}
            </h2>
          </div>

          <div
            className="text-xs leading-relaxed text-[#1A1B1F] space-y-3 prose max-w-none [&_table]:w-full [&_table]:text-right [&_table]:border-collapse [&_th]:bg-[#FAF8FE] [&_th]:text-[#835500] [&_th]:p-2.5 [&_th]:border-b [&_th]:border-[#E3E2E7] [&_td]:p-2.5 [&_td]:border-b [&_td]:border-[#E3E2E7] [&_ul]:list-disc [&_ul]:pr-5 [&_p]:my-2 [&_h3]:text-[#835500] [&_h3]:font-bold [&_h3]:text-sm [&_h3]:mt-4 [&_strong]:text-[#1A1B1F]"
            dangerouslySetInnerHTML={{ __html: activeDoc.h }}
          />
        </div>
      ) : (
        <div className="bg-white border border-[#E3E2E7] rounded-3xl text-center py-16 text-[#524534] text-xs">
          محتوایی برای این ماژول ثبت نشده است.
        </div>
      )}

      {/* Dynamic Module Components list from Admin */}
      {dynamicModuleComps.length > 0 && (
        <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#E3E2E7] pb-2">
            <h3 className="text-xs font-bold text-[#1A1B1F] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#835500]" />
              <span>اجزای عملیاتی ثبت‌شده در سامانه برای ماژول {moduleId} ({dynamicModuleComps.length} جزء)</span>
            </h3>
            <span className="text-[11px] text-[#524534]">مدیریت‌پذیر از پنل ادمین</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {dynamicModuleComps.map((c, idx) => (
              <div key={idx} className="bg-[#FAF8FE] p-4 rounded-2xl border border-[#E3E2E7] space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-[#1A1B1F] text-xs">{c['جزء']}</strong>
                  <span className="bg-amber-100 text-[#835500] text-[10px] font-bold px-2 py-0.5 rounded-full">{c['نوع']}</span>
                </div>
                <p className="text-[#524534] text-[11px] leading-relaxed line-clamp-2">
                  {c['توضیح']}
                </p>
                <div className="flex items-center justify-between text-[10px] text-[#835500] pt-1 border-t border-[#E3E2E7]">
                  <span>منبع: {c['منبع']}</span>
                  <span className="font-semibold">{c['موقعیت']}</span>
                </div>
                {c.customValues && Object.keys(c.customValues).length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1 text-[10px]">
                    {Object.entries(c.customValues).map(([k, v]) => (
                      <span key={k} className="bg-white border border-[#E3E2E7] text-[#524534] px-1.5 py-0.2 rounded font-mono">
                        {k}: {String(v)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
