import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { historyDB } from '../../../services/db';
import { HistoryEvent } from '../../../types';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Database Service Property Tests', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  /**
   * **Feature: korean-history-localization, Property 5: 로컬 저장소 즉시 저장**
   * **Validates: Requirements 1.5**
   * 
   * For any valid history events, data should be immediately saved to localStorage
   */
  it('should immediately save any valid history events to localStorage', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 100 }),
            year: fc.oneof(
              fc.constant('1392년'),
              fc.constant('기원전 57년'),
              fc.integer({ min: 1, max: 2024 }).map(n => `${n}년`)
            ),
            description: fc.string({ minLength: 10, maxLength: 200 }),
            details: fc.string({ minLength: 50, maxLength: 500 })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (events: HistoryEvent[]) => {
          // Mock existing data
          localStorageMock.getItem.mockReturnValue('[]');

          await historyDB.add(events);

          // Verify localStorage.setItem was called
          expect(localStorageMock.setItem).toHaveBeenCalled();
          expect(localStorageMock.setItem).toHaveBeenCalledWith(
            'grimoire_history',
            expect.stringContaining('[')
          );

          // Verify data structure (use last call)
          const lastCallIndex = localStorageMock.setItem.mock.calls.length - 1;
          const savedData = JSON.parse(localStorageMock.setItem.mock.calls[lastCallIndex][1]);
          expect(Array.isArray(savedData)).toBe(true);
          expect(savedData.length).toBeGreaterThanOrEqual(events.length);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Feature: korean-history-localization, Property 15: 다국어 기록 로딩**
   * **Validates: Requirements 4.1**
   * 
   * For any stored data, should load and validate multilingual records
   */
  it('should load and validate multilingual records from storage', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 50 }),
            year: fc.oneof(
              fc.constant('1392년'),
              fc.constant('기원전 57년'),
              fc.constant('1392 AD'),
              fc.integer({ min: 1, max: 2024 }).map(n => `${n}년`)
            ),
            description: fc.string({ minLength: 10, maxLength: 200 }),
            details: fc.string({ minLength: 50, maxLength: 500 })
          }),
          { minLength: 0, maxLength: 5 }
        ),
        async (storedEvents: HistoryEvent[]) => {
          // Mock stored data
          localStorageMock.getItem.mockReturnValue(JSON.stringify(storedEvents));

          const result = await historyDB.getAll();

          // Verify data loading
          expect(Array.isArray(result)).toBe(true);
          
          // Verify data validation - only valid records should be returned
          result.forEach(item => {
            expect(item).toHaveProperty('title');
            expect(item).toHaveProperty('year');
            expect(item).toHaveProperty('description');
            expect(item).toHaveProperty('details');
            expect(item.title).toBeTruthy();
            expect(item.year).toBeTruthy();
            expect(item.description).toBeTruthy();
            expect(item.details).toBeTruthy();
          });
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Feature: korean-history-localization, Property 16: 언어 무관 시간순 정렬**
   * **Validates: Requirements 4.2**
   * 
   * For any mixed language records, should sort chronologically regardless of language
   */
  it('should sort records chronologically regardless of language', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 50 }),
            year: fc.oneof(
              fc.constant('기원전 57년'),
              fc.constant('1392년'),
              fc.constant('1910년'),
              fc.constant('1945년'),
              fc.constant('2024년')
            ),
            description: fc.string({ minLength: 10, maxLength: 100 }),
            details: fc.string({ minLength: 50, maxLength: 200 })
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (events: HistoryEvent[]) => {
          // Mock stored data
          localStorageMock.getItem.mockReturnValue(JSON.stringify(events));

          const result = await historyDB.getAll();

          if (result.length > 1) {
            // Verify chronological sorting
            for (let i = 0; i < result.length - 1; i++) {
              const yearA = historyDB.parseYear(result[i].year);
              const yearB = historyDB.parseYear(result[i + 1].year);
              expect(yearA).toBeLessThanOrEqual(yearB);
            }
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Feature: korean-history-localization, Property 17: 다국어 검색 범위**
   * **Validates: Requirements 4.3**
   * 
   * For any search query, should search across all language records
   */
  it('should search across all language records for any query', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 10 }),
        fc.array(
          fc.record({
            title: fc.oneof(
              fc.constant('조선왕조'),
              fc.constant('Joseon Dynasty'),
              fc.constant('고구려'),
              fc.constant('Goguryeo')
            ),
            year: fc.constant('1392년'),
            description: fc.oneof(
              fc.constant('조선 왕조의 건국'),
              fc.constant('Foundation of Joseon Dynasty')
            ),
            details: fc.string({ minLength: 50, maxLength: 200 })
          }),
          { minLength: 1, maxLength: 3 }
        ),
        async (searchQuery: string, events: HistoryEvent[]) => {
          // Mock stored data
          localStorageMock.getItem.mockReturnValue(JSON.stringify(events));

          const result = await historyDB.search(searchQuery);

          // Verify search results are valid
          expect(Array.isArray(result)).toBe(true);
          
          // If there are results, they should contain the search term
          result.forEach(item => {
            const searchTerm = searchQuery.toLowerCase();
            const matchFound = 
              item.title.toLowerCase().includes(searchTerm) ||
              item.description.toLowerCase().includes(searchTerm) ||
              item.details.toLowerCase().includes(searchTerm) ||
              item.year.includes(searchQuery);
            
            expect(matchFound).toBe(true);
          });
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Feature: korean-history-localization, Property 18: 저장 형식 호환성**
   * **Validates: Requirements 4.4**
   * 
   * For any data format, should maintain compatibility across different formats
   */
  it('should maintain compatibility across different data formats', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // Valid format
          fc.array(
            fc.record({
              title: fc.string({ minLength: 1, maxLength: 50 }),
              year: fc.string({ minLength: 1, maxLength: 20 }),
              description: fc.string({ minLength: 1, maxLength: 100 }),
              details: fc.string({ minLength: 1, maxLength: 200 })
            }),
            { minLength: 0, maxLength: 3 }
          ),
          // Invalid format (should be filtered out)
          fc.array(
            fc.oneof(
              fc.record({
                title: fc.string({ minLength: 1, maxLength: 50 }),
                year: fc.string({ minLength: 1, maxLength: 20 }),
                description: fc.string({ minLength: 1, maxLength: 100 })
                // missing details
              }),
              fc.record({
                title: fc.constant(''),
                year: fc.string({ minLength: 1, maxLength: 20 }),
                description: fc.string({ minLength: 1, maxLength: 100 }),
                details: fc.string({ minLength: 1, maxLength: 200 })
              })
            ),
            { minLength: 0, maxLength: 3 }
          )
        ),
        async (storedData: any) => {
          // Mock stored data
          localStorageMock.getItem.mockReturnValue(JSON.stringify(storedData));

          const result = await historyDB.getAll();

          // Should always return an array
          expect(Array.isArray(result)).toBe(true);
          
          // All returned items should be valid
          result.forEach(item => {
            expect(item.title).toBeTruthy();
            expect(item.year).toBeTruthy();
            expect(item.description).toBeTruthy();
            expect(item.details).toBeTruthy();
          });
        }
      ),
      { numRuns: 10 }
    );
  });
});