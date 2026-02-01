# Progress Tracker: Career Starter Pack

Based on analysis of `src/docs/roadmap/diagram-flow.md` and current codebase state.

## 🚨 Critical Architecture Discrepancies
The "Ultimate Template" and "Diagram Flow" describe a **Next.js + Convex** architecture, but the current project is **Vite + React Router**.

- [ ] **Framework**: Current: Vite (`package.json`). Target: Next.js?
- [ ] **Backend**: **Convex** is NOT installed (missing in `dependencies` and root folder).
- [ ] **Auth**: **Clerk** is NOT installed.
- [ ] **Structure**: `app/` directory (Next.js App Router) is missing. Routes are likely in `src/App.tsx`.

## 📍 Directory Structure Status

| Path | Status | Notes |
|------|--------|-------|
| `convex/` | 🔴 Missing | Needs `npx convex dev` init |
| `features/` | 🟢 Exists | Contains core logic slices |
| `shared/block/ui` | 🔴 Missing | UI currently in `src/components/`? |
| `shared/config` | 🟡 Partial | `menu-catalog.ts` status unknown |

## 🛠 Feature Implementation Status

### 1. Onboarding & CV (Scenario 1)
- [x] **Feature Folder**: `src/features/cv-generator`
- [ ] **Convex Schema**: `convex/cv/schema.ts` (Missing)
- [x] **PDF Utils**: `jspdf`, `html2canvas` installed
- [ ] **AI Optimizer**: Logic in `features/cv-generator`?

### 2. Mock Interview (Scenario 2)
- [x] **Feature Folder**: `src/features/mock-interview`
- [x] **Feature Folder**: `src/features/ai-chat`
- [x] **AI Integration**: `openai` installed
- [ ] **Voice Recog**: Check `features/mock-interview` for implementation

### 3. Job Search & Tracker (Scenario 3)
- [x] **Feature Folder**: `src/features/career-dashboard` (Assumed)
- [ ] **Kanban Board**: Check for `KanbanBoardBlock`
- [ ] **Job Search**: `features/jobs` folder missing?

### 4. Skill Roadmap (Scenario 4)
- [x] **Feature Folder**: `src/features/skill-roadmap`
- [ ] **Interactive Nodes**: Check implementation
- [ ] **Progress Tracking**: Needs Convex backend

### 5. Document Vault (Scenario 5)
- [x] **Feature Folder**: `src/features/document-checklist`
- [ ] **Upload Center**: Needs Convex Storage or Edge Store

### 6. Networking Hub (Scenario 6)
- [ ] **Feature Folder**: `src/features/networking` (Missing)
- [ ] **Mentor Matching**: Not implemented

### 7. Financial Planning (Scenario 7)
- [x] **Feature Folder**: `src/features/financial-calculator`
- [x] **Charts**: `recharts` installed

## 📝 Todo List (Next Steps)

### Phase 1: Foundation (High Priority)
- [ ] **Decide Stack**: Confirm migration to Next.js or adapt Convex for Vite.
- [ ] **Init Convex**: Run `npx convex dev`.
- [ ] **Init Auth**: Install Clerk (`@clerk/clerk-react` or `nextjs`).
- [ ] **Refactor UI**: Move UI blocks to `shared/block/ui` if strictly following template.

### Phase 2: Backend Integration
- [ ] **Schema Definition**: Create `convex/schema.ts` matching "Data Models" in PRD.
- [ ] **Migrate Mock Data**: Move items from `src/shared/mock-db` to Convex seed scripts.

### Phase 3: Feature Completion
- [ ] Implement **Networking** feature.
- [ ] Connect `cv-generator` to Real AI (OpenAI/Anthropic via Convex Actions).
- [ ] Build **Mobile Nav** (`PORTAL_CONFIG`).
