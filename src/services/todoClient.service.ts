import axios from 'axios';
import { Task } from '../models/task.model';

const EXTERNAL_API_URL = 'https://jsonplaceholder.typicode.com/todos'; // Ejemplo

export async function getAllExternalTasks(): Promise<Task[]> {
  const response = await axios.get<any[]>(EXTERNAL_API_URL);
  // Transforma la respuesta a objetos Task
  return response.data.map(item => ({
    id: item.id,
    title: item.title,
    completed: item.completed,
    userId: item.userId,
    source: 'external'
  }));
}

export async function createExternalTask(taskData: { title: string; completed: boolean; userId: number }): Promise<Task> {
  const response = await axios.post<any>(EXTERNAL_API_URL, taskData);
  return {
    id: response.data.id,
    title: response.data.title,
    completed: response.data.completed,
    userId: response.data.userId,
    source: 'external'
  };
}

export async function updateExternalTask(id: number, taskData: Partial<Task>): Promise<Task> {
  const response = await axios.put<any>(`<span class="math-inline">\{EXTERNAL\_API\_URL\}/</span>{id}`, taskData);
  return {
    id: response.data.id,
    title: response.data.title,
    completed: response.data.completed,
    userId: response.data.userId,
    source: 'external'
  };
}

export async function deleteExternalTask(id: number): Promise<void> {
  await axios.delete(`<span class="math-inline">\{EXTERNAL\_API\_URL\}/</span>{id}`);
}