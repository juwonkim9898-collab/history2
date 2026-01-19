import React, { useMemo, useCallback } from 'react';
import { Grimoire } from './components/Grimoire';
import { LibrarianWidget } from './components/LibrarianWidget';
import { SearchBar } from './components/SearchBar';
import { SearchSidebar } from './components/SearchSidebar';
import { TagFilter } from './components/TagFilter';
import { RecentViewed } from './components/RecentViewed';
import ErrorBoundary from './components/ErrorBoundary';
import { useHistory } from './hooks/useHistory';
import { useSearch } from './hooks/useSearch';
import { AppState, KOREAN_UI_TEXTS } from './types';
import { Trash2, X } from 'lucide-react';

const App: React.FC = () => {
  // 커스텀 훅 사용
  const {
    historyContent,
    filteredContent,
    appState,
    setAppState,
    availableTags,
    selectedTag,
    recentViewed,
    flipTrigger,
    clearHistory,
    handleTagSelect,
    viewByDate,
    selectRecords
  } = useHistory();

  const {
    query,
    setQuery,
    searchResults,
    showSidebar,
    duplicateWarning,
    errorMessage,
    setDuplicateWarning,
    handleSearch,
    closeSidebar,
    clearSearch
  } = useSearch(setAppState);

  // 검색 결과 선택 핸들러
  const handleSelectResult = useCallback((results: typeof searchResults) => {
    selectRecords(results);
    clearSearch();
  }, [selectRecords, clearSearch]);

  // 태그 카운트 계산
  const getTagCount = useCallback((tag: string) => {
    return historyContent.filter(item => item.tags.includes(tag)).length;
  }, [historyContent]);

  // 히스토리 초기화
  const handleClearHistory = useCallback(async () => {
    if (window.confirm(KOREAN_UI_TEXTS.confirmReset)) {
      await clearHistory();
    }
  }, [clearHistory]);

  // 배경 스타일 메모이제이션
  const backgroundStyle = useMemo(() => ({
    backgroundImage: 'url(/library-bg.png)',
    backgroundSize: 'cover' as const,
    backgroundPosition: 'center' as const,
    backgroundRepeat: 'no-repeat' as const,
    backgroundAttachment: 'fixed' as const
  }), []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden w-full">
      {/* 고정 배경 레이어 */}
      <div className="fixed inset-0 pointer-events-none" style={backgroundStyle}>
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* 3D 사서 위젯 */}
      <LibrarianWidget />

      {/* 콘텐츠 레이어 */}
      <div className="relative z-10 min-h-screen flex overflow-hidden">
        {/* 검색 사이드바 */}
        {showSidebar && (
          <SearchSidebar
            query={query}
            results={searchResults}
            duplicateWarning={duplicateWarning}
            onClose={closeSidebar}
            onSelectResult={handleSelectResult}
          />
        )}

        {/* 메인 컨텐츠 영역 */}
        <div
          className="flex-1 flex flex-col items-center overflow-y-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* 상단 검색바 영역 */}
          <div className="z-20 w-full max-w-2xl px-4 py-2 mt-1 flex flex-col items-center gap-2">
            {/* 중복 경고 메시지 */}
            {duplicateWarning && !showSidebar && (
              <div className="w-full bg-amber-900/20 border border-amber-700/50 text-amber-200 px-4 py-2 rounded-lg text-sm font-serif flex items-center justify-between animate-pulse">
                <span>"{duplicateWarning}" {KOREAN_UI_TEXTS.duplicateWarning}</span>
                <button onClick={() => setDuplicateWarning('')} className="hover:text-amber-100">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 검색바 */}
            <SearchBar
              query={query}
              setQuery={setQuery}
              onSearch={(e) => {
                e?.preventDefault();
                handleSearch();
              }}
              appState={appState}
            />

            {/* 최근 본 기록 */}
            <RecentViewed dates={recentViewed} onDateClick={viewByDate} />

            {/* 태그 필터 */}
            <TagFilter
              tags={availableTags}
              selectedTag={selectedTag}
              onTagSelect={handleTagSelect}
              totalCount={historyContent.length}
              getTagCount={getTagCount}
            />

            {/* 추천 검색어 & 초기화 버튼 */}
            <div className="flex w-full justify-between items-start px-2">
              <div className="flex flex-wrap gap-2 text-xs font-serif text-amber-800/60">
                {(availableTags.length > 0 ? availableTags.slice(0, 5) : KOREAN_UI_TEXTS.suggestedTopics).map(topic => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => {
                      setQuery(topic);
                      handleSearch(topic);
                    }}
                    className="hover:text-amber-500 transition-colors cursor-pointer border-b border-transparent hover:border-amber-500"
                  >
                    {topic}
                  </button>
                ))}
              </div>

              {historyContent.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-amber-900/40 hover:text-red-900/60 transition-colors text-xs flex items-center gap-1 font-serif"
                  title="초기화"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{KOREAN_UI_TEXTS.reset}</span>
                </button>
              )}
            </div>
          </div>

          {/* 메인 책 디스플레이 영역 */}
          <main className="flex-1 w-full flex items-center justify-center pb-2 px-4 z-10">
            <ErrorBoundary>
              {appState === AppState.ERROR ? (
                <div className="text-center text-red-900 bg-[#f3e5ab] p-8 rounded shadow-lg font-serif border border-red-800 max-w-md mx-4">
                  <h3 className="text-xl font-bold mb-2">{KOREAN_UI_TEXTS.errorTitle}</h3>
                  <p>{KOREAN_UI_TEXTS.errorMessage}</p>
                  <p className="text-sm mt-2 opacity-75 font-sans whitespace-pre-wrap">{errorMessage}</p>
                  <button
                    onClick={() => setAppState(AppState.IDLE)}
                    className="mt-4 text-xs uppercase tracking-widest border-b border-red-900/30 hover:border-red-900 pb-1 transition-all"
                  >
                    다시 시도
                  </button>
                </div>
              ) : (
                <Grimoire
                  content={filteredContent}
                  isLoading={appState === AppState.LOADING}
                  flipTrigger={flipTrigger}
                />
              )}
            </ErrorBoundary>
          </main>

          {/* 푸터 */}
          <footer className="w-full text-center py-1 text-amber-900/20 font-serif text-[9px] tracking-widest z-20 uppercase">
            M M X X V • G R I M O I R E
          </footer>
        </div>
      </div>
    </div>
  );
};

export default App;
