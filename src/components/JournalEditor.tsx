import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Sparkles, 
  BookOpen, 
  Lightbulb, 
  HelpCircle, 
  Layers, 
  Check, 
  Copy, 
  Menu, 
  FileText, 
  Clock, 
  Wand2, 
  ChevronDown, 
  ChevronUp,
  Mic,
  Image as ImageIcon,
  Camera,
  X,
  Plus,
  AlertCircle,
  Eye,
  Globe,
  Lock,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import Markdown from "react-markdown";
import type { JournalEntry, EntryCategory, ChatMessage, AttachedImage, UserProfile, PublishStoryInput, PublicStory } from "../types";
import { VoiceRecorderModal } from "./VoiceRecorderModal";
import { PhotoViewerModal } from "./PhotoViewerModal";
import { PublishConfirmationModal } from "./PublishConfirmationModal";
import { processAndCompressImage } from "../utils/imageUtils";
import { auth } from "../lib/firebase";
import { inspirationService } from "../services/inspirationService";

interface JournalEditorProps {
  entry: JournalEntry;
  onUpdateEntry: (updated: JournalEntry) => Promise<void>;
  onToggleSidebar: () => void;
  isSaving: boolean;
  currentUser: UserProfile;
  onNavigateToInspiration?: () => void;
}

const CATEGORIES: EntryCategory[] = [
  "Reflection",
  "Gratitude",
  "Daily Journal",
  "Ideas & Goals",
  "Decision Making",
];

const PROMPT_STARTERS: Record<EntryCategory, string[]> = {
  Reflection: [
    "What is occupying the most mental bandwidth for me today?",
    "A moment today that made me pause and feel conflicted was...",
    "If I look past the immediate frustration, what is this situation trying to teach me?",
  ],
  Gratitude: [
    "Three specific, small moments today that brought me genuine peace or joy:",
    "Who is someone whose presence made my life lighter recently, and how?",
    "What is a simple comfort I usually take for granted?",
  ],
  "Daily Journal": [
    "Here is how my day unfolded and what stood out most:",
    "The high point and low point of today:",
    "One intentional choice I made today that aligned with my values:",
  ],
  "Ideas & Goals": [
    "A creative idea or project that keeps calling to me:",
    "If I had zero fear of failing, the next bold step I would take is:",
    "How can I break down my current biggest objective into tomorrow's actions?",
  ],
  "Decision Making": [
    "The fork in the road I am currently facing is:",
    "Option A gives me ... but costs me ..., while Option B ...",
    "What would my future self in 5 years advise me to prioritize here?",
  ],
};

