/** One step in the 4-step "Cara Kerja" roadmap. */
export interface ProcessStep {
  id: number;
  title: string;
  description: string;
}

/** A step after config (per-step accent color) has been merged in. */
export interface ProcessStepWithConfig extends ProcessStep {
  dotColorClassName: string;
}

/** One row in the "Isi Profil" preview checklist. */
export interface ProfileChecklistItem {
  label: string;
  done: boolean;
}

/** A single simulated skeleton text line inside the document preview. */
export interface DocumentSkeletonLine {
  widthClassName: string;
}

/** Illustrative interview Q&A pair used in the "Latihan dengan AI" preview. */
export interface InterviewExample {
  question: string;
  feedbackLabel: string;
  feedback: string;
}

/** The one example application row shown in the "Lamar & Lacak" preview. */
export interface ApplicationExample {
  role: string;
  company: string;
  status: string;
}

/** A single stage segment in the horizontal application status track. */
export interface StatusTrackStage {
  filled: boolean;
}
