export interface Mailbox {
  id: string;
  name: string;
  unread?: number;
}

export interface MailboxResponse {
  status: 'success';
  message?: string;
  data: {
    mailboxes: Mailbox[];
  };
}

export interface EmailListItem {
  id: string; // mailboxId|messageId
  mailboxId: string; // labelId
  senderName: string;
  senderEmail: string;
  subject: string;
  preview: string;
  timestamp: string;
  starred: boolean;
  unread: boolean;
  important: boolean;
}

export interface MailboxEmailsResponse {
  status: 'success';
  message?: string;
  data: {
    data: EmailListItem[];
    meta: {
      total?: number;
      page?: number;
      pageSize: number;
      nextPageToken?: string | null;
      hasMore?: boolean;
    };
  };
}

export interface EmailDetail extends EmailListItem {
  to: string[];
  cc?: string[];
  body: string;
  attachments?: {
    id: string;
    fileName: string;
    size: string;
    type: string;
  }[];
  threadId?: string;
}

export interface EmailDetailResponse {
  status: 'success';
  data: EmailDetail;
}

export interface SendEmailData {
  to: string[];
  subject: string;
  body: string;
  cc?: string[];
  bcc?: string[];
  attachments?: File[];
}

export interface SendEmailResponse {
  status: 'success';
  message?: string;
  data: {
    messageId: string;
  };
}

export interface ReplyEmailData {
  body: string;
  replyAll?: boolean;
  attachments?: File[];
}

export interface ReplyEmailResponse {
  status: 'success';
  message?: string;
  data: {
    messageId: string;
  };
}

export interface ModifyEmailData {
  markRead?: boolean;
  markUnread?: boolean;
  star?: boolean;
  unstar?: boolean;
  delete?: boolean;
}

export interface ModifyEmailResponse {
  status: 'success';
  message?: string;
  data: null;
}
