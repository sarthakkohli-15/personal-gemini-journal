import React, { useState, useEffect, useMemo } from "react";
import { 
  Sparkles, 
  Award, 
  Target, 
  Compass, 
  Lightbulb, 
  HelpCircle, 
  CheckCircle2, 
  RefreshCw, 
  Calendar, 
  ChevronRight, 
  AlertCircle, 
  Heart, 
  Mountain, 
  BookOpen, 
  ArrowUpRight, 
  Clock,
  Layers,
  Info,
  Share2,
  Camera,
  Check,
  TrendingUp,
  Smile,
  Film,
  Globe,
  Lock,
  ShieldCheck
} from "lucide-react";
import { 
  auth, 
  db, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs,
  cleanForFirestore
} from "../lib/firebase";
import type { 
  JournalEntry, 
  UserProfile, 
  GrowthInsights, 
  MonthlyReflection,
  InsightItem,
  AttachedImage,
  PublishStoryInput,
  PublicStory
} from "../types";
import { MonthlyStoryReel } from "./MonthlyStoryReel";
import { PhotoViewerModal } from "./PhotoViewerModal";
import { PublishConfirmationModal } from "./PublishConfirmationModal";
import { inspirationService } from "../services/inspirationService";

interface GrowthDashboardProps {
  user: UserProfile;
  entries: JournalEntry[];
  onNavigateToWrite: () => void;
  onNavigateToInspiration?: () => void;
}

