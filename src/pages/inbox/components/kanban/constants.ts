// src/pages/inbox/components/kanban/constants.ts

export const EMAIL_STATUS = {
    INBOX: "INBOX",
    TODO: "TODO",
    IN_PROGRESS: "IN_PROGRESS",
    DONE: "DONE",
    SNOOZED: "SNOOZED",
} as const;

export type EmailStatus =
    typeof EMAIL_STATUS[keyof typeof EMAIL_STATUS];

export const DEFAULT_KANBAN_STATUSES: EmailStatus[] = [
    EMAIL_STATUS.INBOX,
    EMAIL_STATUS.TODO,
    EMAIL_STATUS.IN_PROGRESS,
    EMAIL_STATUS.DONE,
];

export const COLUMN_TITLES: Record<EmailStatus, string> = {
    INBOX: "INBOX",
    TODO: "TO DO",
    IN_PROGRESS: "IN PROGRESS",
    DONE: "DONE",
    SNOOZED: "SNOOZED",
};
