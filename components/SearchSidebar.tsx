import React from 'react';
import { Search, X } from 'lucide-react';
import { HistoryEventUI } from '../types';

interface SearchSidebarProps {
  query: string;
  results: HistoryEventUI[];
  duplicateWarning: string;
  onClose: () => void;
  onSelectResult: (results: HistoryEventUI[]) => void;
}

export const SearchSidebar: React.FC<SearchSidebarProps> = ({
  query,
  results,
  duplicateWarning,
  onClose,
  onSelectResult
}) => {
  return (
    <div className="fixed left-0 top-0 h-full w-80 bg-[#1a120b]/95 backdrop-blur-sm border-r border-amber-900/30 z-30 overflow-y-auto shadow-2xl">
      <div className="p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-amber-100 font-serif text-xl flex items-center gap-2">
            <Search className="w-5 h-5" />
            검색 결과
          </h2>
          <button
            onClick={onClose}
            className="text-amber-700 hover:text-amber-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 검색어 정보 */}
        <div className="mb-4 text-amber-800/80 text-sm font-serif">
          "{query}" 검색 결과 {results.length}개
        </div>

        {/* 중복 경고 */}
        {duplicateWarning && (
          <div className="mb-4 bg-amber-900/20 border border-amber-700/50 text-amber-200 px-3 py-2 rounded text-xs font-serif">
            <div className="flex items-start gap-2">
              <span className="text-amber-500">⚠</span>
              <div>
                <div className="font-bold mb-1">이미 추가된 검색어입니다</div>
                <div className="text-amber-300/80">
                  "{duplicateWarning}"는 이미 책에 추가되어 있습니다.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 결과 목록 */}
        <div className="space-y-3">
          {results.map((result, index) => (
            <div
              key={index}
              className="bg-amber-900/10 border border-amber-900/30 rounded-lg p-4 hover:bg-amber-900/20 transition-all cursor-pointer group"
              onClick={() => onSelectResult([result])}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-amber-100 font-serif font-bold text-base group-hover:text-amber-50">
                  {result.parsed.title}
                </h3>
                <span className="text-amber-700 text-xs font-serif whitespace-nowrap ml-2">
                  {result.parsed.year}
                </span>
              </div>
              <p className="text-amber-800/90 text-sm font-serif leading-relaxed">
                {result.parsed.description}
              </p>
              <div className="mt-3 text-amber-700/60 text-xs font-serif group-hover:text-amber-600">
                클릭하여 추가 →
              </div>
            </div>
          ))}
        </div>

        {/* 전체 추가 버튼 */}
        <button
          onClick={() => onSelectResult(results)}
          className="w-full mt-6 bg-amber-700 hover:bg-amber-600 text-amber-100 py-3 rounded-lg font-serif transition-colors shadow-lg"
        >
          전체 추가 ({results.length}개)
        </button>
      </div>
    </div>
  );
};
