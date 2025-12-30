import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import { Grimoire } from '../../../components/Grimoire';
import { HistoryEvent, KOREAN_UI_TEXTS } from '../../../types';

/**
 * **Feature: korean-history-localization, Property 10: 책 인터페이스 한국어 라벨**
 * **Validates: Requirements 2.5**
 * 
 * For any book component rendering, all titles and labels should be displayed in Korean
 */
describe('Grimoire Korean Interface Labels Property Tests', () => {
  it('should display all interface labels in Korean for any content state', async () => {
    fc.assert(
      fc.asyncProperty(
        // Generate arbitrary history events
        fc.array(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 100 }),
            year: fc.integer({ min: 1, max: 2024 }).map(String),
            description: fc.string({ minLength: 10, maxLength: 200 }),
            details: fc.string({ minLength: 50, maxLength: 500 })
          }),
          { minLength: 0, maxLength: 10 }
        ),
        // Generate loading state
        fc.boolean(),
        async (content: HistoryEvent[], isLoading: boolean) => {
          const { container } = render(
            <Grimoire 
              content={content} 
              isLoading={isLoading}
            />
          );

          // Wait for book to be ready
          await waitFor(() => {
            expect(container.querySelector('.page')).toBeInTheDocument();
          }, { timeout: 3000 });

          // Check that Korean book title is displayed
          expect(screen.getAllByText(KOREAN_UI_TEXTS.bookTitle).length).toBeGreaterThan(0);
          
          // Check that Korean book subtitle is displayed
          expect(screen.getAllByText(KOREAN_UI_TEXTS.bookSubtitle).length).toBeGreaterThan(0);
          
          // Check that Korean index title is displayed
          expect(screen.getAllByText(KOREAN_UI_TEXTS.index).length).toBeGreaterThan(0);
          
          // If loading, check Korean loading text
          if (isLoading) {
            expect(screen.getAllByText(KOREAN_UI_TEXTS.loading).length).toBeGreaterThan(0);
          }
          
          // Check that Korean end text is displayed (on back cover)
          expect(screen.getAllByText(KOREAN_UI_TEXTS.end).length).toBeGreaterThan(0);
          
          // Verify no English text remains
          expect(screen.queryByText('HISTORIA')).not.toBeInTheDocument();
          expect(screen.queryByText('Grimoire of Ages')).not.toBeInTheDocument();
          expect(screen.queryByText('Index')).not.toBeInTheDocument();
          expect(screen.queryByText('Scribing...')).not.toBeInTheDocument();
          expect(screen.queryByText('Finis')).not.toBeInTheDocument();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Feature: korean-history-localization, Property 13: 기록 표시 한국어 렌더링**
   * **Validates: Requirements 3.3**
   * 
   * For any Korean historical content, should render properly in the book interface
   */
  it('should properly render Korean historical content in book interface', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            title: fc.oneof(
              fc.constant('조선왕조 건국'),
              fc.constant('고구려의 전성기'),
              fc.constant('한국전쟁'),
              fc.constant('독립운동'),
              fc.string({ minLength: 5, maxLength: 50 })
            ),
            year: fc.oneof(
              fc.constant('1392년'),
              fc.constant('기원전 37년'),
              fc.constant('1950년'),
              fc.constant('1919년')
            ),
            description: fc.string({ minLength: 20, maxLength: 100 }),
            details: fc.string({ minLength: 100, maxLength: 300 })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (koreanContent: HistoryEvent[]) => {
          const { container } = render(
            <Grimoire 
              content={koreanContent} 
              isLoading={false}
            />
          );

          // Wait for book to be ready
          await waitFor(() => {
            expect(container.querySelector('.page')).toBeInTheDocument();
          }, { timeout: 3000 });

          // Verify Korean content is rendered
          koreanContent.forEach(item => {
            // Title should be rendered
            expect(screen.getByText(item.title)).toBeInTheDocument();
            
            // Year should be rendered
            expect(screen.getByText(item.year)).toBeInTheDocument();
            
            // Description should be rendered
            expect(screen.getByText(item.description)).toBeInTheDocument();
          });

          // Verify proper page structure
          const pages = container.querySelectorAll('.page-content-wrapper');
          expect(pages.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Feature: korean-history-localization, Property 14: 연도 형식 일관성**
   * **Validates: Requirements 3.4**
   * 
   * For any year format, should display consistently in Korean format
   */
  it('should display year formats consistently in Korean', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            title: fc.string({ minLength: 5, maxLength: 50 }),
            year: fc.oneof(
              fc.constant('1392년'),
              fc.constant('기원전 57년'),
              fc.constant('2024년'),
              fc.integer({ min: 1, max: 2024 }).map(n => `${n}년`),
              fc.integer({ min: 1, max: 1000 }).map(n => `기원전 ${n}년`)
            ),
            description: fc.string({ minLength: 20, maxLength: 100 }),
            details: fc.string({ minLength: 100, maxLength: 300 })
          }),
          { minLength: 1, maxLength: 3 }
        ),
        async (events: HistoryEvent[]) => {
          const { container } = render(
            <Grimoire 
              content={events} 
              isLoading={false}
            />
          );

          // Wait for book to be ready
          await waitFor(() => {
            expect(container.querySelector('.page')).toBeInTheDocument();
          }, { timeout: 3000 });

          // Verify all years are displayed in Korean format
          events.forEach(event => {
            const yearElement = screen.getByText(event.year);
            expect(yearElement).toBeInTheDocument();
            
            // Should contain Korean year indicators
            expect(
              event.year.includes('년') || 
              event.year.includes('기원전')
            ).toBe(true);
          });
        }
      ),
      { numRuns: 10 }
    );
  });
});