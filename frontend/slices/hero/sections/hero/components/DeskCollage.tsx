import {
  CHECKLIST_ITEMS,
  POLAROID_CAPTION,
  STAMP_TEXT,
  STICKY_NOTE_1_TEXT,
  STICKY_NOTE_2_TEXT,
} from "../constants/hero.constants";
import { DESK_COLLAGE_LAYOUT } from "../config/hero.config";
import { useHeroContent } from "../hooks/useHeroContent";
import { ApplicationTrackerCard } from "./ApplicationTrackerCard";
import { ChecklistCard } from "./ChecklistCard";
import { ResumeMockCard } from "./ResumeMockCard";
import { StickyNote } from "./StickyNote";

/**
 * Right-column "scattered desk" collage — a relative canvas of absolutely
 * positioned, independently-rotated cards. Position/rotation numbers live
 * in config/hero.config.ts (DESK_COLLAGE_LAYOUT); this component only
 * composes content into those slots.
 */
export function DeskCollage() {
  const { resumeSections, applicationRows } = useHeroContent();

  return (
    <div className="relative hidden min-h-[600px] lg:block">
      <ResumeMockCard className={DESK_COLLAGE_LAYOUT.resumeCard} sections={resumeSections} />

      <div
        className={`flex flex-col items-center justify-center rounded-full border-2 border-dashed border-landing-blue bg-landing-paper-2 text-center shadow-xl ${DESK_COLLAGE_LAYOUT.stampBadge}`}
      >
        <p className="px-3 text-[10px] font-bold uppercase leading-tight tracking-wide text-landing-blue">
          {STAMP_TEXT}
        </p>
      </div>

      <StickyNote
        text={STICKY_NOTE_1_TEXT}
        className={DESK_COLLAGE_LAYOUT.stickyNote1}
        bgClassName="bg-landing-mint"
      />

      <ChecklistCard className={DESK_COLLAGE_LAYOUT.checklistCard} items={CHECKLIST_ITEMS} />

      <div className={`overflow-hidden rounded-xl ${DESK_COLLAGE_LAYOUT.polaroid}`}>
        <div className="aspect-[4/3] w-full rounded-t-xl bg-gradient-to-br from-landing-ink to-landing-terra-soft shadow-xl" />
        <div className="rounded-b-xl border border-t-0 border-landing-line bg-landing-card px-3 py-2">
          <p className="font-display text-sm text-landing-ink">{POLAROID_CAPTION}</p>
        </div>
      </div>

      <ApplicationTrackerCard className={DESK_COLLAGE_LAYOUT.trackerCard} rows={applicationRows} />

      <StickyNote
        text={STICKY_NOTE_2_TEXT}
        className={DESK_COLLAGE_LAYOUT.stickyNote2}
        bgClassName="bg-landing-terra"
        textClassName="text-landing-paper-2 not-italic font-semibold"
      />
    </div>
  );
}
