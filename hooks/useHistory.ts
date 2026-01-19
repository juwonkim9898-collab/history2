import { useState, useEffect, useCallback } from 'react';
import { historyDB, clearLocalDB } from '../services/db';
import { HistoryEventUI, AppState } from '../types';

// 최근 본 기록 관리
const RECENT_VIEWED_KEY = 'recentViewed';
const MAX_RECENT_ITEMS = 5;

export function useHistory() {
  const [historyContent, setHistoryContent] = useState<HistoryEventUI[]>([]);
  const [filteredContent, setFilteredContent] = useState<HistoryEventUI[]>([]);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [recentViewed, setRecentViewed] = useState<string[]>([]);
  const [flipTrigger, setFlipTrigger] = useState(0);

  // 초기화
  useEffect(() => {
    const init = async () => {
      const hasCleanedLocal = localStorage.getItem('hasCleanedLocalDB');
      if (!hasCleanedLocal) {
        await clearLocalDB();
        localStorage.setItem('hasCleanedLocalDB', 'true');
      }

      const savedRecent = localStorage.getItem(RECENT_VIEWED_KEY);
      if (savedRecent) {
        setRecentViewed(JSON.parse(savedRecent));
      }

      await loadHistory();
    };
    init();
  }, []);

  // 태그 필터링
  useEffect(() => {
    const filterByTag = async () => {
      if (selectedTag) {
        const filtered = await historyDB.filterByTag(selectedTag);
        setFilteredContent(filtered);
      } else {
        setFilteredContent(historyContent);
      }
    };

    if (historyContent.length > 0) {
      filterByTag();
    }
  }, [selectedTag, historyContent]);

  const loadHistory = useCallback(async () => {
    const history = await historyDB.getAll();
    const tags = await historyDB.getAllTags();

    if (history.length > 0) {
      setHistoryContent(history);
      setFilteredContent(history);
      setAppState(AppState.READING);
    }
    setAvailableTags(tags);
  }, []);

  const selectRecords = useCallback((records: HistoryEventUI[]) => {
    setHistoryContent(records);
    setFilteredContent(records);
    setAppState(AppState.READING);
    setFlipTrigger(prev => prev + 1);

    // 최근 본 기록 업데이트
    const newDates = records.map(e => e.record_date);
    const updatedRecent = [...new Set([...newDates, ...recentViewed])].slice(0, MAX_RECENT_ITEMS);
    setRecentViewed(updatedRecent);
    localStorage.setItem(RECENT_VIEWED_KEY, JSON.stringify(updatedRecent));
  }, [recentViewed]);

  const clearHistory = useCallback(async () => {
    await historyDB.clear();
    setHistoryContent([]);
    setFilteredContent([]);
    setAvailableTags([]);
    setSelectedTag('');
    setAppState(AppState.IDLE);
    setFlipTrigger(0);
  }, []);

  const handleTagSelect = useCallback((tag: string) => {
    setSelectedTag(prev => prev === tag ? '' : tag);
  }, []);

  const viewByDate = useCallback(async (date: string) => {
    const results = await historyDB.getByDateRange(date, date);
    if (results.length > 0) {
      selectRecords(results);
    }
  }, [selectRecords]);

  return {
    historyContent,
    filteredContent,
    appState,
    setAppState,
    availableTags,
    selectedTag,
    recentViewed,
    flipTrigger,
    loadHistory,
    selectRecords,
    clearHistory,
    handleTagSelect,
    viewByDate
  };
}
