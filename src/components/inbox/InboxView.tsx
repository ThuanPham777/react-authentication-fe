/**
 * TraditionalInboxView Component
 *
 * Displays emails in a 2-column layout (email list + email detail)
 * Features:
 * - Infinite scroll pagination
 * - Email search/filter
 * - Bulk actions (mark read/unread, star, delete)
 * - Email compose/reply
 * - Optimistic UI updates
 */

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import {
  gmailCached,
  getAttachment,
  searchEmails,
  type EmailDetailResponse,
  type SendEmailData,
} from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmailListColumn } from './EmailListColumn';
import { EmailDetailColumn } from './EmailDetailColumn';
import { ComposeModal } from './ComposeModal';
import { CacheStatusIndicator } from './CacheStatusIndicator';
import { useEmailMutations } from '../../hooks/email/useEmailMutations';
import { useEmailSelection } from '../../hooks/email/useEmailSelection';
import {
  downloadAttachment,
  createDefaultComposeDraft,
} from '../../utils/emailUtils';
import { EMAILS_PER_PAGE } from '../../constants/constants.email';

type ComposeDraft = {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  body: string;
  mode?: 'compose' | 'forward';
  forwardEmailId?: string;
};

export function InboxView({
  mailboxId,
  emailSearchTerm = '',
  newEmailIds,
  onClearNewEmailId,
}: {
  mailboxId: string;
  emailSearchTerm?: string;
  newEmailIds?: Set<string>;
  onClearNewEmailId?: (id: string) => void;
}) {
  // State for compose modal and action messages
  const [composeDraft, setComposeDraft] = useState<ComposeDraft | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Debounced search term for API calls (to avoid too many requests)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce the search term to reduce API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(emailSearchTerm.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [emailSearchTerm]);

  // Determine if we're in search mode (global search across all labels)
  const isSearchMode = debouncedSearchTerm.length > 0;

  /**
   * Fetch emails with infinite scroll pagination + offline caching
   * Uses pageToken from Gmail API for cursor-based pagination
   * Only runs when NOT in search mode (normal mailbox browsing)
   */
  const emailsQuery = useInfiniteQuery({
    queryKey: ['emails-infinite', mailboxId],
    queryFn: ({ pageParam }) =>
      gmailCached.getMailboxEmailsInfinite(
        mailboxId,
        pageParam,
        EMAILS_PER_PAGE,
      ),
    enabled: !!mailboxId && !isSearchMode,
    getNextPageParam: (lastPage) =>
      lastPage.data.meta.nextPageToken ?? undefined,
    initialPageParam: undefined as string | undefined,
  });

  /**
   * Global search query - searches across ALL labels without label restrictions
   * Only runs when in search mode
   */
  const searchQuery = useInfiniteQuery({
    queryKey: ['emails-search', debouncedSearchTerm],
    queryFn: ({ pageParam }) =>
      searchEmails(debouncedSearchTerm, pageParam, EMAILS_PER_PAGE),
    enabled: isSearchMode,
    getNextPageParam: (lastPage) =>
      lastPage.data.meta.nextPageToken ?? undefined,
    initialPageParam: undefined as string | undefined,
  });

  // Use the appropriate query based on search mode
  const activeQuery = isSearchMode ? searchQuery : emailsQuery;

  /**
   * Flatten paginated data into single array
   * Uses search results when searching, mailbox results otherwise
   */
  const allEmails = useMemo(() => {
    const flat =
      activeQuery.data?.pages.flatMap((page) => page.data.data) ?? [];

    // Defensive de-dupe: cached pagination or overlapping page tokens can cause
    // repeated items, which leads to React "duplicate key" warnings and janky scroll.
    const seen = new Set<string>();
    const unique: typeof flat = [];
    for (const email of flat) {
      if (!email?.id) continue;
      if (seen.has(email.id)) continue;
      seen.add(email.id);
      unique.push(email);
    }
    return unique;
  }, [activeQuery.data]);

  /**
   * Custom hook for managing email selections
   */
  const {
    selectedEmailId,
    selectedEmails,
    setSelectedEmailId,
    handleToggleSelect,
    handleSelectAll,
    clearSelections,
  } = useEmailSelection({ emails: allEmails, mailboxId });

  /**
   * Fetch detail of currently selected email with offline caching
   * Stale-while-revalidate: cached email shows instantly, fresh data updates in background
   */
  const emailDetailQuery = useQuery<EmailDetailResponse>({
    queryKey: ['email', selectedEmailId ?? 'none'],
    queryFn: () => gmailCached.getEmailDetail(selectedEmailId!),
    enabled: Boolean(selectedEmailId),
  });

  /**
   * Show temporary success/error messages
   */
  const showMessage = (message: string) => {
    setActionMessage(message);
    setTimeout(() => setActionMessage(null), 2000);
  };

  /**
   * Email mutations (send, reply, modify) with optimistic updates
   */
  const { sendMutation, forwardMutation, replyMutation, modifyMutation } =
    useEmailMutations({
      mailboxId,
      onSuccess: (message) => {
        showMessage(message);
        if (message.includes('sent') || message.includes('forwarded')) {
          setComposeDraft(null);
        }
      },
      onError: showMessage,
    });

  /**
   * Handle email selection with automatic mark-as-read
   * When user clicks an email, select it and mark as read if it's unread
   */
  const handleSelectEmail = useCallback(
    (emailId: string) => {
      setSelectedEmailId(emailId);

      // Find the email in the list to check if it's unread
      const email = allEmails.find((e) => e.id === emailId);
      if (email?.unread) {
        // Mark as read silently (no success message)
        modifyMutation.mutate(
          { emailId, actions: { markRead: true } },
          {
            onSuccess: () => {
              // Silent success - don't show message for auto mark-read
            },
            onError: () => {
              // Silent error - don't disrupt user flow
              console.error('Failed to mark email as read');
            },
          },
        );
      }
    },
    [setSelectedEmailId, allEmails, modifyMutation],
  );

  /**
   * Handle bulk modification of multiple selected emails
   */
  const handleBulkModify = async (actions: any, successMessage: string) => {
    if (!selectedEmails.length) {
      return showMessage('Please select at least one email');
    }

    await Promise.all(
      selectedEmails.map((id) =>
        modifyMutation.mutateAsync({ emailId: id, actions }),
      ),
    );

    clearSelections();
    showMessage(successMessage);
  };

  /**
   * Open compose modal with optional initial values
   */
  const openCompose = (initial?: Partial<ComposeDraft>) => {
    setComposeDraft(createDefaultComposeDraft(initial));
  };

  const openForward = (email: any) => {
    // Keep body empty; backend will append the original message.
    openCompose({
      mode: 'forward',
      forwardEmailId: email.id,
      subject: email.subject ? `Fwd: ${email.subject}` : 'Fwd: (No subject)',
      body: '',
    });
  };

  /**
   * Download email attachment
   */
  const handleDownloadAttachment = async (
    attachmentId: string,
    fileName: string,
  ) => {
    if (!selectedEmailId) return;

    const blob = await getAttachment(selectedEmailId, attachmentId);
    downloadAttachment(blob, fileName);
  };

  return (
    <div className='flex flex-col h-full'>
      {actionMessage && (
        <Alert className='mb-2 sm:mb-4'>
          <AlertDescription className='text-sm'>
            {actionMessage}
          </AlertDescription>
        </Alert>
      )}

      <div className='grid gap-2 sm:gap-4 md:grid-cols-1 lg:grid-cols-2 flex-1 min-h-0'>
        {/* Email list - full width on mobile/tablet, half width on desktop */}
        <div
          className={
            selectedEmailId
              ? 'hidden lg:block h-full min-h-0'
              : 'block h-full min-h-0'
          }
        >
          <EmailListColumn
            emails={allEmails}
            isLoading={activeQuery.isLoading}
            isFetching={
              activeQuery.isFetching || activeQuery.isFetchingNextPage
            }
            hasMore={activeQuery.hasNextPage ?? false}
            onLoadMore={() => activeQuery.fetchNextPage()}
            selectedEmails={selectedEmails}
            onSelectEmail={handleSelectEmail}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onMarkRead={() =>
              handleBulkModify({ markRead: true }, 'Marked read')
            }
            onMarkUnread={() =>
              handleBulkModify({ markUnread: true }, 'Marked unread')
            }
            onDeleteSelected={() =>
              handleBulkModify({ delete: true }, 'Moved to trash')
            }
            onStarToggle={(id, starred) =>
              modifyMutation.mutate({
                emailId: id,
                actions: starred ? { unstar: true } : { star: true },
              })
            }
            actionsDisabled={modifyMutation.isPending}
            activeEmailId={selectedEmailId}
            onCompose={() => openCompose()}
            newEmailIds={newEmailIds}
            onClearNewEmailId={onClearNewEmailId}
          />
        </div>

        {/* Email detail - show when email selected, full width on mobile */}
        <div
          className={
            selectedEmailId
              ? 'block h-full min-h-0'
              : 'hidden lg:block h-full min-h-0'
          }
        >
          <EmailDetailColumn
            email={emailDetailQuery.data?.data ?? null}
            isLoading={emailDetailQuery.isLoading}
            hasSelection={!!selectedEmailId}
            onBack={() => setSelectedEmailId(null)}
            onReply={
              selectedEmailId
                ? async (body, replyAll, attachments) => {
                    await replyMutation.mutateAsync({
                      emailId: selectedEmailId,
                      body,
                      replyAll,
                      attachments,
                    });
                  }
                : undefined
            }
            onModify={
              selectedEmailId
                ? (actions) =>
                    modifyMutation.mutate({ emailId: selectedEmailId, actions })
                : undefined
            }
            onDownloadAttachment={
              selectedEmailId ? handleDownloadAttachment : undefined
            }
            isLoadingReply={replyMutation.isPending}
            onForward={(email) => openForward(email)}
          />
        </div>
      </div>

      {composeDraft && (
        <ComposeModal
          draft={composeDraft}
          onClose={() => setComposeDraft(null)}
          onSend={(payload: SendEmailData) => {
            if (
              composeDraft.mode === 'forward' &&
              composeDraft.forwardEmailId
            ) {
              forwardMutation.mutate({
                emailId: composeDraft.forwardEmailId,
                payload,
              });
              return;
            }
            sendMutation.mutate(payload);
          }}
          isLoading={sendMutation.isPending || forwardMutation.isPending}
        />
      )}

      {/* Cache status indicator - shows when syncing fresh data */}
      <CacheStatusIndicator
        isFetching={activeQuery.isFetching || emailDetailQuery.isFetching}
        label={isSearchMode ? 'Searching...' : 'Syncing emails...'}
      />
    </div>
  );
}
