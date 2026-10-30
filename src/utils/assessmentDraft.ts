import type { SelfAssessmentData } from '../types';

const KEY = 'bx_assessment_draft';

export interface AssessmentDraft {
  formData: SelfAssessmentData;
  step: number;
  isCompleted: boolean;
}

export const loadAssessmentDraft = (): AssessmentDraft | null => {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AssessmentDraft) : null;
  } catch {
    return null;
  }
};

export const saveAssessmentDraft = (draft: AssessmentDraft): void => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // storage unavailable (private mode / quota): fail silently
  }
};

export const clearAssessmentDraft = (): void => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
};