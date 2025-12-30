/**
 * Cached Gmail API Client with Stale-While-Revalidate Pattern
 *
 * Wraps the base Gmail API with caching logic:
 * 1. Return cached data immediately if available
 * 2. Fetch fresh data from server in background
 * 3. Update cache and notify when fresh data arrives
 *
 * Usage with React Query:
 * - placeholderData: cached data (instant display)
 * - data: fresh data (replaces placeholder when ready)
 */

import * as baseApi from './gmail.api';
import type {
  MailboxResponse,
  MailboxEmailsResponse,
  EmailDetailResponse,
  SendEmailData,
  SendEmailResponse,
  ReplyEmailData,
  ReplyEmailResponse,
  ModifyEmailData,
  ModifyEmailResponse,
} from './types';
import {
  getCachedEmail,
  cacheEmail,
  getCachedEmailList,
  cacheEmailList,
  getCachedMailboxes,
  cacheMailboxes,
  invalidateEmail,
  invalidateAllEmailListsForMailbox,
  invalidateMailboxes,
} from '../db/emailCache';

/**
 * Cached version of getMailboxes
 * Returns cached data if available, then fetches fresh data
 */
export const getMailboxesCached = async (): Promise<MailboxResponse> => {
  // Try cache first
  const cached = await getCachedMailboxes();

  // Start fresh fetch (don't await, let it run in background)
  const fetchPromise = baseApi.getMailboxes().then(async (response) => {
    // Cache the fresh data
    await cacheMailboxes(response.data.mailboxes);
    return response;
  });

  // If we have cached data, return it immediately
  if (cached) {
    // Don't wait for fresh data, let the query update itself
    return {
      status: 'success',
      data: { mailboxes: cached.data },
    };
  }

  // No cache, wait for fresh data
  return fetchPromise;
};

/**
 * Cached version of getMailboxEmailsInfinite
 * Implements stale-while-revalidate for email lists
 */
export const getMailboxEmailsInfiniteCached = async (
  mailboxId: string,
  pageToken?: string,
  pageSize = 20
): Promise<MailboxEmailsResponse> => {
  // Try cache first
  const cached = await getCachedEmailList(mailboxId, pageToken);

  // IMPORTANT:
  // - Cache must be keyed by the *current* pageToken (the request cursor), not nextPageToken.
  // - For non-first pages, returning cached data can cause UI to "repeat" the first page
  //   if old/bad cache entries exist. So we prefer fetching fresh for pageToken != undefined.
  const isFirstPage = pageToken == null;

  // If cached first page is fresh, it is safe to use it directly.
  if (isFirstPage && cached?.isFresh) {
    return {
      status: 'success',
      data: {
        data: cached.data,
        meta: cached.meta,
      },
    };
  }

  try {
    const response = await baseApi.getMailboxEmailsInfinite(
      mailboxId,
      pageToken,
      pageSize
    );

    await cacheEmailList(
      mailboxId,
      pageToken ?? null,
      response.data.data,
      response.data.meta
    );

    return response;
  } catch (error) {
    // Offline/temporary error fallback: serve cached data if available.
    if (cached) {
      return {
        status: 'success',
        data: {
          data: cached.data,
          meta: cached.meta,
        },
      };
    }
    throw error;
  }
};

/**
 * Cached version of getEmailDetail
 * Implements stale-while-revalidate for individual emails
 */
export const getEmailDetailCached = async (
  emailId: string
): Promise<EmailDetailResponse> => {
  // Try cache first
  const cached = await getCachedEmail(emailId);

  // Start fresh fetch in background
  const fetchPromise = baseApi
    .getEmailDetail(emailId)
    .then(async (response) => {
      // Cache the fresh data
      await cacheEmail(emailId, response.data);
      return response;
    });

  // If we have cached data, return it immediately
  if (cached) {
    return {
      status: 'success',
      data: cached.data,
    };
  }

  // No cache, wait for fresh data
  return fetchPromise;
};

/**
 * Send email (no caching, just invalidate list cache after send)
 */
export const sendEmailWithCacheInvalidation = async (
  data: SendEmailData
): Promise<SendEmailResponse> => {
  const response = await baseApi.sendEmail(data);

  // Invalidate SENT mailbox cache since we added a new email
  await invalidateAllEmailListsForMailbox();

  return response;
};

/**
 * Reply to email (invalidate cache after reply)
 */
export const replyEmailWithCacheInvalidation = async (
  emailId: string,
  data: ReplyEmailData
): Promise<ReplyEmailResponse> => {
  const response = await baseApi.replyEmail(emailId, data);

  // Invalidate the original email cache (thread might have changed)
  await invalidateEmail(emailId);
  // Invalidate SENT mailbox
  await invalidateAllEmailListsForMailbox();

  return response;
};

/**
 * Forward email (invalidate cache after forward)
 */
export const forwardEmailWithCacheInvalidation = async (
  emailId: string,
  data: SendEmailData
): Promise<SendEmailResponse> => {
  const response = await baseApi.forwardEmail(emailId, data);

  // Invalidate SENT mailbox
  await invalidateAllEmailListsForMailbox();

  return response;
};

/**
 * Modify email (star, read, delete) - invalidate cache after modification
 */
export const modifyEmailWithCacheInvalidation = async (
  emailId: string,
  data: ModifyEmailData
): Promise<ModifyEmailResponse> => {
  const response = await baseApi.modifyEmail(emailId, data);

  // Invalidate the email cache
  await invalidateEmail(emailId);

  // If deleting, invalidate all mailbox lists (email moved to trash/removed)
  if (data.delete) {
    await invalidateAllEmailListsForMailbox();
    await invalidateMailboxes(); // Unread counts changed
  } else {
    // Just invalidate affected mailboxes for star/read changes
    await invalidateAllEmailListsForMailbox();
    await invalidateMailboxes(); // Unread counts might have changed
  }

  return response;
};

/**
 * Download attachment (pass-through, no caching for binary data)
 */
export const downloadAttachment = baseApi.getAttachment;

/**
 * Export all cached versions as the default API
 * This allows you to swap imports from './api/gmail.api' to './api/gmail.cached.api'
 */
export {
  getMailboxesCached as getMailboxes,
  getMailboxEmailsInfiniteCached as getMailboxEmailsInfinite,
  getEmailDetailCached as getEmailDetail,
  sendEmailWithCacheInvalidation as sendEmail,
  replyEmailWithCacheInvalidation as replyEmail,
  forwardEmailWithCacheInvalidation as forwardEmail,
  modifyEmailWithCacheInvalidation as modifyEmail,
  downloadAttachment as getAttachment,
};
