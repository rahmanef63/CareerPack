/**
 * MicroInteractions — re-export aggregator. Implementations live in
 * `./micro/<group>.tsx` so each file stays tight while callers keep
 * importing from `@/shared/components/interactions/MicroInteractions`.
 */

export {
  Ripple, SuccessCheck, Shimmer, ConfettiBurst, AnimatedProgress, TypingDots,
} from "./micro/visual";
export { StaggerList, Parallax } from "./micro/scroll";
export {
  LongPressMenu, MagneticTabs, SwipeToDelete, PullToRefresh,
} from "./micro/gestures";
export { useHapticPress, useDragReorder } from "./micro/hooks";
