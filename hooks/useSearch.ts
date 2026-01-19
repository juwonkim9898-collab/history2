import { useState, useCallback } from 'react';
import { historyDB } from '../services/db';
import { HistoryEventUI, AppState } from '../types';

export function useSearch(setAppState: (state: AppState) => void) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<HistoryEventUI[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSearch = useCallback(async (searchQuery?: string) => {
    const topic = searchQuery || query;
    if (!topic.trim()) return;

    setAppState(AppState.LOADING);
    setErrorMessage('');
    setDuplicateWarning('');

    try {
      const isDuplicate = await historyDB.hasTag(topic.trim());
      const dbResults = await historyDB.search(topic.trim());

      if (dbResults.length > 0) {
        // 중복 제거
        const uniqueResults = dbResults.filter((item, index, self) =>
          index === self.findIndex(t =>
            t.id === item.id ||
            (t.parsed.title === item.parsed.title && t.parsed.year === item.parsed.year)
          )
        );

        setSearchResults(uniqueResults);
        setShowSidebar(true);
        setAppState(AppState.IDLE);

        if (isDuplicate) {
          setDuplicateWarning(topic.trim());
        }
        return;
      }

      throw new Error(`"${topic}"에 대한 검색 결과가 없습니다.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '검색 실패');
      setAppState(AppState.ERROR);
      setShowSidebar(false);
    }
  }, [query, setAppState]);

  const closeSidebar = useCallback(() => {
    setShowSidebar(false);
    setDuplicateWarning('');
    setSearchResults([]);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    closeSidebar();
  }, [closeSidebar]);

  return {
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
  };
}