export const GrowthDashboard: React.FC<GrowthDashboardProps> = ({
  user,
  entries,
  onNavigateToWrite,
  onNavigateToInspiration,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "monthly">("overview");

  // Growth Insights State
  const [growthInsights, setGrowthInsights] = useState<GrowthInsights | null>(null);
  const [loadingGrowth, setLoadingGrowth] = useState<boolean>(false);
  const [growthError, setGrowthError] = useState<string | null>(null);

  // Monthly Reflection State
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>("");
  const [monthlyReflectionsCache, setMonthlyReflectionsCache] = useState<Record<string, MonthlyReflection>>({});
  const [loadingMonthly, setLoadingMonthly] = useState<boolean>(false);
  const [monthlyError, setMonthlyError] = useState<string | null>(null);
  const [monthlyViewMode, setMonthlyViewMode] = useState<"story" | "report">("story");
  const [copiedReportCaption, setCopiedReportCaption] = useState<boolean>(false);
  const [selectedReportPhoto, setSelectedReportPhoto] = useState<AttachedImage | null>(null);

  // Inspiration Space Publishing State
  const [showPublishModal, setShowPublishModal] = useState<boolean>(false);
  const [publishSuccessMsg, setPublishSuccessMsg] = useState<string | null>(null);
  const [publicStories, setPublicStories] = useState<PublicStory[]>([]);

  // Fetch user's public stories to check publication status
  useEffect(() => {
    let isMounted = true;
    inspirationService.fetchPublicStories().then((stories) => {
      if (isMounted) {
        setPublicStories(stories.filter((s) => s.authorUid === user.uid));
      }
    }).catch((err) => console.warn("Notice checking public stories in growth:", err));

    return () => {
      isMounted = false;
    };
  }, [user.uid]);

  const handleConfirmPublish = async (input: PublishStoryInput) => {
    const published = await inspirationService.publishStory(input, user);
    setPublicStories((prev) => [published, ...prev]);
    setPublishSuccessMsg("Monthly story published to Inspiration Space! Original history remains private.");
    setTimeout(() => setPublishSuccessMsg(null), 6000);
  };

  // Group user's entries by month (YYYY-MM)
  const availableMonths = useMemo(() => {
    const map = new Map<string, { key: string; label: string; count: number }>();
    
    // Always include current month
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const currentLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    map.set(currentKey, { key: currentKey, label: currentLabel, count: 0 });

    entries.forEach((e) => {
      try {
        const d = new Date(e.createdAt);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
          const existing = map.get(key);
          if (existing) {
            existing.count += 1;
          } else {
            map.set(key, { key, label, count: 1 });
          }
        }
      } catch (err) {
        // ignore date parse issues
      }
    });

    return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [entries]);

  // Set default selected month on mount
  useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonthKey) {
      setSelectedMonthKey(availableMonths[0].key);
    }
  }, [availableMonths, selectedMonthKey]);

  // Load saved Growth Insights from Firestore
  useEffect(() => {
    let isMounted = true;
    const loadSavedInsights = async () => {
      if (!user?.uid) return;
      try {
        const docRef = doc(db, "users", user.uid, "growthInsights", "latest");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && isMounted) {
          setGrowthInsights(docSnap.data() as GrowthInsights);
        }
      } catch (err) {
        console.warn("Could not load cached growth insights:", err);
      }
    };
    loadSavedInsights();
    return () => { isMounted = false; };
  }, [user?.uid]);

  // Load saved Monthly Reflection for selected month from Firestore
  useEffect(() => {
    let isMounted = true;
    const loadMonthlyFromDb = async () => {
      if (!user?.uid || !selectedMonthKey) return;
      if (monthlyReflectionsCache[selectedMonthKey]) return; // already in memory

      try {
        const docRef = doc(db, "users", user.uid, "monthlyReflections", selectedMonthKey);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && isMounted) {
          const data = docSnap.data() as MonthlyReflection;
          setMonthlyReflectionsCache((prev) => ({ ...prev, [selectedMonthKey]: data }));
        }
      } catch (err) {
        console.warn(`Could not load monthly reflection for ${selectedMonthKey}:`, err);
      }
    };
    loadMonthlyFromDb();
    return () => { isMounted = false; };
  }, [user?.uid, selectedMonthKey, monthlyReflectionsCache]);

  // Filter entries for the selected month
  const selectedMonthEntries = useMemo(() => {
    if (!selectedMonthKey) return [];
    return entries.filter((e) => {
      try {
        const d = new Date(e.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return key === selectedMonthKey;
      } catch {
        return false;
      }
    });
  }, [entries, selectedMonthKey]);

  const currentMonthLabel = useMemo(() => {
    const found = availableMonths.find((m) => m.key === selectedMonthKey);
    return found ? found.label : selectedMonthKey;
  }, [availableMonths, selectedMonthKey]);

  // Extract all unique photo memories from the selected month's entries
  const selectedMonthPhotos = useMemo(() => {
    const photos: AttachedImage[] = [];
    const seenIds = new Set<string>();

    selectedMonthEntries.forEach((entry) => {
      if (entry.photos && Array.isArray(entry.photos)) {
        entry.photos.forEach((p) => {
          if (!seenIds.has(p.id)) {
            seenIds.add(p.id);
            photos.push(p);
          }
        });
      }
      if (entry.messages && Array.isArray(entry.messages)) {
        entry.messages.forEach((m) => {
          if (m.images && Array.isArray(m.images)) {
            m.images.forEach((p) => {
              if (!seenIds.has(p.id)) {
                seenIds.add(p.id);
                photos.push(p);
              }
            });
          }
        });
      }
    });

    return photos;
  }, [selectedMonthEntries]);

  // Count voice reflections in the selected month
  const selectedMonthVoiceCount = useMemo(() => {
    return selectedMonthEntries.filter((e) =>
      e.messages.some((m) => m.isVoiceTranscript)
    ).length;
  }, [selectedMonthEntries]);

  // Helper to obtain Firebase Auth ID token
  const getIdToken = async (): Promise<string> => {
    if (!auth.currentUser) return "";
    return await auth.currentUser.getIdToken();
  };

  // Generate or Re-analyze Growth Insights with Gemini
  const handleAnalyzeGrowth = async () => {
    if (entries.length === 0) {
      setGrowthError("You need at least one journal entry to analyze personal growth.");
      return;
    }

    setLoadingGrowth(true);
    setGrowthError(null);

    try {
      const idToken = await getIdToken();
      const response = await fetch("/api/gemini/analyze-growth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId: user.uid,
          entries: entries.map((e) => ({
            id: e.id,
            title: e.title,
            category: e.category,
            summary: e.summary,
            createdAt: e.createdAt,
            messages: e.messages,
          })),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${response.status}`);
      }

      const result = await response.json();

      const newInsights: GrowthInsights = {
        id: "latest",
        userId: user.uid,
        generatedAt: new Date().toISOString(),
        analyzedEntriesCount: entries.length,
        achievements: result.achievements || [],
        activeGoals: result.activeGoals || [],
        recurringThemes: result.recurringThemes || [],
        importantDecisions: result.importantDecisions || [],
        learnedLessons: result.learnedLessons || [],
        unresolvedQuestions: result.unresolvedQuestions || [],
        recentProgress: result.recentProgress || "",
        suggestedNextSteps: result.suggestedNextSteps || [],
      };

      setGrowthInsights(newInsights);

      // Save to Firestore under /users/{userId}/growthInsights/latest
      try {
        await setDoc(doc(db, "users", user.uid, "growthInsights", "latest"), newInsights);
      } catch (saveErr) {
        console.warn("Could not cache growth insights in Firestore:", saveErr);
      }
    } catch (err: any) {
      console.error("Analyze growth error:", err);
      setGrowthError(err.message || "Unable to analyze growth right now. Please try again.");
    } finally {
      setLoadingGrowth(false);
    }
  };

  // Generate or Re-analyze Monthly Reflection with Gemini
  const handleGenerateMonthly = async () => {
    if (selectedMonthEntries.length === 0) {
      setMonthlyError(`No journal entries found for ${currentMonthLabel}. Write an entry to generate a monthly reflection.`);
      return;
    }

    setLoadingMonthly(true);
    setMonthlyError(null);

    try {
      const idToken = await getIdToken();
      const response = await fetch("/api/gemini/monthly-reflection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId: user.uid,
          monthKey: selectedMonthKey,
          monthLabel: currentMonthLabel,
          entries: selectedMonthEntries.map((e) => ({
            id: e.id,
            title: e.title,
            category: e.category,
            summary: e.summary,
            createdAt: e.createdAt,
            messages: e.messages,
            photos: e.photos || [],
          })),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${response.status}`);
      }

      const result = await response.json();

      const newReflection: MonthlyReflection = {
        id: selectedMonthKey,
        userId: user.uid,
        monthKey: selectedMonthKey,
        monthLabel: currentMonthLabel,
        generatedAt: new Date().toISOString(),
        entryCount: selectedMonthEntries.length,
        monthTitle: result.monthTitle || `Reflections of ${currentMonthLabel}`,
        openingNarrative: result.openingNarrative || "",
        closingReflection: result.closingReflection || "",
        shareableCaption: result.shareableCaption || "",
        monthAtAGlance: {
          overview: result.monthAtAGlance?.overview || "",
          dominantVibe: result.monthAtAGlance?.dominantVibe || "",
          totalReflections: selectedMonthEntries.length,
          photosCount: selectedMonthPhotos.length,
          voiceReflectionsCount: selectedMonthVoiceCount,
        },
        accomplishments: result.accomplishments || [],
        thingsProudOf: result.thingsProudOf || [],
        memorableMoments: result.memorableMoments || [],
        challenges: result.challenges || [],
        learnings: result.learnings || [],
        goalsMentioned: result.goalsMentioned || [],
        recurringThemes: result.recurringThemes || [],
        whatChanged: result.whatChanged || "",
        whatMattered: result.whatMattered || [],
        nextMonthFocus: result.nextMonthFocus || [],
        motivationalNote: result.motivationalNote || "",
        photoMemories: selectedMonthPhotos,
      };

      setMonthlyReflectionsCache((prev) => ({ ...prev, [selectedMonthKey]: newReflection }));

      // Save to Firestore under /users/{userId}/monthlyReflections/{monthKey}
      try {
        await setDoc(doc(db, "users", user.uid, "monthlyReflections", selectedMonthKey), newReflection);
      } catch (saveErr) {
        console.warn("Could not cache monthly reflection in Firestore:", saveErr);
      }
    } catch (err: any) {
      console.error("Monthly reflection generation error:", err);
      setMonthlyError(err.message || "Failed to generate monthly reflection. Please try again.");
    } finally {
      setLoadingMonthly(false);
    }
  };

  const currentReflection = monthlyReflectionsCache[selectedMonthKey] || null;

  const handleCopyReportCaption = async (caption: string) => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopiedReportCaption(true);
      setTimeout(() => setCopiedReportCaption(false), 2500);
    } catch {
      // fallback if clipboard fails
    }
  };

  // Format date helper
  const formatDateFriendly = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#141210] text-[#EDE8E3] p-4 sm:p-8 lg:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Top Header & Navigation Tabs */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-stone-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                <Compass className="w-3.5 h-3.5" /> Personal Growth & Reflection
              </span>
              <span className="text-xs text-stone-300">
                {entries.length} {entries.length === 1 ? "entry" : "entries"} recorded
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100 tracking-tight">
              Growth Journey & Milestones
            </h1>
            <p className="text-sm text-stone-300 max-w-2xl mt-1">
              Reflect on your personal trajectory from your own private entries. Comparing your present self only with your past self.
            </p>
          </div>

          {/* Sub-Tabs: Overall Growth vs Monthly Reflection */}
          <div className="flex items-center gap-1.5 bg-[#1C1A17] p-1 rounded-xl border border-stone-800">
            <button
              id="tab-growth-overview"
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === "overview"
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm"
                  : "text-stone-300 hover:text-stone-100 hover:bg-stone-800/50"
              }`}
            >
              <Layers className="w-4 h-4" />
              Growth Overview
            </button>
            <button
              id="tab-monthly-reflection"
              onClick={() => setActiveTab("monthly")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === "monthly"
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm"
                  : "text-stone-300 hover:text-stone-100 hover:bg-stone-800/50"
              }`}
            >
              <Calendar className="w-4 h-4" />
              Monthly Reflection
            </button>
          </div>
        </div>

        {/* AI Safety / Grounding Notice Banner */}
        <div className="bg-[#191715] border border-stone-800/80 rounded-xl p-4 flex items-start gap-3 text-xs text-stone-300">
          <Info className="w-4 h-4 text-amber-400/80 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="leading-relaxed">
              <span className="font-semibold text-stone-200">Grounded in your own voice:</span>{" "}
              Gemini analyzes only journal entries strictly authored by your authenticated account. Items marked{" "}
              <span className="inline-block px-1.5 py-0.2 text-[10px] bg-emerald-500/15 text-emerald-300 rounded border border-emerald-500/30 font-medium">From your entries</span>{" "}
              are directly drawn from your words, while{" "}
              <span className="inline-block px-1.5 py-0.2 text-[10px] bg-amber-500/15 text-amber-300 rounded border border-amber-500/30 font-medium">Inferred pattern</span>{" "}
              represent thematic reflections. Suggestions are always gentle possibilities, never authoritative mandates.
            </p>
          </div>
        </div>

        {/* TAB 1: OVERALL GROWTH DASHBOARD */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            
            {/* Action Bar / Status */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#181614] border border-stone-800 p-4 sm:p-5 rounded-2xl">
              <div>
                <h2 className="text-base font-semibold text-stone-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Continuous Growth Synthesis
                </h2>
                <p className="text-xs text-stone-300 mt-0.5">
                  {growthInsights
                    ? `Synthesized across ${growthInsights.analyzedEntriesCount} journal entries. Last updated: ${formatDateFriendly(growthInsights.generatedAt)}`
                    : entries.length > 0
                    ? `Ready to synthesize insights across your ${entries.length} journal entries.`
                    : "Write your first reflections to unlock AI-synthesized personal insights."}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {entries.length > 0 ? (
                  <button
                    id="btn-analyze-growth"
                    onClick={handleAnalyzeGrowth}
                    disabled={loadingGrowth}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingGrowth ? "animate-spin" : ""}`} />
                    {loadingGrowth ? "Analyzing Entries with Gemini..." : growthInsights ? "Re-analyze Growth" : "Synthesize Growth Insights"}
                  </button>
                ) : (
                  <button
                    onClick={onNavigateToWrite}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold shadow-md transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Write First Entry
                  </button>
                )}
              </div>
            </div>

            {/* Error Message if any */}
            {growthError && (
              <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-4 flex items-center gap-3 text-red-200 text-xs">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="flex-1">{growthError}</p>
                <button
                  onClick={handleAnalyzeGrowth}
                  className="px-2.5 py-1 bg-red-800/40 hover:bg-red-800/60 rounded text-red-100 font-medium transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading State */}
            {loadingGrowth && (
              <div className="bg-[#181614] border border-amber-500/20 rounded-2xl p-10 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto animate-pulse">
                  <Sparkles className="w-6 h-6 animate-spin" />
                </div>
                <div>
                  <h3 className="text-base font-medium text-stone-200">Gemini is reflecting upon your journal history...</h3>
                  <p className="text-xs text-stone-400 max-w-md mx-auto mt-1">
                    Extracting your accomplishments, recurring themes, decisions, and wisdom while honoring your unique voice.
                  </p>
                </div>
              </div>
            )}

            {/* Empty State: No insights generated yet */}
            {!loadingGrowth && !growthInsights && entries.length > 0 && (
              <div className="bg-[#181614] border border-stone-800 rounded-2xl p-10 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-stone-800/80 border border-stone-700 flex items-center justify-center text-amber-400 mx-auto">
                  <Compass className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto">
                  <h3 className="text-lg font-serif font-bold text-stone-200">Discover Your Inward Progress</h3>
                  <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                    You have {entries.length} reflections stored in your private, isolated journal. Let Gemini help you step back and see the milestones, lessons, and patterns you have cultivated.
                  </p>
                </div>
                <button
                  onClick={handleAnalyzeGrowth}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold shadow-md transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Personal Growth Insights
                </button>
              </div>
            )}

            {/* Empty State: No entries written yet */}
            {!loadingGrowth && entries.length === 0 && (
              <div className="bg-[#181614] border border-stone-800 rounded-2xl p-10 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-stone-800/80 border border-stone-700 flex items-center justify-center text-stone-400 mx-auto">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto">
                  <h3 className="text-lg font-serif font-bold text-stone-200">Your Journal Is Just Beginning</h3>
                  <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                    Write your first journal reflection to begin documenting your journey. As you write, this dashboard will extract your milestones, decisions, and lessons learned.
                  </p>
                </div>
                <button
                  onClick={onNavigateToWrite}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold shadow-md transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Write Your First Entry
                </button>
              </div>
            )}

            {/* Rendered Growth Insights */}
            {!loadingGrowth && growthInsights && (
              <div className="space-y-6">

                {/* 1. Recent Progress Narrative Card */}
                {growthInsights.recentProgress && (
                  <div className="bg-gradient-to-r from-amber-500/10 via-[#1C1A17] to-[#181614] border border-amber-500/30 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
                        <Compass className="w-5 h-5" />
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-300">
                            Personal Trajectory & Resilience
                          </h3>
                          <span className="text-[11px] text-stone-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Recent Rhythm
                          </span>
                        </div>
                        <p className="text-stone-200 font-serif text-base sm:text-lg leading-relaxed italic">
                          "{growthInsights.recentProgress}"
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2-Column Section Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Section A: Achievements & Personal Highlights */}
                  <div className="bg-[#181614] border border-stone-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                          <Award className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-stone-100">Achievements & Highlights</h3>
                          <p className="text-[11px] text-stone-400">Milestones and hurdles overcome</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        {growthInsights.achievements.length}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {growthInsights.achievements.length > 0 ? (
                        growthInsights.achievements.map((item, idx) => (
                          <InsightCard key={idx} item={item} defaultIcon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />} />
                        ))
                      ) : (
                        <p className="text-xs text-stone-500 italic py-2">No explicit achievements noted yet in entries.</p>
                      )}
                    </div>
                  </div>

                  {/* Section B: Active & Mentioned Goals */}
                  <div className="bg-[#181614] border border-stone-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
                          <Target className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-stone-100">Active or Mentioned Goals</h3>
                          <p className="text-[11px] text-stone-400">Intentions and ongoing aspirations</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-blue-400/80 bg-blue-500/10 px-2 py-0.5 rounded-full">
                        {growthInsights.activeGoals.length}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {growthInsights.activeGoals.length > 0 ? (
                        growthInsights.activeGoals.map((item, idx) => (
                          <InsightCard key={idx} item={item} defaultIcon={<Target className="w-4 h-4 text-blue-400" />} />
                        ))
                      ) : (
                        <p className="text-xs text-stone-500 italic py-2">No goals mentioned yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Section C: Recurring Themes & Interests */}
                  <div className="bg-[#181614] border border-stone-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
                          <Compass className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-stone-100">Recurring Themes & Interests</h3>
                          <p className="text-[11px] text-stone-400">Underlying topics across reflections</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-purple-400/80 bg-purple-500/10 px-2 py-0.5 rounded-full">
                        {growthInsights.recurringThemes.length}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {growthInsights.recurringThemes.length > 0 ? (
                        growthInsights.recurringThemes.map((item, idx) => (
                          <InsightCard key={idx} item={item} defaultIcon={<Compass className="w-4 h-4 text-purple-400" />} />
                        ))
                      ) : (
                        <p className="text-xs text-stone-500 italic py-2">Themes will emerge as you journal more.</p>
                      )}
                    </div>
                  </div>

                  {/* Section D: Important Decisions Made */}
                  <div className="bg-[#181614] border border-stone-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-stone-100">Important Decisions</h3>
                          <p className="text-[11px] text-stone-400">Choices made and resolved paths</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded-full">
                        {growthInsights.importantDecisions.length}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {growthInsights.importantDecisions.length > 0 ? (
                        growthInsights.importantDecisions.map((item, idx) => (
                          <InsightCard key={idx} item={item} defaultIcon={<CheckCircle2 className="w-4 h-4 text-amber-400" />} />
                        ))
                      ) : (
                        <p className="text-xs text-stone-500 italic py-2">No major decisions recorded yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Section E: Things I Have Learned */}
                  <div className="bg-[#181614] border border-stone-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400">
                          <Lightbulb className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-stone-100">Things You Have Learned</h3>
                          <p className="text-[11px] text-stone-400">Acquired knowledge and inner wisdom</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-teal-400/80 bg-teal-500/10 px-2 py-0.5 rounded-full">
                        {growthInsights.learnedLessons.length}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {growthInsights.learnedLessons.length > 0 ? (
                        growthInsights.learnedLessons.map((item, idx) => (
                          <InsightCard key={idx} item={item} defaultIcon={<Lightbulb className="w-4 h-4 text-teal-400" />} />
                        ))
                      ) : (
                        <p className="text-xs text-stone-500 italic py-2">Lessons will appear as you reflect deeper.</p>
                      )}
                    </div>
                  </div>

                  {/* Section F: Unresolved Questions & Thoughts */}
                  <div className="bg-[#181614] border border-stone-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400">
                          <HelpCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-stone-100">Open Questions & Contemplations</h3>
                          <p className="text-[11px] text-stone-400">Honoring the mysteries and inquiries you hold</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-rose-400/80 bg-rose-500/10 px-2 py-0.5 rounded-full">
                        {growthInsights.unresolvedQuestions.length}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {growthInsights.unresolvedQuestions.length > 0 ? (
                        growthInsights.unresolvedQuestions.map((item, idx) => (
                          <InsightCard key={idx} item={item} defaultIcon={<HelpCircle className="w-4 h-4 text-rose-400" />} />
                        ))
                      ) : (
                        <p className="text-xs text-stone-500 italic py-2">No pending inquiries recorded.</p>
                      )}
                    </div>
                  </div>

                </div>

                {/* Section G: AI-Generated Suggestions for Possible Next Steps */}
                <div className="bg-[#181614] border border-stone-800 rounded-2xl p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-800/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-stone-100">Possible Next Steps for Reflection</h3>
                        <p className="text-[11px] text-stone-400">Offered gently as creative avenues, not authoritative advice</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-stone-500 italic">
                      Invitations to explore
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {growthInsights.suggestedNextSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-[#1C1A17] border border-stone-800 hover:border-amber-500/30 transition-colors flex items-start gap-3"
                      >
                        <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="space-y-1 text-xs">
                          <p className="text-stone-200 leading-relaxed font-medium">
                            {step.text}
                          </p>
                          <span className="inline-block px-1.5 py-0.5 text-[9px] uppercase tracking-wider rounded bg-amber-500/10 text-amber-300 font-medium">
                            Possible Exploration
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* TAB 2: MONTHLY REFLECTION ("My Month in Moments") */}
        {activeTab === "monthly" && (
          <div className="space-y-8">

            {/* Month Selection Bar */}
            <div className="bg-[#181614] border border-stone-800 p-5 rounded-2xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-stone-100 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    Select a Month to Reflect Upon
                  </h2>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Gemini analyzes only the entries from the selected calendar month.
                  </p>
                </div>

                {/* Month Dropdown / Picker */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <select
                      id="select-month"
                      value={selectedMonthKey}
                      onChange={(e) => setSelectedMonthKey(e.target.value)}
                      className="bg-[#1C1A17] border border-stone-700 text-stone-100 text-xs rounded-xl px-3.5 py-2.5 pr-8 focus:outline-none focus:border-amber-500 cursor-pointer appearance-none"
                    >
                      {availableMonths.map((m) => (
                        <option key={m.key} value={m.key}>
                          {m.label} ({m.count} {m.count === 1 ? "entry" : "entries"})
                        </option>
                      ))}
                    </select>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                  </div>

                  <button
                    id="btn-generate-monthly"
                    onClick={handleGenerateMonthly}
                    disabled={loadingMonthly || selectedMonthEntries.length === 0}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingMonthly ? "animate-spin" : ""}`} />
                    {loadingMonthly
                      ? "Synthesizing Month..."
                      : currentReflection
                      ? "Regenerate Reflection"
                      : "Generate Reflection"}
                  </button>
                </div>
              </div>

              {/* Status info */}
              <div className="flex items-center justify-between text-xs text-stone-400 pt-2 border-t border-stone-800/80">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400/80" />
                  Found <span className="font-semibold text-stone-200">{selectedMonthEntries.length}</span> entries for {currentMonthLabel}
                </span>

                {currentReflection && (
                  <span className="text-[11px] text-stone-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Saved on {formatDateFriendly(currentReflection.generatedAt)}
                  </span>
                )}
              </div>
            </div>

            {/* Error Message */}
            {monthlyError && (
              <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-4 flex items-center gap-3 text-red-200 text-xs">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="flex-1">{monthlyError}</p>
                <button
                  onClick={handleGenerateMonthly}
                  className="px-2.5 py-1 bg-red-800/40 hover:bg-red-800/60 rounded text-red-100 font-medium transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading Monthly */}
            {loadingMonthly && (
              <div className="bg-[#181614] border border-amber-500/20 rounded-2xl p-10 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto animate-pulse">
                  <Sparkles className="w-6 h-6 animate-spin" />
                </div>
                <div>
                  <h3 className="text-base font-medium text-stone-200">
                    Curating your Month in Moments for {currentMonthLabel}...
                  </h3>
                  <p className="text-xs text-stone-400 max-w-md mx-auto mt-1">
                    Analyzing accomplishments, challenges, memorable milestones, and takeaways from your journal entries.
                  </p>
                </div>
              </div>
            )}

            {/* Empty state when 0 entries exist for this month */}
            {!loadingMonthly && selectedMonthEntries.length === 0 && (
              <div className="bg-[#181614] border border-stone-800 rounded-2xl p-10 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-stone-800/80 border border-stone-700 flex items-center justify-center text-stone-400 mx-auto">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto">
                  <h3 className="text-base font-serif font-bold text-stone-200">
                    No Entries Found for {currentMonthLabel}
                  </h3>
                  <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                    You haven't logged any reflections during this month yet. Select a different month above or write a new reflection today.
                  </p>
                </div>
                <button
                  onClick={onNavigateToWrite}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold shadow-md transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Write an Entry for This Month
                </button>
              </div>
            )}

            {/* State when entries exist but user hasn't clicked generate yet */}
            {!loadingMonthly && !currentReflection && selectedMonthEntries.length > 0 && (
              <div className="bg-[#181614] border border-stone-800 rounded-2xl p-10 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto">
                  <h3 className="text-lg font-serif font-bold text-stone-200">
                    Ready to Generate Reflection for {currentMonthLabel}
                  </h3>
                  <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                    We found {selectedMonthEntries.length} {selectedMonthEntries.length === 1 ? "entry" : "entries"} from {currentMonthLabel}. Click below to distill your highlights, challenges, and memorable moments.
                  </p>
                </div>
                <button
                  onClick={handleGenerateMonthly}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold shadow-md transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate {currentMonthLabel} Reflection
                </button>
              </div>
            )}

            {/* Rendered Monthly Reflection: "My Month in Moments" */}
            {!loadingMonthly && currentReflection && (
              <div className="space-y-6">
                {/* View Mode Switcher Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#181614] border border-stone-800 p-3.5 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-400 font-medium">View Format:</span>
                    <div className="flex items-center p-1 rounded-xl bg-stone-900 border border-stone-800 text-xs">
                      <button
                        onClick={() => setMonthlyViewMode("story")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                          monthlyViewMode === "story"
                            ? "bg-amber-500 text-stone-950 font-semibold shadow-xs"
                            : "text-stone-400 hover:text-stone-200"
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Story / Reel View</span>
                      </button>

                      <button
                        onClick={() => setMonthlyViewMode("report")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                          monthlyViewMode === "report"
                            ? "bg-amber-500 text-stone-950 font-semibold shadow-xs"
                            : "text-stone-400 hover:text-stone-200"
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Detailed Report</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[11px] text-stone-500 hidden md:inline-block">
                      Saved in your private history
                    </span>
                    <button
                      onClick={handleGenerateMonthly}
                      disabled={loadingMonthly}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-300 text-xs font-medium border border-stone-800 transition cursor-pointer disabled:opacity-50"
                      title="Regenerate this month's recap with Gemini"
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingMonthly ? "animate-spin text-amber-400" : ""}`} />
                      <span>Regenerate</span>
                    </button>
                  </div>
                </div>

                {/* 1. Visual Story / Reel View */}
                {monthlyViewMode === "story" ? (
                  <MonthlyStoryReel
                    reflection={currentReflection}
                    onRegenerate={handleGenerateMonthly}
                    isRegenerating={loadingMonthly}
                    onSwitchToReportView={() => setMonthlyViewMode("report")}
                    onShareToInspiration={() => setShowPublishModal(true)}
                    isSharedToInspiration={publicStories.some((s) => s.sourceOriginalId === currentReflection.id)}
                  />
                ) : (
                  /* 2. Detailed Report View */
                  <div className="space-y-6">
                    {/* Hero Card for the Month */}
                    <div className="bg-gradient-to-br from-[#201D19] via-[#1A1815] to-[#141210] border border-amber-500/35 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                      <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                      
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-800/80 pb-5">
                        <div>
                          <span className="text-[11px] uppercase tracking-widest font-semibold text-amber-400 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> My Month in Moments • Detailed Report
                          </span>
                          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100 tracking-tight mt-1">
                            {currentReflection.monthTitle || currentReflection.monthLabel}
                          </h2>
                          <p className="text-xs text-stone-400 font-sans mt-0.5">
                            {currentReflection.monthLabel}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowPublishModal(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-300 text-xs font-medium border border-stone-800 transition cursor-pointer"
                            title="Share sanitized summary of this month's growth to Inspiration Space"
                          >
                            <Globe className="w-3.5 h-3.5 text-amber-400" />
                            <span>
                              {publicStories.some((s) => s.sourceOriginalId === currentReflection.id)
                                ? "Shared to Inspiration"
                                : "Share Publicly"}
                            </span>
                          </button>

                          <button
                            onClick={() => setMonthlyViewMode("story")}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold shadow-md transition cursor-pointer"
                          >
                            <Film className="w-3.5 h-3.5" />
                            <span>Watch Story / Reel</span>
                          </button>
                        </div>
                      </div>

                      {/* Opening Narrative */}
                      {currentReflection.openingNarrative && (
                        <div className="pt-5 border-b border-stone-800/60 pb-4">
                          <p className="text-stone-300 font-serif text-base sm:text-lg italic leading-relaxed">
                            "{currentReflection.openingNarrative}"
                          </p>
                        </div>
                      )}

                      {/* Summary Metrics & Vibe */}
                      <div className="pt-4 flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900/90 border border-stone-800 text-xs text-stone-300">
                          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                          <span>{currentReflection.entryCount} Reflections</span>
                        </div>

                        {currentReflection.photoMemories && currentReflection.photoMemories.length > 0 && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900/90 border border-stone-800 text-xs text-stone-300">
                            <Camera className="w-3.5 h-3.5 text-amber-400" />
                            <span>{currentReflection.photoMemories.length} Photo Memories</span>
                          </div>
                        )}

                        {currentReflection.monthAtAGlance?.dominantVibe && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300">
                            <Smile className="w-3.5 h-3.5 text-amber-400" />
                            <span>Vibe: {currentReflection.monthAtAGlance.dominantVibe}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Month at a Glance Overview */}
                    {currentReflection.monthAtAGlance?.overview && (
                      <div className="bg-[#181614] border border-stone-800 rounded-2xl p-5 sm:p-6 space-y-2">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> Month at a Glance
                        </h3>
                        <p className="text-sm text-stone-200 font-serif leading-relaxed">
                          {currentReflection.monthAtAGlance.overview}
                        </p>
                      </div>
                    )}

                    {/* Shareable Caption Card */}
                    {currentReflection.shareableCaption && (
                      <div className="bg-[#181614] border border-stone-800 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                              <Share2 className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-stone-100">Shareable Caption</h3>
                              <p className="text-[11px] text-stone-400">A concise, poetic summary of your month</p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleCopyReportCaption(currentReflection.shareableCaption || "")}
                            className="inline-flex items-center gap-1.5 text-xs text-stone-200 hover:text-amber-300 bg-stone-900 hover:bg-stone-800 border border-stone-750 px-3 py-1.5 rounded-xl transition cursor-pointer"
                          >
                            {copiedReportCaption ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400 font-medium">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Share2 className="w-3.5 h-3.5 text-amber-400" />
                                <span>Copy Caption</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="p-4 rounded-xl bg-[#141210] border border-stone-800/90 font-serif italic text-xs sm:text-sm text-stone-200 leading-relaxed">
                          "{currentReflection.shareableCaption}"
                        </div>
                        <p className="text-[10px] text-stone-500">
                          Recaps remain strictly private to your account. You can safely copy this snippet for personal notes or sharing.
                        </p>
                      </div>
                    )}

                    {/* Attached Photo Memories Gallery (if any) */}
                    {currentReflection.photoMemories && currentReflection.photoMemories.length > 0 && (
                      <div className="bg-[#181614] border border-stone-800 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center gap-2 border-b border-stone-800/80 pb-2.5">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                            <Camera className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-stone-100">Moments in Photos</h3>
                            <p className="text-[11px] text-stone-400">Genuine photo memories attached to this month's reflections</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {currentReflection.photoMemories.map((photo) => (
                            <div
                              key={photo.id}
                              onClick={() => setSelectedReportPhoto(photo)}
                              className="group relative rounded-xl overflow-hidden border border-stone-800 bg-stone-950 cursor-pointer shadow-sm hover:border-amber-500/50 transition duration-200"
                            >
                              <img
                                src={photo.dataUrl}
                                alt={photo.caption || photo.name}
                                className="h-32 w-full object-cover group-hover:scale-105 transition duration-300"
                              />
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2 pt-4">
                                {photo.caption ? (
                                  <p className="text-[11px] text-stone-200 italic line-clamp-1">
                                    "{photo.caption}"
                                  </p>
                                ) : (
                                  <p className="text-[10px] text-stone-400 truncate">
                                    {photo.name}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Structured Sections Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      {/* 1. What I Accomplished */}
                      <div className="bg-[#181614] border border-stone-800 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center gap-2 border-b border-stone-800/80 pb-2.5">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                            <Award className="w-4 h-4" />
                          </div>
                          <h3 className="text-sm font-semibold text-stone-100">What I Accomplished</h3>
                        </div>
                        <div className="space-y-2">
                          {currentReflection.accomplishments.length > 0 ? (
                            currentReflection.accomplishments.map((item, i) => (
                              <InsightCard key={i} item={item} defaultIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />} />
                            ))
                          ) : (
                            <p className="text-xs text-stone-500 italic">No specific accomplishments recorded.</p>
                          )}
                        </div>
                      </div>

                      {/* 2. Things I Was Proud Of */}
                      {currentReflection.thingsProudOf && currentReflection.thingsProudOf.length > 0 && (
                        <div className="bg-[#181614] border border-stone-800 rounded-2xl p-5 space-y-3">
                          <div className="flex items-center gap-2 border-b border-stone-800/80 pb-2.5">
                            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400">
                              <Heart className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-semibold text-stone-100">Things I Was Proud Of</h3>
                          </div>
                          <div className="space-y-2">
                            {currentReflection.thingsProudOf.map((item, i) => (
                              <InsightCard key={i} item={item} defaultIcon={<Heart className="w-3.5 h-3.5 text-rose-400" />} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3. Moments Worth Remembering */}
                      <div className="bg-[#181614] border border-stone-800 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center gap-2 border-b border-stone-800/80 pb-2.5">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <h3 className="text-sm font-semibold text-stone-100">Moments Worth Remembering</h3>
                        </div>
                        <div className="space-y-2">
                          {currentReflection.memorableMoments.length > 0 ? (
                            currentReflection.memorableMoments.map((item, i) => (
                              <InsightCard key={i} item={item} defaultIcon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />} />
                            ))
                          ) : (
                            <p className="text-xs text-stone-500 italic">No specific moments highlighted.</p>
                          )}
                        </div>
                      </div>

                      {/* 4. What Challenged Me */}
                      <div className="bg-[#181614] border border-stone-800 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center gap-2 border-b border-stone-800/80 pb-2.5">
                          <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-400">
                            <Mountain className="w-4 h-4" />
                          </div>
                          <h3 className="text-sm font-semibold text-stone-100">What Challenged Me</h3>
                        </div>
                        <div className="space-y-2">
                          {currentReflection.challenges.length > 0 ? (
                            currentReflection.challenges.map((item, i) => (
                              <InsightCard key={i} item={item} defaultIcon={<Mountain className="w-3.5 h-3.5 text-orange-400" />} />
                            ))
                          ) : (
                            <p className="text-xs text-stone-500 italic">No hurdles noted this month.</p>
                          )}
                        </div>
                      </div>

                      {/* 5. What I Learned */}
                      <div className="bg-[#181614] border border-stone-800 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center gap-2 border-b border-stone-800/80 pb-2.5">
                          <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400">
                            <Lightbulb className="w-4 h-4" />
                          </div>
                          <h3 className="text-sm font-semibold text-stone-100">What I Learned</h3>
                        </div>
                        <div className="space-y-2">
                          {currentReflection.learnings.length > 0 ? (
                            currentReflection.learnings.map((item, i) => (
                              <InsightCard key={i} item={item} defaultIcon={<Lightbulb className="w-3.5 h-3.5 text-teal-400" />} />
                            ))
                          ) : (
                            <p className="text-xs text-stone-500 italic">No specific lessons logged.</p>
                          )}
                        </div>
                      </div>

                      {/* 6. Goals I Worked Toward */}
                      <div className="bg-[#181614] border border-stone-800 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center gap-2 border-b border-stone-800/80 pb-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
                            <Target className="w-4 h-4" />
                          </div>
                          <h3 className="text-sm font-semibold text-stone-100">Goals I Worked Toward</h3>
                        </div>
                        <div className="space-y-2">
                          {currentReflection.goalsMentioned.length > 0 ? (
                            currentReflection.goalsMentioned.map((item, i) => (
                              <InsightCard key={i} item={item} defaultIcon={<Target className="w-3.5 h-3.5 text-blue-400" />} />
                            ))
                          ) : (
                            <p className="text-xs text-stone-500 italic">No specific goals mentioned in this period.</p>
                          )}
                        </div>
                      </div>

                      {/* 7. Recurring Themes */}
                      {currentReflection.recurringThemes && currentReflection.recurringThemes.length > 0 && (
                        <div className="bg-[#181614] border border-stone-800 rounded-2xl p-5 space-y-3">
                          <div className="flex items-center gap-2 border-b border-stone-800/80 pb-2.5">
                            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                              <Layers className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-semibold text-stone-100">Recurring Themes</h3>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {currentReflection.recurringThemes.map((item, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1A17] border border-stone-750 text-xs text-stone-200 font-medium"
                              >
                                <Layers className="w-3 h-3 text-amber-400" />
                                <span>{item.text}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 8. What Mattered to Me */}
                      {currentReflection.whatMattered && currentReflection.whatMattered.length > 0 && (
                        <div className="bg-[#181614] border border-stone-800 rounded-2xl p-5 space-y-3">
                          <div className="flex items-center gap-2 border-b border-stone-800/80 pb-2.5">
                            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400">
                              <Heart className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-semibold text-stone-100">What Mattered to Me</h3>
                          </div>
                          <div className="space-y-2">
                            {currentReflection.whatMattered.map((item, i) => (
                              <InsightCard key={i} item={item} defaultIcon={<Heart className="w-3.5 h-3.5 text-rose-400" />} />
                            ))}
                          </div>
                        </div>
                      )}

                    </div>

                    {/* What Changed From Beginning to End */}
                    {currentReflection.whatChanged && (
                      <div className="bg-[#181614] border border-stone-800 rounded-2xl p-5 sm:p-6 space-y-2">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5" /> What Changed From Beginning to End
                        </h3>
                        <p className="text-sm text-stone-200 font-serif leading-relaxed">
                          {currentReflection.whatChanged}
                        </p>
                      </div>
                    )}

                    {/* Possible Focus for Next Month */}
                    <div className="bg-[#181614] border border-stone-800 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center gap-2 border-b border-stone-800/80 pb-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                          <ArrowUpRight className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-stone-100">A Gentle Focus for Next Month</h3>
                          <p className="text-[11px] text-stone-400">Gentle creative possibilities to carry forward with intention</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {currentReflection.nextMonthFocus.map((item, i) => (
                          <div key={i} className="p-3.5 rounded-xl bg-[#1C1A17] border border-stone-800 flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-indigo-500/15 text-indigo-300 flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <p className="text-xs text-stone-200 leading-relaxed font-medium">
                              {item.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Closing Reflection */}
                    {(currentReflection.closingReflection || currentReflection.motivationalNote) && (
                      <div className="bg-gradient-to-r from-stone-900 via-stone-900 to-[#1C1916] border border-stone-800 rounded-2xl p-6 text-center space-y-2">
                        <h4 className="text-xs uppercase tracking-wider text-amber-400 font-semibold">
                          Closing Reflection
                        </h4>
                        <p className="text-stone-300 font-serif text-base italic max-w-xl mx-auto leading-relaxed">
                          "{currentReflection.closingReflection || currentReflection.motivationalNote}"
                        </p>
                      </div>
                    )}

                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </div>

      {/* Publish Success Notice Banner */}
      {publishSuccessMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-emerald-950/95 border border-emerald-700/60 rounded-xl px-5 py-3 shadow-2xl flex items-center gap-3 text-xs text-emerald-200 backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{publishSuccessMsg}</span>
          {onNavigateToInspiration && (
            <button
              onClick={onNavigateToInspiration}
              className="font-bold underline hover:text-emerald-100 ml-2 cursor-pointer"
            >
              Open Inspiration Space →
            </button>
          )}
        </div>
      )}

      {/* Photo Viewer Modal for Report View */}
      <PhotoViewerModal
        image={selectedReportPhoto}
        onClose={() => setSelectedReportPhoto(null)}
      />

      {/* Inspiration Space Publish Confirmation Modal */}
      {showPublishModal && currentReflection && (
        <PublishConfirmationModal
          isOpen={showPublishModal}
          onClose={() => setShowPublishModal(false)}
          onConfirmPublish={handleConfirmPublish}
          initialTitle={currentReflection.monthTitle || `${currentReflection.monthLabel} Highlights`}
          initialContent={currentReflection.openingNarrative || currentReflection.closingReflection || currentReflection.monthAtAGlance?.overview || ""}
          initialCategory={`${currentReflection.monthLabel} Recap`}
          initialHighlights={currentReflection.accomplishments?.map((a) => a.text) || []}
          initialPhotos={currentReflection.photoMemories || []}
          sourceType="monthly_recap"
          sourceOriginalId={currentReflection.id}
          currentUser={user}
        />
      )}
    </div>
  );
};

// Reusable Insight Card showing explicit vs inferred source tag
function InsightCard({ item, defaultIcon }: { item: InsightItem; defaultIcon: React.ReactNode }) {
  const isExplicit = item.sourceType === "explicit";

  return (
    <div className="p-3 rounded-xl bg-[#1C1A17] border border-stone-800/90 hover:border-stone-700 transition-colors flex items-start justify-between gap-3">
      <div className="flex items-start gap-2.5 flex-1 min-w-0">
        <span className="shrink-0 mt-0.5">{defaultIcon}</span>
        <div className="space-y-1 min-w-0">
          <p className="text-xs text-stone-200 leading-relaxed font-medium">
            {item.text}
          </p>
          {item.context && (
            <p className="text-[11px] text-stone-500 italic">
              {item.context}
            </p>
          )}
        </div>
      </div>

      <div className="shrink-0">
        {isExplicit ? (
          <span
            title="Explicitly recorded in your journal"
            className="inline-block px-1.5 py-0.5 text-[9px] font-medium tracking-wide rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 whitespace-nowrap"
          >
            From entry
          </span>
        ) : (
          <span
            title="Pattern or theme inferred by Gemini"
            className="inline-block px-1.5 py-0.5 text-[9px] font-medium tracking-wide rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 whitespace-nowrap"
          >
            Inferred
          </span>
        )}
      </div>
    </div>
  );
}
