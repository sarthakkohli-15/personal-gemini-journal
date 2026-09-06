import { useState, useEffect } from "react";
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  cleanForFirestore
} from "./lib/firebase";
import { Navbar } from "./components/Navbar";
import { LandingPage } from "./components/LandingPage";
import { HistorySidebar } from "./components/HistorySidebar";
import { JournalEditor } from "./components/JournalEditor";
import { GrowthDashboard } from "./components/GrowthDashboard";
import { InspirationSpace } from "./components/InspirationSpace";
import type { JournalEntry, UserProfile } from "./types";
import { BookOpen } from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<"journal" | "growth" | "inspiration">("journal");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [entriesLoading, setEntriesLoading] = useState(false);

  // Monitor Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile: UserProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || "Journaler",
          photoURL: user.photoURL,
        };
        setCurrentUser(profile);
        setAuthError(null);

        // Store user profile record in Firestore
        try {
          await setDoc(
            doc(db, "users", user.uid),
            {
              id: user.uid,
              email: user.email || "",
              displayName: user.displayName || "",
              photoURL: user.photoURL || "",
              createdAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (err) {
          console.warn("Could not sync user profile document:", err);
        }

        // Fetch User's Isolated Entries
        await fetchUserEntries(user.uid);
      } else {
        setCurrentUser(null);
        setEntries([]);
        setActiveEntry(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch entries for authenticated user
  const fetchUserEntries = async (userId: string) => {
    setEntriesLoading(true);
    try {
      const entriesRef = collection(db, "users", userId, "entries");
      const q = query(entriesRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const loadedEntries: JournalEntry[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        loadedEntries.push({
          id: docSnap.id,
          userId: data.userId || userId,
          title: data.title || "Untitled Reflection",
          category: data.category || "Reflection",
          summary: data.summary || "",
          messages: Array.isArray(data.messages) ? data.messages : [],
          photos: Array.isArray(data.photos) ? data.photos : [],
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      });

      setEntries(loadedEntries);

      if (loadedEntries.length > 0) {
        setActiveEntry(loadedEntries[0]);
      } else {
        // Create initial entry template
        const initial = createNewEntryObject(userId);
        setActiveEntry(initial);
      }
    } catch (err) {
      console.error("Error fetching entries from Firestore:", err);
    } finally {
      setEntriesLoading(false);
    }
  };

  // Helper to create a new blank entry object
  const createNewEntryObject = (userId: string): JournalEntry => {
    return {
      id: "entry_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8),
      userId,
      title: "New Reflection",
      category: "Reflection",
      summary: "",
      messages: [],
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  // Google Sign-In handler
  const handleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Sign-in error:", err);
      if (err.code === "auth/popup-blocked") {
        setAuthError(
          "The sign-in popup was blocked by your browser. Please allow popups or open the app in a new tab."
        );
      } else if (err.code === "auth/cancelled-popup-request") {
        setAuthError("Sign-in was cancelled.");
      } else {
        setAuthError(err.message || "Failed to sign in with Google.");
      }
      setAuthLoading(false);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setEntries([]);
      setActiveEntry(null);
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  // Start a new reflection
  const handleNewEntry = () => {
    if (!currentUser) return;
    const newEntry = createNewEntryObject(currentUser.uid);
    setActiveEntry(newEntry);
  };

  // Save/Update an entry to Firestore
  const handleUpdateEntry = async (updated: JournalEntry) => {
    if (!currentUser) return;

    setActiveEntry(updated);

    // Update in local array
    setEntries((prev) => {
      const index = prev.findIndex((e) => e.id === updated.id);
      if (index >= 0) {
        const copy = [...prev];
        copy[index] = updated;
        return copy;
      } else {
        return [updated, ...prev];
      }
    });

    // Persist to user's isolated Firestore collection
    setIsSaving(true);
    try {
      const entryDocRef = doc(db, "users", currentUser.uid, "entries", updated.id);
      await setDoc(entryDocRef, cleanForFirestore(updated), { merge: true });
    } catch (err) {
      console.error("Firestore save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete an entry
  const handleDeleteEntry = async (entryId: string) => {
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, "users", currentUser.uid, "entries", entryId));

      setEntries((prev) => {
        const filtered = prev.filter((e) => e.id !== entryId);
        if (activeEntry?.id === entryId) {
          setActiveEntry(filtered.length > 0 ? filtered[0] : createNewEntryObject(currentUser.uid));
        }
        return filtered;
      });
    } catch (err) {
      console.error("Firestore delete error:", err);
    }
  };

  // Loading Screen
  if (authLoading && !currentUser) {
    return (
      <div className="min-h-screen bg-[#141210] flex flex-col items-center justify-center text-stone-200">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 animate-pulse">
          <BookOpen className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-stone-300">Loading your private journal...</p>
      </div>
    );
  }

  // Unauthenticated Landing Page
  if (!currentUser) {
    return (
      <LandingPage
        onSignIn={handleSignIn}
        loading={authLoading}
        error={authError}
      />
    );
  }

  // Authenticated Dashboard
  return (
    <div className="min-h-screen flex flex-col bg-[#141210] text-[#EDE8E3]">
      <Navbar
        user={currentUser}
        onSignOut={handleSignOut}
        syncing={isSaving}
        activeView={activeView}
        onSelectView={setActiveView}
      />

      {activeView === "inspiration" ? (
        <main className="flex-1 flex flex-col overflow-hidden">
          <InspirationSpace
            currentUser={currentUser}
            onNavigateToWrite={() => setActiveView("journal")}
            onNavigateToGrowth={() => setActiveView("growth")}
          />
        </main>
      ) : activeView === "growth" ? (
        <main className="flex-1 flex flex-col overflow-hidden">
          <GrowthDashboard
            user={currentUser}
            entries={entries}
            onNavigateToWrite={() => setActiveView("journal")}
            onNavigateToInspiration={() => setActiveView("inspiration")}
          />
        </main>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <HistorySidebar
            entries={entries}
            activeEntryId={activeEntry?.id || null}
            onSelectEntry={(entry) => setActiveEntry(entry)}
            onNewEntry={handleNewEntry}
            onDeleteEntry={handleDeleteEntry}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onNavigateToGrowth={() => setActiveView("growth")}
          />

          <main className="flex-1 flex flex-col overflow-hidden">
            {entriesLoading && entries.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-stone-400 text-xs">
                <div className="text-center">
                  <span className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin inline-block mb-2"></span>
                  <p>Retrieving your isolated reflections...</p>
                </div>
              </div>
            ) : activeEntry ? (
              <JournalEditor
                key={activeEntry.id}
                entry={activeEntry}
                onUpdateEntry={handleUpdateEntry}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                isSaving={isSaving}
                currentUser={currentUser}
                onNavigateToInspiration={() => setActiveView("inspiration")}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-stone-500 text-sm">
                Select or create a reflection to begin.
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
