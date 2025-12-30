import { type RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchBarWithSuggestions } from '../SearchBarWithSuggestions';
import { ModeToggle, type InboxMode } from '../mode-toggle';
import { Menu } from 'lucide-react';

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
  onMobileMenuToggle?: () => void;
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
  onMobileMenuToggle,
  userEmail,
  userProvider,
  onLogout,
}: InboxHeaderProps) {
  return (
    <header className='border-b bg-card shrink-0 safe-area-inset-top'>
      <div className='flex items-center justify-between gap-2 sm:gap-4 px-2 sm:px-4 py-3 sm:py-4'>
        {/* Mobile menu button - only visible on mobile/tablet */}
        {mode === 'traditional' && onMobileMenuToggle && (
          <Button
            variant='ghost'
            size='sm'
            onClick={onMobileMenuToggle}
            className='lg:hidden p-2 h-auto'
            aria-label='Open menu'
          >
            <Menu className='h-5 w-5' />
          </Button>
        )}

        <div className='hidden md:block'>
          <p className='text-xs uppercase tracking-[0.3em] text-muted-foreground'>
            Mailbox
          </p>
          <h1 className='text-xl sm:text-2xl font-semibold'>Inbox workspace</h1>
        </div>

        {/* Mobile-only compact title */}
        <div className='md:hidden'>
          <h1 className='text-lg font-semibold'>Inbox</h1>
        </div>

        <div className='flex-1 px-2 sm:px-4 max-w-2xl'>
          {mode === 'traditional' ? (
            <Input
              ref={searchInputRef}
              type='search'
              placeholder='Search...'
              className='w-full text-sm'
              value={emailSearchTerm}
              onChange={(e) => onEmailSearchTermChange(e.target.value)}
            />
          ) : (
            <SearchBarWithSuggestions
              inputRef={searchInputRef}
              value={searchQuery}
              onChange={onSearchQueryChange}
              onSearch={onSearch}
              placeholder='Search...'
            />
          )}
        </div>

        <div className='flex items-center gap-1 sm:gap-3'>
          <Button
            variant='ghost'
            size='sm'
            onClick={onShowKeyboardHelp}
            title='Keyboard shortcuts (Press ?)'
            className='hidden sm:flex'
          >
            <span className='text-lg'>?</span>
          </Button>
          <ModeToggle
            mode={mode}
            onChange={onModeChange}
          />
          <div className='text-right hidden lg:block'>
            <p className='text-sm font-medium'>{userEmail}</p>
            <p className='text-xs text-muted-foreground'>
              {userProvider ?? 'password'} session
            </p>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={onLogout}
            className='hidden sm:flex'
          >
            Logout
          </Button>
          {/* Mobile logout button - icon only */}
          <Button
            variant='outline'
            size='sm'
            onClick={onLogout}
            className='sm:hidden p-2'
            aria-label='Logout'
          >
            <span className='text-xs'>Exit</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
