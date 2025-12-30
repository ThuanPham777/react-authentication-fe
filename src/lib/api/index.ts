// src/lib/api/index.ts
export { default as apiClient } from './client';

export * from './types';

export * from './auth.api';
export * from './gmail.api';
export * from './kanban.api';

// Cached versions with stale-while-revalidate pattern
export * as gmailCached from './gmail.cached.api';
