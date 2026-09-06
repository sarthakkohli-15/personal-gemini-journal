export interface AttachedImage {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string; // safely downscaled / compressed base64 data URI
  caption?: string;
  uploadedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string;
  images?: AttachedImage[];
  isVoiceTranscript?: boolean;
}

export type EntryCategory = 
  | 'Reflection' 
  | 'Gratitude' 
  | 'Daily Journal' 
  | 'Ideas & Goals' 
  | 'Decision Making';

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  category: EntryCategory;
  summary: string;
  messages: ChatMessage[];
  photos?: AttachedImage[]; // entry-level attached photo memories
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export type InsightSourceType = 'explicit' | 'inferred';

export interface InsightItem {
  id?: string;
  text: string;
  sourceType: InsightSourceType;
  context?: string;
}

export interface GrowthInsights {
  id: string;
  userId: string;
  generatedAt: string;
  analyzedEntriesCount: number;
  achievements: InsightItem[];
  activeGoals: InsightItem[];
  recurringThemes: InsightItem[];
  importantDecisions: InsightItem[];
  learnedLessons: InsightItem[];
  unresolvedQuestions: InsightItem[];
  recentProgress: string;
  suggestedNextSteps: InsightItem[];
}

export interface MonthlyReflection {
  id: string;
  userId: string;
  monthKey: string; // e.g. "2026-09"
  monthLabel: string; // e.g. "September 2026"
  generatedAt: string;
  entryCount: number;
  monthTitle?: string; // Short AI-written title for the month
  openingNarrative?: string; // 2-3 sentence opening narrative
  closingReflection?: string; // Short closing reflection
  shareableCaption?: string; // Concise shareable caption
  accomplishments: InsightItem[];
  thingsProudOf?: InsightItem[]; // Things I was proud of
  memorableMoments: InsightItem[]; // Moments worth remembering
  challenges: InsightItem[]; // What challenged me
  learnings: InsightItem[]; // What I learned
  goalsMentioned: InsightItem[]; // Goals I worked toward
  recurringThemes?: InsightItem[]; // Recurring themes
  whatChanged?: string; // What changed from beginning to end of month
  whatMattered: InsightItem[];
  nextMonthFocus: InsightItem[]; // A gentle focus for next month
  motivationalNote?: string;
  monthAtAGlance?: {
    overview: string;
    dominantVibe?: string;
    totalReflections: number;
    photosCount: number;
    voiceReflectionsCount: number;
  };
  photoMemories?: AttachedImage[];
}

export interface PublicStory {
  id: string;
  authorUid: string;
  authorDisplayName: string;
  authorPhotoURL?: string | null;
  isAnonymous: boolean;
  sourceType: "reflection" | "monthly_recap";
  sourceOriginalId: string;
  title: string;
  content: string;
  category: string;
  highlights: string[];
  photos: AttachedImage[];
  publishedAt: string;
  inspiredCount: number;
  inspiredBy: string[];
}

export interface PublishStoryInput {
  sourceType: "reflection" | "monthly_recap";
  sourceOriginalId: string;
  title: string;
  content: string;
  authorDisplayName: string;
  isAnonymous: boolean;
  category: string;
  highlights: string[];
  photos: AttachedImage[];
}
