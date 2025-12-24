import React, { useState, useEffect } from 'react';
import { Grimoire } from './components/Grimoire';
import { fetchHistoryStory } from './services/geminiService';
import { historyDB } from './services/db';
import { HistoryEvent, AppState } from './types';
import { Search, Sparkles, Feather, Trash2 } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary'; // 에러 바운더리 임포트

const App = () => {
  const [query, setQuery] = useState('');
  const [historyContent, setHistoryContent] = useState<HistoryEvent[]>([]);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [flipTrigger, setFlipTrigger] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 컴포넌트 마운트 시 DB에서 기존 기록 로드
  useEffect(() => {
    historyDB.getAll().then(history => {
      if (history.length > 0) {
        setHistoryContent(history);
        setAppState(AppState.READING);
      }
    });
  }, []);

  const handleSearch = async (e?: React.FormEvent | string) => {
    if (typeof e !== 'string' && e) e.preventDefault();
    
    const topic = typeof e === 'string' ? e : query;
    if (!topic.trim()) return;

    // 검색 시작 시 상태 변경
    setAppState(AppState.LOADING);
    setErrorMessage(''); // 이전 에러 초기화
    
    try {
      // Gemini API 호출 (geminiService.ts에서 v1 경로를 사용하는지 확인 필요)
      const story = await fetchHistoryStory(topic);
      
      // DB 저장 및 상태 업데이트
      await historyDB.add(story);
      
      // 🔥 중요: insertBefore 에러 방지를 위해 상태 업데이트를 신중하게 처리
      setHistoryContent(prev => [...prev, ...story]);
      setAppState(AppState.READING);
      setQuery(''); 
      
      // 새로운 챕터가 추가되었음을 Grimoire에 알림
      setFlipTrigger(prev => prev + 1);
      
    } catch (error) {
      console.error("Search failed:", error);
      setErrorMessage(error instanceof Error ? error.message : "The Grimoire is resisting your spell...");
      setAppState(AppState.ERROR);
    }
  };

  const clearHistory = async () => {
    if (window.confirm("Are you sure you want to burn this grimoire and start over?")) {
      await historyDB.clear();
      setHistoryContent([]);
      setAppState(AppState.IDLE);
      setFlipTrigger(0);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center overflow-hidden relative">
      
      {/* 배경 효과 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1a100a] via-[#050505] to-black opacity-80 pointer-events-none"></div>
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

      {/* 상단 검색바 영역 */}
      <div className="z-20 w-full max-w-2xl px-4 py-6 mt-4 flex flex-col items-center gap-4">
        <form 
          onSubmit={handleSearch}
          className="relative w-full group transition-all duration-300 focus-within:scale-105"
        >
          <div className="absolute inset-0 bg-amber-600/20 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
          
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Dictate a new chapter for the Grimoire..."
            className="w-full bg-[#1a120b] border border-[#3e2723] text-amber-100/90 placeholder-amber-900/50 
                       font-serif text-lg py-3 pl-12 pr-12 rounded-full shadow-2xl focus:outline-none focus:border-amber-600/50 focus:ring-1 focus:ring-amber-600/30 transition-all relative z-10"
          />
          <Feather className="absolute left-4 top-1/2 transform -translate-y-1/2 text-amber-700 w-5 h-5 pointer-events-none z-20" />
          
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

        <div className="flex w-full justify-between items-start px-2">
            <div className="flex flex-wrap gap-2 text-xs font-serif text-amber-800/60">
              {['The Roman Empire', 'Joseon Dynasty', 'Samurai Code', 'Alchemy'].map(topic => (
                <button 
                  key={topic}
                  type="button"
                  onClick={() => { setQuery(topic); handleSearch(topic); }}
                  className="hover:text-amber-500 transition-colors cursor-pointer border-b border-transparent hover:border-amber-500"
                >
                  {topic}
                </button>
              ))}
            </div>

            {historyContent.length > 0 && (
              <button 
                onClick={clearHistory}
                className="text-amber-900/40 hover:text-red-900/60 transition-colors text-xs flex items-center gap-1 font-serif"
                title="Burn Book (Reset)"
              >
                <Trash2 className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
        </div>
      </div>

      {/* 메인 책 디스플레이 영역 */}
      <main className="flex-1 w-full flex items-center justify-center p-4 z-10">
        <ErrorBoundary>
          {appState === AppState.ERROR ? (
            <div className="text-center text-red-900 bg-[#f3e5ab] p-8 rounded shadow-lg font-serif border border-red-800 max-w-md mx-4">
              <h3 className="text-xl font-bold mb-2">The Ink has Faded...</h3>
              <p>Could not retrieve the history.</p>
              <p className="text-sm mt-2 opacity-75 font-sans whitespace-pre-wrap">{errorMessage}</p>
              <button 
                onClick={() => setAppState(AppState.IDLE)}
                className="mt-4 text-xs uppercase tracking-widest border-b border-red-900/30 hover:border-red-900 pb-1 transition-all"
              >
                Try Again
              </button>
            </div>
          ) : (
            /* Grimoire 컴포넌트 내부의 Page 컴포넌트가 Stable Wrapper로 감싸져 있어야 합니다. */
            <Grimoire 
              content={historyContent} 
              isLoading={appState === AppState.LOADING}
              flipTrigger={flipTrigger}
            />
          )}
        </ErrorBoundary>
      </main>

      <footer className="w-full text-center py-4 text-amber-900/20 font-serif text-[10px] tracking-widest z-20 uppercase">
        M M X X V  •  G R I M O I R E
      </footer>
    </div>
  );
};

export default App;