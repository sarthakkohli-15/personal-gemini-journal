import React from "react";
import { X, Calendar, FileText, Download } from "lucide-react";
import type { AttachedImage } from "../types";

interface PhotoViewerModalProps {
  image: AttachedImage | null;
  onClose: () => void;
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({ image, onClose }) => {
  if (!image) return null;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = image.dataUrl;
    link.download = image.name || "journal-photo-memory.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 max-w-4xl w-full bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-800 bg-stone-900/90">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <FileText className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-sm font-medium text-stone-200 truncate">{image.name}</span>
            <span className="text-xs text-stone-500 shrink-0">
              ({(image.size / 1024).toFixed(0)} KB)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition"
              title="Download full image"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition"
              title="Close viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Display */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-stone-950/60 min-h-[300px]">
          <img
            src={image.dataUrl}
            alt={image.caption || image.name}
            className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
          />
        </div>

        {/* Caption and Meta Footer */}
        <div className="px-5 py-3 bg-stone-900/95 border-t border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-400">
          {image.caption ? (
            <p className="font-serif italic text-stone-300 text-sm">{image.caption}</p>
          ) : (
            <span className="text-stone-500 italic">No caption added</span>
          )}

          <div className="flex items-center gap-1 text-[11px] text-stone-500 shrink-0">
            <Calendar className="w-3 h-3" />
            <span>{new Date(image.uploadedAt).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
