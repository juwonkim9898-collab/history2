import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { fetchHistoryStory } from '../../../services/geminiService';

describe('Local History Service Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * **Feature: korean-history-localization, Property 11: 한국어 검색 응답**
   * **Validates: Requirements 3.1**
   * 
   * For any search topic, should return Korean historical content
   */
  it('should return Korean historical content for any search topic', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('조선왕조'),
          fc.constant('고구려'),
          fc.constant('한국전쟁'),
          fc.constant('독립운동'),
          fc.string({ minLength: 1, maxLength: 20 })
        ),
        async (topic: string) => {
          const result = await fetchHistoryStory(topic);

          // Verify data structure
          expect(Array.isArray(result)).toBe(true);
          expect(result.length).toBeGreaterThan(0);

          // Verify each item has required Korean fields
          result.forEach(item => {
            expect(item).toHaveProperty('title');
            expect(item).toHaveProperty('year');
            expect(item).toHaveProperty('description');
            expect(item).toHaveProperty('details');
            expect(typeof item.title).toBe('string');
            expect(typeof item.year).toBe('string');
            expect(typeof item.description).toBe('string');
            expect(typeof item.details).toBe('string');
            expect(item.title.length).toBeGreaterThan(0);
            expect(item.year.length).toBeGreaterThan(0);
            expect(item.description.length).toBeGreaterThan(0);
            expect(item.details.length).toBeGreaterThan(0);
          });
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * **Feature: korean-history-localization, Property 12: 한국 역사 데이터 반환**
   * **Validates: Requirements 3.2**
   * 
   * For any valid search, should return authentic Korean historical data
   */
  it('should return authentic Korean historical data', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom('조선왕조', '고구려', '한국전쟁', '독립운동', '통일신라', '고려'),
        async (category: string) => {
          const result = await fetchHistoryStory(category);

          expect(result.length).toBeGreaterThan(0);

          // Verify Korean year format
          result.forEach(item => {
            expect(
              item.year.includes('년') || 
              item.year.includes('기원전') ||
              item.year.includes('세기')
            ).toBe(true);
          });

          // Verify Korean content
          result.forEach(item => {
            // Should contain Korean characters
            expect(/[가-힣]/.test(item.title)).toBe(true);
            expect(/[가-힣]/.test(item.description)).toBe(true);
            expect(/[가-힣]/.test(item.details)).toBe(true);
          });
        }
      ),
      { numRuns: 15 }
    );
  });

  /**
   * **Feature: korean-history-localization, Property 7: 한국어 오류 메시지**
   * **Validates: Requirements 2.2**
   * 
   * For any error condition, should return Korean error messages
   */
  it('should return Korean error messages for error conditions', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant(''),
          fc.constant('   '),
          fc.constant('\t\n')
        ),
        async (invalidInput: string) => {
          await expect(fetchHistoryStory(invalidInput)).rejects.toThrow();

          try {
            await fetchHistoryStory(invalidInput);
          } catch (error) {
            const errorMessage = (error as Error).message;
            
            // Verify Korean error messages
            expect(
              errorMessage.includes('검색어') ||
              errorMessage.includes('오류') ||
              errorMessage.includes('입력') ||
              errorMessage.includes('시도')
            ).toBe(true);
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Feature: korean-history-localization, Property: 검색 결과 일관성**
   * **Validates: 동일한 검색어에 대한 일관된 결과**
   * 
   * For the same search term, should return consistent results
   */
  it('should return consistent results for the same search term', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom('조선왕조', '고구려', '한국전쟁'),
        async (searchTerm: string) => {
          const result1 = await fetchHistoryStory(searchTerm);
          const result2 = await fetchHistoryStory(searchTerm);

          // Results should be consistent (same titles and years)
          expect(result1.length).toBe(result2.length);
          
          result1.forEach((item1, index) => {
            const item2 = result2[index];
            expect(item1.title).toBe(item2.title);
            expect(item1.year).toBe(item2.year);
            expect(item1.description).toBe(item2.description);
            expect(item1.details).toBe(item2.details);
          });
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Feature: korean-history-localization, Property: 응답 시간 테스트**
   * **Validates: 적절한 응답 시간**
   * 
   * For any search, should respond within reasonable time
   */
  it('should respond within reasonable time for any search', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }),
        async (searchTerm: string) => {
          const startTime = Date.now();
          await fetchHistoryStory(searchTerm);
          const endTime = Date.now();
          
          const responseTime = endTime - startTime;
          
          // Should respond within 3 seconds (including simulated delay)
          expect(responseTime).toBeLessThan(3000);
          // Should have some delay to simulate real API (at least 500ms)
          expect(responseTime).toBeGreaterThan(500);
        }
      ),
      { numRuns: 5 }
    );
  });
});