import React from 'react';
import { Tag } from 'lucide-react';

interface RecentViewedProps {
  dates: string[];
  onDateClick: (date: string) => void;
}

// 날짜 포맷팅: 2024-12-30 → 12월 30일
const formatDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  } catch {
    return dateStr;
  }
};

export const RecentViewed: React.FC<RecentViewedProps> = ({ dates, onDateClick }) => {
  if (!dates.length) return null;

  return (
    <div className="w-full px-2">
      <div className="flex items-center gap-2 mb-2">
        <Tag className="w-4 h-4 text-amber-700" />
        <span className="text-xs font-serif text-amber-800/80">최근 본 기록:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {dates.map((date, index) => (
          <button
            key={index}
            onClick={() => onDateClick(date)}
            className="px-3 py-1 rounded-full text-xs font-serif transition-all bg-amber-900/20 text-amber-700 hover:bg-amber-900/30 hover:text-amber-600"
          >
            {formatDate(date)}
          </button>
        ))}
      </div>
    </div>
  );
};
