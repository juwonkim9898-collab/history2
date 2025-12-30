import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import App from '../../App';
import { KOREAN_UI_TEXTS } from '../../types';

// Mock the services to avoid API calls during testing
vi.mock('../../services/geminiService', () => ({
  fetchHistoryStory: vi.fn().mockResolvedValue([
    {
      title: '조선 건국',
      year: '1392년',
      description: '이성계가 조선을 건국하다',
      details: '1392년 이성계가 위화도 회군 후 조선을 건국했습니다.'
    }
  ])
}));

vi.mock('../../services/db', () => ({
  historyDB: {
    getAll: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
    getAllTags: vi.fn().mockResolvedValue([]),
    hasTag: vi.fn().mockResolvedValue(false)
  }
}));

describe('App Korean UI Text Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * **Feature: korean-history-localization, Property 6: UI 텍스트 한국어 표시**
   * **Validates: Requirements 2.1**
   * 
   * For any app initialization, all UI elements should display text in Korean
   */
  it('should display all UI text in Korean for any app state', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null),
        async () => {
          const { unmount } = render(<App />);

          try {
            // Wait for Grimoire to render
            await waitFor(() => {
              expect(screen.getByText(KOREAN_UI_TEXTS.bookTitle)).toBeInTheDocument();
            }, { timeout: 3000 });

            // Check that Korean search placeholder is present
            const searchInput = screen.getByPlaceholderText(KOREAN_UI_TEXTS.searchPlaceholder);
            expect(searchInput).toBeInTheDocument();

            // Check that Korean suggested topics are displayed
            KOREAN_UI_TEXTS.suggestedTopics.forEach(topic => {
              expect(screen.getByText(topic)).toBeInTheDocument();
            });

            // Check that Korean book title and subtitle are displayed
            expect(screen.getByText(KOREAN_UI_TEXTS.bookTitle)).toBeInTheDocument();
            expect(screen.getByText(KOREAN_UI_TEXTS.bookSubtitle)).toBeInTheDocument();

            // Check that Korean index title is displayed
            expect(screen.getByText(KOREAN_UI_TEXTS.index)).toBeInTheDocument();

            // Check that Korean end text is displayed
            expect(screen.getByText(KOREAN_UI_TEXTS.end)).toBeInTheDocument();

            // Verify no English UI text remains in critical areas
            expect(screen.queryByPlaceholderText(/dictate.*new.*chapter/i)).not.toBeInTheDocument();
            expect(screen.queryByText('The Roman Empire')).not.toBeInTheDocument();
            expect(screen.queryByText('Reset')).not.toBeInTheDocument();
            expect(screen.queryByText('Index')).not.toBeInTheDocument();
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Feature: korean-history-localization, Property 2: 빈 입력 거부**
   * **Validates: Requirements 1.2**
   * 
   * For any empty or whitespace-only input, should not trigger search
   */
  it('should reject empty or whitespace-only search input', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''),
          fc.constant('   '),
          fc.constant('\t'),
          fc.constant('\n')
        ),
        (emptyInput: string) => {
          const { container, unmount } = render(<App />);
          
          try {
            const searchInput = screen.getByPlaceholderText(KOREAN_UI_TEXTS.searchPlaceholder);
            const searchButton = container.querySelector('button[type="submit"]');

            // Try to search with empty input
            fireEvent.change(searchInput, { target: { value: emptyInput } });
            fireEvent.click(searchButton!);

            // Should not show loading state
            expect(screen.queryByText(KOREAN_UI_TEXTS.loading)).not.toBeInTheDocument();
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Feature: korean-history-localization, Property 9: 한국 역사 추천 주제**
   * **Validates: Requirements 2.4**
   * 
   * For any app load, should display Korean historical topics as suggestions
   */
  it('should display Korean historical topics as suggestions', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const { unmount } = render(<App />);

          try {
            // Verify all Korean suggested topics are present
            KOREAN_UI_TEXTS.suggestedTopics.forEach(topic => {
              const topicButton = screen.getByText(topic);
              expect(topicButton).toBeInTheDocument();
              expect(topicButton.tagName.toLowerCase()).toBe('button');
            });

            // Verify no English topics remain
            expect(screen.queryByText('The Roman Empire')).not.toBeInTheDocument();
            expect(screen.queryByText('Joseon Dynasty')).not.toBeInTheDocument();
            expect(screen.queryByText('Samurai Code')).not.toBeInTheDocument();
            expect(screen.queryByText('Alchemy')).not.toBeInTheDocument();
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Feature: korean-history-localization, Property 22: 호버 시각적 피드백**
   * **Validates: Requirements 5.4**
   * 
   * For any interactive element, should provide visual feedback on hover
   */
  it('should provide visual feedback on hover for interactive elements', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const { container, unmount } = render(<App />);

          try {
            // Check suggested topic buttons have hover styles
            KOREAN_UI_TEXTS.suggestedTopics.forEach(topic => {
              const topicButton = screen.getByText(topic);
              expect(topicButton).toHaveClass('hover:text-amber-500');
              expect(topicButton).toHaveClass('hover:border-amber-500');
            });

            // Check search button has hover styles
            const searchButton = container.querySelector('button[type="submit"]');
            expect(searchButton).toHaveClass('hover:bg-[#4e342e]');
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 5 }
    );
  });
});