import React from 'react';
import { Tag } from 'lucide-react';
import { KOREAN_UI_TEXTS } from '../types';

interface TagFilterProps {
  tags: string[];
  selectedTag: string;
  onTagSelect: (tag: string) => void;
  totalCount: number;
  getTagCount: (tag: string) => number;
}

export const TagFilter: React.FC<TagFilterProps> = ({
  tags,
  selectedTag,
  onTagSelect,
  totalCount,
  getTagCount
}) => {
  if (!tags.length) return null;

  return (
    <div className="w-full px-2 mt-4">
      <div className="flex items-center gap-2 mb-2">
        <Tag className="w-4 h-4 text-amber-700" />
        <span className="text-xs font-serif text-amber-800/80">검색 기록:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onTagSelect('')}
          className={`px-3 py-1 rounded-full text-xs font-serif transition-all ${
            !selectedTag
              ? 'bg-amber-700 text-amber-100 shadow-lg'
              : 'bg-amber-900/20 text-amber-700 hover:bg-amber-900/30'
          }`}
        >
          {KOREAN_UI_TEXTS.allTags} ({totalCount})
        </button>
        {tags.map(tag => (
          <button
            key={tag}
            onClick={() => onTagSelect(tag)}
            className={`px-3 py-1 rounded-full text-xs font-serif transition-all ${
              selectedTag === tag
                ? 'bg-amber-700 text-amber-100 shadow-lg'
                : 'bg-amber-900/20 text-amber-700 hover:bg-amber-900/30'
            }`}
          >
            {tag} ({getTagCount(tag)})
          </button>
        ))}
      </div>
    </div>
  );
};
