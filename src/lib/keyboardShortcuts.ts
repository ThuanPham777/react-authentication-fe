/**
 * Keyboard shortcuts configuration and utilities
 * Inspired by Gmail's keyboard navigation system
 */

export type ShortcutAction =
  | 'NEXT_EMAIL'
  | 'PREV_EMAIL'
  | 'OPEN_EMAIL'
  | 'FOCUS_SEARCH'
  | 'SHOW_HELP'
  | 'CLOSE_MODAL';

export type ShortcutDefinition = {
  keys: string[];
  description: string;
  category: 'Navigation' | 'Actions' | 'View' | 'Selection';
  contexts?: ('list' | 'detail' | 'kanban' | 'global')[];
};

/**
 * All available keyboard shortcuts
 */
export const SHORTCUTS: Record<ShortcutAction, ShortcutDefinition> = {
  // Navigation
  NEXT_EMAIL: {
    keys: ['j', 'ArrowDown'],
    description: 'Next email',
    category: 'Navigation',
    contexts: ['list'],
  },
  PREV_EMAIL: {
    keys: ['k', 'ArrowUp'],
    description: 'Previous email',
    category: 'Navigation',
    contexts: ['list'],
  },
  OPEN_EMAIL: {
    keys: ['Enter'],
    description: 'Open selected email',
    category: 'Navigation',
    contexts: ['list'],
  },

  // View
  FOCUS_SEARCH: {
    keys: ['/'],
    description: 'Focus search',
    category: 'View',
    contexts: ['global'],
  },
  CLOSE_MODAL: {
    keys: ['Escape'],
    description: 'Close modal',
    category: 'View',
    contexts: ['global'],
  },
  SHOW_HELP: {
    keys: ['?'],
    description: 'Show keyboard shortcuts help',
    category: 'View',
    contexts: ['global'],
  },
};

/**
 * Check if user is currently typing in an input element
 */
export function isTypingContext(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  const isEditable = target.isContentEditable;

  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    isEditable ||
    target.hasAttribute('contenteditable')
  );
}

/**
 * Normalize key event to shortcut string
 */
