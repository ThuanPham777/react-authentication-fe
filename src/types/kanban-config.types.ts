/**
 * Dynamic Kanban Column Configuration Types
 */

export interface KanbanColumn {
  id: string;
  name: string;
  gmailLabel?: string; // Optional Gmail label mapping
  order: number;
}

export interface KanbanConfig {
  userId: string;
  columns: KanbanColumn[];
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_KANBAN_CONFIG: KanbanColumn[] = [
  { id: 'INBOX', name: 'Inbox', gmailLabel: 'INBOX', order: 0 },
  { id: 'TODO', name: 'To Do', gmailLabel: 'TODO', order: 1 },
  {
    id: 'IN_PROGRESS',
    name: 'In Progress',
    gmailLabel: 'IN_PROGRESS',
    order: 2,
  },
  { id: 'DONE', name: 'Done', gmailLabel: 'DONE', order: 3 },
];
