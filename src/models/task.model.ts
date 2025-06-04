export interface Task {
  id: number | string;
  title: string;
  completed: boolean;
  userId?: number;
  source?: 'external' | 'firebase';
}
