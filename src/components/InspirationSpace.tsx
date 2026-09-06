import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Globe, 
  Lock, 
  Trash2, 
  Calendar, 
  Camera, 
  Check, 
  Tag, 
  Filter, 
  User, 
  EyeOff, 
  Heart, 
  Layers, 
  BookOpen, 
  Compass, 
  AlertCircle,
  RefreshCw
} from "lucide-react";
import type { PublicStory, UserProfile, AttachedImage } from "../types";
import { inspirationService } from "../services/inspirationService";
import { PhotoViewerModal } from "./PhotoViewerModal";

interface InspirationSpaceProps {
  currentUser: UserProfile;
  onNavigateToWrite: () => void;
  onNavigateToGrowth: () => void;
}

export const InspirationSpace: React.FC<InspirationSpaceProps> = ({
  currentUser,
  onNavigateToWrite,
  onNavigateToGrowth,
}) => {
  const [stories, setStories] = useState<PublicStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "reflections" | "recaps" | "mine">("all");
  const [unpublishingId, setUnpublishingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<AttachedImage | null>(null);
  const [inspiringStoryId, setInspiringStoryId] = useState<string | null>(null);

  // Subscribe to public stories in real time
  useEffect(() => {
    setLoading(true);
    const unsubscribe = inspirationService.subscribePublicStories((loaded) => {
      setStories(loaded);
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  // Filtered stories list
  const filteredStories = stories.filter((story) => {
    if (activeFilter === "reflections") return story.sourceType === "reflection";
    if (activeFilter === "recaps") return story.sourceType === "monthly_recap";
    if (activeFilter === "mine") return story.authorUid === currentUser.uid;
    return true;
  });

  // Handle unpublishing a story
  const handleUnpublish = async (story: PublicStory) => {
    if (story.authorUid !== currentUser.uid) {
      setActionError("You are only permitted to unpublish your own stories.");
      return;
    }

    const confirm = window.confirm(
      `Are you sure you want to remove "${story.title}" from Inspiration Space? Your original private journal entry will remain completely safe in your account.`
    );
    if (!confirm) return;

    setUnpublishingId(story.id);
    setActionError(null);
    try {
      await inspirationService.unpublishStory(story.id, currentUser.uid);
      setStories((prev) => prev.filter((s) => s.id !== story.id));
    } catch (err: any) {
      console.error("Unpublish error:", err);
      setActionError(err.message || "Failed to unpublish story.");
    } finally {
      setUnpublishingId(null);
    }
  };

  // Handle gentle "Inspired Me" reaction
  const handleToggleInspire = async (story: PublicStory) => {
    if (inspiringStoryId) return;
    setInspiringStoryId(story.id);

    try {
      const result = await inspirationService.toggleInspiredReaction(
        story.id,
        story.inspiredBy || [],
        currentUser.uid
      );

      // Update in local state
      setStories((prev) =>
        prev.map((s) => {
          if (s.id !== story.id) return s;
          const currentList = s.inspiredBy || [];
          const updatedList = result.inspired
            ? [...currentList, currentUser.uid]
            : currentList.filter((id) => id !== currentUser.uid);
          return {
            ...s,
            inspiredCount: result.newCount,
            inspiredBy: updatedList,
          };
        })
      );
    } catch (err) {
      console.error("Inspiration toggle error:", err);
    } finally {
      setInspiringStoryId(null);
    }
  };

  const myPublishedCount = stories.filter((s) => s.authorUid === currentUser.uid).length;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#141210] text-[#EDE8E3] overflow-y-auto">
      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <PhotoViewerModal
          image={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}

      {/* Hero / Header Section */}
      <div className="bg-stone-900/60 border-b border-stone-800/80 px-4 sm:px-8 py-8 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 mb-2">
                <Globe className="w-3.5 h-3.5" />
                <span>Sanctuary of Shared Milestones</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100 tracking-tight">
                Inspiration Space
              </h1>
            </div>

            {/* Guiding Principle Card */}
            <div className="bg-[#1c1916] border border-amber-500/20 rounded-2xl px-4 py-3 sm:max-w-md shadow-xs">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-serif font-medium text-amber-300 italic">
                    "Share progress to inspire, not compete."
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">
                    Compare yourself only to who you were yesterday. Here, we celebrate quiet resilience and genuine human lessons without followers or rankings.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center bg-[#181614] p-1 rounded-xl border border-stone-800">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeFilter === "all"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                All Stories ({stories.length})
              </button>
              <button
                onClick={() => setActiveFilter("reflections")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeFilter === "reflections"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                Reflections
              </button>
              <button
                onClick={() => setActiveFilter("recaps")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeFilter === "recaps"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                Monthly Recaps
              </button>
              <button
                onClick={() => setActiveFilter("mine")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  activeFilter === "mine"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                <span>My Shared</span>
                {myPublishedCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-500/30 text-amber-200 rounded-full text-[10px]">
                    {myPublishedCount}
                  </span>
                )}
              </button>
            </div>

            <div className="text-xs text-stone-500 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              <span>Private by default • Only explicitly shared items appear here</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content List */}
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-8 py-8 flex-1">
        {actionError && (
          <div className="mb-6 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400 text-sm">
            <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-3"></div>
            <p>Loading inspiration from fellow journalers...</p>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="bg-[#181614] border border-stone-800 rounded-2xl p-10 text-center max-w-lg mx-auto my-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-medium text-stone-200">
                {activeFilter === "mine"
                  ? "You haven't shared any stories yet"
                  : "No stories found in this section"}
              </h3>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                {activeFilter === "mine"
                  ? "All your journal entries and monthly recaps are kept strictly private. If you ever feel that an accomplishment or reflection could encourage someone else, you can click 'Share Publicly' from your journal editor or monthly recap."
                  : "Be the first to share a genuine milestone or reflective lesson in this space."}
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={onNavigateToWrite}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold transition"
              >
                Write in Journal
              </button>
              <button
                onClick={onNavigateToGrowth}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition"
              >
                View Monthly Recaps
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredStories.map((story) => {
              const isAuthor = story.authorUid === currentUser.uid;
              const hasInspired = (story.inspiredBy || []).includes(currentUser.uid);
              const formattedDate = new Date(story.publishedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <article
                  key={story.id}
                  className={`bg-[#181614] border rounded-2xl p-6 sm:p-7 shadow-sm transition hover:border-stone-700/80 ${
                    isAuthor
                      ? "border-amber-500/30 bg-gradient-to-b from-stone-900/90 to-[#181614]"
                      : "border-stone-800/90"
                  }`}
                >
                  {/* Card Header: Author Info & Badges */}
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-800/80">
                    <div className="flex items-center gap-3">
                      {story.isAnonymous ? (
                        <div className="w-9 h-9 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-400">
                          <EyeOff className="w-4 h-4" />
                        </div>
                      ) : story.authorPhotoURL ? (
                        <img
                          src={story.authorPhotoURL}
                          alt={story.authorDisplayName}
                          className="w-9 h-9 rounded-full border border-stone-700 object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-amber-700/20 border border-amber-500/30 flex items-center justify-center text-amber-300 font-medium text-xs">
                          {story.authorDisplayName.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-stone-200">
                            {story.authorDisplayName}
                          </span>
                          {isAuthor && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-medium">
                              Your Shared Story
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formattedDate}
                          </span>
                          <span>•</span>
                          <span className="text-stone-400">{story.category}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right side actions: Type Tag & Unpublish for Author */}
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-stone-800/80 border border-stone-700 text-stone-300 text-xs flex items-center gap-1">
                        {story.sourceType === "monthly_recap" ? (
                          <>
                            <Compass className="w-3 h-3 text-amber-400" />
                            <span>Monthly Recap</span>
                          </>
                        ) : (
                          <>
                            <BookOpen className="w-3 h-3 text-amber-400" />
                            <span>Reflection</span>
                          </>
                        )}
                      </span>

                      {isAuthor && (
                        <button
                          onClick={() => handleUnpublish(story)}
                          disabled={unpublishingId === story.id}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-red-300 hover:bg-red-950/40 border border-transparent hover:border-red-900/50 transition cursor-pointer"
                          title="Unpublish (remove from Inspiration Space)"
                        >
                          {unpublishingId === story.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Story Body */}
                  <div className="py-5 space-y-4">
                    <h2 className="text-xl sm:text-2xl font-serif font-semibold text-stone-100 tracking-tight leading-snug">
                      {story.title}
                    </h2>

                    <div className="text-stone-300 text-sm leading-relaxed whitespace-pre-line max-w-prose">
                      {story.content}
                    </div>

                    {/* Highlights / Lessons */}
                    {story.highlights && story.highlights.length > 0 && (
                      <div className="pt-2 space-y-2">
                        <div className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Accomplishments & Lessons</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {story.highlights.map((h, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-800 text-xs text-stone-300 flex items-start gap-2"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5"></span>
                              <span className="leading-snug">{h}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Photos Grid */}
                    {story.photos && story.photos.length > 0 && (
                      <div className="pt-2">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {story.photos.map((photo) => (
                            <div
                              key={photo.id}
                              onClick={() => setSelectedPhoto(photo)}
                              className="relative group rounded-xl overflow-hidden border border-stone-700/80 bg-stone-900 aspect-video cursor-pointer hover:border-amber-500/50 transition"
                            >
                              <img
                                src={photo.dataUrl}
                                alt={photo.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                              {photo.caption && (
                                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                                  <p className="text-[11px] text-stone-200 truncate">
                                    {photo.caption}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer: "Inspired Me" Interaction (Anti-Compete, Quiet Inspiration) */}
                  <div className="pt-4 border-t border-stone-800/80 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleInspire(story)}
                      disabled={inspiringStoryId === story.id}
                      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                        hasInspired
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs"
                          : "bg-stone-900 hover:bg-stone-850 text-stone-400 hover:text-stone-200 border border-stone-800"
                      }`}
                      title="Tap to let the author know this moment quietly inspired you"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${hasInspired ? "text-amber-400" : "text-stone-400"}`} />
                      <span>{hasInspired ? "Inspired" : "Inspired Me"}</span>
                      {story.inspiredCount > 0 && (
                        <span className="px-1.5 py-0.2 bg-stone-800 text-stone-300 rounded-full text-[10px] ml-0.5">
                          {story.inspiredCount}
                        </span>
                      )}
                    </button>

                    <span className="text-[11px] text-stone-500 italic">
                      Shared to inspire, not compete
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
