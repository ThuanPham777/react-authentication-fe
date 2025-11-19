import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getEmailDetail, getMailboxEmails, getMailboxes } from '@/lib/api';
import type {
    EmailDetail,
    EmailDetailResponse,
    EmailListItem,
    Mailbox,
    MailboxEmailsResponse,
    MailboxResponse,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import {
    RefreshCcw,
    Plus,
    CheckSquare,
    Trash2,
    Star,
    StarOff,
    Reply,
    ReplyAll,
    Forward,
    Archive,
    Loader2,
    ChevronLeft,
    ChevronRight,
    ArrowLeft,
    Paperclip,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PAGE_SIZE = 8;

export default function Inbox() {
    const { user, logout } = useAuth();
    const queryClient = useQueryClient();
    const [selectedMailbox, setSelectedMailbox] = useState<string | null>(null);
    const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [composeOpen, setComposeOpen] = useState(false);
    const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
    const [isMobile, setIsMobile] = useState(false);
    const [actionMessage, setActionMessage] = useState<string | null>(null);

    const mailboxesQuery = useQuery<MailboxResponse>({
        queryKey: ['mailboxes'],
        queryFn: getMailboxes,
    });

    useEffect(() => {
        if (!selectedMailbox && mailboxesQuery.data?.data.length) {
            setSelectedMailbox(mailboxesQuery.data.data[0].id);
        }
    }, [mailboxesQuery.data, selectedMailbox]);

    const emailsQuery = useQuery<MailboxEmailsResponse>({
        queryKey: ['emails', selectedMailbox ?? 'unselected', page],
        queryFn: () => getMailboxEmails(selectedMailbox!, page, PAGE_SIZE),
        enabled: Boolean(selectedMailbox),
        placeholderData: (previous) => previous,
    });

    const emailDetailQuery = useQuery<EmailDetailResponse>({
        queryKey: ['email', selectedEmailId ?? 'none'],
        queryFn: () => getEmailDetail(selectedEmailId!),
        enabled: Boolean(selectedEmailId),
    });

    useEffect(() => {
        const media = window.matchMedia('(max-width: 1023px)');
        const handler = (event: MediaQueryListEvent | MediaQueryList) => {
            setIsMobile(event.matches);
            if (!event.matches) {
                setMobileView('list');
            }
        };
        handler(media);
        media.addEventListener('change', handler);
        return () => media.removeEventListener('change', handler);
    }, []);

    useEffect(() => {
        setSelectedEmails([]);
        setSelectedEmailId(null);
        setPage(1);
    }, [selectedMailbox]);

    useEffect(() => {
        setSelectedEmails([]);
    }, [page]);

    useEffect(() => {
        if (!emailsQuery.data?.data.length) {
            setSelectedEmailId(null);
            return;
        }
        const stillExists = emailsQuery.data.data.some((email) => email.id === selectedEmailId);
        if (!stillExists) {
            setSelectedEmailId(emailsQuery.data.data[0].id);
        }
    }, [emailsQuery.data, selectedEmailId]);

    const totalPages = useMemo(() => {
        if (!emailsQuery.data?.meta.total) return 1;
        return Math.max(1, Math.ceil(emailsQuery.data.meta.total / PAGE_SIZE));
    }, [emailsQuery.data]);

    const handleSelectEmail = (emailId: string) => {
        setSelectedEmailId(emailId);
        if (isMobile) setMobileView('detail');
    };

    const toggleSelectEmail = (emailId: string) => {
        setSelectedEmails((prev) =>
            prev.includes(emailId) ? prev.filter((id) => id !== emailId) : [...prev, emailId],
        );
    };

    const handleSelectAll = () => {
        if (!emailsQuery.data?.data.length) return;
        if (selectedEmails.length === emailsQuery.data.data.length) {
            setSelectedEmails([]);
        } else {
            setSelectedEmails(emailsQuery.data.data.map((email) => email.id));
        }
    };

    const handleRefresh = async () => {
        await queryClient.invalidateQueries({ queryKey: ['mailboxes'] });
        await queryClient.invalidateQueries({ queryKey: ['emails', selectedMailbox] });
        if (selectedEmailId) {
            await queryClient.invalidateQueries({ queryKey: ['email', selectedEmailId] });
        }
        showActionMessage('Mailbox updated');
    };

    const showActionMessage = (message: string) => {
        setActionMessage(message);
        setTimeout(() => setActionMessage(null), 2500);
    };

    const performMockAction = (message: string) => {
        showActionMessage(`${message} (mock action)`);
    };

    const currentEmails = emailsQuery.data?.data ?? [];
    const emailDetail = emailDetailQuery.data?.data ?? null;

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            <header className="border-b bg-card">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Mailbox</p>
                        <h1 className="text-2xl font-semibold">Inbox workspace</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-sm font-medium">{user?.email}</p>
                            <p className="text-xs text-muted-foreground">{user?.provider ?? 'password'} session</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => logout()}>
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            {actionMessage && (
                <div className="mx-auto mt-4 w-full max-w-3xl px-4">
                    <Alert>
                        <AlertDescription>{actionMessage}</AlertDescription>
                    </Alert>
                </div>
            )}

            <main className="flex-1 overflow-hidden">
                <div className="hidden h-full grid-cols-[20%_40%_40%] gap-4 p-4 lg:grid">
                    <MailboxColumn
                        mailboxes={mailboxesQuery.data?.data ?? []}
                        isLoading={mailboxesQuery.isLoading}
                        selectedId={selectedMailbox}
                        onSelect={(id) => setSelectedMailbox(id)}
                        onCompose={() => setComposeOpen(true)}
                    />
                    <EmailListColumn
                        emails={currentEmails}
                        isLoading={emailsQuery.isLoading}
                        isFetching={emailsQuery.isFetching}
                        page={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        selectedEmails={selectedEmails}
                        onSelectEmail={handleSelectEmail}
                        onToggleSelect={toggleSelectEmail}
                        onSelectAll={handleSelectAll}
                        onRefresh={handleRefresh}
                        onAction={performMockAction}
                        activeEmailId={selectedEmailId}
                    />
                    <EmailDetailColumn
                        email={emailDetail}
                        isLoading={emailDetailQuery.isLoading}
                        hasSelection={Boolean(selectedEmailId)}
                        onBack={() => setMobileView('list')}
                        isMobile={false}
                        onAction={performMockAction}
                    />
                </div>

                <div className="lg:hidden p-4 space-y-4">
                    {mobileView === 'list' && (
                        <>
                            <MailboxColumn
                                mailboxes={mailboxesQuery.data?.data ?? []}
                                isLoading={mailboxesQuery.isLoading}
                                selectedId={selectedMailbox}
                                onSelect={(id) => setSelectedMailbox(id)}
                                onCompose={() => setComposeOpen(true)}
                            />
                            <EmailListColumn
                                emails={currentEmails}
                                isLoading={emailsQuery.isLoading}
                                isFetching={emailsQuery.isFetching}
                                page={page}
                                totalPages={totalPages}
                                onPageChange={setPage}
                                selectedEmails={selectedEmails}
                                onSelectEmail={handleSelectEmail}
                                onToggleSelect={toggleSelectEmail}
                                onSelectAll={handleSelectAll}
                                onRefresh={handleRefresh}
                                onAction={performMockAction}
                                activeEmailId={selectedEmailId}
                                compact
                            />
                        </>
                    )}

                    {mobileView === 'detail' && (
                        <EmailDetailColumn
                            email={emailDetail}
                            isLoading={emailDetailQuery.isLoading}
                            hasSelection={Boolean(selectedEmailId)}
                            onBack={() => setMobileView('list')}
                            isMobile
                            onAction={performMockAction}
                        />
                    )}
                </div>
            </main>

            {composeOpen && (
                <ComposeModal onClose={() => setComposeOpen(false)} onSend={() => performMockAction('Draft sent')} />
            )}
        </div>
    );
}

function MailboxColumn({
    mailboxes,
    isLoading,
    selectedId,
    onSelect,
    onCompose,
}: {
    mailboxes: Mailbox[];
    isLoading: boolean;
    selectedId: string | null;
    onSelect: (id: string) => void;
    onCompose: () => void;
}) {
    return (
        <div className="rounded-xl border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b px-4 py-3">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Mailboxes</p>
                <Button size="sm" variant="outline" className="gap-1" onClick={onCompose}>
                    <Plus className="h-4 w-4" />
                    Compose
                </Button>
            </div>
            <div className="max-h-[calc(100vh-220px)] overflow-auto">
                {isLoading ? (
                    <div className="p-4 text-sm text-muted-foreground">Loading folders…</div>
                ) : mailboxes.length ? (
                    <ul className="divide-y">
                        {mailboxes.map((mailbox) => (
                            <li key={mailbox.id}>
                                <button
                                    type="button"
                                    className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${selectedId === mailbox.id ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted/50'
                                        }`}
                                    onClick={() => onSelect(mailbox.id)}
                                >
                                    <span>{mailbox.name}</span>
                                    {typeof mailbox.unread === 'number' && (
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">
                                            {mailbox.unread}
                                        </span>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="p-4 text-sm text-muted-foreground">No mailboxes available.</div>
                )}
            </div>
        </div>
    );
}

function EmailListColumn({
    emails,
    isLoading,
    isFetching,
    page,
    totalPages,
    onPageChange,
    selectedEmails,
    onSelectEmail,
    onToggleSelect,
    onSelectAll,
    onRefresh,
    onAction,
    activeEmailId,
    compact,
}: {
    emails: EmailListItem[];
    isLoading: boolean;
    isFetching: boolean;
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    selectedEmails: string[];
    onSelectEmail: (id: string) => void;
    onToggleSelect: (id: string) => void;
    onSelectAll: () => void;
    onRefresh: () => void;
    onAction: (message: string) => void;
    activeEmailId: string | null;
    compact?: boolean;
}) {
    return (
        <div className="flex h-full flex-col rounded-xl border bg-card shadow-sm">
            <div className="border-b px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={onRefresh}>
                        <RefreshCcw className="h-4 w-4" />
                        Refresh
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2" onClick={onSelectAll}>
                        <CheckSquare className="h-4 w-4" />
                        Select All
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onAction('Marked read')}>
                        Mark Read
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onAction('Marked unread')}>
                        Mark Unread
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onAction('Moved to trash')}>
                        <Trash2 className="h-4 w-4" />
                        Delete
                    </Button>
                    {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <Input
                    type="search"
                    placeholder="Search emails (mocked)"
                    className="mt-3"
                    onFocus={() => onAction('Search is mocked for this assignment')}
                />
            </div>

            <div className="flex-1 overflow-auto">
                {isLoading ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading emails…</div>
                ) : emails.length ? (
                    <ul>
                        {emails.map((email) => (
                            <li
                                key={email.id}
                                tabIndex={0}
                                className={`border-b px-4 py-3 outline-none transition hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring ${email.id === activeEmailId ? 'bg-primary/5' : ''
                                    }`}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        onSelectEmail(email.id);
                                    }
                                }}
                            >
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        className="mt-1 accent-primary"
                                        checked={selectedEmails.includes(email.id)}
                                        onChange={() => onToggleSelect(email.id)}
                                        aria-label={`Select email from ${email.senderName}`}
                                    />
                                    <div
                                        className={`flex-1 cursor-pointer rounded-lg px-2 py-1 ${email.id === activeEmailId ? 'bg-primary/10' : ''
                                            } ${compact ? 'text-sm' : ''}`}
                                        onClick={() => onSelectEmail(email.id)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold">
                                                {email.senderName}{' '}
                                                {email.unread && <span className="text-xs text-primary">• Unread</span>}
                                            </p>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(email.timestamp).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium line-clamp-1">{email.subject}</p>
                                        <p className="text-sm text-muted-foreground line-clamp-1">{email.preview}</p>
                                    </div>
                                    <button
                                        type="button"
                                        className="text-muted-foreground hover:text-yellow-500"
                                        onClick={() => onAction(email.starred ? 'Star removed' : 'Starred')}
                                    >
                                        {email.starred ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                        <MailIcon />
                        <p>No emails in this mailbox yet.</p>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
                <p className="text-muted-foreground">
                    Page {page} / {totalPages}
                </p>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

function EmailDetailColumn({
    email,
    isLoading,
    hasSelection,
    onBack,
    isMobile,
    onAction,
}: {
    email: EmailDetail | null;
    isLoading: boolean;
    hasSelection: boolean;
    onBack: () => void;
    isMobile: boolean;
    onAction: (message: string) => void;
}) {
    return (
        <div className="flex h-full flex-col rounded-xl border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-2">
                    {isMobile && (
                        <Button variant="ghost" size="sm" onClick={onBack}>
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                    )}
                    <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Email detail</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onAction('Archived')}>
                        <Archive className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onAction('Star toggled')}>
                        <Star className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
                {isLoading ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading email…</div>
                ) : email ? (
                    <article className="space-y-4">
                        <div>
                            <p className="text-xs uppercase text-muted-foreground">Subject</p>
                            <h2 className="text-2xl font-semibold">{email.subject}</h2>
                        </div>
                        <div className="rounded-lg border p-3">
                            <p className="text-sm">
                                From <span className="font-semibold">{email.senderName}</span>{' '}
                                <span className="text-muted-foreground">&lt;{email.senderEmail}&gt;</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                                To: {email.to.join(', ')}
                                {email.cc?.length ? ` — Cc: ${email.cc.join(', ')}` : ''}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Received {new Date(email.timestamp).toLocaleString()}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => onAction('Reply')}>
                                <Reply className="h-4 w-4" /> Reply
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => onAction('Reply all')}>
                                <ReplyAll className="h-4 w-4" /> Reply all
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => onAction('Forwarded')}>
                                <Forward className="h-4 w-4" /> Forward
                            </Button>
                        </div>
                        <div
                            className="prose prose-sm max-w-none dark:prose-invert"
                            dangerouslySetInnerHTML={{ __html: email.body }}
                        />
                        {email.attachments?.length ? (
                            <div>
                                <p className="text-sm font-semibold mb-2">Attachments</p>
                                <div className="space-y-2">
                                    {email.attachments.map((attachment) => (
                                        <div
                                            key={attachment.id}
                                            className="flex items-center justify-between rounded border px-3 py-2 text-sm"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Paperclip className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium">{attachment.fileName}</p>
                                                    <p className="text-xs text-muted-foreground">{attachment.size}</p>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="ghost" onClick={() => onAction('Download started')}>
                                                Download
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </article>
                ) : hasSelection ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                        <MailIcon />
                        <p>Select an email to view the full thread.</p>
                    </div>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                        <MailIcon />
                        <p>No email selected.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function ComposeModal({ onClose, onSend }: { onClose: () => void; onSend: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-2xl">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Compose</p>
                        <h2 className="text-xl font-semibold">New message</h2>
                    </div>
                    <Button variant="ghost" onClick={onClose}>
                        Close
                    </Button>
                </div>
                <div className="mt-4 space-y-3">
                    <Input placeholder="To" />
                    <Input placeholder="Subject" />
                    <textarea
                        placeholder="Write your message…"
                        rows={6}
                        className="w-full rounded-md border bg-background p-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                </div>
                <div className="mt-4 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            onSend();
                            onClose();
                        }}
                    >
                        Send mock
                    </Button>
                </div>
            </div>
        </div>
    );
}

const MailIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-12 w-12 text-muted-foreground"
    >
        <path d="M3 7l9 6 9-6" />
        <rect width="18" height="14" x="3" y="5" rx="2" ry="2" />
    </svg>
);


