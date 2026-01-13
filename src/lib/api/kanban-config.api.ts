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

/**
 * Sync emails from Gmail label into a specific column
 * @param columnId - The column ID to sync emails into
 * @param limit - Max number of emails to sync (default: 10)
 */
export async function syncColumnFromGmail(
  columnId: string,
  limit = 10
): Promise<{ synced: number; message: string }> {
  const response = await apiClient.post<{
    status: 'success';
    data: { synced: number; message: string };
  }>(
    `/api/kanban/columns/${encodeURIComponent(columnId)}/sync?limit=${limit}`,
    {}
  );
  return response.data.data;
}
