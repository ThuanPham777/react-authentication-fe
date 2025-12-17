/**
 * Kanban Column Configuration API
 */

import apiClient from './client';
import { type KanbanColumn } from '@/types/kanban-config.types';

export async function getKanbanColumns(): Promise<KanbanColumn[]> {
  const response = await apiClient.get('/api/kanban/columns');
  return response.data.data;
}

export async function updateKanbanColumns(
  columns: KanbanColumn[]
): Promise<KanbanColumn[]> {
  const response = await apiClient.post('/api/kanban/columns', { columns });
  return response.data.data;
}
