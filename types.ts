// 백엔드 API 응답 타입
export interface HistoryEvent {
  id: number;
  user_id: string;
  content: string; // 전체 내용 (요약 + 상세 기록)
  summary: string; // 요약 부분만 (상세 기록 제외)
  record_date: string; // YYYY-MM-DD 형식
  tags: string[];
  file_url: string | null; // 사진 URL (추후 사용)
}

// 파싱된 콘텐츠 타입
export interface ParsedHistoryContent {
  title: string;
  year: string;
  description: string;
  details: string;
  image_url?: string; // 이미지 URL (선택적)
}

// UI에서 사용하는 확장된 타입
export interface HistoryEventUI extends HistoryEvent {
  parsed: ParsedHistoryContent;
}

// API 응답 래퍼
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// 페이지네이션 정보
export interface Pagination {
  current_page: number;
  total_pages: number;
  total_records: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}

// 기록 목록 응답
export interface RecordsResponse {
  records: HistoryEvent[];
  pagination: Pagination;
}

// 태그 카운트
export interface TagCount {
  tag: string;
  count: number;
}

// 날짜별 카운트
export interface DateCount {
  date: string;
  count: number;
}

// 통계 응답
export interface StatsResponse {
  period: string;
  total_records: number;
  records_in_period: number;
  most_used_tags: TagCount[];
  records_by_date: DateCount[];
  date_range: {
    start_date: string | null;
    end_date: string;
  };
}

export interface BookContent {
  leftPage: HistoryEvent | null;
  rightPage: HistoryEvent | null;
}

export enum AppState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  READING = 'READING',
  ERROR = 'ERROR'
}

export const KOREAN_UI_TEXTS = {
  searchPlaceholder: "기록 정보 불러오기",
  loading: "기록 중...",
  reset: "초기화",
  index: "목차",
  page: "페이지",
  end: "끝",
  errorTitle: "기록을 불러올 수 없습니다",
  errorMessage: "역사를 불러오는 중 오류가 발생했습니다.",
  confirmReset: "정말로 모든 기록을 삭제하시겠습니까?",
  suggestedTopics: [], // DB에서 동적으로 로드됨
  bookTitle: "역사서",
  bookSubtitle: "시대의 기록",
  allTags: "전체",
  duplicateWarning: "이미 검색한 키워드입니다"
};