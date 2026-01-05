/**
 * Custom hook for keyboard navigation and shortcuts
 * Handles global and context-specific keyboard events
 */

import { useEffect, useRef, useCallback } from 'react';
import {
  SHORTCUTS,
  isTypingContext,
  type ShortcutAction,
} from '@/lib/keyboardShortcuts';

export type ShortcutHandler = () => void;
export type ShortcutHandlers = Partial<Record<ShortcutAction, ShortcutHandler>>;

interface UseKeyboardNavigationOptions {
  /**
   * Handlers for specific shortcut actions
   */
  handlers: ShortcutHandlers;
  /**
   * Whether keyboard shortcuts are enabled
   */
  enabled?: boolean;
}

/**
 * Hook for handling keyboard shortcuts
 * Supports command sequences like 'g i' for multi-key shortcuts
 */
