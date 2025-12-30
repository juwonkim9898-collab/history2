import { HistoryEvent, HistoryEventUI, ParsedHistoryContent, ApiResponse, RecordsResponse, TagCount, StatsResponse } from '../types';

// API 기본 URL
const API_BASE_URL = 'http://127.0.0.1:8000';

// 토큰 저장
let authToken: string | null = null;

// 브라우저 로컬 DB 삭제 (IndexedDB 정리)
export async function clearLocalDB(): Promise<void> {
  try {
    // 알려진 IndexedDB 이름들 삭제
    const dbNames = ['historyDB', 'grimoireDB', 'history', 'grimoire'];
    
    for (const dbName of dbNames) {
      try {
        console.log('🗑️ 로컬 DB 삭제 시도:', dbName);
        indexedDB.deleteDatabase(dbName);
      } catch (err) {
        console.warn('⚠️ DB 삭제 실패:', dbName, err);
      }
    }
    
    // localStorage 정리
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('history') || key.includes('grimoire') || key.includes('DB'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => {
      console.log('🗑️ localStorage 삭제:', key);
      localStorage.removeItem(key);
    });
    
    console.log('✅ 로컬 DB 정리 완료');
  } catch (error) {
    console.warn('⚠️ 로컬 DB 정리 중 오류:', error);
  }
}

// 토큰 가져오기 함수
async function getToken(): Promise<string> {
  if (!authToken) {
    const response = await fetch(`${API_BASE_URL}/generate-test-token`);
    const data = await response.json();
    authToken = data.token;
  }
  return authToken;
}

