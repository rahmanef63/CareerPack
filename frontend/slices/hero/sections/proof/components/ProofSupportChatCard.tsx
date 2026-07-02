import type { CSSProperties } from "react";
import type { ProofCardContent, SupportChatBubbleWithMeta } from "../types/proof.types";
import { ProofCardShell } from "./ProofCardShell";
import { cn } from "@/shared/lib/utils";

interface ProofSupportChatCardProps {
  content: ProofCardContent;
  bubbles: SupportChatBubbleWithMeta[];
  style?: CSSProperties;
}

/** Proof card #3 — an illustrative chat mock of the AI support/assistant
 * feature. UI illustration of a capability, not a transcript claim. */
export function ProofSupportChatCard({ content, bubbles, style }: ProofSupportChatCardProps) {
  return (
    <ProofCardShell title={content.title} description={content.description} style={style}>
      <div className="flex flex-col gap-2">
        {bubbles.map((bubble) => (
          <div key={bubble.id} className={cn("flex", bubble.alignClassName)}>
            <p className={cn("max-w-[85%] rounded-2xl px-3.5 py-2 text-sm", bubble.bubbleClassName)}>
              {bubble.text}
            </p>
          </div>
        ))}
      </div>
    </ProofCardShell>
  );
}
