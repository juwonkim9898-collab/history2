import { HistoryEventUI } from '../types';

// DB에만 의존하는 서비스 (Gemini API 불필요)
// DB에 데이터가 없으면 에러 메시지만 반환
export const fetchHistoryStory = async (topic: string): Promise<HistoryEventUI[]> => {
  // DB에 없는 검색어는 에러 처리
  throw new Error(`"${topic}"에 대한 검색 결과가 없습니다. DB에 데이터를 먼저 추가해주세요.`);
};
