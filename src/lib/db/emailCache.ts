/**
 * Email Cache Service
 *
 * High-level caching API for emails using IndexedDB.
 * Implements the stale-while-revalidate pattern for optimal UX.
 *
 * Pattern:
 * 1. Check cache → return immediately if exists (even if stale)
 * 2. Fetch from server in background
 * 3. Update cache with fresh data
 * 4. Notify caller when fresh data arrives
 */

import type {
  EmailDetail,
  EmailListItem,
  Mailbox,
  MailboxEmailsResponse,
} from '../api/types';
import {
  STORES,
  CACHE_TTL,
  getFromStore,
  setInStore,
  deleteFromStore,
  clearStore,
  isCacheFresh,
} from './indexedDB';

// Cache entry types with metadata
interface CachedEmail {
  id: string;
  data: EmailDetail;
  cachedAt: number;
}

interface CachedEmailList {
  cacheKey: string; // mailboxId:pageToken
  mailboxId: string;
  pageToken: string | null;
  data: EmailListItem[];
  meta: MailboxEmailsResponse['data']['meta'];
  cachedAt: number;
}

interface CachedMailboxes {
  cacheKey: string;
  data: Mailbox[];
  cachedAt: number;
}

/**
 * Generate cache key for email lists
 */
const getEmailListCacheKey = (
  mailboxId: string,
  pageToken?: string
): string => {
  return `${mailboxId}:${pageToken || 'first'}`;
};

/**
 * Cache individual email detail
 */
export const cacheEmail = async (
  emailId: string,
  data: EmailDetail
): Promise<void> => {
  const cached: CachedEmail = {
    id: emailId,
    data,
    cachedAt: Date.now(),
  };
  await setInStore(STORES.EMAILS, cached);
};

/**
 * Get cached email detail
 * Returns { data, isFresh } to indicate if data needs revalidation
 */
export const getCachedEmail = async (
  emailId: string
): Promise<{ data: EmailDetail; isFresh: boolean } | null> => {
  const cached = await getFromStore<CachedEmail>(STORES.EMAILS, emailId);
  if (!cached) return null;

  const isFresh = isCacheFresh(cached.cachedAt, CACHE_TTL.EMAILS);
  return { data: cached.data, isFresh };
};

/**
 * Cache email list for a mailbox/page
 */
export const cacheEmailList = async (
  mailboxId: string,
  pageToken: string | null | undefined,
  data: EmailListItem[],
  meta: MailboxEmailsResponse['data']['meta']
): Promise<void> => {
  const cacheKey = getEmailListCacheKey(mailboxId, pageToken || undefined);
  const cached: CachedEmailList = {
    cacheKey,
    mailboxId,
    pageToken: pageToken || null,
    data,
    meta,
    cachedAt: Date.now(),
  };
  await setInStore(STORES.EMAIL_LISTS, cached);
};

/**
 * Get cached email list
 */
export const getCachedEmailList = async (
  mailboxId: string,
  pageToken?: string
): Promise<{
  data: EmailListItem[];
  meta: MailboxEmailsResponse['data']['meta'];
  isFresh: boolean;
} | null> => {
  const cacheKey = getEmailListCacheKey(mailboxId, pageToken);
  const cached = await getFromStore<CachedEmailList>(
    STORES.EMAIL_LISTS,
    cacheKey
  );
  if (!cached) return null;

  const isFresh = isCacheFresh(cached.cachedAt, CACHE_TTL.EMAIL_LISTS);
  return { data: cached.data, meta: cached.meta, isFresh };
};

/**
 * Cache mailboxes list
 */
export const cacheMailboxes = async (mailboxes: Mailbox[]): Promise<void> => {
  const cached: CachedMailboxes = {
    cacheKey: 'mailboxes',
    data: mailboxes,
    cachedAt: Date.now(),
  };
  await setInStore(STORES.MAILBOXES, cached);
};

/**
 * Get cached mailboxes
 */
export const getCachedMailboxes = async (): Promise<{
  data: Mailbox[];
  isFresh: boolean;
} | null> => {
  const cached = await getFromStore<CachedMailboxes>(
    STORES.MAILBOXES,
    'mailboxes'
  );
  if (!cached) return null;

  const isFresh = isCacheFresh(cached.cachedAt, CACHE_TTL.MAILBOXES);
  return { data: cached.data, isFresh };
};

/**
 * Invalidate (delete) cached email
 * Useful when email is deleted or modified
 */
export const invalidateEmail = async (emailId: string): Promise<void> => {
  await deleteFromStore(STORES.EMAILS, emailId);
};

/**
 * Invalidate email list cache for a specific mailbox
 * Useful when emails are added/deleted/modified in a mailbox
 */
export const invalidateEmailList = async (
  mailboxId: string,
  pageToken?: string
): Promise<void> => {
  const cacheKey = getEmailListCacheKey(mailboxId, pageToken);
  await deleteFromStore(STORES.EMAIL_LISTS, cacheKey);
};

/**
 * Invalidate all email lists for a mailbox (all pages)
 * More aggressive invalidation when major changes occur
 */
export const invalidateAllEmailListsForMailbox = async (): Promise<void> => {
  // Since we can't easily query by mailboxId without loading all,
  // we clear the entire email lists cache for simplicity.
  // In production, you might want to use the mailboxId index to be more selective.
  await clearStore(STORES.EMAIL_LISTS);
};

/**
 * Invalidate mailboxes cache
 */
export const invalidateMailboxes = async (): Promise<void> => {
  await deleteFromStore(STORES.MAILBOXES, 'mailboxes');
};

/**
 * Clear all email-related cache
 * Useful on logout or when switching accounts
 */
export const clearAllEmailCache = async (): Promise<void> => {
  await Promise.all([
    clearStore(STORES.EMAILS),
    clearStore(STORES.EMAIL_LISTS),
    clearStore(STORES.MAILBOXES),
  ]);
  console.log('All email cache cleared');
};
