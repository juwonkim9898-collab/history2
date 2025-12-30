import React, { useState, useEffect } from 'react';
import { Grimoire } from './components/Grimoire';
import { fetchHistoryStory } from './services/geminiService';
import { historyDB, clearLocalDB } from './services/db';
import { HistoryEventUI, AppState, KOREAN_UI_TEXTS } from './types';
import { Search, Sparkles, Feather, Trash2, Tag, X } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';

const App = () => {
  const [query, setQuery] = useState('');
  const [historyContent, setHistoryContent] = useState<HistoryEventUI[]>([]);
  const [filteredContent, setFilteredContent] = useState<HistoryEventUI[]>([]);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [flipTrigger, setFlipTrigger] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [duplicateWarning, setDuplicateWarning] = useState<string>('');
  const [searchResults, setSearchResults] = useState<HistoryEventUI[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [recentViewed, setRecentViewed] = useState<string[]>([]); // 최근 본 기록 (날짜 형식)

  // 컴포넌트 마운트 시 로컬 DB 정리 및 PostgreSQL에서 기록 로드
  useEffect(() => {
    const initializeApp = async () => {
      // 로컬 IndexedDB 정리 (한 번만 실행)
      const hasCleanedLocal = localStorage.getItem('hasCleanedLocalDB');
      if (!hasCleanedLocal) {
        await clearLocalDB();
        localStorage.setItem('hasCleanedLocalDB', 'true');
      }
      
      // 최근 본 기록 불러오기
      const savedRecent = localStorage.getItem('recentViewed');
      if (savedRecent) {
        setRecentViewed(JSON.parse(savedRecent));
      }
      
      // PostgreSQL에서 데이터 로드
      await loadHistory();
    };
    
    initializeApp();
  }, []);

  // 태그 필터링 - DB API 사용
  useEffect(() => {
    const filterByTag = async () => {
      if (selectedTag) {
        const filtered = await historyDB.filterByTag(selectedTag);
        setFilteredContent(filtered);
      } else {
        const allRecords = await historyDB.getAll();
        setFilteredContent(allRecords);
      }
    };
    
    if (historyContent.length > 0) {
      filterByTag();
    }
  }, [selectedTag, historyContent.length]);

  const loadHistory = async () => {
    console.log('🔄 loadHistory 시작...');
    const history = await historyDB.getAll();
    const tags = await historyDB.getAllTags();
    
    console.log('📊 불러온 기록:', history.length, '개');
    console.log('🏷️ 불러온 태그:', tags);
    
    if (history.length > 0) {
      setHistoryContent(history);
      setFilteredContent(history);
      setAppState(AppState.READING);
      console.log('✅ 상태 업데이트 완료');
    } else {
      console.log('⚠️ 기록이 없습니다');
    }
    setAvailableTags(tags);
  };

  const handleSearch = async (e?: React.FormEvent | string) => {
    if (typeof e !== 'string' && e) e.preventDefault();
    
    const topic = typeof e === 'string' ? e : query;
    if (!topic.trim()) return;

    setAppState(AppState.LOADING);
    setErrorMessage('');
    setDuplicateWarning('');
    
    try {
      // 태그 중복 체크 (검색어가 태그로 이미 존재하는지)
      const isDuplicate = await historyDB.hasTag(topic.trim());
      
      // DB에서 검색 (키워드 검색 - 콘텐츠 내용 검색)
      const dbResults = await historyDB.search(topic.trim());
      
      if (dbResults.length > 0) {
        // 중복 제거: id와 content 기준으로 유니크한 결과만 필터링
        const uniqueResults = dbResults.filter((item, index, self) => 
          index === self.findIndex((t) => (
            t.id === item.id || 
            (t.parsed.title === item.parsed.title && t.parsed.year === item.parsed.year)
          ))
        );
        
        console.log(`🔍 검색 결과: ${dbResults.length}개 → 중복 제거 후: ${uniqueResults.length}개`);
        
        // DB에 관련 내용이 있으면 표시
        setSearchResults(uniqueResults);
        setShowSidebar(true);
        setAppState(AppState.IDLE);
        
        // 태그로도 존재하면 중복 경고
        if (isDuplicate) {
          setDuplicateWarning(topic.trim());
        }
        return;
      }
      
      // DB에 검색 결과가 없으면 에러 표시
      throw new Error(`"${topic}"에 대한 검색 결과가 없습니다. DB에 데이터를 먼저 추가해주세요.`);
      
    } catch (error) {
      console.error("Search failed:", error);
      setErrorMessage(error instanceof Error ? error.message : "기록을 불러올 수 없습니다...");
      setAppState(AppState.ERROR);
      setShowSidebar(false);
    }
  };

  const handleSelectResult = async (selectedEvents: HistoryEventUI[]) => {
    try {
      // DB에 저장하지 않고 바로 표시 (읽기 전용)
      setHistoryContent(selectedEvents);
      setFilteredContent(selectedEvents);
      setAppState(AppState.READING);
      setQuery(''); 
      setShowSidebar(false);
      setSearchResults([]);
      setDuplicateWarning('');
      setFlipTrigger((prev: number) => prev + 1);
      
      // 최근 본 기록에 추가 (날짜 기준, 중복 제거, 최대 5개)
      const newDates = selectedEvents.map(e => e.record_date);
      const updatedRecent = [...new Set([...newDates, ...recentViewed])].slice(0, 5);
      setRecentViewed(updatedRecent);
      localStorage.setItem('recentViewed', JSON.stringify(updatedRecent));
      
    } catch (error) {
      console.error("Display failed:", error);
      setErrorMessage(error instanceof Error ? error.message : "표시에 실패했습니다.");
    }
  };

  const clearHistory = async () => {
    if (window.confirm(KOREAN_UI_TEXTS.confirmReset)) {
      await historyDB.clear();
      setHistoryContent([]);
      setFilteredContent([]);
      setAvailableTags([]);
      setSelectedTag('');
      setAppState(AppState.IDLE);
      setFlipTrigger(0);
    }
  };

  const handleTagSelect = (tag: string) => {
    setSelectedTag(tag === selectedTag ? '' : tag);
  };

  return (
    <div 
      className="min-h-screen bg-[#0a0a0a] flex overflow-hidden relative"
      style={{
        backgroundImage: 'url(/library-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed', // 배경 고정 (스크롤 시 움직이지 않음)
        willChange: 'auto', // GPU 가속 방지 (움찔거림 방지)
        transform: 'translateZ(0)' // 하드웨어 가속 활성화
      }}
    >
      
      {/* 배경 오버레이 (이미지 위에 어두운 레이어) */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1a100a]/50 via-transparent to-black/60 opacity-80 pointer-events-none"></div>

      {/* 사이드바 - 검색 결과 */}
      {showSidebar && (
        <div className="fixed left-0 top-0 h-full w-80 bg-[#1a120b]/95 backdrop-blur-sm border-r border-amber-900/30 z-30 overflow-y-auto shadow-2xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-amber-100 font-serif text-xl flex items-center gap-2">
                <Search className="w-5 h-5" />
                검색 결과
              </h2>
              <button 
                onClick={() => {
                  setShowSidebar(false);
                  setDuplicateWarning('');
                }}
                className="text-amber-700 hover:text-amber-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 text-amber-800/80 text-sm font-serif">
              "{query}" 검색 결과 {searchResults.length}개
            </div>

            {/* 중복 경고 메시지 (사이드바 내부) */}
            {duplicateWarning && (
              <div className="mb-4 bg-amber-900/20 border border-amber-700/50 text-amber-200 px-3 py-2 rounded text-xs font-serif">
                <div className="flex items-start gap-2">
                  <span className="text-amber-500">⚠</span>
                  <div>
                    <div className="font-bold mb-1">이미 추가된 검색어입니다</div>
                    <div className="text-amber-300/80">
                      "{duplicateWarning}"는 이미 책에 추가되어 있습니다. 
                      그래도 추가하시려면 아래 버튼을 클릭하세요.
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {searchResults.map((result, index) => (
                <div 
                  key={index}
                  className="bg-amber-900/10 border border-amber-900/30 rounded-lg p-4 hover:bg-amber-900/20 transition-all cursor-pointer group"
                  onClick={() => handleSelectResult([result])}
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

            <button
              onClick={() => handleSelectResult(searchResults)}
              className="w-full mt-6 bg-amber-700 hover:bg-amber-600 text-amber-100 py-3 rounded-lg font-serif transition-colors shadow-lg"
            >
              전체 추가 ({searchResults.length}개)
            </button>
          </div>
        </div>
      )}

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col items-center overflow-y-auto scrollbar-thin scrollbar-thumb-amber-900/50 scrollbar-track-transparent hover:scrollbar-thumb-amber-800/70">

      {/* 상단 검색바 영역 */}
      <div className="z-20 w-full max-w-2xl px-4 py-2 mt-1 flex flex-col items-center gap-2">
        {/* 중복 경고 메시지 (사이드바가 닫혀있을 때만) */}
        {duplicateWarning && !showSidebar && (
          <div className="w-full bg-amber-900/20 border border-amber-700/50 text-amber-200 px-4 py-2 rounded-lg text-sm font-serif flex items-center justify-between animate-pulse">
            <span>"{duplicateWarning}" {KOREAN_UI_TEXTS.duplicateWarning}</span>
            <button onClick={() => setDuplicateWarning('')} className="hover:text-amber-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form 
          onSubmit={handleSearch}
          className="relative w-full group transition-all duration-300 focus-within:scale-105"
        >
          <div className="absolute inset-0 bg-amber-600/20 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
          
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={KOREAN_UI_TEXTS.searchPlaceholder}
            className="w-full bg-[#1a120b] border border-[#3e2723] text-amber-100/90 placeholder-amber-900/50 
                       font-serif text-base py-2 pl-10 pr-10 rounded-full shadow-2xl focus:outline-none focus:border-amber-600/50 focus:ring-1 focus:ring-amber-600/30 transition-all relative z-10"
          />
          <Feather className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-700 w-4 h-4 pointer-events-none z-20" />
          
          <button 
            type="submit"
            disabled={appState === AppState.LOADING}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#3e2723] hover:bg-[#4e342e] text-amber-100 p-2 rounded-full transition-colors disabled:opacity-50 z-20"
          >
            {appState === AppState.LOADING ? (
              <Sparkles className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </button>
        </form>

        {/* 최근 본 기록 (날짜 태그) */}
        {recentViewed && recentViewed.length > 0 && (
          <div className="w-full px-2">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-amber-700" />
              <span className="text-xs font-serif text-amber-800/80">최근 본 기록:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentViewed.map((date, index) => {
                // 날짜 포맷팅: 2024-12-30 → 12월 30일
                const formatDate = (dateStr: string) => {
                  try {
                    const d = new Date(dateStr);
                    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
                  } catch {
                    return dateStr;
                  }
                };
                
                return (
                  <button
                    key={index}
                    onClick={async () => {
                      // 해당 날짜의 기록 검색
                      const results = await historyDB.getByDateRange(date, date);
                      if (results.length > 0) {
                        setHistoryContent(results);
                        setFilteredContent(results);
                        setAppState(AppState.READING);
                        setFlipTrigger((prev: number) => prev + 1);
                      }
                    }}
                    className="px-3 py-1 rounded-full text-xs font-serif transition-all bg-amber-900/20 text-amber-700 hover:bg-amber-900/30 hover:text-amber-600"
                  >
                    {formatDate(date)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 태그 필터 */}
        {availableTags && availableTags.length > 0 && (
          <div className="w-full px-2 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-amber-700" />
              <span className="text-xs font-serif text-amber-800/80">검색 기록:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTag('')}
                className={`px-3 py-1 rounded-full text-xs font-serif transition-all ${
                  !selectedTag 
                    ? 'bg-amber-700 text-amber-100 shadow-lg' 
                    : 'bg-amber-900/20 text-amber-700 hover:bg-amber-900/30'
                }`}
              >
                {KOREAN_UI_TEXTS.allTags} ({historyContent.length})
              </button>
              {availableTags.map(tag => {
                const count = historyContent.filter(item => item.tags.includes(tag)).length;
                return (
                  <button
                    key={tag}
                    onClick={() => handleTagSelect(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-serif transition-all ${
                      selectedTag === tag 
                        ? 'bg-amber-700 text-amber-100 shadow-lg' 
                        : 'bg-amber-900/20 text-amber-700 hover:bg-amber-900/30'
                    }`}
                  >
                    {tag} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex w-full justify-between items-start px-2">
            <div className="flex flex-wrap gap-2 text-xs font-serif text-amber-800/60">
              {availableTags.length > 0 ? (
                // DB에서 가져온 태그들을 추천 검색어로 표시 (최대 5개)
                availableTags.slice(0, 5).map(topic => (
                  <button 
                    key={topic}
                    type="button"
                    onClick={() => { setQuery(topic); handleSearch(topic); }}
                    className="hover:text-amber-500 transition-colors cursor-pointer border-b border-transparent hover:border-amber-500"
                  >
                    {topic}
                  </button>
                ))
              ) : (
                // DB에 태그가 없으면 기본 추천 검색어 표시
                KOREAN_UI_TEXTS.suggestedTopics.map(topic => (
                  <button 
                    key={topic}
                    type="button"
                    onClick={() => { setQuery(topic); handleSearch(topic); }}
                    className="hover:text-amber-500 transition-colors cursor-pointer border-b border-transparent hover:border-amber-500"
                  >
                    {topic}
                  </button>
                ))
              )}
            </div>

            {historyContent && historyContent.length > 0 && (
              <button 
                onClick={clearHistory}
                className="text-amber-900/40 hover:text-red-900/60 transition-colors text-xs flex items-center gap-1 font-serif"
                title="Burn Book (Reset)"
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

      <footer className="w-full text-center py-1 text-amber-900/20 font-serif text-[9px] tracking-widest z-20 uppercase">
        M M X X V  •  G R I M O I R E
      </footer>
      </div>
    </div>
  );
};

export default App;