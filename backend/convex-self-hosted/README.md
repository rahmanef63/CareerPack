# Convex Self-Hosted (Per Project)

This folder holds the self-hosted Convex backend stack dedicated to this project.
The mode is optional — development still defaults to Convex cloud dev.

## Quick Start

1. Copy the env file:
   - PowerShell: `Copy-Item .env.example .env`
   - Bash: `cp .env.example .env`

2. Pull the official image (optional, just to confirm access):
   docker pull ghcr.io/get-convex/convex-backend:latest

3. Start the backend:
   `pnpm run backend:selfhosted:up`

4. Check the logs:
   `pnpm run backend:selfhosted:logs`

   If an auth error such as `Missing environment variable JWT_PRIVATE_KEY` shows up,
   make sure the `.env` file contains:
   - `JWT_PRIVATE_KEY=...`
   - `CONVEX_SITE_URL=http://localhost:3210`

5. Push Convex functions to the self-hosted backend:
   - Generate an admin key first:
     pnpm run backend:selfhosted:admin-key
   - Copy the resulting key into `backend/convex-self-hosted/convex.env` under `CONVEX_SELF_HOSTED_ADMIN_KEY=...`
   pnpm run backend:selfhosted:push

6. Seed sample data (after a user has successfully signed in / signed up):
   pnpm run backend:selfhosted:seed

7. Set the frontend env (`frontend/.env.local`):
   NEXT_PUBLIC_CONVEX_URL=http://localhost:3210

## Notes

- If `docker pull` from `ghcr.io` fails, log in with a GitHub PAT that has the `read:packages` scope (not your account password).
- This stack is isolated per project, so it shares no database with other projects.
- If auth still fails with `InvalidAccountId`, reset the local data:
  - `docker compose -f backend/convex-self-hosted/docker-compose.yml down -v`
  - `pnpm run backend:selfhosted:up`
  - `pnpm run backend:selfhosted:push`
