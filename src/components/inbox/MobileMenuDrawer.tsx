/**
 * MobileMenuDrawer - Responsive mobile menu drawer for mailbox navigation
 *
 * Features:
 * - Slide-in drawer from left on mobile devices
 * - Overlay backdrop
 * - Touch-friendly close gestures
 * - Auto-closes when mailbox is selected
 */

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Mailbox } from '@/lib/api';
import { formatMailboxName } from '@/utils/mailboxUtils';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mailboxes: Mailbox[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function MobileMenuDrawer({
  isOpen,
  onClose,
  mailboxes,
  selectedId,
  onSelect,
}: MobileMenuDrawerProps) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSelect = (id: string) => {
    onSelect(id);
    onClose(); // Auto-close on selection
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className='fixed inset-0 bg-black/50 z-40 lg:hidden'
        onClick={onClose}
        aria-hidden='true'
      />

      {/* Drawer panel */}
      <div
        className={`
          fixed top-0 left-0 bottom-0 z-50
          w-[280px] max-w-[85vw]
          bg-card border-r shadow-xl
          transform transition-transform duration-300 ease-in-out
          lg:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        role='dialog'
        aria-modal='true'
        aria-label='Mailbox navigation'
      >
        {/* Drawer header */}
        <div className='flex items-center justify-between border-b px-4 py-3 safe-area-inset-top'>
          <p className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
            Mailboxes
          </p>
          <Button
            size='sm'
            variant='ghost'
            onClick={onClose}
            className='h-8 w-8 p-0'
            aria-label='Close menu'
          >
            <X className='h-4 w-4' />
          </Button>
        </div>

        {/* Mailbox list */}
        <div className='overflow-y-auto touch-scroll scrollbar-thin h-[calc(100%-57px)] safe-area-inset-bottom'>
          {mailboxes.length ? (
            <ul className='divide-y'>
              {mailboxes.map((mailbox) => (
                <li key={mailbox.id}>
                  <button
                    type='button'
                    className={`
                      flex w-full items-center justify-between
                      px-4 py-3 text-left text-sm transition
                      tap-target
                      ${
                        selectedId === mailbox.id
                          ? 'bg-primary/10 font-semibold'
                          : 'hover:bg-muted/50 active:bg-muted'
                      }
                    `}
                    onClick={() => handleSelect(mailbox.id)}
                  >
                    <span className='truncate'>
                      {formatMailboxName(mailbox.name)}
                    </span>
                    {typeof mailbox.unread === 'number' && (
                      <span className='rounded-full bg-muted px-2 py-0.5 text-xs font-semibold'>
                        {mailbox.unread}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className='p-4 text-sm text-muted-foreground'>
              No mailboxes.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
