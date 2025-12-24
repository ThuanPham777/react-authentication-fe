/**
 * Kanban Column Configuration API
 */

import apiClient from './client';
import { type KanbanColumn } from '@/types/kanban-config.types';

export async function getKanbanColumns(): Promise<KanbanColumn[]> {
  const response = await apiClient.get<{
    status: 'success';
    data: { columns: KanbanColumn[] };
  }>('/api/kanban/columns');
  return response.data.data.columns;
}

export async function updateKanbanColumns(
  columns: KanbanColumn[]
): Promise<KanbanColumn[]> {
  const response = await apiClient.post<{
    status: 'success';
    data: { columns: KanbanColumn[] };
  }>('/api/kanban/columns', { columns });
  return response.data.data.columns;
}
