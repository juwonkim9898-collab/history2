import { HistoryEvent } from '../types';

const DB_KEY = 'grimoire_history';

// 로컬 스토리지를 DB처럼 사용하는 프로토타입 서비스
export const historyDB = {
  async getAll(): Promise<HistoryEvent[]> {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : [];
  },

  async add(events: HistoryEvent[]): Promise<void> {
    const current = await this.getAll();
    const updated = [...current, ...events];
    localStorage.setItem(DB_KEY, JSON.stringify(updated));
  },

  async clear(): Promise<void> {
    localStorage.removeItem(DB_KEY);
  }
};