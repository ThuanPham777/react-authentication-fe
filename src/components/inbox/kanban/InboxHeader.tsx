import { type RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchBarWithSuggestions } from '../SearchBarWithSuggestions';
import { ModeToggle, type InboxMode } from '../mode-toggle';

interface InboxHeaderProps {
  mode: InboxMode;
  onModeChange: (mode: InboxMode) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  emailSearchTerm: string;
  onEmailSearchTermChange: (value: string) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSearch: (query?: string, isSemanticSearch?: boolean) => void;
  onShowKeyboardHelp: () => void;
  userEmail?: string;
  userProvider?: string;
  onLogout: () => void;
}

/**
 * InboxHeader Component
 *
 * Shared header for both Traditional and Kanban inbox views
 * Contains:
 * - Mailbox branding
 * - Mode-specific search bar (simple Input or SearchBarWithSuggestions)
 * - Keyboard shortcuts help button
 * - View mode toggle
 * - User info and logout
 */
export function InboxHeader({
  mode,
  onModeChange,
  searchInputRef,
  emailSearchTerm,
  onEmailSearchTermChange,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  onShowKeyboardHelp,
  userEmail,
  userProvider,
  onLogout,
}: InboxHeaderProps) {
  return (
    <header className='border-b bg-card shrink-0'>
      <div className='flex items-center justify-between gap-4 px-4 py-4'>
        <div>
          <p className='text-xs uppercase tracking-[0.3em] text-muted-foreground'>
            Mailbox
          </p>
          <h1 className='text-2xl font-semibold'>Inbox workspace</h1>
        </div>

        <div className='flex-1 px-4'>
          {mode === 'traditional' ? (
            <Input
              ref={searchInputRef}
              type='search'
              placeholder='Search emails... (Press / to focus)'
              className='w-full'
              value={emailSearchTerm}
              onChange={(e) => onEmailSearchTermChange(e.target.value)}
            />
          ) : (
            <SearchBarWithSuggestions
              inputRef={searchInputRef}
              value={searchQuery}
              onChange={onSearchQueryChange}
              onSearch={onSearch}
              placeholder='Search emails... (Press / to focus, Ctrl+Enter for AI search)'
            />
          )}
        </div>

        <div className='flex items-center gap-3'>
          <Button
            variant='ghost'
            size='sm'
            onClick={onShowKeyboardHelp}
            title='Keyboard shortcuts (Press ?)'
          >
            <span className='text-lg'>?</span>
          </Button>
          <ModeToggle
            mode={mode}
            onChange={onModeChange}
          />
          <div className='text-right'>
            <p className='text-sm font-medium'>{userEmail}</p>
            <p className='text-xs text-muted-foreground'>
              {userProvider ?? 'password'} session
            </p>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={onLogout}
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
