import React from 'react';
import { Search, Sparkles } from 'lucide-react';
import { AppState, KOREAN_UI_TEXTS } from '../types';

interface SearchBarProps {
  query: string;
  setQuery: (query: string) => void;
  onSearch: (e?: React.FormEvent) => void;
  appState: AppState;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  setQuery,
  onSearch,
  appState
}) => {
  const isLoading = appState === AppState.LOADING;

  return (
    <form
      onSubmit={onSearch}
      className="relative w-full group transition-all duration-300 focus-within:scale-105"
    >
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={KOREAN_UI_TEXTS.searchPlaceholder}
          disabled={isLoading}
          className="w-full px-6 py-4 pr-14 text-lg rounded-full border-4 border-amber-700 bg-amber-50/95 text-amber-900 placeholder-amber-700 focus:outline-none focus:ring-4 focus:ring-amber-500 disabled:opacity-50 shadow-2xl backdrop-blur-sm font-serif"
        />

        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-amber-700 text-white rounded-full hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
        >
          {isLoading ? (
            <Sparkles className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </button>
      </div>
    </form>
  );
};
