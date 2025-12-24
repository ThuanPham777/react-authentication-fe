import apiClient from './client';

export interface GmailLabel {
  id: string;
  name: string;
  type: 'system' | 'user';
}

export interface LabelValidationResult {
  valid: boolean;
  message: string;
  actualName?: string;
  suggestions?: string[];
  hint?: string;
}

/**
 * Fetch all available Gmail labels for the current user
 */
export async function getGmailLabels(): Promise<GmailLabel[]> {
  const response = await apiClient.get<{
    status: 'success';
    data: { labels: GmailLabel[] };
  }>(`/api/kanban/gmail-labels`);
  return response.data.data.labels;
}

/**
 * Validate if a Gmail label exists
 */
export async function validateGmailLabel(
  labelName: string
): Promise<LabelValidationResult> {
  const response = await apiClient.post<{
    status: 'success';
    data: LabelValidationResult;
  }>(`/api/kanban/validate-label`, { labelName });
  return response.data.data;
}
