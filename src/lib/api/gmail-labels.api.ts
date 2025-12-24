import axios from 'axios';
import { API_BASE_URL } from '@/config/env';

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
  const response = await axios.get(`${API_BASE_URL}/api/kanban/gmail-labels`, {
    withCredentials: true,
  });
  return response.data.labels;
}

/**
 * Validate if a Gmail label exists
 */
export async function validateGmailLabel(
  labelName: string
): Promise<LabelValidationResult> {
  const response = await axios.post(
    `${API_BASE_URL}/api/kanban/validate-label`,
    { labelName },
    { withCredentials: true }
  );
  return response.data;
}
