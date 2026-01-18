/**
 * Custom hook for managing email selection state
 * Handles single selection, multi-selection, and auto-selection logic
 */

import { useEffect, useState } from 'react';
import type { EmailListItem } from '@/lib/api';

interface UseEmailSelectionProps {
  emails: EmailListItem[];
  mailboxId: string;
}

export function useEmailSelection({
  emails,
  mailboxId,
}: UseEmailSelectionProps) {
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  /**
   * Reset selection when mailbox changes
   */
  useEffect(() => {
    setSelectedEmails([]);
    setSelectedEmailId(null);
  }, [mailboxId]);

  /**
   * Handle edge case when selected email is deleted
   * Does NOT auto-select first email on initial load - user must click to select
   */
  useEffect(() => {
    if (!emails.length) {
      setSelectedEmailId(null);
      return;
    }

    // Only act if there WAS a selection but the email no longer exists
    // This handles deletion cases without auto-selecting on initial load
    if (selectedEmailId) {
      const currentIndex = emails.findIndex((e) => e.id === selectedEmailId);
      if (currentIndex === -1) {
        // Selected email was deleted, clear selection
        setSelectedEmailId(null);
      }
    }
  }, [emails, selectedEmailId]);

  /**
   * Toggle selection of a single email (for bulk actions)
   */
  const handleToggleSelect = (emailId: string) => {
    setSelectedEmails((prev) =>
      prev.includes(emailId)
        ? prev.filter((id) => id !== emailId)
        : [...prev, emailId],
    );
  };

  /**
   * Select or deselect all emails
   */
  const handleSelectAll = () => {
    if (!emails.length) return;
    setSelectedEmails((prev) =>
      prev.length === emails.length ? [] : emails.map((e) => e.id),
    );
  };

  /**
   * Clear all selections (useful after bulk actions)
   */
  const clearSelections = () => {
    setSelectedEmails([]);
  };

  return {
    selectedEmailId,
    selectedEmails,
    setSelectedEmailId,
    handleToggleSelect,
    handleSelectAll,
    clearSelections,
  };
}
