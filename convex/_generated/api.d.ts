/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _seeds_aiDefaults from "../_seeds/aiDefaults.js";
import type * as _seeds_careerGraph_index from "../_seeds/careerGraph/index.js";
import type * as _seeds_careerGraph_tech from "../_seeds/careerGraph/tech.js";
import type * as _seeds_careerGraph_types from "../_seeds/careerGraph/types.js";
import type * as _seeds_documents_ae from "../_seeds/documents/ae.js";
import type * as _seeds_documents_au from "../_seeds/documents/au.js";
import type * as _seeds_documents_de from "../_seeds/documents/de.js";
import type * as _seeds_documents_id from "../_seeds/documents/id.js";
import type * as _seeds_documents_index from "../_seeds/documents/index.js";
import type * as _seeds_documents_jp from "../_seeds/documents/jp.js";
import type * as _seeds_documents_kr from "../_seeds/documents/kr.js";
import type * as _seeds_documents_nl from "../_seeds/documents/nl.js";
import type * as _seeds_documents_sa from "../_seeds/documents/sa.js";
import type * as _seeds_documents_sg from "../_seeds/documents/sg.js";
import type * as _seeds_documents_types from "../_seeds/documents/types.js";
import type * as _seeds_roadmapTemplates_business_index from "../_seeds/roadmapTemplates/business/index.js";
import type * as _seeds_roadmapTemplates_creative_index from "../_seeds/roadmapTemplates/creative/index.js";
import type * as _seeds_roadmapTemplates_education_index from "../_seeds/roadmapTemplates/education/index.js";
import type * as _seeds_roadmapTemplates_finance_index from "../_seeds/roadmapTemplates/finance/index.js";
import type * as _seeds_roadmapTemplates_government_index from "../_seeds/roadmapTemplates/government/index.js";
import type * as _seeds_roadmapTemplates_health_index from "../_seeds/roadmapTemplates/health/index.js";
import type * as _seeds_roadmapTemplates_hr_index from "../_seeds/roadmapTemplates/hr/index.js";
import type * as _seeds_roadmapTemplates_index from "../_seeds/roadmapTemplates/index.js";
import type * as _seeds_roadmapTemplates_social_index from "../_seeds/roadmapTemplates/social/index.js";
import type * as _seeds_roadmapTemplates_tech_index from "../_seeds/roadmapTemplates/tech/index.js";
import type * as _seeds_roadmapTemplates_types from "../_seeds/roadmapTemplates/types.js";
import type * as _shared_aiOutput from "../_shared/aiOutput.js";
import type * as _shared_aiProviders from "../_shared/aiProviders.js";
import type * as _shared_aiResolve from "../_shared/aiResolve.js";
import type * as _shared_auth from "../_shared/auth.js";
import type * as _shared_bulkDelete from "../_shared/bulkDelete.js";
import type * as _shared_clientIp from "../_shared/clientIp.js";
import type * as _shared_email from "../_shared/email.js";
import type * as _shared_env from "../_shared/env.js";
import type * as _shared_errorSink from "../_shared/errorSink.js";
import type * as _shared_fetchWithTimeout from "../_shared/fetchWithTimeout.js";
import type * as _shared_idempotency from "../_shared/idempotency.js";
import type * as _shared_origin from "../_shared/origin.js";
import type * as _shared_rateLimit from "../_shared/rateLimit.js";
import type * as _shared_redact from "../_shared/redact.js";
import type * as _shared_sanitize from "../_shared/sanitize.js";
import type * as _shared_validate from "../_shared/validate.js";
import type * as admin_aggregator from "../admin/aggregator.js";
import type * as admin_bootstrap from "../admin/bootstrap.js";
import type * as admin_cleanup from "../admin/cleanup.js";
import type * as admin_lib_cascadeDelete from "../admin/lib/cascadeDelete.js";
import type * as admin_lib_skillOps from "../admin/lib/skillOps.js";
import type * as admin_lib_templateOps from "../admin/lib/templateOps.js";
import type * as admin_lib_userOps from "../admin/lib/userOps.js";
import type * as admin_mutations from "../admin/mutations.js";
import type * as admin_queries from "../admin/queries.js";
import type * as admin_unsubscribes from "../admin/unsubscribes.js";
import type * as admin_webhooks from "../admin/webhooks.js";
import type * as aiIdempotency from "../aiIdempotency.js";
import type * as ai_actions from "../ai/actions.js";
import type * as ai_mutations from "../ai/mutations.js";
import type * as ai_queries from "../ai/queries.js";
import type * as ai_skillHandlers from "../ai/skillHandlers.js";
import type * as applications_mutations from "../applications/mutations.js";
import type * as applications_queries from "../applications/queries.js";
import type * as auth from "../auth.js";
import type * as authCheckEmail from "../authCheckEmail.js";
import type * as calendar_mutations from "../calendar/mutations.js";
import type * as calendar_queries from "../calendar/queries.js";
import type * as calendar_reminders from "../calendar/reminders.js";
import type * as contacts_mutations from "../contacts/mutations.js";
import type * as contacts_queries from "../contacts/queries.js";
import type * as crons from "../crons.js";
import type * as cv_actions from "../cv/actions.js";
import type * as cv_mutations from "../cv/mutations.js";
import type * as cv_queries from "../cv/queries.js";
import type * as documents_mutations from "../documents/mutations.js";
import type * as documents_queries from "../documents/queries.js";
import type * as engine_atoms_lib from "../engine/atoms/lib.js";
import type * as engine_atoms_mutations from "../engine/atoms/mutations.js";
import type * as engine_atoms_queries from "../engine/atoms/queries.js";
import type * as engine_atoms_validator from "../engine/atoms/validator.js";
import type * as engine_dp_lib from "../engine/dp/lib.js";
import type * as engine_dp_queries from "../engine/dp/queries.js";
import type * as engine_graph_lib from "../engine/graph/lib.js";
import type * as engine_graph_mutations from "../engine/graph/mutations.js";
import type * as engine_graph_queries from "../engine/graph/queries.js";
import type * as engine_outcomes_calibrator from "../engine/outcomes/calibrator.js";
import type * as engine_outcomes_lib from "../engine/outcomes/lib.js";
import type * as engine_outcomes_mutations from "../engine/outcomes/mutations.js";
import type * as engine_outcomes_queries from "../engine/outcomes/queries.js";
import type * as engine_plan_actions from "../engine/plan/actions.js";
import type * as engine_plan_lib from "../engine/plan/lib.js";
import type * as engine_plan_mutations from "../engine/plan/mutations.js";
import type * as engine_plan_queries from "../engine/plan/queries.js";
import type * as feedback_mutations from "../feedback/mutations.js";
import type * as files_mutations from "../files/mutations.js";
import type * as files_ownership from "../files/ownership.js";
import type * as files_queries from "../files/queries.js";
import type * as financial_mutations from "../financial/mutations.js";
import type * as financial_queries from "../financial/queries.js";
import type * as goals_mutations from "../goals/mutations.js";
import type * as goals_queries from "../goals/queries.js";
import type * as health from "../health.js";
import type * as http from "../http.js";
import type * as matcher_actions from "../matcher/actions.js";
import type * as matcher_atsScore from "../matcher/atsScore.js";
import type * as matcher_external from "../matcher/external.js";
import type * as matcher_mutations from "../matcher/mutations.js";
import type * as matcher_queries from "../matcher/queries.js";
import type * as matcher_salaryStats from "../matcher/salaryStats.js";
import type * as matcher_seedJobs from "../matcher/seedJobs.js";
import type * as mockInterview_mutations from "../mockInterview/mutations.js";
import type * as mockInterview_queries from "../mockInterview/queries.js";
import type * as notifications_digest from "../notifications/digest.js";
import type * as notifications_mutations from "../notifications/mutations.js";
import type * as notifications_queries from "../notifications/queries.js";
import type * as onboarding_mutations from "../onboarding/mutations.js";
import type * as onboarding_queries from "../onboarding/queries.js";
import type * as onboarding_sanitize from "../onboarding/sanitize.js";
import type * as onboarding_sanitize_application from "../onboarding/sanitize/application.js";
import type * as onboarding_sanitize_contact from "../onboarding/sanitize/contact.js";
import type * as onboarding_sanitize_cv from "../onboarding/sanitize/cv.js";
import type * as onboarding_sanitize_goal from "../onboarding/sanitize/goal.js";
import type * as onboarding_sanitize_portfolio from "../onboarding/sanitize/portfolio.js";
import type * as onboarding_sanitize_primitives from "../onboarding/sanitize/primitives.js";
import type * as onboarding_sanitize_profile from "../onboarding/sanitize/profile.js";
import type * as onboarding_types from "../onboarding/types.js";
import type * as passwordReset from "../passwordReset.js";
import type * as portfolio_mutations from "../portfolio/mutations.js";
import type * as portfolio_queries from "../portfolio/queries.js";
import type * as profile_autoBlocks from "../profile/autoBlocks.js";
import type * as profile_blocks from "../profile/blocks.js";
import type * as profile_blocks_header from "../profile/blocks/header.js";
import type * as profile_blocks_helpers from "../profile/blocks/helpers.js";
import type * as profile_blocks_sanitize from "../profile/blocks/sanitize.js";
import type * as profile_blocks_types from "../profile/blocks/types.js";
import type * as profile_brandingPayload from "../profile/brandingPayload.js";
import type * as profile_mutations from "../profile/mutations.js";
import type * as profile_queries from "../profile/queries.js";
import type * as roadmap_mutations from "../roadmap/mutations.js";
import type * as roadmap_queries from "../roadmap/queries.js";
import type * as roadmap_saved from "../roadmap/saved.js";
import type * as roadmap_templates from "../roadmap/templates.js";
import type * as router from "../router.js";
import type * as seed from "../seed.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "_seeds/aiDefaults": typeof _seeds_aiDefaults;
  "_seeds/careerGraph/index": typeof _seeds_careerGraph_index;
  "_seeds/careerGraph/tech": typeof _seeds_careerGraph_tech;
  "_seeds/careerGraph/types": typeof _seeds_careerGraph_types;
  "_seeds/documents/ae": typeof _seeds_documents_ae;
  "_seeds/documents/au": typeof _seeds_documents_au;
  "_seeds/documents/de": typeof _seeds_documents_de;
  "_seeds/documents/id": typeof _seeds_documents_id;
  "_seeds/documents/index": typeof _seeds_documents_index;
  "_seeds/documents/jp": typeof _seeds_documents_jp;
  "_seeds/documents/kr": typeof _seeds_documents_kr;
  "_seeds/documents/nl": typeof _seeds_documents_nl;
  "_seeds/documents/sa": typeof _seeds_documents_sa;
  "_seeds/documents/sg": typeof _seeds_documents_sg;
  "_seeds/documents/types": typeof _seeds_documents_types;
  "_seeds/roadmapTemplates/business/index": typeof _seeds_roadmapTemplates_business_index;
  "_seeds/roadmapTemplates/creative/index": typeof _seeds_roadmapTemplates_creative_index;
  "_seeds/roadmapTemplates/education/index": typeof _seeds_roadmapTemplates_education_index;
  "_seeds/roadmapTemplates/finance/index": typeof _seeds_roadmapTemplates_finance_index;
  "_seeds/roadmapTemplates/government/index": typeof _seeds_roadmapTemplates_government_index;
  "_seeds/roadmapTemplates/health/index": typeof _seeds_roadmapTemplates_health_index;
  "_seeds/roadmapTemplates/hr/index": typeof _seeds_roadmapTemplates_hr_index;
  "_seeds/roadmapTemplates/index": typeof _seeds_roadmapTemplates_index;
  "_seeds/roadmapTemplates/social/index": typeof _seeds_roadmapTemplates_social_index;
  "_seeds/roadmapTemplates/tech/index": typeof _seeds_roadmapTemplates_tech_index;
  "_seeds/roadmapTemplates/types": typeof _seeds_roadmapTemplates_types;
  "_shared/aiOutput": typeof _shared_aiOutput;
  "_shared/aiProviders": typeof _shared_aiProviders;
  "_shared/aiResolve": typeof _shared_aiResolve;
  "_shared/auth": typeof _shared_auth;
  "_shared/bulkDelete": typeof _shared_bulkDelete;
  "_shared/clientIp": typeof _shared_clientIp;
  "_shared/email": typeof _shared_email;
  "_shared/env": typeof _shared_env;
  "_shared/errorSink": typeof _shared_errorSink;
  "_shared/fetchWithTimeout": typeof _shared_fetchWithTimeout;
  "_shared/idempotency": typeof _shared_idempotency;
  "_shared/origin": typeof _shared_origin;
  "_shared/rateLimit": typeof _shared_rateLimit;
  "_shared/redact": typeof _shared_redact;
  "_shared/sanitize": typeof _shared_sanitize;
  "_shared/validate": typeof _shared_validate;
  "admin/aggregator": typeof admin_aggregator;
  "admin/bootstrap": typeof admin_bootstrap;
  "admin/cleanup": typeof admin_cleanup;
  "admin/lib/cascadeDelete": typeof admin_lib_cascadeDelete;
  "admin/lib/skillOps": typeof admin_lib_skillOps;
  "admin/lib/templateOps": typeof admin_lib_templateOps;
  "admin/lib/userOps": typeof admin_lib_userOps;
  "admin/mutations": typeof admin_mutations;
  "admin/queries": typeof admin_queries;
  "admin/unsubscribes": typeof admin_unsubscribes;
  "admin/webhooks": typeof admin_webhooks;
  aiIdempotency: typeof aiIdempotency;
  "ai/actions": typeof ai_actions;
  "ai/mutations": typeof ai_mutations;
  "ai/queries": typeof ai_queries;
  "ai/skillHandlers": typeof ai_skillHandlers;
  "applications/mutations": typeof applications_mutations;
  "applications/queries": typeof applications_queries;
  auth: typeof auth;
  authCheckEmail: typeof authCheckEmail;
  "calendar/mutations": typeof calendar_mutations;
  "calendar/queries": typeof calendar_queries;
  "calendar/reminders": typeof calendar_reminders;
  "contacts/mutations": typeof contacts_mutations;
  "contacts/queries": typeof contacts_queries;
  crons: typeof crons;
  "cv/actions": typeof cv_actions;
  "cv/mutations": typeof cv_mutations;
  "cv/queries": typeof cv_queries;
  "documents/mutations": typeof documents_mutations;
  "documents/queries": typeof documents_queries;
  "engine/atoms/lib": typeof engine_atoms_lib;
  "engine/atoms/mutations": typeof engine_atoms_mutations;
  "engine/atoms/queries": typeof engine_atoms_queries;
  "engine/atoms/validator": typeof engine_atoms_validator;
  "engine/dp/lib": typeof engine_dp_lib;
  "engine/dp/queries": typeof engine_dp_queries;
  "engine/graph/lib": typeof engine_graph_lib;
  "engine/graph/mutations": typeof engine_graph_mutations;
  "engine/graph/queries": typeof engine_graph_queries;
  "engine/outcomes/calibrator": typeof engine_outcomes_calibrator;
  "engine/outcomes/lib": typeof engine_outcomes_lib;
  "engine/outcomes/mutations": typeof engine_outcomes_mutations;
  "engine/outcomes/queries": typeof engine_outcomes_queries;
  "engine/plan/actions": typeof engine_plan_actions;
  "engine/plan/lib": typeof engine_plan_lib;
  "engine/plan/mutations": typeof engine_plan_mutations;
  "engine/plan/queries": typeof engine_plan_queries;
  "feedback/mutations": typeof feedback_mutations;
  "files/mutations": typeof files_mutations;
  "files/ownership": typeof files_ownership;
  "files/queries": typeof files_queries;
  "financial/mutations": typeof financial_mutations;
  "financial/queries": typeof financial_queries;
  "goals/mutations": typeof goals_mutations;
  "goals/queries": typeof goals_queries;
  health: typeof health;
  http: typeof http;
  "matcher/actions": typeof matcher_actions;
  "matcher/atsScore": typeof matcher_atsScore;
  "matcher/external": typeof matcher_external;
  "matcher/mutations": typeof matcher_mutations;
  "matcher/queries": typeof matcher_queries;
  "matcher/salaryStats": typeof matcher_salaryStats;
  "matcher/seedJobs": typeof matcher_seedJobs;
  "mockInterview/mutations": typeof mockInterview_mutations;
  "mockInterview/queries": typeof mockInterview_queries;
  "notifications/digest": typeof notifications_digest;
  "notifications/mutations": typeof notifications_mutations;
  "notifications/queries": typeof notifications_queries;
  "onboarding/mutations": typeof onboarding_mutations;
  "onboarding/queries": typeof onboarding_queries;
  "onboarding/sanitize": typeof onboarding_sanitize;
  "onboarding/sanitize/application": typeof onboarding_sanitize_application;
  "onboarding/sanitize/contact": typeof onboarding_sanitize_contact;
  "onboarding/sanitize/cv": typeof onboarding_sanitize_cv;
  "onboarding/sanitize/goal": typeof onboarding_sanitize_goal;
  "onboarding/sanitize/portfolio": typeof onboarding_sanitize_portfolio;
  "onboarding/sanitize/primitives": typeof onboarding_sanitize_primitives;
  "onboarding/sanitize/profile": typeof onboarding_sanitize_profile;
  "onboarding/types": typeof onboarding_types;
  passwordReset: typeof passwordReset;
  "portfolio/mutations": typeof portfolio_mutations;
  "portfolio/queries": typeof portfolio_queries;
  "profile/autoBlocks": typeof profile_autoBlocks;
  "profile/blocks": typeof profile_blocks;
  "profile/blocks/header": typeof profile_blocks_header;
  "profile/blocks/helpers": typeof profile_blocks_helpers;
  "profile/blocks/sanitize": typeof profile_blocks_sanitize;
  "profile/blocks/types": typeof profile_blocks_types;
  "profile/brandingPayload": typeof profile_brandingPayload;
  "profile/mutations": typeof profile_mutations;
  "profile/queries": typeof profile_queries;
  "roadmap/mutations": typeof roadmap_mutations;
  "roadmap/queries": typeof roadmap_queries;
  "roadmap/saved": typeof roadmap_saved;
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
