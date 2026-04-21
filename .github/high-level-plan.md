# AI Agent Project Brief: GoStrich

> **STATUS (Updated):** Core app is fully implemented. All sections 3A–3D below are live.
> Key deviations from the original brief:
> - **Storage**: Used Zustand + AsyncStorage (not WatermelonDB/SQLite) — simpler, sufficient
> - **Auth**: Added Google Sign-In + SecureStore (not in original brief)
> - **Foreground-only GPS**: Background tracking not yet implemented
> - **Mascot**: Added Rive ostrich animation (`assets/ostrich.riv`)
>
> See [TECHNICAL_PLAN.md](TECHNICAL_PLAN.md) and [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for the current architecture.

---

## Context & Role

You are an expert React Native and mobile app architect. I want you to build a running tracking application from scratch.

You have full autonomy over the project structure, file naming, state management patterns, and UI/UX design. Your goal is to deliver a robust, modern, and clean codebase that fulfills the requirements below.

## 1. App Identity & Core Philosophy

- **App Name:** GoStrich
- **Concept:** A Strava-inspired running tracker.
- **Architecture Philosophy:** 100% Offline-First.
- **Strict Constraint:** There is NO backend, NO external database (like Firebase/Supabase), and NO server. All data must be generated and stored entirely on the user's local device.

## 2. Technical Stack & Tooling

- **Framework:** React Native (Use Expo, managed workflow preferred).
- **Language:** TypeScript (preferred) or JavaScript.
- **Local Storage:** You must implement a robust local storage solution capable of handling large arrays of GPS coordinates (e.g., local SQLite, Realm, or WatermelonDB — choose the best fit for this use case).
- **Mapping:** Use standard React Native map integrations.

## 3. Core Features to Implement

### A. Location Permissions & Management

- The app must prompt the user for the necessary location permissions (Foreground and Background).
- The UI must gracefully handle denied permissions and guide the user to settings.

### B. The Tracking Engine

- A mechanism to start, pause, and stop a run.
- Must track GPS coordinates reliably while the run is active.
- Needs to calculate the total distance covered (filtering out minor GPS drift if possible).
- Needs to track the duration of the run (a live stopwatch).
- Must calculate and display the current/average pace (Minutes per Kilometer).

### C. Live Map UI

- A main dashboard displaying a map centered on the user's current location.
- As the user runs, the app must draw a visible path (polyline) on the map showing their exact route in real-time.

### D. Activity History

- When a run is stopped, it must be saved to the local device database.
- A dedicated "History" or "Log" screen where the user can view a list of their past runs.
- Each history item should show: Date, Total Distance, Total Time, and Average Pace.

## 4. AI Agent Instructions (How to proceed)

Please act as the lead developer and guide me through building this app. Follow these steps:

1.  **Architecture Proposal:** Based on the requirements above, first propose your chosen libraries (e.g., for mapping, local DB, location tracking) and your planned folder/navigation structure. Ask for my approval.
2.  **Step-by-Step Execution:** Do not write the entire app at once. Break the development down into logical phases (e.g., Phase 1: Setup & Navigation, Phase 2: Map & Tracking UI, Phase 3: GPS Logic & Math, Phase 4: Local Storage).
3.  **Code Generation:** Wait for my confirmation before moving from one phase to the next. Provide the exact terminal commands needed to install dependencies alongside the code.
