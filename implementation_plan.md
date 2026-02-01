# Implementation Plan: Convex Integration & Feature Completion

This plan outlines the steps to integrate the provided `convex/` backend into the existing Vite + React application, aligning with the "Career Starter Pack" roadmap.

## [Goal Description]
Integrate the provided Convex backend (Schema, Functions, Auth) into the current Vite application. Replace the mock authentication with `@convex-dev/auth`, and connect frontend features (CV, Interview, Roadmap) to the real backend database, enabling data persistence and real-time updates.

## User Review Required
> [!IMPORTANT]
> The project architecture is **Vite (SPA)**, but the `convex/` folder uses `@convex-dev/auth` which is fully compatible. The original plan mentioned Clerk, but we will strictly follow the provided `convex/` code which uses Convex Auth (Password + Anonymous).

> [!WARNING]
> This migration will replace the existing `features/auth` implementation. Ensure you have backed up any custom auth logic if it exists (currently seems to be mock/local).

## Proposed Changes

### 1. Infrastructure & Dependencies
#### [MODIFY] `package.json`
-  Install required dependencies: `convex`, `@convex-dev/auth`, `@radix-ui/react-dropdown-menu`.
-  Verify `vite` configuration supports top-level await (usually standard in newer versions).

### 2. Core Configuration
#### [NEW] `src/ConvexClientProvider.tsx`
-  Create a wrapper component for `ConvexAuthNextJS` (or React equivalent) and `ConvexProvider`.
-  Configure with `VITE_CONVEX_URL`.

#### [MODIFY] `src/main.tsx`
-  Wrap the app with `ConvexClientProvider`.

### 3. Authentication (Scenario 1: Onboarding)
#### [MODIFY] `src/features/auth/`
-  Replace `AuthProvider` context with Convex Auth logic (`useAuthActions`, `useConvexAuth`).
-  Update `LoginPage.tsx` to use `convex/auth` functions (`signIn` with "password" or "anonymous").
-  Update `ProtectedRoute` in `App.tsx` to check `isAuthenticated` from Convex.

### 4. Feature Integration

#### A. CV Generator (Scenario 1)
-  **Backend**: `convex/cv.ts` (Already exists).
-  **Frontend**: Update `src/features/cv-generator/hooks/useCvGenerator.ts` (or similar).
-  **Action**: Replace local state/mock API with:
    -  Query: `api.cv.get` (check specific function name).
    -  Mutation: `api.cv.save` or `update`.

#### B. Mock Interview (Scenario 2)
-  **Backend**: `convex/interviews.ts`.
-  **Frontend**: Update `src/features/mock-interview` or `src/features/ai-chat`.
-  **Action**:
    -  Store interview sessions in `mockInterviews` table.
    -  Use `convex/ai.ts` (if available) or client-side OpenAI call (secured via Convex Action preferred) for generating questions/feedback.

#### C. Skill Roadmap (Scenario 4)
-  **Backend**: `convex/roadmaps.ts`
-  **Frontend**: Update `src/features/skill-roadmap`.
-  **Action**: Save user progress (`completedAt`, `status`) to `skillRoadmaps` table.

### 5. Cleanup
-  Remove `src/shared/mock-db` usage where replaced by Convex.

## Verification Plan

### Automated Tests
-  Run `npx convex dev` and ensure it connects to the project `exuberant-marlin-710`.
-  Verify type generation with `npx convex dev` running.

### Manual Verification
1.  **Auth**:
    -  Register a new user via the UI.
    -  Check the Convex Dashboard -> Data -> `users` table to see the new record.
    -  Log out and Log in.
2.  **CV**:
    -  Create a CV, save it.
    -  Refresh page, ensure CV data loads from backend.
3.  **Interview**:
    -  Complete a mock interview session.
    -  Check `mockInterviews` table for the record.
