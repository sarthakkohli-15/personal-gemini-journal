import { 
  db, 
  auth, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot 
} from "../lib/firebase";
import type { PublicStory, PublishStoryInput, UserProfile } from "../types";

export const inspirationService = {
  /**
   * Publishes a journal reflection or monthly recap story after server-side token verification and sanitization
   */
  async publishStory(
    input: PublishStoryInput, 
    currentUser: UserProfile
  ): Promise<PublicStory> {
    const idToken = await auth.currentUser?.getIdToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (idToken) {
      headers["Authorization"] = `Bearer ${idToken}`;
    }

    // Call server endpoint for server-side token validation and strict sanitization
    const response = await fetch("/api/public-stories/publish", {
      method: "POST",
      headers,
      body: JSON.stringify({
        ...input,
        authorUid: currentUser.uid,
        authorDisplayName: input.isAnonymous ? "Anonymous Journaler" : (input.authorDisplayName || currentUser.displayName || "Journaler"),
        authorPhotoURL: input.isAnonymous ? null : currentUser.photoURL,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server returned ${response.status}`);
    }

    const data = await response.json();
    const sanitizedStory: PublicStory = data.story;

    // Persist to the isolated public collection /publicStories/{storyId}
    const storyDocRef = doc(db, "publicStories", sanitizedStory.id);
    await setDoc(storyDocRef, sanitizedStory);

    return sanitizedStory;
  },

  /**
   * Unpublishes (deletes) a public story with ownership validation
   */
  async unpublishStory(storyId: string, authorUid: string): Promise<void> {
    const idToken = await auth.currentUser?.getIdToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (idToken) {
      headers["Authorization"] = `Bearer ${idToken}`;
    }

    // Server-side ownership verification
    const checkRes = await fetch("/api/public-stories/unpublish-check", {
      method: "POST",
      headers,
      body: JSON.stringify({ storyAuthorUid: authorUid }),
    });

    if (!checkRes.ok) {
      const errData = await checkRes.json().catch(() => ({}));
      throw new Error(errData.error || "You are not authorized to unpublish this story.");
    }

    // Delete from public collection
    await deleteDoc(doc(db, "publicStories", storyId));
  },

  /**
   * Toggles the gentle "Inspired Me" reaction without competitive metrics or leaderboards
   */
  async toggleInspiredReaction(
    storyId: string, 
    currentInspiredBy: string[] = [], 
    userUid: string
  ): Promise<{ inspired: boolean; newCount: number }> {
    const isAlreadyInspired = currentInspiredBy.includes(userUid);
    const updatedBy = isAlreadyInspired
      ? currentInspiredBy.filter((id) => id !== userUid)
      : [...currentInspiredBy, userUid];

    const updatedCount = Math.max(0, updatedBy.length);

    const storyRef = doc(db, "publicStories", storyId);
    await updateDoc(storyRef, {
      inspiredCount: updatedCount,
      inspiredBy: updatedBy,
    });

    return {
      inspired: !isAlreadyInspired,
      newCount: updatedCount,
    };
  },

  /**
   * Listen to public stories in real time
   */
  subscribePublicStories(callback: (stories: PublicStory[]) => void) {
    try {
      const storiesRef = collection(db, "publicStories");
      const q = query(storiesRef, orderBy("publishedAt", "desc"));
      return onSnapshot(
        q, 
        (snapshot) => {
          const stories: PublicStory[] = [];
          snapshot.forEach((docSnap) => {
            const d = docSnap.data();
            stories.push({
              id: docSnap.id,
              authorUid: d.authorUid || "",
              authorDisplayName: d.authorDisplayName || "Anonymous Journaler",
              authorPhotoURL: d.authorPhotoURL || null,
              isAnonymous: Boolean(d.isAnonymous),
              sourceType: d.sourceType || "reflection",
              sourceOriginalId: d.sourceOriginalId || "",
              title: d.title || "Untitled Inspiration",
              content: d.content || "",
              category: d.category || "Reflection",
              highlights: Array.isArray(d.highlights) ? d.highlights : [],
              photos: Array.isArray(d.photos) ? d.photos : [],
              publishedAt: d.publishedAt || new Date().toISOString(),
              inspiredCount: typeof d.inspiredCount === "number" ? d.inspiredCount : (d.inspiredBy?.length || 0),
              inspiredBy: Array.isArray(d.inspiredBy) ? d.inspiredBy : [],
            });
          });
          callback(stories);
        },
        (error) => {
          console.warn("Realtime subscription fallback or permission notice:", error);
          // Fallback to one-time query
          this.fetchPublicStories().then(callback).catch(() => callback([]));
        }
      );
    } catch (err) {
      console.warn("Could not setup realtime listener, falling back to manual fetch:", err);
      this.fetchPublicStories().then(callback).catch(() => callback([]));
      return () => {};
    }
  },

  /**
   * One-time fetch of public stories
   */
  async fetchPublicStories(): Promise<PublicStory[]> {
    try {
      const storiesRef = collection(db, "publicStories");
      const q = query(storiesRef, orderBy("publishedAt", "desc"));
      const snapshot = await getDocs(q);
      const stories: PublicStory[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        stories.push({
          id: docSnap.id,
          authorUid: d.authorUid || "",
          authorDisplayName: d.authorDisplayName || "Anonymous Journaler",
          authorPhotoURL: d.authorPhotoURL || null,
          isAnonymous: Boolean(d.isAnonymous),
          sourceType: d.sourceType || "reflection",
          sourceOriginalId: d.sourceOriginalId || "",
          title: d.title || "Untitled Inspiration",
          content: d.content || "",
          category: d.category || "Reflection",
          highlights: Array.isArray(d.highlights) ? d.highlights : [],
          photos: Array.isArray(d.photos) ? d.photos : [],
          publishedAt: d.publishedAt || new Date().toISOString(),
          inspiredCount: typeof d.inspiredCount === "number" ? d.inspiredCount : (d.inspiredBy?.length || 0),
          inspiredBy: Array.isArray(d.inspiredBy) ? d.inspiredBy : [],
        });
      });
      return stories;
    } catch (err) {
      console.error("Error fetching public stories:", err);
      return [];
    }
  }
};
