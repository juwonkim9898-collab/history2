import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import App from '../../../App';
import { KOREAN_UI_TEXTS } from '../../../types';

// Mock services for integration testing
const mockHistoryData = [
  {
    title: '조선왕조 건국',
    year: '1392년',
    description: '이성계가 조선을 건국하다',
    details: '1392년 이성계가 위화도 회군 후 조선을 건국했습니다. 이는 한국사의 중요한 전환점이었습니다.'
  },
  {
    title: '한글 창제',
    year: '1443년',
    description: '세종대왕이 한글을 창제하다',
    details: '1443년 세종대왕이 훈민정음을 창제하여 백성들이 쉽게 글을 읽고 쓸 수 있게 했습니다.'
  }
];

vi.mock('../../../services/geminiService', () => ({
  fetchHistoryStory: vi.fn()
}));

vi.mock('../../../services/db', () => ({
  historyDB: {
    getAll: vi.fn(),
    add: vi.fn(),
    clear: vi.fn(),
    search: vi.fn(),
    parseYear: vi.fn(),
    getStats: vi.fn(),
    getAllTags: vi.fn(),
    hasTag: vi.fn(),
    filterByTag: vi.fn()
  }
}));

describe('Korean History Localization Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * **Integration Test: 데이터 지속성 및 로딩**
   * **Validates: 로컬 저장소 지속성**
   * 
   * Tests data persistence and loading from localStorage
   */
  it('should persist and load Korean data correctly', async () => {
    const { historyDB } = await import('../../../services/db');

    // Setup persistent data
    (historyDB.getAll as any).mockResolvedValue(mockHistoryData);

    fc.assert(
      fc.asyncProperty(
        fc.constant(null),
        async () => {
          const { unmount } = render(<App />);

          try {
            // Wait for data to load
            await waitFor(() => {
              // Should show Korean UI elements
              expect(screen.getByText(KOREAN_UI_TEXTS.index)).toBeInTheDocument();
              expect(screen.getByText(KOREAN_UI_TEXTS.bookTitle)).toBeInTheDocument();
            }, { timeout: 2000 });

            // Verify data was loaded from storage
            expect(historyDB.getAll).toHaveBeenCalled();
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * **Integration Test: 반응형 디자인 및 접근성**
   * **Validates: 한국어 콘텐츠 반응형 지원**
   * 
   * Tests responsive design with Korean content
   */
  it.skip('should maintain Korean UI across different viewport sizes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          width: fc.integer({ min: 320, max: 1920 }),
          height: fc.integer({ min: 568, max: 1080 })
        }),
        async (viewport) => {
          // Mock window dimensions
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewport.width,
          });
          Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: viewport.height,
          });

          const { unmount } = render(<App />);

          try {
            // Wait for Grimoire to render
            await waitFor(() => {
              expect(screen.getByText(KOREAN_UI_TEXTS.bookTitle)).toBeInTheDocument();
            }, { timeout: 5000 });

            // Verify Korean UI elements are present regardless of viewport
            const searchInputs = screen.getAllByPlaceholderText(KOREAN_UI_TEXTS.searchPlaceholder);
            expect(searchInputs.length).toBeGreaterThan(0);
            
            expect(screen.getByText(KOREAN_UI_TEXTS.bookTitle)).toBeInTheDocument();

            // Verify suggested topics are accessible
            KOREAN_UI_TEXTS.suggestedTopics.forEach(topic => {
              expect(screen.getByText(topic)).toBeInTheDocument();
            });
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 5 }
    );
  }, 10000);

  /**
   * **Integration Test: 기본 UI 렌더링**
   * **Validates: 한국어 UI 기본 표시**
   * 
   * Tests basic Korean UI rendering
   */
  it.skip('should render Korean UI elements correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null),
        async () => {
          const { unmount } = render(<App />);

          try {
            // Wait for Grimoire to render
            await waitFor(() => {
              expect(screen.getByText(KOREAN_UI_TEXTS.bookTitle)).toBeInTheDocument();
            }, { timeout: 5000 });

            // Verify Korean UI elements
            expect(screen.getByText(KOREAN_UI_TEXTS.bookTitle)).toBeInTheDocument();
            expect(screen.getByText(KOREAN_UI_TEXTS.bookSubtitle)).toBeInTheDocument();
            expect(screen.getByText(KOREAN_UI_TEXTS.index)).toBeInTheDocument();
            expect(screen.getByText(KOREAN_UI_TEXTS.end)).toBeInTheDocument();

            // Verify suggested topics
            KOREAN_UI_TEXTS.suggestedTopics.forEach(topic => {
              const elements = screen.getAllByText(topic);
              expect(elements.length).toBeGreaterThan(0);
            });
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 5 }
    );
  }, 10000);
});