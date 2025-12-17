import { useEffect, useMemo, useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import {
  getMailboxEmailsInfinite,
  getEmailDetail,
  sendEmail,
  replyEmail,
  modifyEmail,
  getAttachment,
  type EmailDetailResponse,
  type SendEmailData,
} from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmailListColumn } from './EmailListColumn';
import { EmailDetailColumn } from './EmailDetailColumn';
import { ComposeModal } from './ComposeModal';

const PAGE_SIZE = 10;

type ComposeDraft = {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  body: string;
};

export function TraditionalInboxView({
  mailboxId,
  emailSearchTerm = '',
}: {
  mailboxId: string;
  emailSearchTerm?: string;
}) {
  const qc = useQueryClient();

  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [composeDraft, setComposeDraft] = useState<ComposeDraft | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const emailsQuery = useInfiniteQuery({
    queryKey: ['emails-infinite', mailboxId],
    queryFn: ({ pageParam }) =>
      getMailboxEmailsInfinite(mailboxId, pageParam, PAGE_SIZE),
    enabled: !!mailboxId,
    getNextPageParam: (lastPage) => lastPage.meta.nextPageToken ?? undefined,
    initialPageParam: undefined as string | undefined,
  });

  const emailDetailQuery = useQuery<EmailDetailResponse>({
    queryKey: ['email', selectedEmailId ?? 'none'],
    queryFn: () => getEmailDetail(selectedEmailId!),
    enabled: Boolean(selectedEmailId),
  });

  // Flatten all pages into single array
  const allEmails = useMemo(() => {
    return emailsQuery.data?.pages.flatMap((page) => page.data) ?? [];
  }, [emailsQuery.data]);

  useEffect(() => {
    setSelectedEmails([]);
    setSelectedEmailId(null);
  }, [mailboxId]);

  useEffect(() => {
    if (!allEmails.length) {
      setSelectedEmailId(null);
      return;
    }
    const still = allEmails.some((e) => e.id === selectedEmailId);
    if (!still) setSelectedEmailId(allEmails[0].id);
  }, [allEmails, selectedEmailId]);

  const show = (m: string) => {
    setActionMessage(m);
    window.setTimeout(() => setActionMessage(null), 2000);
  };

  const sendMutation = useMutation({
    mutationFn: sendEmail,
    onSuccess: () => {
      show('Email sent');
      qc.invalidateQueries({ queryKey: ['emails', mailboxId] });
      setComposeDraft(null);
    },
    onError: (err: any) =>
      show(`Failed: ${err.response?.data?.message || err.message}`),
  });

  const replyMutation = useMutation({
    mutationFn: ({
      emailId,
      body,
      replyAll,
    }: {
      emailId: string;
      body: string;
      replyAll?: boolean;
    }) => replyEmail(emailId, { body, replyAll }),
    onSuccess: (_data, vars) => {
      show('Reply sent');
      qc.invalidateQueries({ queryKey: ['emails', mailboxId] });
      qc.invalidateQueries({ queryKey: ['email', vars.emailId] });
    },
  });

  const modifyMutation = useMutation({
    mutationFn: ({ emailId, actions }: { emailId: string; actions: any }) =>
      modifyEmail(emailId, actions),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['emails', mailboxId] });
    },
  });

  const handleSelectAll = () => {
    if (!allEmails.length) return;
    setSelectedEmails((prev) =>
      prev.length === allEmails.length ? [] : allEmails.map((e) => e.id)
    );
  };

  const handleBulkModify = async (actions: any, msg: string) => {
    if (!selectedEmails.length) return show('Select at least one email');
    await Promise.all(
      selectedEmails.map((id) =>
        modifyMutation.mutateAsync({ emailId: id, actions })
      )
    );
    setSelectedEmails([]);
    show(msg);
  };

  const filteredEmails = useMemo(() => {
    if (!emailSearchTerm.trim()) return allEmails;
    const t = emailSearchTerm.toLowerCase();
    return allEmails.filter(
      (e) =>
        e.senderName.toLowerCase().includes(t) ||
        e.subject.toLowerCase().includes(t) ||
        e.preview.toLowerCase().includes(t)
    );
  }, [allEmails, emailSearchTerm]);

  const openCompose = (initial?: Partial<ComposeDraft>) =>
    setComposeDraft({
      to: '',
      cc: '',
      bcc: '',
      subject: '',
      body: '',
      ...initial,
    });

  return (
    <div className='flex flex-col h-full'>
      {actionMessage && (
        <Alert className='mb-4'>
          <AlertDescription>{actionMessage}</AlertDescription>
        </Alert>
      )}

      <div className='grid gap-4 lg:grid-cols-2 flex-1 min-h-0'>
        <EmailListColumn
          emails={filteredEmails}
          isLoading={emailsQuery.isLoading}
          isFetching={emailsQuery.isFetching || emailsQuery.isFetchingNextPage}
          hasMore={emailsQuery.hasNextPage ?? false}
          onLoadMore={() => emailsQuery.fetchNextPage()}
          selectedEmails={selectedEmails}
          onSelectEmail={setSelectedEmailId}
          onToggleSelect={(id) =>
            setSelectedEmails((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
            )
          }
          onSelectAll={handleSelectAll}
          onRefresh={() =>
            qc.invalidateQueries({ queryKey: ['emails-infinite', mailboxId] })
          }
          onMarkRead={() => handleBulkModify({ markRead: true }, 'Marked read')}
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
        />

        <EmailDetailColumn
          email={emailDetailQuery.data?.data ?? null}
          isLoading={emailDetailQuery.isLoading}
          hasSelection={!!selectedEmailId}
          onReply={
            selectedEmailId
              ? async (body, replyAll) => {
                  await replyMutation.mutateAsync({
                    emailId: selectedEmailId,
                    body,
                    replyAll,
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
            selectedEmailId
              ? async (attachmentId, fileName) => {
                  const blob = await getAttachment(
                    selectedEmailId,
                    attachmentId
                  );
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = fileName;
                  document.body.appendChild(a);
                  a.click();
                  URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                }
              : undefined
          }
          isLoadingAction={replyMutation.isPending || modifyMutation.isPending}
        />
      </div>

      {composeDraft && (
        <ComposeModal
          draft={composeDraft}
          onClose={() => setComposeDraft(null)}
          onSend={(payload: SendEmailData) => sendMutation.mutate(payload)}
          isLoading={sendMutation.isPending}
        />
      )}
    </div>
  );
}
