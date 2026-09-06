import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Sparkles,
  Award,
  Target,
  Lightbulb,
  Heart,
  Mountain,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Share2,
  Check,
  Camera,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Smile,
  Maximize2,
  Minimize2,
  BookOpen,
  Mic,
  Clock,
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { MonthlyReflection, AttachedImage, InsightItem } from "../types";
import { PhotoViewerModal } from "./PhotoViewerModal";

interface MonthlyStoryReelProps {
  reflection: MonthlyReflection;
  onRegenerate: () => void;
  isRegenerating?: boolean;
  onClose?: () => void;
  onSwitchToReportView?: () => void;
  onShareToInspiration?: () => void;
  isSharedToInspiration?: boolean;
}

interface SlideDefinition {
  id: string;
  title: string;
  categoryTag: string;
  render: () => React.ReactNode;
}

export const MonthlyStoryReel: React.FC<MonthlyStoryReelProps> = ({
  reflection,
  onRegenerate,
  isRegenerating = false,
  onClose,
  onSwitchToReportView,
  onShareToInspiration,
  isSharedToInspiration = false,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100 for active slide
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<AttachedImage | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Photos available for this month
  const photos = reflection.photoMemories || [];
  const hasPhotos = photos.length > 0;

  // Build slides array dynamically based on available content
  const slides: SlideDefinition[] = [
    // 1. Cover Slide
    {
      id: "cover",
      title: "Title & Opening",
      categoryTag: "Opening Story",
      render: () => (
        <div className="flex flex-col items-center justify-center text-center px-4 sm:px-8 py-8 h-full space-y-6 max-w-2xl mx-auto">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>My Month in Moments</span>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="space-y-2"
          >
            <span className="text-xs uppercase tracking-widest text-stone-400 font-sans">
              {reflection.monthLabel}
            </span>
            <h1 className="text-3xl sm:text-5xl font-serif font-bold text-stone-100 tracking-tight leading-tight">
              {reflection.monthTitle || `Reflections of ${reflection.monthLabel}`}
            </h1>
          </motion.div>

          {reflection.openingNarrative && (
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-stone-300 font-serif text-base sm:text-lg leading-relaxed italic max-w-xl"
            >
              "{reflection.openingNarrative}"
            </motion.p>
          )}

          {/* Quick Stats Pill */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-3 pt-2"
          >
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900/90 border border-stone-800 text-xs text-stone-300">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>{reflection.entryCount} Reflections</span>
            </div>

            {hasPhotos && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900/90 border border-stone-800 text-xs text-stone-300">
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>{photos.length} Photo {photos.length === 1 ? "Memory" : "Memories"}</span>
              </div>
            )}

            {reflection.monthAtAGlance?.dominantVibe && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300">
                <Smile className="w-3.5 h-3.5 text-amber-400" />
                <span>{reflection.monthAtAGlance.dominantVibe}</span>
              </div>
            )}
          </motion.div>
        </div>
      ),
    },

    // 2. Month at a Glance
    {
      id: "glance",
      title: "Month at a Glance",
      categoryTag: "Overview & Vibe",
      render: () => (
        <div className="flex flex-col justify-center px-4 sm:px-8 py-6 h-full space-y-6 max-w-3xl mx-auto">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-400 flex items-center justify-center sm:justify-start gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> My Month at a Glance
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100">
              The Journey of {reflection.monthLabel}
            </h2>
          </div>

          {reflection.monthAtAGlance?.overview ? (
            <div className="p-5 sm:p-6 rounded-2xl bg-stone-900/70 border border-stone-800/80 backdrop-blur-xs space-y-3">
              <p className="text-sm sm:text-base text-stone-200 leading-relaxed font-serif">
                {reflection.monthAtAGlance.overview}
              </p>
              {reflection.monthAtAGlance.dominantVibe && (
                <div className="pt-2 border-t border-stone-800 flex items-center gap-2">
                  <span className="text-xs text-stone-400">Dominant Tone:</span>
                  <span className="text-xs font-medium text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                    {reflection.monthAtAGlance.dominantVibe}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 sm:p-6 rounded-2xl bg-stone-900/70 border border-stone-800/80 text-sm text-stone-300 font-serif">
              A period of dedicated inward reflection, noticing milestones, and recording the steps that shaped your month.
            </div>
          )}

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-stone-900/90 border border-stone-800 text-center space-y-1">
              <span className="text-2xl font-serif font-bold text-amber-400">{reflection.entryCount}</span>
              <p className="text-[11px] text-stone-400">Total Entries</p>
            </div>
            <div className="p-3.5 rounded-xl bg-stone-900/90 border border-stone-800 text-center space-y-1">
              <span className="text-2xl font-serif font-bold text-emerald-400">
                {reflection.accomplishments.length}
              </span>
              <p className="text-[11px] text-stone-400">Wins Celebrated</p>
            </div>
            <div className="p-3.5 rounded-xl bg-stone-900/90 border border-stone-800 text-center space-y-1 col-span-2 sm:col-span-1">
              <span className="text-2xl font-serif font-bold text-teal-400">
                {reflection.learnings.length}
              </span>
              <p className="text-[11px] text-stone-400">Lessons Learned</p>
            </div>
          </div>
        </div>
      ),
    },

    // 3. Accomplishments & Pride
    {
      id: "accomplishments",
      title: "Accomplishments",
      categoryTag: "Wins & Pride",
      render: () => (
        <div className="flex flex-col justify-center px-4 sm:px-8 py-6 h-full space-y-5 max-w-3xl mx-auto">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400 flex items-center justify-center sm:justify-start gap-1.5">
              <Award className="w-3.5 h-3.5" /> What I Accomplished
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100">
              Steps Forward & What I Was Proud Of
            </h2>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[50vh] pr-1">
            {reflection.accomplishments.slice(0, 3).map((item, idx) => (
              <motion.div
                key={`acc-${idx}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 hover:border-emerald-500/30 transition flex items-start gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
                  ✓
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-200 leading-snug">{item.text}</p>
                  {item.context && <p className="text-xs text-stone-400 italic">{item.context}</p>}
                </div>
                <SourceBadge type={item.sourceType} />
              </motion.div>
            ))}

            {reflection.thingsProudOf && reflection.thingsProudOf.length > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-300 mb-2 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400" /> Moments of Quiet Pride
                </h4>
                {reflection.thingsProudOf.slice(0, 2).map((item, idx) => (
                  <div
                    key={`proud-${idx}`}
                    className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 mb-2 flex items-start justify-between gap-3"
                  >
                    <p className="text-xs text-stone-200 leading-relaxed font-medium">"{item.text}"</p>
                    <SourceBadge type={item.sourceType} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ),
    },

    // 4. Attached Photo Memories (Conditional: Only shown if photos exist)
    ...(hasPhotos
      ? [
          {
            id: "photos",
            title: "Photo Memories",
            categoryTag: "Visual Memories",
            render: () => (
              <div className="flex flex-col justify-center px-4 sm:px-8 py-6 h-full space-y-4 max-w-3xl mx-auto">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-400 flex items-center justify-center sm:justify-start gap-1.5">
                    <Camera className="w-3.5 h-3.5" /> Moments Captured in Photos
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100">
                    Glimpses from Your Month
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto max-h-[52vh] p-1">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => setSelectedPhoto(photo)}
                      className="group relative rounded-xl overflow-hidden border border-stone-750 bg-stone-950 cursor-pointer shadow-md hover:border-amber-500/60 transition duration-200"
                    >
                      <img
                        src={photo.dataUrl}
                        alt={photo.caption || photo.name}
                        className="h-40 w-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2.5 pt-6 text-left">
                        {photo.caption ? (
                          <p className="text-xs text-stone-100 font-serif italic line-clamp-2">
                            "{photo.caption}"
                          </p>
                        ) : (
                          <p className="text-xs text-stone-300 truncate font-sans">
                            {photo.name}
                          </p>
                        )}
                        <span className="text-[10px] text-amber-400/80 block mt-1">Tap to enlarge</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ),
          },
        ]
      : []),

    // 5. Moments Worth Remembering
    {
      id: "memories",
      title: "Memorable Moments",
      categoryTag: "Milestones & Joys",
      render: () => (
        <div className="flex flex-col justify-center px-4 sm:px-8 py-6 h-full space-y-5 max-w-3xl mx-auto">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-400 flex items-center justify-center sm:justify-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Moments Worth Remembering
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100">
              Small Joys & Meaningful Milestones
            </h2>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[50vh] pr-1">
            {reflection.memorableMoments.map((item, idx) => (
              <motion.div
                key={`mem-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 hover:border-amber-500/30 transition flex items-start gap-3"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-200 leading-snug">{item.text}</p>
                  {item.context && <p className="text-xs text-stone-400 italic">{item.context}</p>}
                </div>
                <SourceBadge type={item.sourceType} />
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },

    // 6. Challenges & Resilience
    {
      id: "challenges",
      title: "What Challenged Me",
      categoryTag: "Hurdles & Resilience",
      render: () => (
        <div className="flex flex-col justify-center px-4 sm:px-8 py-6 h-full space-y-5 max-w-3xl mx-auto">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-orange-400 flex items-center justify-center sm:justify-start gap-1.5">
              <Mountain className="w-3.5 h-3.5" /> What Challenged Me
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100">
              Hurdles Faced with Resilience
            </h2>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[50vh] pr-1">
            {reflection.challenges.map((item, idx) => (
              <motion.div
                key={`chal-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 hover:border-orange-500/30 transition flex items-start gap-3"
              >
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
                  <Mountain className="w-4 h-4" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-200 leading-snug">{item.text}</p>
                  {item.context && <p className="text-xs text-stone-400 italic">{item.context}</p>}
                </div>
                <SourceBadge type={item.sourceType} />
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },

    // 7. What I Learned
    {
      id: "learnings",
      title: "What I Learned",
      categoryTag: "Insight & Wisdom",
      render: () => (
        <div className="flex flex-col justify-center px-4 sm:px-8 py-6 h-full space-y-5 max-w-3xl mx-auto">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-teal-400 flex items-center justify-center sm:justify-start gap-1.5">
              <Lightbulb className="w-3.5 h-3.5" /> What I Learned
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100">
              Wisdom & Realizations Discovered
            </h2>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[50vh] pr-1">
            {reflection.learnings.map((item, idx) => (
              <motion.div
                key={`learn-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 hover:border-teal-500/30 transition flex items-start gap-3"
              >
                <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-200 leading-snug">{item.text}</p>
                  {item.context && <p className="text-xs text-stone-400 italic">{item.context}</p>}
                </div>
                <SourceBadge type={item.sourceType} />
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },

    // 8. Goals & Recurring Themes
    {
      id: "goals",
      title: "Goals & Themes",
      categoryTag: "Aspirations & Rhythms",
      render: () => (
        <div className="flex flex-col justify-center px-4 sm:px-8 py-6 h-full space-y-5 max-w-3xl mx-auto">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-blue-400 flex items-center justify-center sm:justify-start gap-1.5">
              <Target className="w-3.5 h-3.5" /> Goals & Recurring Themes
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100">
              Where Your Energy Gravitated
            </h2>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[50vh] pr-1">
            {reflection.goalsMentioned.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Goals Worked Toward
                </h4>
                {reflection.goalsMentioned.map((item, idx) => (
                  <div
                    key={`goal-${idx}`}
                    className="p-3.5 rounded-xl bg-stone-900/80 border border-stone-800 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <Target className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="text-xs text-stone-200 font-medium">{item.text}</span>
                    </div>
                    <SourceBadge type={item.sourceType} />
                  </div>
                ))}
              </div>
            )}

            {reflection.recurringThemes && reflection.recurringThemes.length > 0 && (
              <div className="space-y-2 pt-1">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Recurring Themes & Values
                </h4>
                <div className="flex flex-wrap gap-2">
                  {reflection.recurringThemes.map((item, idx) => (
                    <span
                      key={`theme-${idx}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-750 text-xs text-stone-200 font-medium"
                    >
                      <Layers className="w-3 h-3 text-amber-400" />
                      <span>{item.text}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ),
    },

    // 9. What Changed From Beginning to End
    {
      id: "evolution",
      title: "What Changed",
      categoryTag: "Personal Evolution",
      render: () => (
        <div className="flex flex-col justify-center px-4 sm:px-8 py-6 h-full space-y-6 max-w-2xl mx-auto text-center">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-indigo-400 flex items-center justify-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> What Changed From Beginning to End
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100">
              The Evolution of Your Month
            </h2>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-stone-900/90 to-stone-950 border border-stone-800 space-y-4 shadow-xl">
            <p className="text-base sm:text-lg text-stone-200 leading-relaxed font-serif">
              {reflection.whatChanged ||
                "Throughout the month, a shift occurred toward greater clarity and self-trust, navigating challenges with intention and honoring what matters most."}
            </p>
          </div>
        </div>
      ),
    },

    // 10. A Gentle Focus for Next Month
    {
      id: "nextFocus",
      title: "Next Month Focus",
      categoryTag: "Looking Forward",
      render: () => (
        <div className="flex flex-col justify-center px-4 sm:px-8 py-6 h-full space-y-5 max-w-3xl mx-auto">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-indigo-400 flex items-center justify-center sm:justify-start gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> A Gentle Focus for Next Month
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100">
              Invitations to Carry Forward
            </h2>
            <p className="text-xs text-stone-400">Gentle creative avenues, not mandatory commands</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[50vh] pr-1">
            {reflection.nextMonthFocus.map((item, idx) => (
              <motion.div
                key={`focus-${idx}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 flex items-start gap-3"
              >
                <span className="w-5 h-5 rounded-full bg-indigo-500/15 text-indigo-300 flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-xs text-stone-200 leading-relaxed font-medium">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },

    // 11. Closing Reflection & Shareable Caption
    {
      id: "closing",
      title: "Closing & Share",
      categoryTag: "Closing Reflection",
      render: () => (
        <div className="flex flex-col justify-center px-4 sm:px-8 py-6 h-full space-y-6 max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto"
          >
            <Sparkles className="w-6 h-6" />
          </motion.div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100">
              Honoring Your Journey
            </h2>
            <p className="text-stone-300 font-serif text-base sm:text-lg italic leading-relaxed max-w-lg mx-auto">
              "{reflection.closingReflection || reflection.motivationalNote || "Every reflection recorded this month was an act of honoring yourself and noticing the steps that matter."}"
            </p>
          </div>

          {/* Shareable Caption Card */}
          {reflection.shareableCaption && (
            <div className="p-4 sm:p-5 rounded-2xl bg-stone-900/90 border border-stone-800 text-left space-y-2 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5" /> Shareable Caption
                </span>
                <button
                  onClick={handleCopyCaption}
                  className="inline-flex items-center gap-1 text-[11px] text-stone-300 hover:text-amber-300 bg-stone-800 hover:bg-stone-750 px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  {copiedCaption ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3 h-3" />
                      <span>Copy Caption</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-stone-200 font-serif italic leading-relaxed">
                "{reflection.shareableCaption}"
              </p>
              <p className="text-[10px] text-stone-500">
                Private by default. Copy whenever you want to keep or share a personal note.
              </p>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setCurrentSlideIndex(0);
                setProgress(0);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-stone-100 text-xs font-medium border border-stone-800 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Replay Story</span>
            </button>

            {onShareToInspiration && (
              <button
                onClick={onShareToInspiration}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold shadow-md transition cursor-pointer"
                title="Share sanitized summary of this month's growth to Inspiration Space"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{isSharedToInspiration ? "Manage in Inspiration Space" : "Share to Inspiration Space"}</span>
              </button>
            )}

            {onSwitchToReportView && (
              <button
                onClick={onSwitchToReportView}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold border border-amber-500/30 transition cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>View Full Deep Report</span>
              </button>
            )}
          </div>
        </div>
      ),
    },
  ];

  const totalSlides = slides.length;

  // Handle slide advance
  const handleNext = useCallback(() => {
    if (currentSlideIndex < totalSlides - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      setIsPlaying(false);
    }
  }, [currentSlideIndex, totalSlides]);

  const handlePrev = useCallback(() => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
      setProgress(0);
    }
  }, [currentSlideIndex]);

  // Handle auto-advance playback
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = 70; // 70ms step
    const totalDuration = 7000; // 7 seconds per slide
    const increment = (intervalTime / totalDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, handleNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev]);

  // Copy shareable caption to clipboard
  const handleCopyCaption = async () => {
    if (!reflection.shareableCaption) return;
    try {
      await navigator.clipboard.writeText(reflection.shareableCaption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2500);
    } catch {
      // fallback
    }
  };

  const currentSlide = slides[currentSlideIndex];

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#181614] via-[#151311] to-[#100E0D] border border-stone-800 shadow-2xl flex flex-col transition-all duration-300 ${
        isFullScreen ? "fixed inset-0 z-50 rounded-none border-none" : "min-h-[580px] sm:min-h-[640px]"
      }`}
    >
      {/* Top Header Controls & Story Progress Bars */}
      <div className="relative z-20 px-4 sm:px-6 pt-4 pb-3 border-b border-stone-800/80 bg-[#161412]/80 backdrop-blur-md space-y-3">
        {/* Progress Segments */}
        <div className="flex items-center gap-1.5 w-full">
          {slides.map((s, idx) => {
            let fillPercent = 0;
            if (idx < currentSlideIndex) fillPercent = 100;
            else if (idx === currentSlideIndex) fillPercent = progress;

            return (
              <button
                key={s.id}
                onClick={() => {
                  setCurrentSlideIndex(idx);
                  setProgress(0);
                }}
                className="flex-1 h-1.5 rounded-full bg-stone-800/90 overflow-hidden cursor-pointer group relative transition-all"
                title={`${idx + 1}. ${s.title}`}
              >
                <div
                  className="h-full bg-amber-400 transition-all duration-75 ease-linear"
                  style={{ width: `${fillPercent}%` }}
                />
              </button>
            );
          })}
        </div>

        {/* Story Metadata & Controls Bar */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-serif font-semibold text-stone-200">
              {reflection.monthLabel}
            </span>
            <span className="text-stone-500">•</span>
            <span className="text-stone-400 font-medium text-[11px]">
              Slide {currentSlideIndex + 1} of {totalSlides}
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-stone-800/80 text-[10px] text-amber-300/90 border border-stone-750 font-medium">
              {currentSlide.categoryTag}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Play / Pause Toggle */}
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-stone-100 border border-stone-800 transition cursor-pointer"
              title={isPlaying ? "Pause auto-advance (Space)" : "Play auto-advance (Space)"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            {/* Replay */}
            <button
              onClick={() => {
                setCurrentSlideIndex(0);
                setProgress(0);
              }}
              className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-stone-100 border border-stone-800 transition cursor-pointer"
              title="Restart from beginning"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullScreen((f) => !f)}
              className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-stone-100 border border-stone-800 transition cursor-pointer"
              title={isFullScreen ? "Exit fullscreen" : "Enter fullscreen story"}
            >
              {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Regenerate Option */}
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border border-stone-800 transition cursor-pointer disabled:opacity-50"
              title="Regenerate this month's recap with Gemini"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin text-amber-400" : ""}`} />
            </button>

            {/* Switch to Detailed View */}
            {onSwitchToReportView && (
              <button
                onClick={onSwitchToReportView}
                className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-stone-100 border border-stone-800 text-[11px] font-medium transition cursor-pointer"
                title="Switch to detailed grid report"
              >
                <Layers className="w-3 h-3 text-amber-400" />
                <span>Deep Report</span>
              </button>
            )}

            {/* Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800 transition cursor-pointer"
                title="Close recap"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Slide Stage */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden p-4 sm:p-6 select-none">
        {/* Ambient Warm Gradient Backdrop */}
        <div className="absolute inset-0 bg-radial from-amber-500/5 via-transparent to-transparent pointer-events-none" />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="w-full h-full flex items-center justify-center z-10"
          >
            {currentSlide.render()}
          </motion.div>
        </AnimatePresence>

        {/* Previous Button Overlay */}
        {currentSlideIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-stone-950/70 hover:bg-stone-900/90 text-stone-300 hover:text-white border border-stone-750 backdrop-blur-xs flex items-center justify-center transition shadow-lg cursor-pointer"
            title="Previous slide (Left Arrow)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Next Button Overlay */}
        {currentSlideIndex < totalSlides - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-stone-950/70 hover:bg-stone-900/90 text-stone-300 hover:text-white border border-stone-750 backdrop-blur-xs flex items-center justify-center transition shadow-lg cursor-pointer"
            title="Next slide (Right Arrow)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Slide Navigator Dots / Indicator Bar at Bottom */}
      <div className="relative z-20 px-4 py-3 bg-[#13110F] border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-400">
        <span className="text-[11px] text-stone-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Grounded strictly in your private entries
        </span>

        {/* Slide navigation pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[60%] py-1">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => {
                setCurrentSlideIndex(idx);
                setProgress(0);
              }}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentSlideIndex
                  ? "w-6 bg-amber-400"
                  : "w-1.5 bg-stone-700 hover:bg-stone-500"
              }`}
              title={s.title}
            />
          ))}
        </div>

        <span className="text-[11px] text-stone-500">
          Use ← → keys to navigate
        </span>
      </div>

      {/* Photo Viewer Modal */}
      <PhotoViewerModal
        image={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
      />
    </div>
  );
};

// Reusable Source Badge distinguishing explicit from inferred
function SourceBadge({ type }: { type?: "explicit" | "inferred" }) {
  if (type === "explicit") {
    return (
      <span
        title="Explicitly mentioned or photographed by you"
        className="inline-block px-1.5 py-0.5 text-[9px] font-medium tracking-wide rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 whitespace-nowrap shrink-0"
      >
        From entry
      </span>
    );
  }
  return (
    <span
      title="Inferred pattern or theme observed by Gemini"
      className="inline-block px-1.5 py-0.5 text-[9px] font-medium tracking-wide rounded bg-amber-500/15 text-amber-300 border border-amber-500/25 whitespace-nowrap shrink-0"
    >
      Inferred
    </span>
  );
}
