/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _shared_aiProviders from "../_shared/aiProviders.js";
import type * as _shared_auth from "../_shared/auth.js";
import type * as _shared_env from "../_shared/env.js";
import type * as _shared_rateLimit from "../_shared/rateLimit.js";
import type * as _shared_sanitize from "../_shared/sanitize.js";
import type * as admin_cleanup from "../admin/cleanup.js";
import type * as admin_mutations from "../admin/mutations.js";
import type * as admin_queries from "../admin/queries.js";
import type * as ai_actions from "../ai/actions.js";
import type * as ai_mutations from "../ai/mutations.js";
import type * as ai_queries from "../ai/queries.js";
import type * as applications_mutations from "../applications/mutations.js";
import type * as applications_queries from "../applications/queries.js";
import type * as auth from "../auth.js";
import type * as calendar_mutations from "../calendar/mutations.js";
import type * as calendar_queries from "../calendar/queries.js";
import type * as contacts_mutations from "../contacts/mutations.js";
import type * as contacts_queries from "../contacts/queries.js";
import type * as crons from "../crons.js";
import type * as cv_actions from "../cv/actions.js";
import type * as cv_mutations from "../cv/mutations.js";
import type * as cv_queries from "../cv/queries.js";
import type * as documents_mutations from "../documents/mutations.js";
import type * as documents_queries from "../documents/queries.js";
import type * as feedback_mutations from "../feedback/mutations.js";
import type * as files_mutations from "../files/mutations.js";
import type * as files_queries from "../files/queries.js";
import type * as financial_mutations from "../financial/mutations.js";
import type * as financial_queries from "../financial/queries.js";
import type * as goals_mutations from "../goals/mutations.js";
import type * as goals_queries from "../goals/queries.js";
import type * as http from "../http.js";
import type * as matcher_actions from "../matcher/actions.js";
import type * as matcher_atsScore from "../matcher/atsScore.js";
import type * as matcher_mutations from "../matcher/mutations.js";
import type * as matcher_queries from "../matcher/queries.js";
import type * as matcher_seedJobs from "../matcher/seedJobs.js";
import type * as mockInterview_mutations from "../mockInterview/mutations.js";
import type * as mockInterview_queries from "../mockInterview/queries.js";
import type * as notifications_mutations from "../notifications/mutations.js";
import type * as notifications_queries from "../notifications/queries.js";
import type * as onboarding_mutations from "../onboarding/mutations.js";
import type * as onboarding_queries from "../onboarding/queries.js";
import type * as onboarding_sanitize from "../onboarding/sanitize.js";
import type * as onboarding_types from "../onboarding/types.js";
import type * as passwordReset from "../passwordReset.js";
import type * as portfolio_mutations from "../portfolio/mutations.js";
import type * as portfolio_queries from "../portfolio/queries.js";
import type * as profile_autoBlocks from "../profile/autoBlocks.js";
import type * as profile_blocks from "../profile/blocks.js";
import type * as profile_mutations from "../profile/mutations.js";
import type * as profile_queries from "../profile/queries.js";
import type * as roadmap_mutations from "../roadmap/mutations.js";
import type * as roadmap_queries from "../roadmap/queries.js";
import type * as roadmap_templates from "../roadmap/templates.js";
import type * as router from "../router.js";
import type * as seed from "../seed.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "_shared/aiProviders": typeof _shared_aiProviders;
  "_shared/auth": typeof _shared_auth;
  "_shared/env": typeof _shared_env;
  "_shared/rateLimit": typeof _shared_rateLimit;
  "_shared/sanitize": typeof _shared_sanitize;
  "admin/cleanup": typeof admin_cleanup;
  "admin/mutations": typeof admin_mutations;
  "admin/queries": typeof admin_queries;
  "ai/actions": typeof ai_actions;
  "ai/mutations": typeof ai_mutations;
  "ai/queries": typeof ai_queries;
  "applications/mutations": typeof applications_mutations;
  "applications/queries": typeof applications_queries;
  auth: typeof auth;
  "calendar/mutations": typeof calendar_mutations;
  "calendar/queries": typeof calendar_queries;
  "contacts/mutations": typeof contacts_mutations;
  "contacts/queries": typeof contacts_queries;
  crons: typeof crons;
  "cv/actions": typeof cv_actions;
  "cv/mutations": typeof cv_mutations;
  "cv/queries": typeof cv_queries;
  "documents/mutations": typeof documents_mutations;
  "documents/queries": typeof documents_queries;
  "feedback/mutations": typeof feedback_mutations;
  "files/mutations": typeof files_mutations;
  "files/queries": typeof files_queries;
  "financial/mutations": typeof financial_mutations;
  "financial/queries": typeof financial_queries;
  "goals/mutations": typeof goals_mutations;
  "goals/queries": typeof goals_queries;
  http: typeof http;
  "matcher/actions": typeof matcher_actions;
  "matcher/atsScore": typeof matcher_atsScore;
  "matcher/mutations": typeof matcher_mutations;
  "matcher/queries": typeof matcher_queries;
  "matcher/seedJobs": typeof matcher_seedJobs;
  "mockInterview/mutations": typeof mockInterview_mutations;
  "mockInterview/queries": typeof mockInterview_queries;
  "notifications/mutations": typeof notifications_mutations;
  "notifications/queries": typeof notifications_queries;
  "onboarding/mutations": typeof onboarding_mutations;
  "onboarding/queries": typeof onboarding_queries;
  "onboarding/sanitize": typeof onboarding_sanitize;
  "onboarding/types": typeof onboarding_types;
  passwordReset: typeof passwordReset;
  "portfolio/mutations": typeof portfolio_mutations;
  "portfolio/queries": typeof portfolio_queries;
  "profile/autoBlocks": typeof profile_autoBlocks;
  "profile/blocks": typeof profile_blocks;
  "profile/mutations": typeof profile_mutations;
  "profile/queries": typeof profile_queries;
  "roadmap/mutations": typeof roadmap_mutations;
  "roadmap/queries": typeof roadmap_queries;
  "roadmap/templates": typeof roadmap_templates;
  router: typeof router;
  seed: typeof seed;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
