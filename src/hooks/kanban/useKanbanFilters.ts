/**
 * Kanban Filters Hook
 *
 * Manages filtering and sorting state for kanban board
 */

import { useState, useMemo } from 'react';
import type { KanbanBoardData, KanbanEmailItem, EmailStatus } from '@/lib/api';

interface UseKanbanFiltersProps {
  board: KanbanBoardData | undefined;
  statuses: EmailStatus[];
}

/**
 * Hook for managing kanban board filters and sorting
 * @param board - Raw board data from API
 * @param statuses - Array of valid column statuses
 * @returns Filtered/sorted board and filter controls
 */
export function useKanbanFilters({ board, statuses }: UseKanbanFiltersProps) {
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [filterUnread, setFilterUnread] = useState(false);
  const [filterSender, setFilterSender] = useState('');
  const [filterAttachments, setFilterAttachments] = useState(false);

  /**
   * Processes board data with filters and sorting
   * Applies: unread filter, sender search, and date sorting
   */
  const processedBoard = useMemo(() => {
    if (!board) return undefined;

    const out: any = {};
    for (const st of statuses) {
      let items: KanbanEmailItem[] = (board as any)[st] ?? [];

      // Filter by unread status (must be in INBOX)
      if (filterUnread) {
        items = items.filter((i) => i.status === 'INBOX');
      }

      // Filter by sender name or email (case-insensitive)
      if (filterSender && filterSender.trim()) {
        const searchTerm = filterSender.trim().toLowerCase();
        items = items.filter((i) => {
          return (
            (i.senderName ?? '').toLowerCase().includes(searchTerm) ||
            (i.senderEmail ?? '').toLowerCase().includes(searchTerm)
          );
        });
      }

      // Filter by attachments
      if (filterAttachments) {
        console.log(
          '[Filter] Filtering by attachments. Sample items:',
          items.slice(0, 3).map((i) => ({
            messageId: i.messageId,
            hasAttachments: (i as any).hasAttachments,
            subject: i.subject,
          }))
        );
        const filtered = items.filter(
          (i) => (i as any).hasAttachments === true
        );
        console.log(
          `[Filter] Filtered ${items.length} items down to ${filtered.length} with attachments`
        );
        items = filtered;
      }

      // Sort by date (createdAt or updatedAt)
      items = items.slice().sort((a, b) => {
        const timeA = new Date(a.createdAt ?? a.updatedAt ?? 0).getTime();
        const timeB = new Date(b.createdAt ?? b.updatedAt ?? 0).getTime();
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      });

      out[st] = items;
    }

    return out as KanbanBoardData;
  }, [
    board,
    statuses,
    sortOrder,
    filterUnread,
    filterSender,
    filterAttachments,
  ]);

  /**
   * Flattens all board items into a single array
   * Useful for batch operations or auto-summarization
   */
  const flatItems = useMemo(() => {
    if (!board) return [];
    return statuses.flatMap((st) => (board as any)[st] ?? []);
  }, [board, statuses]);

  return {
    // Processed data
    processedBoard,
    flatItems,

    // Sort controls
    sortOrder,
    setSortOrder,

    // Filter controls
    filterUnread,
    setFilterUnread,
    filterSender,
    setFilterSender,
    filterAttachments,
    setFilterAttachments,
  };
}
