import { type KanbanColumn } from '@/types/kanban-config.types';

/**
 * Built-in email status constants.
 * Note: EmailStatus type accepts ANY string (for dynamic columns),
 * but these constants are used for special logic:
 * - INBOX: Default status for new emails
 * - SNOOZED: Special temporary status for snoozed emails
 */
export const EmailStatus = {
  INBOX: 'INBOX',
  SNOOZED: 'SNOOZED',
} as const;

export type EmailStatus = string; // Dynamic status support

export interface KanbanEmailItem {
  _id: string;
  userId: string;
  provider: 'gmail';
  messageId: string;
  mailboxId?: string;

  unread?: boolean;

  senderName?: string;
  senderEmail?: string;
  subject?: string;
  snippet?: string;
  threadId?: string;

  status: EmailStatus;
  originalStatus?: EmailStatus;
  snoozeUntil?: string;

  summary?: string;
  lastSummarizedAt?: string;

  receivedAt?: string; // Email received date from Gmail (internalDate)

  hasAttachments?: boolean;

  createdAt?: string;
  updatedAt?: string;

  // Search-only metadata
  _score?: number;
  _searchType?: 'fuzzy' | 'semantic';
}

export interface KanbanBoardData {
  [status: string]: KanbanEmailItem[]; // Dynamic columns
}

export interface KanbanBoardResponse {
  status: 'success';
  message?: string;
  data: {
    data: KanbanBoardData;
    meta: {
      pageSize: number;
      nextPageToken?: string | null;
      hasMore?: boolean;
      total?: Record<string, number>;
    };
    columns?: KanbanColumn[]; // Column configuration from backend
    warnings?: Array<{
      columnId: string;
      message: string;
      type: 'warning' | 'error';
    }>; // Gmail label validation warnings
  };
}
