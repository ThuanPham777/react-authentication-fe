// src/lib/api/mail.api.ts
import apiClient from "./client";
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
} from "./types";

export const getMailboxes = async (): Promise<MailboxResponse> => {
    const response = await apiClient.get<MailboxResponse>("/api/mailboxes");
    return response.data;
};

export const getMailboxEmails = async (
    mailboxId: string,
    page = 1,
    pageSize = 20
): Promise<MailboxEmailsResponse> => {
    const safeId = encodeURIComponent(mailboxId);
    const response = await apiClient.get<MailboxEmailsResponse>(
        `/api/mailboxes/${safeId}/emails`,
        { params: { page, limit: pageSize } }
    );
    return response.data;
};

export const getEmailDetail = async (emailId: string): Promise<EmailDetailResponse> => {
    const safeId = encodeURIComponent(emailId);
    const response = await apiClient.get<EmailDetailResponse>(`/api/emails/${safeId}`);
    return response.data;
};

export const sendEmail = async (data: SendEmailData): Promise<SendEmailResponse> => {
    const response = await apiClient.post<SendEmailResponse>("/api/emails/send", data);
    return response.data;
};

export const replyEmail = async (
    emailId: string,
    data: ReplyEmailData
): Promise<ReplyEmailResponse> => {
    const safeId = encodeURIComponent(emailId);
    const response = await apiClient.post<ReplyEmailResponse>(
        `/api/emails/${safeId}/reply`,
        data
    );
    return response.data;
};

export const modifyEmail = async (
    emailId: string,
    data: ModifyEmailData
): Promise<ModifyEmailResponse> => {
    const safeId = encodeURIComponent(emailId);
    const response = await apiClient.post<ModifyEmailResponse>(
        `/api/emails/${safeId}/modify`,
        data
    );
    return response.data;
};

export const getAttachment = async (emailId: string, attachmentId: string): Promise<Blob> => {
    const response = await apiClient.get(`/api/attachments/${attachmentId}`, {
        params: { emailId },
        responseType: "blob",
    });
    return response.data;
};
