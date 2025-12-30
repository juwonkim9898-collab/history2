// 다른 프로젝트에서 import할 수 있는 라이브러리 진입점

export { default as KoreanHistoryGrimoire } from './App';
export { Grimoire } from './components/Grimoire';
export { Page } from './components/Page';
export { ErrorBoundary } from './components/ErrorBoundary';

// 서비스 export
export { fetchHistoryStory } from './services/geminiService';
export { historyDB, clearLocalDB } from './services/db';

// 타입 export
export * from './types';
