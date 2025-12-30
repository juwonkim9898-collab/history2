import { HistoryEventUI } from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000';

// 토큰 관리
class TokenManager {
  private token: string | null = null;

  async getToken(): Promise<string> {
    if (!this.token) {
      try {
        const response = await fetch(`${API_BASE_URL}/generate-test-token`);
        const data = await response.json();
        this.token = data.token;
        localStorage.setItem('auth_token', this.token);
      } catch (error) {
        console.error('토큰 생성 실패:', error);
        throw error;
      }
    }
    return this.token;
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
  }
}

const tokenManager = new TokenManager();

// API 응답 타입
interface ApiRecord {
  id: number;
  user_id: string;
  content: string;
  summary: string; // 새 필드 추가
  record_date: string;
  tags: string[];
  file_url: string | null; // 새 필드 추가
}

interface ApiResponse {
  success: boolean;
  data: {
    records: ApiRecord[];
    pagination?: {
      current_page: number;
      total_pages: number;
      total_records: number;
      limit: number;
      has_next: boolean;
      has_prev: boolean;
    };
  };
}

// API 호출 헬퍼
async function apiCall<T>(endpoint: string): Promise<T> {
  const token = await tokenManager.getToken();

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        tokenManager.clearToken();
        return apiCall(endpoint);
      }
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API 호출 실패:', error);
    throw error;
  }
}

// API 응답을 HistoryEventUI 형식으로 변환
function convertToHistoryEvent(record: ApiRecord): HistoryEventUI {
  try {
    // content가 JSON 문자열인 경우 파싱
    let parsed;
    try {
      parsed = JSON.parse(record.content);
    } catch {
      // JSON이 아니면 content를 그대로 사용
      parsed = {
        title: '기록',
        year: record.record_date,
        description: record.content.substring(0, 100),
        details: record.content
      };
    }

    return {
      id: record.id,
      user_id: record.user_id,
      content: record.content,
      summary: record.summary || record.content, // 새 필드 추가
      record_date: record.record_date,
      tags: record.tags || [],
      file_url: record.file_url || null, // 새 필드 추가
      parsed: {
        title: parsed.title || '기록',
        year: parsed.year || record.record_date,
        description: parsed.description || record.content.substring(0, 100),
        details: parsed.details || record.content
      }
    };
  } catch (error) {
    console.error('데이터 변환 실패:', error);
    // 기본값 반환
    return {
      id: record.id,
      user_id: record.user_id,
      content: record.content,
      summary: record.summary || record.content, // 새 필드 추가
      record_date: record.record_date,
      tags: record.tags || [],
      file_url: record.file_url || null, // 새 필드 추가
      parsed: {
        title: '기록',
        year: record.record_date,
        description: record.content.substring(0, 100),
        details: record.content
      }
    };
  }
}

// API 함수들
export const api = {
  // 전체 기록 조회
  async getRecords(page = 1, limit = 20): Promise<HistoryEventUI[]> {
    const response = await apiCall<ApiResponse>(`/api/records?page=${page}&limit=${limit}`);
    if (response.success) {
      return response.data.records.map(convertToHistoryEvent);
    }
    return [];
  },

  // 키워드 검색
  async searchByKeyword(keyword: string): Promise<HistoryEventUI[]> {
    const response = await apiCall<ApiResponse>(
      `/api/records/search/keyword?q=${encodeURIComponent(keyword)}`
    );
    if (response.success) {
      return response.data.records.map(convertToHistoryEvent);
    }
    return [];
  },

  // 태그로 검색
  async searchByTags(tags: string[]): Promise<HistoryEventUI[]> {
    const tagsParam = tags.join(',');
    const response = await apiCall<ApiResponse>(
      `/api/records/search/tags?tags=${tagsParam}`
    );
    if (response.success) {
      return response.data.records.map(convertToHistoryEvent);
    }
    return [];
  },

  // 모든 태그 조회
  async getTags(): Promise<{ tag: string; count: number }[]> {
    const response = await apiCall<any>('/api/records/tags');
    if (response.success) {
      return response.data.tags;
    }
    return [];
  },

  // 통계 조회
  async getStats(period: 'week' | 'month' | 'year' | 'all' = 'month') {
    const response = await apiCall<any>(`/api/records/stats?period=${period}`);
    if (response.success) {
      return response.data;
    }
    return null;
  },
};

export default api;
