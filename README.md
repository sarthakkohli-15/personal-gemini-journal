# 🔐 Personal Gemini Journal

A privacy-first AI-powered personal growth journal built with **Google Gemini, Firebase, Firestore, and Cloud Run**.

Personal Gemini Journal helps users transform everyday thoughts, voice notes, memories, achievements, and challenges into meaningful insights, goals, and monthly stories — helping users measure progress against their **past selves rather than other people**.

## ✨ Key Features

### 📝 AI-Powered Journaling
- Multi-turn conversations powered by Gemini
- Sounding Board mode
- Brainstorming mode
- Socratic reflection mode
- Takeaways and journal synthesis
- Searchable journal history

### 🎙️ Voice Journal
- Record journal entries using your microphone
- Review and edit transcripts before saving
- AI-assisted transcription refinement
- Voice entries remain associated with the authenticated user

### 📸 Photo Memories
- Attach photos to journal entries
- Add captions and memories
- Image previews and lightbox viewing
- Media indicators in journal history

### 📈 Growth Dashboard
Gemini analyzes journal history to surface:

- Achievements and highlights
- Goals
- Recurring themes and interests
- Important decisions
- Lessons learned
- Unresolved questions
- Recent progress
- Personalized suggestions

Insights distinguish between information explicitly stated by the user and AI-inferred observations.

### 🎬 My Month in Moments
An interactive monthly visual story generated from the user's journal.

It can include:

- Monthly achievements
- Challenges
- Lessons
- Photos and memories
- Goals
- Recurring themes
- Personal shifts
- Closing reflection
- Shareable caption

Monthly reflections are stored privately for each authenticated user.

### 🌱 Inspiration Space
Users can optionally share selected reflections to inspire others.

Privacy is the default:

- Nothing is automatically published
- Explicit confirmation is required before sharing
- Users can edit the public title and excerpt
- Anonymous sharing is supported
- Published content is separated from private journal data
- Users can unpublish their stories
- Supportive "Inspired Me" reactions
- No follower counts, rankings, or leaderboards

The goal is to **share progress to inspire, not compete**.

## 🔒 Security & Privacy

Security is a core part of the architecture.

- Firebase Authentication for user identity
- User-owned Firestore paths
- Private journal data stored under authenticated user IDs
- Backend verification of Firebase ID tokens
- Gemini API calls executed server-side
- Gemini API keys are never committed to the repository
- Firestore Security Rules enforce user-level isolation
- Public stories use a separate sanitized collection
- Public sharing is explicitly opt-in
- Input validation and prompt-injection boundaries are applied

Private journal entries follow a structure similar to:

```text
/users/{uid}/entries/{entryId}
```

Monthly reflections:

```text
/users/{uid}/monthlyReflections/{monthKey}
```

Publicly shared sanitized stories are stored separately:

```text
/publicStories/{storyId}
```

## 🛠️ Technology Stack

- **Google Gemini API** — AI conversations and reflection
- **Google AI Studio** — AI development and prototyping
- **Firebase Authentication** — secure authentication
- **Cloud Firestore** — user-isolated journal storage
- **Google Cloud Run** — application deployment
- **Google Cloud Secret Manager** — production secret management
- **React / TypeScript** — frontend
- **Node.js / Express** — secure backend API

## 🚀 Running Locally

### 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd personal-gemini-journal
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create the required local environment configuration.

```env
GEMINI_API_KEY=your_gemini_api_key
```

Do **not** commit API keys or other credentials to GitHub.

Configure the Firebase settings required by the application for your Firebase project.

### 4. Configure Firebase

Enable:

- Firebase Authentication
- Google Sign-In
- Cloud Firestore

Deploy the Firestore Security Rules included in this repository.

### 5. Run the application

```bash
npm run dev
```

## ☁️ Cloud Run Deployment

The production application is designed to run on **Google Cloud Run**.

For production, sensitive credentials such as `GEMINI_API_KEY` should be stored in **Google Cloud Secret Manager** and injected into the Cloud Run service rather than hardcoded into source code.

The Cloud Run service should include the challenge label:

```text
dev-tutorial=cloud-run-ai-challenge
```

Example:

```bash
gcloud run services update <SERVICE_NAME> \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=<REGION>
```

## 🧠 Design Philosophy

Most social platforms encourage users to compare themselves with other people.

Personal Gemini Journal takes the opposite approach.

> **Compare yourself with who you were yesterday, not with someone else today.**

AI is used to help users recognize their own progress, patterns, lessons, goals, and meaningful moments while keeping their private reflections private by default.

## 🏆 Google Gen AI Academy APAC — Ideathon

Built for the **Google Gen AI Academy APAC Cohort 3 Ideathon**.

The project explores how Gemini, Firebase, Firestore, Secret Manager, and Cloud Run can be combined to build a useful AI experience with privacy and security at its foundation.

#AccelerateAIwithCloudRun
