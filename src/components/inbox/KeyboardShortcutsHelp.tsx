/**
 * Keyboard Shortcuts Help Modal
 * Displays all available keyboard shortcuts grouped by category
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SHORTCUTS } from '@/lib/keyboardShortcuts';
import { Keyboard } from 'lucide-react';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsHelp({
  open,
  onOpenChange,
}: KeyboardShortcutsHelpProps) {
  // Group shortcuts by category
  const categories = Object.entries(SHORTCUTS).reduce(
    (acc, [action, definition]) => {
      const category = definition.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({
        action,
        ...definition,
      });
      return acc;
    },
    {} as Record<
      string,
      Array<{
        action: string;
        keys: string[];
        description: string;
        contexts?: string[];
      }>
    >
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Keyboard className='h-5 w-5' />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate and perform actions quickly
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6 mt-4'>
          {Object.entries(categories).map(([category, shortcuts]) => (
            <div key={category}>
              <h3 className='text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3'>
                {category}
              </h3>
              <div className='space-y-2'>
                {shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.action}
                    className='flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors'
                  >
                    <span className='text-sm'>{shortcut.description}</span>
                    <div className='flex items-center gap-2'>
                      {shortcut.keys.map((key, idx) => (
                        <div
                          key={idx}
                          className='flex items-center gap-1'
                        >
                          {idx > 0 && (
                            <span className='text-xs text-muted-foreground'>
                              or
                            </span>
                          )}
                          <kbd className='px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded'>
                            {key.split(' ').map((k, i) => (
                              <span key={i}>
                                {i > 0 && (
                                  <span className='mx-1 text-muted-foreground'>
                                    then
                                  </span>
                                )}
                                {k}
                              </span>
                            ))}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className='mt-6 pt-4 border-t'>
          <p className='text-xs text-muted-foreground'>
            <strong>Tip:</strong> Press{' '}
            <kbd className='px-1.5 py-0.5 text-xs bg-muted border border-border rounded'>
              ?
            </kbd>{' '}
            anytime to show this help dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
