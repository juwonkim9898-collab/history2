import React, { useState, useEffect } from 'react';
import { MainLayout } from "@/components/layout/MainLayout";
import { Grimoire } from '@/grimoire/components/Grimoire';
import { fetchHistoryStory } from '@/grimoire/services/geminiService';
import { historyDB } from '@/grimoire/services/db';
import { HistoryEvent, AppState, KOREAN_UI_TEXTS } from '@/grimoire/types';
import { Search, Sparkles, Feather, Trash2, Tag, X } from 'lucide-react';
import ErrorBoundary from '@/grimoire/components/ErrorBoundary';

// CSS 애니메이션 추가
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;
if (!document.head.querySelector('style[data-grimoire]')) {
  styleSheet.setAttribute('data-grimoire', 'true');
  document.head.appendChild(styleSheet);
}

const History = () => {
  const [query, setQuery] = useState('');
  const [historyContent, setHistoryContent] = useState<HistoryEvent[]>([]);
  const [filteredContent, setFilteredContent] = useState<HistoryEvent[]>([]);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [flipTrigger, setFlipTrigger] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [duplicateWarning, setDuplicateWarning] = useState<string>('');
  const [searchResults, setSearchResults] = useState<HistoryEvent[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (selectedTag) {
      const filtered = historyContent.filter(item => item.tag === selectedTag);
      setFilteredContent(filtered);
    } else {
      setFilteredContent(historyContent);
    }
  }, [selectedTag, historyContent]);

  const loadHistory = async () => {
    const history = await historyDB.getAll();
    const tags = await historyDB.getAllTags();

    if (history.length > 0) {
      setHistoryContent(history);
      setFilteredContent(history);
      setAppState(AppState.READING);
    }
    setAvailableTags(tags);
  };

  const handleSearch = async (e?: React.FormEvent | string) => {
    if (typeof e !== 'string' && e) e.preventDefault();

    const searchTerm = typeof e === 'string' ? e : query;
    if (!searchTerm.trim()) return;

    setAppState(AppState.LOADING);
    setErrorMessage('');
    setDuplicateWarning('');

    const isDuplicate = await historyDB.hasTag(searchTerm);
    if (isDuplicate) {
      setDuplicateWarning(`"${searchTerm}"는 이미 검색한 키워드입니다`);
    }

    try {
      const results = await fetchHistoryStory(searchTerm);
      setSearchResults(results);
      setShowSidebar(true);
      setAppState(AppState.READING);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
      setAppState(AppState.ERROR);
      setSearchResults([]);
      setShowSidebar(false);
    }
  };

  const handleSelectResult = async (event: HistoryEvent) => {
    try {
      await historyDB.add([event], query);
      await loadHistory();
      setFlipTrigger(prev => prev + 1);
      setShowSidebar(false);
      setSearchResults([]);
      setQuery('');
      setDuplicateWarning('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '기록 추가 중 오류가 발생했습니다.');
      setAppState(AppState.ERROR);
    }
  };

  const handleAddAllResults = async () => {
    if (searchResults.length === 0) return;

    try {
      await historyDB.add(searchResults, query);
      await loadHistory();
      setFlipTrigger(prev => prev + 1);
      setShowSidebar(false);
      setSearchResults([]);
      setQuery('');
      setDuplicateWarning('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '기록 추가 중 오류가 발생했습니다.');
      setAppState(AppState.ERROR);
    }
  };

  const handleReset = async () => {
    if (window.confirm(KOREAN_UI_TEXTS.confirmReset)) {
      await historyDB.clear();
      setHistoryContent([]);
      setFilteredContent([]);
      setAvailableTags([]);
      setSelectedTag('');
      setAppState(AppState.IDLE);
      setFlipTrigger(prev => prev + 1);
    }
  };

  const handleTagFilter = (tag: string) => {
    setSelectedTag(tag === selectedTag ? '' : tag);
  };

  return (
    <MainLayout>
      <div 
        className="min-h-screen relative"
        style={{
          backgroundImage: 'url(/library-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* 어두운 오버레이 */}
        <div className="absolute inset-0 bg-black/50"></div>
        
        {/* 컨텐츠 */}
        <div className="relative z-10">
        {/* 사이드바 */}
        {showSidebar && (
          <div className="fixed left-0 top-0 h-full w-80 bg-amber-50 shadow-2xl z-50 overflow-y-auto border-r-4 border-amber-900">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-amber-900">검색 결과</h2>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-2 hover:bg-amber-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-amber-900" />
                </button>
              </div>

              {duplicateWarning && (
                <div className="mb-4 p-3 bg-yellow-100 border-2 border-yellow-600 rounded-lg">
                  <p className="text-sm text-yellow-800 font-medium">{duplicateWarning}</p>
                  <p className="text-xs text-yellow-700 mt-1">그래도 추가할 수 있습니다</p>
                </div>
              )}

              {searchResults.length > 0 && (
                <button
                  onClick={handleAddAllResults}
                  className="w-full mb-4 px-4 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors font-medium"
                >
                  전체 추가 ({searchResults.length}개)
                </button>
              )}

              <div className="space-y-4">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    onClick={() => handleSelectResult(result)}
                    className="p-4 bg-white rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer border-2 border-amber-200 hover:border-amber-400"
                  >
                    <h3 className="font-bold text-lg text-amber-900 mb-2">{result.title}</h3>
                    <p className="text-sm text-amber-700 mb-2">{result.year}</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{result.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="container mx-auto py-2 px-4">
          {/* 검색 바 */}
          <div className="flex flex-col items-center gap-4 mb-4">
            <form onSubmit={handleSearch} className="w-full max-w-2xl">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={KOREAN_UI_TEXTS.searchPlaceholder}
                  disabled={appState === AppState.LOADING}
                  className="w-full px-6 py-4 pr-14 text-lg rounded-full border-4 border-amber-700 bg-amber-50/95 text-amber-900 placeholder-amber-700 focus:outline-none focus:ring-4 focus:ring-amber-500 disabled:opacity-50 shadow-2xl backdrop-blur-sm"
                />
                <button
                  type="submit"
                  disabled={appState === AppState.LOADING || !query.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-amber-700 text-white rounded-full hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                >
                  {appState === AppState.LOADING ? (
                    <Sparkles className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>

            {!showSidebar && duplicateWarning && (
              <div className="w-full max-w-2xl p-3 bg-yellow-100 border-2 border-yellow-600 rounded-lg">
                <p className="text-sm text-yellow-800 text-center font-medium">{duplicateWarning}</p>
              </div>
            )}

            {/* 태그 필터 */}
            {availableTags && availableTags.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center max-w-4xl">
                <button
                  onClick={() => handleTagFilter('')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedTag === ''
                      ? 'bg-amber-700 text-white shadow-md'
                      : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  }`}
                >
                  <Tag className="w-4 h-4 inline mr-1" />
                  {KOREAN_UI_TEXTS.allTags}
                </button>
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagFilter(tag)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedTag === tag
                        ? 'bg-amber-700 text-white shadow-md'
                        : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {/* 초기화 버튼 */}
            {historyContent && historyContent.length > 0 && (
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-md flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {KOREAN_UI_TEXTS.reset}
              </button>
            )}
          </div>

          {/* 에러 메시지 */}
          {appState === AppState.ERROR && errorMessage && (
            <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-100 border-2 border-red-400 rounded-lg">
              <p className="text-red-800 text-center font-medium">{errorMessage}</p>
            </div>
          )}

          {/* 그리모어 책 */}
          <div className="flex justify-center items-start">
            <ErrorBoundary>
              <Grimoire
                content={filteredContent}
                isLoading={appState === AppState.LOADING}
                flipTrigger={flipTrigger}
              />
            </ErrorBoundary>
          </div>

          {/* 푸터 */}
          <footer className="text-center py-4 text-amber-200">
            <div className="flex items-center justify-center gap-2">
              <Feather className="w-5 h-5" />
              <p className="text-sm">한국 역사 그리모어</p>
            </div>
          </footer>
        </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default History;
