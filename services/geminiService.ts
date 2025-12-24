import { HistoryEvent } from '../types';

// 환경 변수 설정 (Vite인 경우 VITE_ 접두사가 필요합니다)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyDO8p1qu_zEJHApy4lSh1iZDBpbNXUFBDE";

export const fetchHistoryStory = async (topic: string): Promise<HistoryEvent[]> => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a historical storyteller. Topic: ${topic}. 
              Generate 5 historical entries as a raw JSON array. 
              Schema: [{"title": "string", "year": "string", "description": "string", "details": "string"}]
              Return ONLY the JSON array. Do not include markdown formatting or backticks.`
            }]
          }]
          // ⚠️ 400 에러를 유발했던 generationConfig 설정을 제거하여 호환성을 높였습니다.
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API 호출 실패 (${response.status})`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error("응답 데이터가 비어 있습니다.");

    // 마크다운 백틱(```json)이 포함되어 올 경우를 대비한 추출 로직
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("유효하지 않은 데이터 형식입니다.");
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Gemini Service Error:", error);
    throw error;
  }
};