/**
 * Kanban Configuration Hook
 * Manages column configuration with backend sync
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  type KanbanColumn,
  DEFAULT_KANBAN_CONFIG,
} from '@/types/kanban-config.types';
import {
  getKanbanColumns,
  updateKanbanColumns,
} from '@/lib/api/kanban-config.api';

export function useKanbanConfig() {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch columns from backend
  const { data: columns = DEFAULT_KANBAN_CONFIG, isLoading } = useQuery({
    queryKey: ['kanban-columns'],
    queryFn: getKanbanColumns,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: updateKanbanColumns,
    onSuccess: (data) => {
      queryClient.setQueryData(['kanban-columns'], data);
    },
  });

  useEffect(() => {
    if (!isLoading && !isInitialized) {
      setIsInitialized(true);
    }
  }, [isLoading, isInitialized]);

  const syncColumns = async (newColumns: KanbanColumn[]) => {
    return syncMutation.mutateAsync(newColumns);
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

  return {
    columns,
    addColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
    resetToDefault,
    isLoading,
    isSyncing: syncMutation.isPending,
    error: syncMutation.error,
  };
}
