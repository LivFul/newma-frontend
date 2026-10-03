// The whole hero interaction model as a pure reducer. The Interactive layer translates DOM events
// into HeroEvents and carries out the returned effect; nothing here touches the DOM.
import { ECOSYSTEM_SLUGS, type EcosystemSlug } from "@/content/ecosystem/registry";
import type { HeroView } from "./part-props";

export type HeroState = Readonly<{
  view: HeroView;
  pinned: boolean;
  suppressed: boolean;
  active: EcosystemSlug | null;
  /** Mouse pointer is over the graphic (mouse pointers only). */
  hovering: boolean;
  /** A touch tap opened the view and nothing has closed it yet. */
  touchOpen: boolean;
}>;

export type HeroEvent =
  | { type: "pointerEnter" }
  | { type: "pointerLeave" }
  | { type: "focusIn"; slug: EcosystemSlug }
  | { type: "focusOut" }
  | { type: "arrow"; direction: "next" | "prev" }
  | { type: "home" }
  | { type: "end" }
  | { type: "escape" }
  | { type: "toggle" }
  /** `view` is the view at pointerdown, before the tap's own focus event could explode it. */
  | { type: "tap"; slug: EcosystemSlug | null; touch: boolean; view: HeroView }
  | { type: "outsideTap" };

export type HeroEffect =
  | { type: "none" }
  | { type: "focus"; slug: EcosystemSlug }
  | { type: "preventNavigation" }
  | { type: "navigate"; slug: EcosystemSlug };

export type HeroResult = Readonly<{ state: HeroState; effect: HeroEffect }>;

const NO_EFFECT: HeroEffect = Object.freeze({ type: "none" });

// The view is derived, never set directly, so no event ordering can leave it inconsistent.
function settle(draft: Omit<HeroState, "view">): HeroState {
  const open =
    draft.pinned ||
    draft.touchOpen ||
    (!draft.suppressed && (draft.hovering || draft.active !== null));
  return Object.freeze({ ...draft, view: open ? "exploded" : "assembled" });
}

export const INITIAL_HERO_STATE: HeroState = settle({
  pinned: false,
  suppressed: false,
  active: null,
  hovering: false,
  touchOpen: false,
});

const result = (state: HeroState, effect: HeroEffect = NO_EFFECT): HeroResult =>
  Object.freeze({ state, effect });

const LAST = ECOSYSTEM_SLUGS.length - 1;

function moveTo(state: HeroState, index: number): HeroResult {
  const slug = ECOSYSTEM_SLUGS[index]!;
  const next = settle({ ...state, active: slug, suppressed: false });
  return result(next, slug === state.active ? NO_EFFECT : { type: "focus", slug });
}

function arrow(state: HeroState, direction: "next" | "prev"): HeroResult {
  if (state.active === null) return moveTo(state, direction === "next" ? 0 : LAST);
  const current = ECOSYSTEM_SLUGS.indexOf(state.active);
  const target = Math.min(LAST, Math.max(0, current + (direction === "next" ? 1 : -1)));
  return moveTo(state, target);
}

function tap(state: HeroState, event: Extract<HeroEvent, { type: "tap" }>): HeroResult {
  if (!event.touch) return result(state);
  if (event.view === "assembled") {
    return result(settle({ ...state, touchOpen: true }), { type: "preventNavigation" });
  }
  return result(state, event.slug ? { type: "navigate", slug: event.slug } : NO_EFFECT);
}

export function heroReducer(state: HeroState, event: HeroEvent): HeroResult {
  switch (event.type) {
    case "pointerEnter":
      return result(settle({ ...state, hovering: true }));
    case "pointerLeave":
      return result(settle({ ...state, hovering: false, suppressed: false }));
    case "focusIn":
      return result(settle({ ...state, active: event.slug, suppressed: false }));
    case "focusOut":
      return result(settle({ ...state, active: null, suppressed: false }));
    case "arrow":
      return arrow(state, event.direction);
    case "home":
      return moveTo(state, 0);
    case "end":
      return moveTo(state, LAST);
    case "escape":
      return state.view === "assembled"
        ? result(state)
        : result(settle({ ...state, pinned: false, touchOpen: false, suppressed: true }));
    case "toggle":
      return result(
        settle({ ...state, pinned: !state.pinned, suppressed: false, touchOpen: false }),
      );
    case "tap":
      return tap(state, event);
    case "outsideTap":
      return result(state.pinned ? state : settle({ ...state, touchOpen: false }));
  }
}
