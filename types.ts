export interface HistoryEvent {
  title: string;
  year: string;
  description: string;
  details: string;
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