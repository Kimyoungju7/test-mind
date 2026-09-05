export type CounselorPersona = "warm" | "parent" | "discipline" | "burnout";

export interface PersonaInfo {
  id: CounselorPersona;
  title: string;
  subtitle: string;
  iconName: string;
  badge: string;
  greeting: string;
  promptExamples: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  persona?: CounselorPersona;
}

export interface MindPrescription {
  title: string;
  empathy: string;
  rxAction: string;
  mantra: string;
  teaRecommendation: string;
}

export interface CounselingSession {
  id: string;
  title: string;
  summary?: string;
  persona: CounselorPersona;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  tags: string[];
  moodScore?: number;
  notes?: string;
  isFavorite?: boolean;
}

export interface CounselingStats {
  totalSessions: number;
  totalMessages: number;
  personaDistribution: Record<CounselorPersona, number>;
  topTags: { tag: string; count: number }[];
  averageMood?: number;
  lastSessionDate?: string;
}
