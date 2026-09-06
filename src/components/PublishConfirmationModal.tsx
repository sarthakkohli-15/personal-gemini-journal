import React, { useState } from "react";
import { 
  X, 
  ShieldCheck, 
  Sparkles, 
  Lock, 
  Globe, 
  UserCheck, 
  EyeOff, 
  Trash2, 
  Check, 
  AlertCircle,
  HelpCircle,
  Camera
} from "lucide-react";
import type { AttachedImage, PublishStoryInput, UserProfile } from "../types";

interface PublishConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPublish: (input: PublishStoryInput) => Promise<void>;
  initialTitle: string;
  initialContent: string;
  initialCategory: string;
  initialHighlights?: string[];
  initialPhotos?: AttachedImage[];
  sourceType: "reflection" | "monthly_recap";
  sourceOriginalId: string;
  currentUser: UserProfile;
}

export const PublishConfirmationModal: React.FC<PublishConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirmPublish,
  initialTitle,
  initialContent,
  initialCategory,
  initialHighlights = [],
  initialPhotos = [],
  sourceType,
  sourceOriginalId,
  currentUser,
}) => {
  const [title, setTitle] = useState(initialTitle || "Moments of Growth");
  const [content, setContent] = useState(initialContent || "");
  const [category, setCategory] = useState(initialCategory || "Reflection");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [customAuthorName, setCustomAuthorName] = useState(currentUser.displayName || "Journaler");
  
  // Selected Highlights
  const [selectedHighlights, setSelectedHighlights] = useState<string[]>(initialHighlights);

  // Selected Photos
  const [photos, setPhotos] = useState<AttachedImage[]>(initialPhotos);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleHighlight = (item: string) => {
    if (selectedHighlights.includes(item)) {
      setSelectedHighlights(selectedHighlights.filter((h) => h !== item));
    } else {
      setSelectedHighlights([...selectedHighlights, item]);
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    setPhotos(photos.filter((p) => p.id !== photoId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg("Please provide a title for your shared story.");
      return;
    }

    if (!content.trim()) {
      setErrorMsg("Story text cannot be empty. Please include a reflection or excerpt.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirmPublish({
        sourceType,
        sourceOriginalId,
        title: title.trim(),
        content: content.trim(),
        category: category.trim(),
        authorDisplayName: isAnonymous ? "Anonymous Journaler" : customAuthorName.trim(),
        isAnonymous,
        highlights: selectedHighlights,
        photos: photos,
      });
      onClose();
    } catch (err: any) {
      console.error("Publishing error:", err);
      setErrorMsg(err.message || "Failed to publish story. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#1a1714] border border-stone-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-100 flex items-center gap-2">
                Share to Inspiration Space
              </h2>
              <p className="text-xs text-amber-300/90 font-serif italic">
                "Share progress to inspire, not compete."
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Privacy Notice Banner */}
        <div className="px-6 py-3 bg-amber-950/20 border-b border-amber-900/30 text-amber-200/90 text-xs flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-stone-200">Private by Default: </span>
            Your original journal entries, transcripts, and notes remain 100% private in your account.
            Only the sanitized copy you confirm below will be visible in Inspiration Space. You can unpublish anytime.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Author Identity Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-300">
              Author Identity
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setIsAnonymous(false)}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                  !isAnonymous
                    ? "bg-amber-500/10 border-amber-500/40 text-stone-100 shadow-xs"
                    : "bg-stone-900/60 border-stone-800 text-stone-400 hover:border-stone-700"
                }`}
              >
                <UserCheck className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="overflow-hidden">
                  <div className="text-xs font-medium text-stone-200 truncate">
                    Share with my name
                  </div>
                  <div className="text-[11px] text-stone-400 truncate">
                    {currentUser.displayName || "Journaler"}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsAnonymous(true)}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                  isAnonymous
                    ? "bg-amber-500/10 border-amber-500/40 text-stone-100 shadow-xs"
                    : "bg-stone-900/60 border-stone-800 text-stone-400 hover:border-stone-700"
                }`}
              >
                <EyeOff className="w-5 h-5 text-stone-400 shrink-0" />
                <div>
                  <div className="text-xs font-medium text-stone-200">
                    Share Anonymously
                  </div>
                  <div className="text-[11px] text-stone-400">
                    Hides your name and photo completely
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Public Story Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-300 flex items-center justify-between">
              <span>Story Title</span>
              <span className="text-[10px] text-stone-400 font-normal">Visible publicly</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="e.g., Finding Balance in Small Steps"
              className="w-full px-3.5 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 text-sm focus:outline-hidden focus:border-amber-500 transition font-serif"
            />
          </div>

          {/* Public Story Reflection / Excerpt */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-300 flex items-center justify-between">
              <span>Public Reflection / Excerpt</span>
              <span className="text-[10px] text-stone-400 font-normal">
                Edit to remove any sensitive names or details
              </span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="Write or review what you'd like to share..."
              className="w-full px-3.5 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 text-sm focus:outline-hidden focus:border-amber-500 transition leading-relaxed"
            />
            <p className="text-[11px] text-stone-400">
              {content.length} characters • Feel free to edit or trim this text to only what you feel comfortable sharing.
            </p>
          </div>

          {/* Optional Highlights / Key Lessons */}
          {initialHighlights.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-300">
                Key Accomplishments & Lessons to Include
              </label>
              <div className="space-y-1.5 bg-stone-900/60 p-3 rounded-xl border border-stone-800">
                {initialHighlights.map((item, idx) => {
                  const isChecked = selectedHighlights.includes(item);
                  return (
                    <label
                      key={idx}
                      className="flex items-start gap-2.5 text-xs text-stone-300 hover:text-stone-100 cursor-pointer select-none p-1 rounded-sm transition"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleHighlight(item)}
                        className="mt-0.5 rounded-sm border-stone-700 text-amber-500 focus:ring-0 cursor-pointer"
                      />
                      <span className="flex-1 leading-snug">{item}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Photos to Include */}
          {photos.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-300 flex items-center justify-between">
                <span>Photo Memories to Include ({photos.length})</span>
                <span className="text-[10px] text-stone-400 font-normal">Click trash to remove sensitive photos</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {photos.map((photo) => (
                  <div 
                    key={photo.id}
                    className="relative group rounded-xl overflow-hidden border border-stone-700/80 bg-stone-900 aspect-video flex flex-col justify-end"
                  >
                    <img
                      src={photo.dataUrl}
                      alt={photo.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90"></div>
                    <div className="relative p-2 flex items-center justify-between z-10">
                      <span className="text-[10px] text-stone-200 truncate max-w-[100px]">
                        {photo.caption || photo.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(photo.id)}
                        className="p-1 rounded-md bg-red-900/80 hover:bg-red-800 text-red-200 transition"
                        title="Remove photo from public story"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What Stays Private (Guarantee Checklist) */}
          <div className="p-3.5 rounded-xl bg-stone-900/90 border border-stone-800 space-y-2">
            <div className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Strict Privacy Guarantees</span>
            </div>
            <ul className="text-[11px] text-stone-400 space-y-1 pl-5 list-disc">
              <li>Your email address ({currentUser.email}) and private Firebase UID will NEVER be revealed.</li>
              <li>Your other private journal entries and raw voice recordings stay strictly private.</li>
              <li>No vanity follower counts, rankings, or competitive metrics are ever displayed.</li>
              <li>You retain full ownership and can unpublish this story at any time.</li>
            </ul>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-stone-950/30 border-t-stone-950 rounded-full animate-spin"></span>
                  <span>Publishing to Inspiration...</span>
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5" />
                  <span>Confirm & Publish Story</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
