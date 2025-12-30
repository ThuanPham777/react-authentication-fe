import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMailboxes } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { searchKanban, semanticSearchKanban } from '@/lib/api/kanban.api';
import { getKanbanColumns } from '@/lib/api/kanban-config.api';
import { SearchResults } from '../components/inbox/SearchResults';
import { MailboxSidebar } from '../components/inbox/MailboxSidebar';
import { type InboxMode } from '../components/inbox/mode-toggle';
import { TraditionalInboxView } from '../components/inbox/traditional/TraditionalInboxView';
import { KanbanInboxView } from '../components/inbox/kanban/KanbanInboxView';
import { InboxHeader } from '../components/inbox/kanban/InboxHeader';
import { getGmailUrl } from '@/utils/emailUtils';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { KeyboardShortcutsHelp } from '@/components/inbox/KeyboardShortcutsHelp';

/**
 * InboxPage - Main inbox container with dual view modes
 *
 * Features:
 * - Toggle between Traditional (Outlook-style) and Kanban views
 * - Mailbox sidebar with message counts
 * - Header with search (traditional) or smart search (kanban)
 * - User profile dropdown with logout
 * - Auto-select first mailbox on load
 * - Fuzzy and semantic search for kanban mode
 *
 * Architecture:
 * - Traditional mode: 3-column layout (mailboxes, email list, email detail)
 * - Kanban mode: Board with drag-drop columns (To Do, In Progress, Done)
 */
export default function InboxPage() {
  const { user, logout } = useAuth();

  // View mode and mailbox selection
  const [mode, setMode] = useState<InboxMode>('traditional');
  const [selectedMailbox, setSelectedMailbox] = useState<string | null>(null);

  // Search state (for kanban mode)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<'fuzzy' | 'semantic'>('fuzzy');

  // Email filtering (for traditional mode)
  const [emailSearchTerm, setEmailSearchTerm] = useState('');

  // Keyboard shortcuts state
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  /**
   * Executes kanban search (fuzzy or semantic)
   * @param query - Search query string
   * @param isSemanticSearch - If true, uses AI semantic search; otherwise fuzzy search
   */
  const doSearch = async (query?: string, isSemanticSearch = false) => {
    const q = query || searchQuery;
    if (!q || !q.trim()) return;

    setSearchLoading(true);
    setSearchError(null);
    const type = isSemanticSearch ? 'semantic' : 'fuzzy';
    setSearchType(type);

    try {
      const resp = isSemanticSearch
        ? await semanticSearchKanban(q.trim())
        : await searchKanban(q.trim());
      setSearchResults(resp.data?.results ?? []);
    } catch (err: any) {
      setSearchError(err?.message ?? 'Search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  // Fetch mailboxes (labels) from Gmail API
  const mailboxesQuery = useQuery({
    queryKey: ['mailboxes'],
    queryFn: getMailboxes,
  });

  const kanbanColumnsQuery = useQuery({
    queryKey: ['kanban-columns'],
    queryFn: getKanbanColumns,
    enabled: mode === 'kanban',
    staleTime: 60_000,
  });

  /**
   * Auto-select first mailbox when entering traditional mode
   * Ensures there's always a selected mailbox in traditional view
   */
  useEffect(() => {
    if (mode === 'traditional') {
      if (!selectedMailbox && mailboxesQuery.data?.data.mailboxes.length) {
        setSelectedMailbox(mailboxesQuery.data.data.mailboxes[0].id);
      }
    }
  }, [mailboxesQuery.data, selectedMailbox, mode]);

  /**
   * Force INBOX selection when switching to kanban mode
   * Kanban only works with INBOX emails
   */
  useEffect(() => {
    if (mode === 'kanban') {
      setSelectedMailbox('INBOX');
    }
  }, [mode]);

  /**
   * Global keyboard shortcuts
   */
  useKeyboardNavigation({
    handlers: {
      FOCUS_SEARCH: () => {
        searchInputRef.current?.focus();
      },
      SHOW_HELP: () => {
        setShowKeyboardHelp(true);
      },
      CLOSE_MODAL: () => {
        if (showKeyboardHelp) {
          setShowKeyboardHelp(false);
        } else if (searchResults !== null) {
          setSearchResults(null);
          setSearchError(null);
          setSearchQuery('');
        }
      },
    },
  });

  return (
    <div className='h-screen flex flex-col bg-background text-foreground overflow-hidden'>
      <InboxHeader
        mode={mode}
        onModeChange={setMode}
        searchInputRef={searchInputRef}
        emailSearchTerm={emailSearchTerm}
        onEmailSearchTermChange={setEmailSearchTerm}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearch={doSearch}
        onShowKeyboardHelp={() => setShowKeyboardHelp(true)}
        userEmail={user?.email}
        userProvider={user?.provider}
        onLogout={logout}
      />

      <main className='flex-1 overflow-hidden min-h-0'>
        <div className='h-full p-4 flex flex-col min-h-0'>
          {searchResults !== null || searchLoading ? (
            <div className='rounded-xl border bg-card p-4 overflow-auto'>
              <SearchResults
                items={searchResults || []}
                loading={searchLoading}
                error={searchError}
                searchType={searchType}
                columns={kanbanColumnsQuery.data}
                onView={(id) => {
                  const gmailUrl = getGmailUrl(id, user?.email);
                  window.open(gmailUrl, '_blank', 'noopener,noreferrer');
                }}
                onClear={() => {
                  setSearchResults(null);
                  setSearchError(null);
                  setSearchQuery('');
                }}
              />
            </div>
          ) : mode === 'traditional' ? (
            <div className='grid gap-4 lg:grid-cols-[18%_82%] h-full min-h-0'>
              <MailboxSidebar
                mailboxes={mailboxesQuery.data?.data.mailboxes ?? []}
                isLoading={mailboxesQuery.isLoading}
                selectedId={selectedMailbox}
                onSelect={setSelectedMailbox}
                title='Mailboxes'
                showCompose={false}
              />

              <div className='rounded-xl border bg-card p-4 overflow-hidden'>
                {!selectedMailbox ? (
                  <div className='text-sm text-muted-foreground'>
                    Select a mailbox…
                  </div>
                ) : (
                  <TraditionalInboxView
                    mailboxId={selectedMailbox}
                    emailSearchTerm={emailSearchTerm}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className='rounded-xl border bg-card p-4 overflow-auto'>
              <KanbanInboxView labelId={selectedMailbox ?? 'INBOX'} />
            </div>
          )}
        </div>
      </main>

      {/* Keyboard shortcuts help modal */}
      <KeyboardShortcutsHelp
        open={showKeyboardHelp}
        onOpenChange={setShowKeyboardHelp}
      />
    </div>
  );
}
