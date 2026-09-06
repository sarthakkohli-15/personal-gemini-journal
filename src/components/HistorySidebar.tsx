import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Trash2, 
  Calendar, 
  Sparkles, 
  Tag, 
  X,
  MessageSquare,
  ChevronRight,
  Compass,
  Mic,
  Camera
} from "lucide-react";
import type { JournalEntry, EntryCategory } from "../types";

interface HistorySidebarProps {
  entries: JournalEntry[];
  activeEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onDeleteEntry: (entryId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToGrowth?: () => void;
}

const CATEGORIES: ("All" | EntryCategory)[] = [
  "All",
  "Reflection",
  "Gratitude",
  "Daily Journal",
  "Ideas & Goals",
  "Decision Making",
];

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  entries,
  activeEntryId,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
  isOpen,
  onClose,
  onNavigateToGrowth,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"All" | EntryCategory>("All");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredEntries = entries.filter((entry) => {
    const matchesCategory =
      selectedCategory === "All" || entry.category === selectedCategory;
    const matchesSearch =
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.summary && entry.summary.toLowerCase().includes(searchTerm.toLowerCase())) ||
      entry.messages.some((m) =>
        m.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesCategory && matchesSearch;
  });

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
      });
    } catch {
      return "Recent";
    }
  };

  const getCategoryColor = (category: EntryCategory) => {
    switch (category) {
      case "Gratitude":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Ideas & Goals":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "Decision Making":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "Daily Journal":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default:
        return "bg-stone-700/40 text-stone-300 border-stone-600/40";
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-80 sm:w-88 bg-stone-900 border-r border-stone-800 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-stone-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <h2 className="font-medium text-sm text-stone-200">Past Reflections</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-400">
                {entries.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              onNewEntry();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-medium text-xs sm:text-sm transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Reflection</span>
          </button>

          {onNavigateToGrowth && (
            <button
              onClick={() => {
                onNavigateToGrowth();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-stone-800/80 hover:bg-stone-800 hover:border-amber-500/30 border border-stone-700/60 text-stone-200 text-xs font-medium transition cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Personal Growth Dashboard</span>
            </button>
          )}

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search entries & thoughts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-950/60 border border-stone-800 rounded-lg text-stone-200 placeholder-stone-500 focus:outline-hidden focus:border-amber-500/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Category Filter Horizontal Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md whitespace-nowrap transition border ${
                  selectedCategory === cat
                    ? "bg-stone-100 text-stone-900 border-stone-200 font-medium"
                    : "bg-stone-800/60 text-stone-400 border-stone-800 hover:border-stone-700 hover:text-stone-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredEntries.length === 0 ? (
            <div className="py-12 text-center text-stone-500 text-xs px-4">
              {entries.length === 0 ? (
                <div>
                  <Sparkles className="w-8 h-8 text-stone-600 mx-auto mb-2 opacity-50" />
                  <p className="font-medium text-stone-400 mb-1">No reflections yet</p>
                  <p>Start your very first journal entry to begin your conversation with Gemini.</p>
                </div>
              ) : (
                <p>No reflections found matching your filter.</p>
              )}
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const isActive = activeEntryId === entry.id;
              const isConfirmingDelete = deleteConfirmId === entry.id;

              return (
                <div
                  key={entry.id}
                  className={`group relative rounded-xl p-3 border transition text-left cursor-pointer ${
                    isActive
                      ? "bg-stone-800/90 border-amber-500/40 shadow-sm"
                      : "bg-stone-950/40 border-stone-800/80 hover:bg-stone-800/50 hover:border-stone-700"
                  }`}
                  onClick={() => {
                    if (!isConfirmingDelete) {
                      onSelectEntry(entry);
                      onClose();
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getCategoryColor(
                        entry.category
                      )}`}
                    >
                      {entry.category}
                    </span>
                    <span className="text-[11px] text-stone-500">
                      {formatDate(entry.createdAt)}
                    </span>
                  </div>

                  <h3 className="font-medium text-xs sm:text-sm text-stone-200 line-clamp-1 mb-1 group-hover:text-amber-300 transition-colors">
                    {entry.title || "Untitled Reflection"}
                  </h3>

                  {entry.summary ? (
                    <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed mb-2">
                      {entry.summary}
                    </p>
                  ) : entry.messages.length > 0 ? (
                    <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed mb-2 italic">
                      "{entry.messages[0].text}"
                    </p>
                  ) : null}

                  <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-800/60">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-stone-500" />
                        {entry.messages.length} {entry.messages.length === 1 ? "turn" : "turns"}
                      </span>
                      {entry.messages.some((m) => m.isVoiceTranscript) && (
                        <span className="flex items-center text-amber-400/90" title="Contains voice reflection">
                          <Mic className="w-3 h-3" />
                        </span>
                      )}
                      {((entry.photos && entry.photos.length > 0) || entry.messages.some((m) => m.images && m.images.length > 0)) && (
                        <span className="flex items-center text-amber-400/90" title="Contains photo memories">
                          <Camera className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    {/* Delete action */}
                    {isConfirmingDelete ? (
                      <div
                        className="flex items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-[10px] text-red-400 font-medium">Delete?</span>
                        <button
                          onClick={() => {
                            onDeleteEntry(entry.id);
                            setDeleteConfirmId(null);
                          }}
                          className="px-1.5 py-0.5 text-[10px] bg-red-600 hover:bg-red-500 text-white rounded font-medium"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-1.5 py-0.5 text-[10px] bg-stone-700 hover:bg-stone-600 text-stone-200 rounded"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(entry.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-stone-500 hover:text-red-400 transition"
                        title="Delete reflection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
};
