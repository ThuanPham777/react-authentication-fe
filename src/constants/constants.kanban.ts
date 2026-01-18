// src/pages/inbox/components/kanban/constants.ts

/**
 * Built-in email status constants.
 * Note: EmailStatus type accepts ANY string (for dynamic columns),
 * but these constants are used for special logic:
 * - INBOX: Default status for new emails
 * - SNOOZED: Special temporary status for snoozed emails
 */
export const EMAIL_STATUS = {
  INBOX: 'INBOX',
  SNOOZED: 'SNOOZED',
} as const;

export type EmailStatus = string; // Dynamic status support - any column ID

// COLUMN_TITLES is deprecated - column names come from dynamic config now
// Keeping for backward compatibility with any remaining hard-coded references
export const COLUMN_TITLES: Record<string, string> = {
  INBOX: 'INBOX',
  SNOOZED: 'SNOOZED',
};

/**
 * Constants for Kanban Inbox View
 * Centralizes configuration values and magic numbers
 */

/**
 * Maximum number of items to auto-summarize on board load
 * Prevents overwhelming the AI service with too many requests
 */
export const MAX_AUTO_SUMMARIZE_ITEMS = 12;

/**
 * Duration (in milliseconds) to show success/error messages
 */
export const MESSAGE_DISPLAY_DURATION = 2000;

/**
 * Default animation duration for card transitions (in milliseconds)
 */
export const CARD_ANIMATION_DURATION = 200;

/**
 * Maximum length for email subject in card preview
 */
export const MAX_SUBJECT_LENGTH_KANBAN = 60;

/**
 * Maximum length for email preview text in card
 */
export const MAX_PREVIEW_LENGTH_KANBAN = 100;

/**
 * Debounce delay for sender filter input (in milliseconds)
 */
export const FILTER_DEBOUNCE_DELAY = 300;

/**
 * Number of kanban items to fetch per page/request
 * Used in infinite scroll pagination
 */
export const KANBAN_PER_PAGE = 10;
