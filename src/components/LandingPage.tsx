import React from "react";
import { BookOpen, Sparkles, Shield, Compass, BrainCircuit, ArrowRight } from "lucide-react";

interface LandingPageProps {
  onSignIn: () => void;
  loading: boolean;
  error?: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSignIn, loading, error }) => {
  return (
    <div className="min-h-screen bg-[#141210] text-[#EDE8E3] flex flex-col justify-between selection:bg-amber-500/30">
      {/* Top Header */}
      <header className="px-6 py-6 max-w-6xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="font-serif text-lg tracking-tight font-medium text-stone-100">
            Reflections & Journal
          </span>
        </div>

        <button
          onClick={onSignIn}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-stone-200 bg-stone-900 border border-stone-800 hover:border-stone-700 hover:bg-stone-800/80 rounded-xl transition shadow-sm disabled:opacity-50"
        >
          <span>Sign In</span>
          <ArrowRight className="w-4 h-4 text-stone-400" />
        </button>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-6 py-12 sm:py-20 flex-1 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/25 mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Intelligent Journaling Powered by Gemini & Cloud Firestore</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-serif tracking-tight text-[#F7F4EF] max-w-3xl leading-[1.15]">
          A private sanctuary for your thoughts and self-discovery.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-stone-400 max-w-2xl font-light leading-relaxed">
          Write multi-turn journal entries and engage in reflective dialogue with Gemini. 
          Unpack emotions, brainstorm ideas, and receive structured takeaways—with every word strictly isolated to your private database.
        </p>

        {error && (
          <div className="mt-6 max-w-md w-full p-3.5 rounded-xl bg-red-950/40 border border-red-800/50 text-red-200 text-xs text-left">
            <p className="font-semibold mb-1">Sign-in Notice:</p>
            <p>{error}</p>
          </div>
        )}

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={onSignIn}
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-semibold text-sm shadow-lg shadow-amber-900/20 transition active:scale-[0.98] disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-stone-950/30 border-t-stone-950 rounded-full animate-spin"></span>
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google Sign-In</span>
              </>
            )}
          </button>
        </div>

        {/* Feature Pillars */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="p-6 rounded-2xl bg-stone-900/60 border border-stone-800/80 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-stone-200 text-base mb-1.5">Zero-Trust Isolation</h3>
            <p className="text-sm text-stone-400 leading-relaxed">
              Every entry is written directly to your own authenticated Firestore partition. No other user can ever read your reflections.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-stone-900/60 border border-stone-800/80 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-stone-200 text-base mb-1.5">Gemini Guided Reflection</h3>
            <p className="text-sm text-stone-400 leading-relaxed">
              Converse with an empathetic AI sounding board. Unpack difficult situations, brainstorm creative ideas, and discover underlying patterns.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-stone-900/60 border border-stone-800/80 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-stone-200 text-base mb-1.5">Intelligent Summaries</h3>
            <p className="text-sm text-stone-400 leading-relaxed">
              Automatic synthesis generates titles and key takeaways for each session, building a searchable chronicled history of your personal growth.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-stone-900 max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2">
        <p>© 2026 Journal & Reflections. Private & Secure.</p>
        <p className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Firebase Auth & Cloud Firestore Connected
        </p>
      </footer>
    </div>
  );
};
