/**
 * Gmail System Labels
 * These labels always exist in Gmail and don't need validation
 */
export const GMAIL_SYSTEM_LABELS = [
  'INBOX',
  'STARRED',
  'IMPORTANT',
  'SENT',
  'DRAFT',
  'TRASH',
  'SPAM',
  'UNREAD',
] as const;

export type GmailSystemLabel = (typeof GMAIL_SYSTEM_LABELS)[number];

/**
 * Check if a label is a Gmail system label
 */
export function isSystemLabel(label: string): boolean {
  return GMAIL_SYSTEM_LABELS.includes(label.toUpperCase() as GmailSystemLabel);
}
