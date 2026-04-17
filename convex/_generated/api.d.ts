/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as applications from "../applications.js";
import type * as auth from "../auth.js";
import type * as chat from "../chat.js";
import type * as cv from "../cv.js";
import type * as documents from "../documents.js";
import type * as financial from "../financial.js";
import type * as goals from "../goals.js";
import type * as http from "../http.js";
import type * as interviews from "../interviews.js";
import type * as notifications from "../notifications.js";
import type * as roadmaps from "../roadmaps.js";
import type * as router from "../router.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  applications: typeof applications;
  auth: typeof auth;
  chat: typeof chat;
  cv: typeof cv;
  documents: typeof documents;
  financial: typeof financial;
  goals: typeof goals;
  http: typeof http;
  interviews: typeof interviews;
  notifications: typeof notifications;
  roadmaps: typeof roadmaps;
  router: typeof router;
  seed: typeof seed;
  users: typeof users;
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
