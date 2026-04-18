# Product Flow Diagram (Simplified)

## Scenario 1: Onboarding and CV Creation
1. User opens landing page.
2. User signs up or logs in.
3. User completes onboarding preferences.
4. User enters CV generator.
5. User uses AI helper to improve CV content.
6. User checks ATS readiness.
7. User exports CV and starts applying to jobs.

## Scenario 2: Mock Interview
1. User opens interview simulator from dashboard.
2. User selects role/industry and difficulty.
3. System serves question set.
4. User submits answers.
5. System generates feedback and score.
6. Session is saved to practice history.

## Scenario 3: Job Application Tracking
1. User finds and saves target jobs.
2. User applies using selected CV.
3. Application is tracked by status:
   - Applied
   - Screening
   - Interview
   - Offer / Rejected
4. User reviews analytics in dashboard.

## Scenario 4: Skill Roadmap
1. User selects target career path.
2. System generates skill roadmap.
3. User marks tasks/resources as completed.
4. Progress percentage is updated.

## Scenario 5: Document Checklist
1. User opens checklist.
2. User marks required documents ready/not ready.
3. Progress updates in real time.
4. Missing docs become action items.

## Scenario 6: Financial Planning
1. User inputs location and expected salary.
2. User fills expense assumptions.
3. System calculates readiness score and gap.
4. User tracks improvement over time.

## Data Flow Overview
- Frontend: Next.js (`frontend/`)
- Backend: Convex functions (`convex/`)
- Auth/session: `@convex-dev/auth`
- Feature data persists in Convex tables:
  - `userProfiles`, `cvs`, `jobApplications`, `skillRoadmaps`
  - `documentChecklists`, `mockInterviews`, `financialPlans`, `careerGoals`
