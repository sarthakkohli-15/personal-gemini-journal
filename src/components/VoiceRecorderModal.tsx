import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, 
  Square, 
  Sparkles, 
  AlertCircle, 
  X, 
  Check, 
  RotateCcw, 
  Send, 
  Volume2,
  FileText
} from "lucide-react";
import { auth } from "../lib/firebase";

interface VoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitTranscript: (transcript: string, sendImmediately: boolean) => void;
}

type RecorderState = 
  | "idle" 
  | "requesting" 
  | "recording" 
  | "transcribing" 
  | "reviewing" 
  | "error";

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({
  isOpen,
  onClose,
  onSubmitTranscript,
}) => {
  const [recorderState, setRecorderState] = useState<RecorderState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<"permission" | "device" | "general" | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isGeminiTranscribing, setIsGeminiTranscribing] = useState(false);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Reset when opened/closed
  useEffect(() => {
    if (isOpen) {
      setRecorderState("idle");
      setErrorMessage(null);
      setErrorType(null);
      setRecordingSeconds(0);
      setTranscript("");
      setAudioBlob(null);
    } else {
      cleanupResources();
    }
    return () => {
      cleanupResources();
    };
  }, [isOpen]);

  // Clean up recording tracks, timers, and recognizers
  const cleanupResources = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.onend = null;
        speechRecognitionRef.current.onerror = null;
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  // Start recording
  const startRecording = async () => {
    setErrorMessage(null);
    setErrorType(null);
    setRecorderState("requesting");
    setRecordingSeconds(0);
    setTranscript("");
    audioChunksRef.current = [];

    // Check if mediaDevices is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorType("device");
      setErrorMessage("Audio recording is not supported on this browser or platform.");
      setRecorderState("error");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Start MediaRecorder
      let mimeType = "";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const recordedBlob = new Blob(audioChunksRef.current, {
          type: mimeType || "audio/webm",
        });
        setAudioBlob(recordedBlob);
      };

      recorder.start(250); // Slice data every 250ms

      // Attempt browser SpeechRecognition for live continuous transcription
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognizer = new SpeechRecognition();
          recognizer.continuous = true;
          recognizer.interimResults = true;
          recognizer.lang = "en-US";

          let accumulated = "";

          recognizer.onresult = (event: any) => {
            let interim = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const current = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                accumulated += (accumulated ? " " : "") + current.trim();
              } else {
                interim += current;
              }
            }
            const liveText = (accumulated + (interim ? " " + interim : "")).trim();
            setTranscript(liveText);
          };

          recognizer.onerror = (e: any) => {
            console.warn("SpeechRecognition notice:", e.error);
          };

          recognizer.onend = () => {
            // If still recording, restart speech recognition
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
              try {
                recognizer.start();
              } catch {}
            }
          };

          recognizer.start();
          speechRecognitionRef.current = recognizer;
        } catch (recognitionErr) {
          console.warn("Speech recognition initialization notice:", recognitionErr);
        }
      }

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          // Max 5 minutes cap
          if (prev >= 300) {
            stopRecording();
            return 300;
          }
          return prev + 1;
        });
      }, 1000);

      setRecorderState("recording");
    } catch (err: any) {
      console.error("Microphone access error:", err);
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError" ||
        err.message?.toLowerCase().includes("denied") ||
        err.message?.toLowerCase().includes("permission")
      ) {
        setErrorType("permission");
        setErrorMessage(
          "Microphone permission was denied. Please allow microphone access in your browser settings (look for the lock or camera/mic icon in the browser address bar) to record your voice journal."
        );
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorType("device");
        setErrorMessage("No microphone detected. Please plug in or enable an audio input device.");
      } else {
        setErrorType("general");
        setErrorMessage(
          err.message || "Failed to access microphone. Please check your browser audio permissions."
        );
      }
      setRecorderState("error");
      cleanupResources();
    }
  };

  // Stop recording
  const stopRecording = async () => {
    if (recorderState !== "recording") return;

    // Clear interval and stop recognizer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    // Release microphone hardware immediately
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    setRecorderState("reviewing");
  };

  // Optional: Transcribe recorded audio with server-side Gemini 3.8/3.6 Flash
  const handleTranscribeWithGemini = async () => {
    if (!audioBlob) return;

    setIsGeminiTranscribing(true);
    setErrorMessage(null);

    try {
      // Convert audioBlob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(",")[1];
          resolve(base64Data);
        };
        reader.onerror = () => reject(new Error("Failed to read audio data"));
      });
      reader.readAsDataURL(audioBlob);

      const base64Audio = await base64Promise;

      // Get Firebase Auth token
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : "";

      const response = await fetch("/api/gemini/transcribe-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          audioData: base64Audio,
          mimeType: audioBlob.type || "audio/webm",
          userId: auth.currentUser?.uid || "",
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Transcription failed with status ${response.status}`);
      }

      const data = await response.json();
      if (data.transcript && data.transcript.trim()) {
        setTranscript((prev) => (prev ? prev + "\n\n" + data.transcript.trim() : data.transcript.trim()));
      }
    } catch (err: any) {
      console.error("Gemini audio transcription error:", err);
      setErrorMessage("Could not complete AI audio transcription: " + (err.message || "Unknown error"));
    } finally {
      setIsGeminiTranscribing(false);
    }
  };

  // Final actions
  const handleInsertToEditor = () => {
    if (!transcript.trim()) return;
    onSubmitTranscript(transcript.trim(), false);
    onClose();
  };

  const handleSendDirectly = () => {
    if (!transcript.trim()) return;
    onSubmitTranscript(transcript.trim(), true);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      {/* Click outside to close (only when not actively recording) */}
      <div 
        className="absolute inset-0" 
        onClick={() => {
          if (recorderState !== "recording") onClose();
        }} 
      />

      <div className="relative z-10 max-w-lg w-full bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-medium text-stone-100">
                Voice Reflection Journal
              </h3>
              <p className="text-[11px] text-stone-400">
                Private speech-to-text with review before saving
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={recorderState === "recording"}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition disabled:opacity-30 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content by State */}
        <div className="py-6">
          {/* IDLE STATE */}
          {recorderState === "idle" && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 mx-auto shadow-inner">
                <Mic className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-medium text-stone-200">
                  Ready to record your reflection
                </p>
                <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto leading-relaxed">
                  Speak your unfiltered thoughts freely. Your speech will be converted into private text so you can review and edit before submitting.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={startRecording}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-medium text-sm transition shadow-sm cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  <span>Start Recording</span>
                </button>
              </div>
            </div>
          )}

          {/* REQUESTING PERMISSION STATE */}
          {recorderState === "requesting" && (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin mx-auto" />
              <p className="text-sm text-stone-300">Requesting microphone access...</p>
              <p className="text-xs text-stone-500">
                Please click "Allow" if prompted by your browser.
              </p>
            </div>
          )}

          {/* RECORDING STATE */}
          {recorderState === "recording" && (
            <div className="text-center py-3 space-y-5">
              {/* Pulsating Indicator */}
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                <span className="absolute inset-2 rounded-full bg-red-500/30 animate-pulse" />
                <div className="relative w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                  <Mic className="w-6 h-6" />
                </div>
              </div>

              {/* Timer */}
              <div>
                <div className="font-mono text-2xl font-semibold text-stone-100 tracking-wider">
                  {formatTime(recordingSeconds)}
                </div>
                <div className="flex items-center justify-center gap-1.5 text-xs text-red-400 mt-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>Recording voice reflection...</span>
                </div>
              </div>

              {/* Live Transcript Preview Box */}
              <div className="text-left bg-stone-950/80 border border-stone-800 rounded-xl p-3.5 min-h-[90px] max-h-[140px] overflow-y-auto">
                <div className="text-[11px] font-medium text-amber-400/80 flex items-center gap-1 mb-1">
                  <Volume2 className="w-3 h-3" />
                  <span>Live transcription preview:</span>
                </div>
                {transcript ? (
                  <p className="text-xs text-stone-200 font-serif leading-relaxed italic">
                    "{transcript}"
                  </p>
                ) : (
                  <p className="text-xs text-stone-500 italic">
                    Listening... start speaking clearly into your microphone.
                  </p>
                )}
              </div>

              {/* Stop Button */}
              <div>
                <button
                  onClick={stopRecording}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-sm transition shadow-sm cursor-pointer"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Finish Recording</span>
                </button>
              </div>
            </div>
          )}

          {/* REVIEWING & EDITING STATE */}
          {recorderState === "reviewing" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span className="flex items-center gap-1 font-medium text-amber-300">
                  <FileText className="w-3.5 h-3.5" />
                  Review & Edit Your Transcript:
                </span>
                <span className="text-[11px] text-stone-500">
                  Duration: {formatTime(recordingSeconds)} • {transcript.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>

              {/* Editable Transcript Textarea */}
              <div className="relative">
                <textarea
                  rows={5}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Your voice reflection transcript will appear here. You can freely edit or type additional thoughts..."
                  className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500/60 rounded-xl p-3 text-sm text-stone-100 font-serif leading-relaxed focus:outline-hidden resize-none"
                />
              </div>

              {/* Gemini Audio Transcription Refinement (if audio recorded and user wants enhanced transcription) */}
              {audioBlob && (
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-stone-500 text-[11px]">
                    Need higher precision or punctuation?
                  </span>
                  <button
                    onClick={handleTranscribeWithGemini}
                    disabled={isGeminiTranscribing}
                    className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 text-[11px] font-medium transition disabled:opacity-40 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    {isGeminiTranscribing ? "Transcribing with Gemini..." : "Refine with Gemini AI"}
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-stone-800 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setRecorderState("idle");
                    setTranscript("");
                    setRecordingSeconds(0);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-750 text-stone-400 hover:text-stone-200 text-xs transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Re-record</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleInsertToEditor}
                    disabled={!transcript.trim()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-medium border border-stone-700 transition disabled:opacity-30 cursor-pointer"
                    title="Insert text into message input for further writing"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Insert into Input</span>
                  </button>

                  <button
                    onClick={handleSendDirectly}
                    disabled={!transcript.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold transition disabled:opacity-40 shadow-sm cursor-pointer"
                    title="Submit directly to Gemini reflection"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Reflection</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ERROR STATE */}
          {recorderState === "error" && (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400 mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h4 className="text-sm font-medium text-stone-200">
                  {errorType === "permission" ? "Microphone Access Required" : "Audio Error"}
                </h4>
                <p className="text-xs text-stone-400 leading-relaxed">
                  {errorMessage}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  onClick={startRecording}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-medium transition cursor-pointer"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs transition cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