// content 필드 파싱 헬퍼 - 백엔드 summary 필드 사용
function parseHistoryContent(event: HistoryEvent): ParsedHistoryContent {
  // 날짜를 한국어 형식으로 포맷팅
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '제목 없음';
    try {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${year}년 ${month}월 ${day}일`;
    } catch {
      return dateStr;
    }
  };

  // 백엔드에서 summary와 content를 분리해서 제공
  return {
    title: formatDate(event.record_date),
    year: event.record_date ? new Date(event.record_date).getFullYear().toString() : '',
    description: event.summary, // 백엔드의 summary 필드 사용 (요약만)
    details: event.content, // 전체 내용
    image_url: event.file_url || undefined // 백엔드의 file_url 필드 사용
  };
}

// HistoryEvent를 HistoryEventUI로 변환
function toHistoryEventUI(event: HistoryEvent): HistoryEventUI {
  return {
    ...event,
    parsed: parseHistoryContent(event)
  };
}

// API 호출 헬퍼 함수
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  
  console.log('🔵 API 호출:', `${API_BASE_URL}${endpoint}`);
  console.log('🔑 토큰:', token ? token.substring(0, 20) + '...' : 'null');
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  console.log('📡 응답 상태:', response.status, response.statusText);

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ API 오류:', error);
    throw new Error(error.error?.message || '서버 오류가 발생했습니다.');
  }

  const result: ApiResponse<T> = await response.json();
  console.log('✅ API 응답:', result);
  
  if (!result.success || !result.data) {
    console.error('❌ 데이터 없음:', result);
    throw new Error(result.error?.message || '데이터를 불러올 수 없습니다.');
  }

  return result.data;
}

export const historyDB = {
  // 전체 기록 조회
  async getAll(page: number = 1, limit: number = 100, sort: string = 'date_desc'): Promise<HistoryEventUI[]> {
    try {
      console.log('📚 getAll 호출됨:', { page, limit, sort });
      const data = await apiCall<RecordsResponse>(
        `/api/records?page=${page}&limit=${limit}&sort=${sort}`
      );
      console.log('📚 받은 데이터:', data);
      const result = data.records.map(toHistoryEventUI);
      console.log('📚 변환된 데이터:', result);
      return result;
    } catch (error) {
      console.error('❌ 데이터 로딩 오류:', error);
      return [];
    }
  },

  // 특정 기록 조회
  async getById(id: number): Promise<HistoryEventUI | null> {
    try {
      const record = await apiCall<HistoryEvent>(`/api/records/${id}`);
      return toHistoryEventUI(record);
    } catch (error) {
      console.error('기록 조회 오류:', error);
      return null;
    }
  },

  // 기록 추가
  async add(events: HistoryEventUI[]): Promise<void> {
    try {
      if (!Array.isArray(events) || events.length === 0) {
        throw new Error('저장할 데이터가 유효하지 않습니다.');
      }

      // 각 이벤트를 개별적으로 POST
      for (const event of events) {
        await apiCall('/api/records', {
          method: 'POST',
          body: JSON.stringify({
            content: event.content,
            record_date: event.record_date,
            tags: event.tags
          })
        });
      }
    } catch (error) {
      console.error('데이터 저장 오류:', error);
      throw new Error('기록을 저장하는 중 오류가 발생했습니다.');
    }
  },

  // 기록 삭제 (전체)
  async clear(): Promise<void> {
    try {
      // 모든 기록을 가져와서 개별 삭제
      const records = await this.getAll(1, 1000);
      for (const record of records) {
        await apiCall(`/api/records/${record.id}`, {
          method: 'DELETE'
        });
      }
    } catch (error) {
      console.error('데이터 삭제 오류:', error);
      throw new Error('기록을 삭제하는 중 오류가 발생했습니다.');
    }
  },

  // 날짜 범위로 기록 조회
  async getByDateRange(startDate: string, endDate: string, page: number = 1, limit: number = 100): Promise<HistoryEventUI[]> {
    try {
      const data = await apiCall<RecordsResponse>(
        `/api/records/date-range?start_date=${startDate}&end_date=${endDate}&page=${page}&limit=${limit}`
      );
      return data.records.map(toHistoryEventUI);
    } catch (error) {
      console.error('날짜 범위 조회 오류:', error);
      return [];
    }
  },

  // 키워드로 검색
  async search(query: string, page: number = 1, limit: number = 100): Promise<HistoryEventUI[]> {
    try {
      const data = await apiCall<RecordsResponse>(
        `/api/records/search/keyword?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
      );
      return data.records.map(toHistoryEventUI);
    } catch (error) {
      console.error('검색 오류:', error);
      return [];
    }
  },

  // 태그로 검색
  async searchByTags(tags: string[], matchAll: boolean = false, page: number = 1, limit: number = 100): Promise<HistoryEventUI[]> {
    try {
      const tagsParam = tags.join(',');
      const data = await apiCall<RecordsResponse>(
        `/api/records/search/tags?tags=${encodeURIComponent(tagsParam)}&match_all=${matchAll}&page=${page}&limit=${limit}`
      );
      return data.records.map(toHistoryEventUI);
    } catch (error) {
      console.error('태그 검색 오류:', error);
      return [];
    }
  },

  // 모든 태그 가져오기
  async getAllTags(): Promise<string[]> {
    try {
      const data = await apiCall<{ tags: TagCount[]; total_tags: number }>(
        `/api/records/tags`
      );
      return data.tags.map(t => t.tag);
    } catch (error) {
      console.error('태그 조회 오류:', error);
      return [];
    }
  },

  // 태그로 필터링
  async filterByTag(tag: string): Promise<HistoryEventUI[]> {
    return this.searchByTags([tag], false);
  },

  // 통계 조회
  async getStats(period: string = 'month'): Promise<StatsResponse | null> {
    try {
      const data = await apiCall<StatsResponse>(
        `/api/records/stats?period=${period}`
      );
      return data;
    } catch (error) {
      console.error('통계 조회 오류:', error);
      return null;
    }
  },

  // 태그 중복 체크
  async hasTag(tag: string): Promise<boolean> {
    const tags = await this.getAllTags();
    return tags.includes(tag);
  }
};