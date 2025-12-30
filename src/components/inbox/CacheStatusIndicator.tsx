/**
 * Cache Status Indicator Component
 *
 * Displays a small badge showing whether data is from cache or fresh from server.
 * Useful for debugging and demonstrating the stale-while-revalidate pattern.
 *
 * Usage:
 * <CacheStatusIndicator isFetching={query.isFetching} />
 */

import { useEffect, useState } from 'react';

interface CacheStatusIndicatorProps {
  /** Whether React Query is currently fetching fresh data */
  isFetching: boolean;
  /** Optional custom label */
  label?: string;
}

export function CacheStatusIndicator({
  isFetching,
  label,
}: CacheStatusIndicatorProps) {
  const [justUpdated, setJustUpdated] = useState(false);

  useEffect(() => {
    if (!isFetching && justUpdated) {
      // Show "updated" state for 2 seconds after fetch completes
      const timer = setTimeout(() => setJustUpdated(false), 2000);
      return () => clearTimeout(timer);
    }
    if (isFetching) {
      setJustUpdated(true);
    }
  }, [isFetching, justUpdated]);

  // Don't show anything if not fetching and no recent update
  if (!isFetching && !justUpdated) return null;

  return (
    <div
      className='fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs shadow-lg'
      role='status'
      aria-live='polite'
    >
      <div
        className={`h-2 w-2 rounded-full ${
          isFetching ? 'animate-pulse bg-blue-500' : 'bg-green-500'
        }`}
      />
      <span className='font-medium'>
        {isFetching ? label || 'Syncing...' : '✓ Updated'}
      </span>
    </div>
  );
}

/**
 * Cache Debug Panel Component
 *
 * Shows detailed cache statistics for development/debugging.
 * Displays cache hit/miss info and allows clearing cache.
 *
 * Usage (dev only):
 * {process.env.NODE_ENV === 'development' && <CacheDebugPanel />}
 */

export function CacheDebugPanel() {
  const [stats, setStats] = useState({
    emails: 0,
    emailLists: 0,
    mailboxes: 0,
  });

  const updateStats = async () => {
    try {
      const { getAllFromStore, STORES } = await import('@/lib/db/indexedDB');
      const [emails, lists, mailboxes] = await Promise.all([
        getAllFromStore(STORES.EMAILS),
        getAllFromStore(STORES.EMAIL_LISTS),
        getAllFromStore(STORES.MAILBOXES),
      ]);
      setStats({
        emails: emails.length,
        emailLists: lists.length,
        mailboxes: mailboxes.length,
      });
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    }
  };

  const clearCache = async () => {
    if (!confirm('Clear all cached data?')) return;
    try {
      const { clearAllCache } = await import('@/lib/db/indexedDB');
      await clearAllCache();
      await updateStats();
      alert('Cache cleared successfully!');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      alert('Failed to clear cache');
    }
  };

  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className='fixed bottom-4 left-4 z-50 rounded-lg border bg-card p-4 text-xs shadow-lg'>
      <h3 className='mb-2 font-semibold'>Cache Stats (Dev)</h3>
      <div className='space-y-1'>
        <div className='flex justify-between gap-4'>
          <span className='text-muted-foreground'>Emails:</span>
          <span className='font-mono'>{stats.emails}</span>
        </div>
        <div className='flex justify-between gap-4'>
          <span className='text-muted-foreground'>Email Lists:</span>
          <span className='font-mono'>{stats.emailLists}</span>
        </div>
        <div className='flex justify-between gap-4'>
          <span className='text-muted-foreground'>Mailboxes:</span>
          <span className='font-mono'>{stats.mailboxes}</span>
        </div>
      </div>
      <button
        onClick={clearCache}
        className='mt-3 w-full rounded bg-destructive px-2 py-1 text-destructive-foreground hover:bg-destructive/90'
      >
        Clear Cache
      </button>
    </div>
  );
}
