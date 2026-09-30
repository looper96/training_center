import React, { useState, useMemo } from 'react';
import { MODULE_COMPONENTS } from '../data/pipelineDocs';
import { MODS } from '../data/pipelineSeed';
import { ModuleComponentData, SiteSettings, TrainingModule } from '../types/pipeline';
import { Search, Filter, BookOpen, Layers } from 'lucide-react';

interface DocsExplorerViewProps {
  onOpenModule: (moduleId: string) => void;
  components?: ModuleComponentData[];
  settings?: SiteSettings;
  modules?: TrainingModule[];
}

export const DocsExplorerView: React.FC<DocsExplorerViewProps> = ({ 
  onOpenModule,
  components,
  settings,
  modules
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const activeComponents = components || MODULE_COMPONENTS;
  const activeModules = modules || MODS;

  const types = useMemo(() => {
    return Array.from(new Set(activeComponents.map(c => c['نوع'])));
  }, [activeComponents]);

  const filteredComponents = useMemo(() => {
    return activeComponents.filter(item => {
      const matchMod = !selectedModule || item['ماژول'] === selectedModule;
      const matchLoc = !selectedLocation || item['موقعیت'].includes(selectedLocation);
      const matchType = !selectedType || item['نوع'] === selectedType;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery = !q || (
        item['جزء'].toLowerCase().includes(q) ||
        item['توضیح'].toLowerCase().includes(q) ||
        item['نوع'].toLowerCase().includes(q) ||
        item['منبع'].toLowerCase().includes(q)
      );
      return matchMod && matchLoc && matchType && matchQuery;
    });
  }, [activeComponents, searchQuery, selectedModule, selectedLocation, selectedType]);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-[#835500]" />
          <span className="text-xs font-bold text-[#835500]">مرکز مستندات و SOPهای عملیاتی</span>
        </div>
        <h1 className="text-2xl font-black text-[#1A1B1F] mb-1">
          اجزای ماژول‌های آموزشی ({activeComponents.length} جزء عملیاتی)
        </h1>
        <p className="text-xs text-[#524534]">
          جستجو و فیلتر زنده روی تمام سرفصل‌ها، SOPها، تسک‌های روزانه و رسپی‌های استخراج‌شده از اسناد عملیاتی اسنپ‌کیچن
        </p>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#524534] absolute right-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="جستجو در نام جزء، نوع، منبع یا توضیح..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAF8FE] border border-[#D7C3AE] text-[#1A1B1F] rounded-xl px-4 py-2 pr-10 text-xs focus:outline-none focus:border-[#F5A623]"
            />
          </div>

          <select
            value={selectedModule}
            onChange={e => setSelectedModule(e.target.value)}
            className="bg-[#FAF8FE] border border-[#D7C3AE] text-[#1A1B1F] rounded-xl px-3 py-2 text-xs min-w-[200px] w-full md:w-auto focus:outline-none focus:border-[#F5A623]"
          >
            <option value="">همه ماژول‌ها</option>
            {activeModules.map(m => (
              <option key={m.id} value={m.id}>{m.id} — {m.name}</option>
            ))}
          </select>

          <select
            value={selectedLocation}
            onChange={e => setSelectedLocation(e.target.value)}
            className="bg-[#FAF8FE] border border-[#D7C3AE] text-[#1A1B1F] rounded-xl px-3 py-2 text-xs min-w-[160px] w-full md:w-auto focus:outline-none focus:border-[#F5A623]"
          >
            <option value="">همه موقعیت‌ها</option>
            <option value="Hub">Hub</option>
            <option value="SuperHub">SuperHub</option>
            <option value="irancell">irancell</option>
          </select>

          <span className="bg-[#F5A623] text-[#1A1B1F] px-4 py-2 rounded-full font-bold text-xs whitespace-nowrap shadow-xs">
            {filteredComponents.length} مورد
          </span>
        </div>

        {/* Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedType('')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              !selectedType
                ? 'bg-[#F5A623] text-[#1A1B1F] shadow-xs'
                : 'bg-[#FAF8FE] text-[#524534] hover:bg-[#F3EEFA] border border-[#E3E2E7]'
            }`}
          >
            همه نوع‌ها
          </button>
          {types.map(t => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                selectedType === t
                  ? 'bg-[#F5A623] text-[#1A1B1F] shadow-xs'
                  : 'bg-[#FAF8FE] text-[#524534] hover:bg-[#F3EEFA] border border-[#E3E2E7]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E3E2E7] rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#FAF8FE] text-[#524534] font-bold border-b border-[#E3E2E7]">
                <th className="py-3.5 px-4">ماژول</th>
                <th className="py-3.5 px-4">نام جزء</th>
                <th className="py-3.5 px-3">نوع</th>
                <th className="py-3.5 px-3">منبع</th>
                <th className="py-3.5 px-4">توضیح و خلاصه</th>
                <th className="py-3.5 px-4">موقعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E2E7]">
              {filteredComponents.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#FAF8FE] transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <button
                      onClick={() => onOpenModule(item['ماژول'])}
                      className="bg-amber-100 hover:bg-amber-200 text-[#835500] px-2.5 py-1 rounded-lg font-bold font-mono transition-colors"
                      title="کلیک برای باز کردن داک این ماژول"
                    >
                      {item['ماژول']}
                    </button>
                  </td>
                  <td className="py-3 px-4 font-bold text-[#1A1B1F] max-w-xs">
                    <div
                      onClick={() => onOpenModule(item['ماژول'])}
                      className="cursor-pointer hover:text-[#835500] transition-colors"
                    >
                      {item['جزء']}
                    </div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="text-[11px] bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full text-[#524534]">
                      {item['نوع']}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#524534] whitespace-nowrap text-[11px]">
                    {item['منبع']}
                  </td>
                  <td className="py-3 px-4 text-[#524534] max-w-sm leading-relaxed">
                    <div className="line-clamp-2">{item['توضیح']}</div>
                    {item.customValues && Object.keys(item.customValues).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1 pt-1 border-t border-[#E3E2E7] text-[10px]">
                        {Object.entries(item.customValues).map(([k, v]) => {
                          const def = settings?.componentCustomFields?.find(f => f.key === k);
                          return (
                            <span key={k} className="bg-amber-50 text-[#835500] border border-amber-200 px-1.5 py-0.2 rounded font-mono">
                              {def?.label || k}: {String(v)}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="text-[11px] text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full font-semibold">
                      {item['موقعیت']}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