export const JournalEditor: React.FC<JournalEditorProps> = ({
  entry,
  onUpdateEntry,
  onToggleSidebar,
  isSaving,
  currentUser,
  onNavigateToInspiration,
}) => {
  const [inputText, setInputText] = useState("");
  const [selectedMode, setSelectedMode] = useState<"reflect" | "brainstorm" | "deepen" | "summarize">("reflect");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSummaryBanner, setShowSummaryBanner] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Voice & Photo Memory State
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [pendingImages, setPendingImages] = useState<AttachedImage[]>([]);
  const [selectedViewingImage, setSelectedViewingImage] = useState<AttachedImage | null>(null);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Inspiration Space Publishing State
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishedStory, setPublishedStory] = useState<PublicStory | null>(null);
  const [publishSuccessMsg, setPublishSuccessMsg] = useState<string | null>(null);
  const [isUnpublishing, setIsUnpublishing] = useState(false);

  // Check if current entry is already published in publicStories
  useEffect(() => {
    let isMounted = true;
    inspirationService.fetchPublicStories().then((stories) => {
      if (!isMounted) return;
      const match = stories.find(
        (s) => s.sourceOriginalId === entry.id && s.authorUid === currentUser.uid
      );
      setPublishedStory(match || null);
    }).catch((err) => {
      console.warn("Could not check published stories:", err);
    });

    return () => {
      isMounted = false;
    };
  }, [entry.id, currentUser.uid]);

  const handleConfirmPublish = async (input: PublishStoryInput) => {
    const published = await inspirationService.publishStory(input, currentUser);
    setPublishedStory(published);
    setPublishSuccessMsg("Shared to Inspiration Space! Your private original entry remains safe.");
    setTimeout(() => {
      setPublishSuccessMsg(null);
    }, 6000);
  };

  const handleUnpublish = async () => {
    if (!publishedStory) return;
    const confirm = window.confirm("Are you sure you want to remove this story from Inspiration Space?");
    if (!confirm) return;

    setIsUnpublishing(true);
    try {
      await inspirationService.unpublishStory(publishedStory.id, currentUser.uid);
      setPublishedStory(null);
      setPublishSuccessMsg("Story unpublished. It is no longer visible in Inspiration Space.");
      setTimeout(() => setPublishSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to unpublish story.");
    } finally {
      setIsUnpublishing(false);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entry.messages, isGenerating]);

  // Handle title change
  const handleTitleChange = async (newTitle: string) => {
    const updated = {
      ...entry,
      title: newTitle,
      updatedAt: new Date().toISOString(),
    };
    await onUpdateEntry(updated);
  };

  // Handle category change
  const handleCategoryChange = async (newCat: EntryCategory) => {
    const updated = {
      ...entry,
      category: newCat,
      updatedAt: new Date().toISOString(),
    };
    await onUpdateEntry(updated);
  };

  // Copy message to clipboard
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handle selecting photo memories
  const handleImageSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingImages(true);
    setImageError(null);

    const newImages: AttachedImage[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await processAndCompressImage(file);
      if (result.error) {
        errors.push(result.error);
      } else if (result.image) {
        newImages.push(result.image);
      }
    }

    if (errors.length > 0) {
      setImageError(errors.join(" "));
    }

    if (newImages.length > 0) {
      setPendingImages((prev) => [...prev, ...newImages]);
    }

    setIsProcessingImages(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemovePendingImage = (id: string) => {
    setPendingImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleUpdatePendingCaption = (id: string, caption: string) => {
    setPendingImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, caption } : img))
    );
  };

  // Handle voice transcript submission
  const handleVoiceTranscriptSubmit = (transcriptText: string, sendImmediately: boolean) => {
    if (sendImmediately) {
      handleSendMessage(transcriptText, undefined, true);
    } else {
      setInputText((prev) => (prev ? prev + "\n\n" + transcriptText : transcriptText));
      textareaRef.current?.focus();
    }
  };

  // Send message and converse with Gemini
  const handleSendMessage = async (
    textToSend?: string,
    imagesToSend?: AttachedImage[],
    isVoice?: boolean
  ) => {
    const content = (textToSend !== undefined ? textToSend : inputText).trim();
    const currentPendingImages = imagesToSend || pendingImages;

    if ((!content && currentPendingImages.length === 0) || isGenerating) return;

    setErrorMsg(null);
    setImageError(null);
    setInputText("");
    setPendingImages([]);

    const userMessage: ChatMessage = {
      id: "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      sender: "user",
      text: content || (currentPendingImages.length > 0 ? "Attached photo memory." : ""),
      timestamp: new Date().toISOString(),
      images: currentPendingImages,
      isVoiceTranscript: !!isVoice,
    };

    // If this is the first turn and title is default, propose initial title from input
    let newTitle = entry.title;
    if (entry.title === "New Reflection" || !entry.title.trim()) {
      const titleSeed = content || "Photo Memory";
      newTitle = titleSeed.slice(0, 45) + (titleSeed.length > 45 ? "..." : "");
    }

    const updatedMessages = [...entry.messages, userMessage];

    // Persist photos at entry level as well
    const existingPhotos = entry.photos || [];
    const updatedPhotos = currentPendingImages.length > 0
      ? [...existingPhotos, ...currentPendingImages]
      : existingPhotos;

    const preliminaryEntry: JournalEntry = {
      ...entry,
      title: newTitle,
      messages: updatedMessages,
      photos: updatedPhotos,
      updatedAt: new Date().toISOString(),
    };

    // Optimistically update
    await onUpdateEntry(preliminaryEntry);

    setIsGenerating(true);

    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : "";

      const response = await fetch("/api/gemini/reflect", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          messages: updatedMessages,
          category: entry.category,
          mode: selectedMode,
          userId: auth.currentUser?.uid || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();

      const geminiMessage: ChatMessage = {
        id: "msg_gemini_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        sender: "gemini",
        text: data.reply,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, geminiMessage];
      const finalEntry: JournalEntry = {
        ...preliminaryEntry,
        messages: finalMessages,
        updatedAt: new Date().toISOString(),
      };

      await onUpdateEntry(finalEntry);

      // Focus back on textarea
      textareaRef.current?.focus();
    } catch (err: any) {
      console.error("Failed to get response from Gemini:", err);
      setErrorMsg(err.message || "Unable to reach Gemini. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate full summary & title synthesis using Gemini
  const handleGenerateSummary = async () => {
    if (entry.messages.length === 0 || isSummarizing) return;

    setIsSummarizing(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/gemini/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: entry.messages,
          category: entry.category,
          currentTitle: entry.title,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();

      const updated: JournalEntry = {
        ...entry,
        title: data.title || entry.title,
        summary: data.summary || entry.summary,
        updatedAt: new Date().toISOString(),
      };

      await onUpdateEntry(updated);
      setShowSummaryBanner(true);
    } catch (err: any) {
      console.error("Summary error:", err);
      setErrorMsg("Could not generate summary: " + (err.message || "error"));
    } finally {
      setIsSummarizing(false);
    }
  };

  // Keyboard shortcut: Enter sends, Shift+Enter new line
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#171513] text-[#EDE8E3] overflow-hidden">
      {/* Editor Top Bar */}
      <div className="bg-stone-900/90 border-b border-stone-800/80 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20 backdrop-blur-sm">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          {/* Mobile sidebar toggle button */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg bg-stone-800 text-stone-300 hover:text-stone-100 hover:bg-stone-700"
            title="Open History"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Editable Title */}
          <div className="flex-1">
            <input
              type="text"
              value={entry.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Title your reflection..."
              className="w-full bg-transparent text-stone-100 font-serif font-medium text-base sm:text-lg focus:outline-hidden border-b border-transparent hover:border-stone-700 focus:border-amber-500/60 pb-0.5 transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Photo Memories Badge */}
          {entry.photos && entry.photos.length > 0 && (
            <button
              onClick={() => {
                if (entry.photos && entry.photos.length > 0) {
                  setSelectedViewingImage(entry.photos[0]);
                }
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 border border-stone-700 text-xs transition cursor-pointer"
              title="View attached photo memories"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>{entry.photos.length} Photo{entry.photos.length > 1 ? "s" : ""}</span>
            </button>
          )}

          {/* Category Selector */}
          <div className="relative">
            <select
              value={entry.category}
              onChange={(e) => handleCategoryChange(e.target.value as EntryCategory)}
              className="appearance-none bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs px-3 py-1.5 pr-7 rounded-lg border border-stone-700 focus:outline-hidden focus:border-amber-500/60 cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Synthesize Summary button */}
          <button
            onClick={handleGenerateSummary}
            disabled={isSummarizing || entry.messages.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/25 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Ask Gemini to synthesize key takeaways and title"
          >
            {isSummarizing ? (
              <>
                <span className="w-3 h-3 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"></span>
                <span className="hidden sm:inline">Synthesizing...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Synthesize Insights</span>
              </>
            )}
          </button>

          {/* Share to Inspiration Space Button */}
          {publishedStory ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (onNavigateToInspiration) {
                    onNavigateToInspiration();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-lg hover:bg-amber-500/25 transition cursor-pointer"
                title="View your story in Inspiration Space"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Shared</span>
              </button>
              <button
                onClick={handleUnpublish}
                disabled={isUnpublishing}
                className="px-2 py-1.5 text-xs font-medium bg-stone-800 hover:bg-red-950/60 hover:text-red-300 text-stone-400 border border-stone-700 rounded-lg transition cursor-pointer"
                title="Unpublish from Inspiration Space"
              >
                {isUnpublishing ? "..." : "Unpublish"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowPublishModal(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-amber-300 border border-stone-700 rounded-lg transition cursor-pointer"
              title="Share an inspirational excerpt to Inspiration Space (Private by default)"
            >
              <Globe className="w-3.5 h-3.5 text-stone-400" />
              <span className="hidden md:inline">Share Publicly</span>
            </button>
          )}

          {/* Cloud Save State indicator */}
          <div className="text-[11px] text-stone-400 flex items-center gap-1 pl-1">
            {isSaving ? (
              <span className="text-amber-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                Saving
              </span>
            ) : (
              <span className="text-stone-500 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Saved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Publish Success Notice Banner */}
      {publishSuccessMsg && (
        <div className="bg-emerald-950/40 border-b border-emerald-800/40 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{publishSuccessMsg}</span>
          </div>
          {onNavigateToInspiration && (
            <button
              onClick={onNavigateToInspiration}
              className="font-semibold underline hover:text-emerald-100 ml-2 cursor-pointer"
            >
              View in Inspiration Space →
            </button>
          )}
        </div>
      )}

      {/* Summary Accordion Banner (if available) */}
      {entry.summary && (
        <div className="bg-amber-950/20 border-b border-amber-800/30 px-6 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Gemini Reflection Synthesis</span>
            </div>
            <button
              onClick={() => setShowSummaryBanner(!showSummaryBanner)}
              className="text-stone-400 hover:text-stone-200 text-xs flex items-center gap-1"
            >
              {showSummaryBanner ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
          {showSummaryBanner && (
            <p className="mt-1.5 text-xs text-stone-300 leading-relaxed font-serif italic">
              "{entry.summary}"
            </p>
          )}
        </div>
      )}

      {/* Error alert if any */}
      {errorMsg && (
        <div className="mx-6 mt-3 p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-200 text-xs flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-200 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Conversation / Journal Canvas */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 max-w-4xl w-full mx-auto">
        {entry.messages.length === 0 ? (
          /* Empty State / Starters */
          <div className="py-10 text-center max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-xl font-medium text-stone-200 mb-2">
              What is on your mind?
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 mb-8 leading-relaxed">
              Write freely. Gemini will act as your empathetic sounding board, prompting you to uncover deeper insights and brainstorm paths forward.
            </p>

            <div className="text-left space-y-2">
              <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                Suggested Prompts for {entry.category}
              </div>
              {PROMPT_STARTERS[entry.category]?.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="w-full text-left p-3 rounded-xl bg-stone-900/70 hover:bg-stone-850 border border-stone-800 hover:border-stone-700 text-stone-300 hover:text-amber-200 text-xs transition leading-relaxed flex items-center justify-between group cursor-pointer"
                >
                  <span>"{prompt}"</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400/50 group-hover:text-amber-300 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message Flow */
          entry.messages.map((msg) => {
            const isUser = msg.sender === "user";

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-2 mb-1 text-[11px] text-stone-500">
                  {isUser ? (
                    <>
                      <span>You</span>
                      {msg.isVoiceTranscript && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium text-[10px]">
                          <Mic className="w-2.5 h-2.5" />
                          Voice Reflection
                        </span>
                      )}
                      <span className="w-1 h-1 rounded-full bg-stone-600"></span>
                      <Clock className="w-3 h-3" />
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span className="text-amber-300 font-medium">Gemini</span>
                      <span className="w-1 h-1 rounded-full bg-stone-600"></span>
                      <Clock className="w-3 h-3" />
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </>
                  )}
                </div>

                <div
                  className={`relative group rounded-2xl px-5 py-4 max-w-2xl border text-sm leading-relaxed transition ${
                    isUser
                      ? "bg-stone-900/90 text-stone-100 border-stone-800 rounded-tr-xs shadow-xs font-serif whitespace-pre-wrap"
                      : "bg-stone-900/40 text-stone-200 border-amber-500/20 rounded-tl-xs shadow-sm"
                  }`}
                >
                  {isUser ? (
                    <div className="space-y-2">
                      <p className="text-stone-100 text-sm leading-relaxed">{msg.text}</p>
                      {msg.images && msg.images.length > 0 && (
                        <div className="pt-1.5 grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {msg.images.map((img) => (
                            <div
                              key={img.id}
                              onClick={() => setSelectedViewingImage(img)}
                              className="group/photo relative rounded-xl overflow-hidden border border-stone-750 bg-stone-950/80 cursor-pointer shadow-sm hover:border-amber-500/60 transition"
                            >
                              <img
                                src={img.dataUrl}
                                alt={img.caption || img.name}
                                className="h-28 w-full object-cover transition duration-200 group-hover/photo:scale-105"
                              />
                              {img.caption ? (
                                <div className="absolute bottom-0 inset-x-0 bg-stone-950/85 backdrop-blur-xs px-2 py-1 text-[11px] text-stone-200 truncate font-serif italic">
                                  {img.caption}
                                </div>
                              ) : (
                                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-stone-300 opacity-0 group-hover/photo:opacity-100 transition">
                                  <Eye className="w-3 h-3 inline mr-0.5" /> View
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="prose prose-invert prose-stone max-w-none text-sm text-stone-200 prose-headings:text-stone-100 prose-strong:text-amber-300 prose-em:text-amber-200">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  )}

                  {/* Copy helper */}
                  <button
                    onClick={() => handleCopy(msg.id, msg.text)}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-stone-850/80 text-stone-400 hover:text-stone-200 opacity-0 group-hover:opacity-100 transition shadow-xs"
                    title="Copy text"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* Loading Bubble when Gemini is processing */}
        {isGenerating && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2 mb-1 text-[11px] text-amber-400 font-medium">
              <Sparkles className="w-3 h-3 animate-spin" />
              <span>Gemini is reflecting...</span>
            </div>
            <div className="rounded-2xl rounded-tl-xs px-5 py-4 bg-stone-900/40 border border-amber-500/30 text-stone-300 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]"></span>
              <span className="text-xs text-stone-400 ml-2">Unpacking thoughts and perspectives</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Interaction Bar & Input Area */}
      <div className="bg-stone-900/90 border-t border-stone-800/80 px-4 sm:px-8 py-3.5 sticky bottom-0 z-20 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto space-y-2.5">
          {/* Mode Selector Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-stone-500 text-[11px] font-medium mr-1 shrink-0">Gemini Focus:</span>
            <button
              onClick={() => setSelectedMode("reflect")}
              className={`px-2.5 py-1 rounded-full border text-[11px] font-medium whitespace-nowrap transition ${
                selectedMode === "reflect"
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-stone-850 text-stone-400 border-stone-750 hover:text-stone-200"
              }`}
            >
              Sounding Board
            </button>
            <button
              onClick={() => setSelectedMode("brainstorm")}
              className={`px-2.5 py-1 rounded-full border text-[11px] font-medium whitespace-nowrap transition ${
                selectedMode === "brainstorm"
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-stone-850 text-stone-400 border-stone-750 hover:text-stone-200"
              }`}
            >
              Brainstorm Ideas
            </button>
            <button
              onClick={() => setSelectedMode("deepen")}
              className={`px-2.5 py-1 rounded-full border text-[11px] font-medium whitespace-nowrap transition ${
                selectedMode === "deepen"
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-stone-850 text-stone-400 border-stone-750 hover:text-stone-200"
              }`}
            >
              Socratic Inquiries
            </button>
            <button
              onClick={() => setSelectedMode("summarize")}
              className={`px-2.5 py-1 rounded-full border text-[11px] font-medium whitespace-nowrap transition ${
                selectedMode === "summarize"
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-stone-850 text-stone-400 border-stone-750 hover:text-stone-200"
              }`}
            >
              Key Takeaways
            </button>
          </div>

          {/* Image Validation Alert Banner if error occurs */}
          {imageError && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{imageError}</span>
              </div>
              <button
                onClick={() => setImageError(null)}
                className="p-1 rounded text-red-400 hover:text-red-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Pending Photos Preview Tray */}
          {pendingImages.length > 0 && (
            <div className="flex items-center gap-2.5 overflow-x-auto p-2 bg-stone-950/90 border border-stone-800 rounded-xl">
              <span className="text-[11px] text-amber-400 font-medium shrink-0 flex items-center gap-1 pl-1">
                <ImageIcon className="w-3.5 h-3.5" />
                Photos ({pendingImages.length}):
              </span>
              {pendingImages.map((img) => (
                <div
                  key={img.id}
                  className="relative group shrink-0 rounded-lg overflow-hidden border border-stone-700 bg-stone-900 flex items-center gap-2 pr-2"
                >
                  <img
                    src={img.dataUrl}
                    alt={img.name}
                    onClick={() => setSelectedViewingImage(img)}
                    className="w-10 h-10 object-cover cursor-pointer hover:opacity-85 transition"
                    title="Click to view photo"
                  />
                  <div className="max-w-[120px]">
                    <input
                      type="text"
                      value={img.caption || ""}
                      onChange={(e) => handleUpdatePendingCaption(img.id, e.target.value)}
                      placeholder="Add caption..."
                      className="text-[11px] text-stone-200 bg-transparent focus:outline-hidden placeholder-stone-500 truncate w-full"
                    />
                    <div className="text-[9px] text-stone-500">{(img.size / 1024).toFixed(0)} KB</div>
                  </div>
                  <button
                    onClick={() => handleRemovePendingImage(img.id)}
                    className="p-1 rounded text-stone-400 hover:text-red-400 transition cursor-pointer"
                    title="Remove photo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 px-2.5 py-1.5 rounded-lg border border-dashed border-stone-700 hover:border-amber-500/50 text-stone-400 hover:text-amber-300 text-xs flex items-center gap-1 transition cursor-pointer"
                title="Add more photos"
              >
                <Plus className="w-3 h-3" />
                <span className="text-[11px]">Add</span>
              </button>
            </div>
          )}

          {/* Textarea Input Container */}
          <div className="relative flex items-end gap-2 bg-stone-950/70 border border-stone-800 rounded-2xl p-2 focus-within:border-amber-500/50 transition shadow-inner">
            {/* Attachment Controls: Mic & Photo */}
            <div className="flex items-center gap-1 shrink-0 pb-0.5">
              <button
                type="button"
                onClick={() => setShowVoiceModal(true)}
                disabled={isGenerating}
                className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-amber-400 border border-stone-800 hover:border-amber-500/30 transition cursor-pointer disabled:opacity-40"
                title="Record Voice Reflection (Microphone)"
              >
                <Mic className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating || isProcessingImages}
                className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-amber-400 border border-stone-800 hover:border-amber-500/30 transition cursor-pointer disabled:opacity-40"
                title="Attach Photo Memory"
              >
                {isProcessingImages ? (
                  <span className="w-4 h-4 border-2 border-stone-500 border-t-amber-400 rounded-full animate-spin inline-block" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={handleImageSelection}
                className="hidden"
              />
            </div>

            <textarea
              ref={textareaRef}
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={pendingImages.length > 0 ? "Describe this photo memory or write thoughts... (Enter to send)" : "Write your thoughts, feelings, or ask Gemini to reflect on an idea... (Enter to send, Shift+Enter for new line)"}
              className="flex-1 bg-transparent text-stone-100 placeholder-stone-500 text-sm p-2 focus:outline-hidden resize-none max-h-36 leading-relaxed font-serif"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={(!inputText.trim() && pendingImages.length === 0) || isGenerating}
              className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm shrink-0 cursor-pointer"
              title="Send entry (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Voice Reflection Modal */}
      <VoiceRecorderModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onSubmitTranscript={handleVoiceTranscriptSubmit}
      />

      {/* Photo Viewer Modal */}
      <PhotoViewerModal
        image={selectedViewingImage}
        onClose={() => setSelectedViewingImage(null)}
      />

      {/* Inspiration Space Publish Confirmation Modal */}
      {showPublishModal && (
        <PublishConfirmationModal
          isOpen={showPublishModal}
          onClose={() => setShowPublishModal(false)}
          onConfirmPublish={handleConfirmPublish}
          initialTitle={entry.title || "Moments of Reflection"}
          initialContent={
            entry.summary ||
            entry.messages.filter((m) => m.sender === "user").map((m) => m.text).join("\n\n") ||
            ""
          }
          initialCategory={entry.category}
          initialPhotos={entry.photos || []}
          sourceType="reflection"
          sourceOriginalId={entry.id}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};
