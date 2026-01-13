/**
 * Kanban Configuration Hook
 * Manages column configuration with backend sync
 */

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  type KanbanColumn,
  DEFAULT_KANBAN_CONFIG,
} from '@/types/kanban-config.types';
import {
  getKanbanColumns,
  updateKanbanColumns,
  syncColumnFromGmail,
} from '@/lib/api/kanban-config.api';

export function useKanbanConfig() {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);
  const previousColumnsRef = useRef<KanbanColumn[]>([]);

  // Fetch columns from backend
  const { data: columns = DEFAULT_KANBAN_CONFIG, isLoading } = useQuery({
    queryKey: ['kanban-columns'],
    queryFn: getKanbanColumns,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Sync columns mutation
  const syncMutation = useMutation({
    mutationFn: updateKanbanColumns,
    onSuccess: (data) => {
      queryClient.setQueryData(['kanban-columns'], data);
    },
  });

  // Sync single column from Gmail mutation
  const syncColumnMutation = useMutation({
    mutationFn: ({ columnId, limit }: { columnId: string; limit?: number }) =>
      syncColumnFromGmail(columnId, limit),
    onSuccess: () => {
      // Invalidate board query to refetch with new emails
      queryClient.invalidateQueries({ queryKey: ['kanban-board'] });
    },
  });

  useEffect(() => {
    if (!isLoading && !isInitialized) {
      setIsInitialized(true);
      previousColumnsRef.current = columns;
    }
  }, [isLoading, isInitialized, columns]);

  const syncColumns = async (newColumns: KanbanColumn[]) => {
    const oldColumns = previousColumnsRef.current;
    const result = await syncMutation.mutateAsync(newColumns);

    // Find columns with new/changed Gmail labels
    const columnsToSync: string[] = [];
    for (const col of newColumns) {
      const oldCol = oldColumns.find((c) => c.id === col.id);
      const oldLabel = oldCol?.gmailLabel || '';
      const newLabel = col.gmailLabel || '';

      // New column with Gmail label or existing column with changed label
      if (newLabel && oldLabel !== newLabel) {
        columnsToSync.push(col.id);
      }
    }

    // Sync new columns from Gmail (sequentially to avoid rate limits)
    for (const columnId of columnsToSync) {
      try {
        await syncColumnMutation.mutateAsync({ columnId, limit: 10 });
      } catch (error) {
        console.error(`Failed to sync column ${columnId}:`, error);
      }
    }

    // Update reference for next comparison
    previousColumnsRef.current = result;

    // Always invalidate board after column changes
    queryClient.invalidateQueries({ queryKey: ['kanban-board'] });

    return result;
  };

  const addColumn = async (name: string, gmailLabel?: string) => {
    const newColumn: KanbanColumn = {
      id: `col_${Date.now()}`,
      name,
      gmailLabel,
      order: columns.length,
    };
    const updated = [...columns, newColumn];
    await syncColumns(updated);
    return newColumn;
  };

  const updateColumn = async (id: string, updates: Partial<KanbanColumn>) => {
    const updated = columns.map((col) =>
      col.id === id ? { ...col, ...updates } : col
    );
    await syncColumns(updated);
  };

  const deleteColumn = async (id: string) => {
    const updated = columns.filter((col) => col.id !== id);
    await syncColumns(updated);
  };

  const reorderColumns = async (newColumns: KanbanColumn[]) => {
    const updated = newColumns.map((col, index) => ({ ...col, order: index }));
    await syncColumns(updated);
  };

  const resetToDefault = async () => {
    await syncColumns(DEFAULT_KANBAN_CONFIG);
  };

  /**
   * Manually sync a single column from its Gmail label
   * Useful for refreshing column content
   */
  const syncColumn = async (columnId: string, limit = 50) => {
    return syncColumnMutation.mutateAsync({ columnId, limit });
  };

  /**
   * Sync all columns that have Gmail labels
   * Used for auto-sync on Kanban view mount
   */
  const syncAllColumns = async (limit = 50) => {
    const columnsWithLabels = columns.filter((col) => col.gmailLabel);

    if (columnsWithLabels.length === 0) return { synced: 0 };

    let totalSynced = 0;
    for (const col of columnsWithLabels) {
      try {
        const result = await syncColumnMutation.mutateAsync({
          columnId: col.id,
          limit,
        });
        totalSynced += result.synced;
      } catch (error) {
        console.error(`Failed to sync column ${col.name}:`, error);
      }
    }

    return { synced: totalSynced };
  };

  return {
    columns,
    addColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
    resetToDefault,
    syncColumn,
    syncAllColumns,
    isLoading,
    isSyncing: syncMutation.isPending || syncColumnMutation.isPending,
    error: syncMutation.error || syncColumnMutation.error,
  };
}
