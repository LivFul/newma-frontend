"use client";

import { useReducer } from "react";
import {
  createHeroState,
  heroReducer,
  type HeroEffect,
  type HeroEvent,
  type HeroSeed,
  type HeroState,
} from "./state";

type Slot = Readonly<{ state: HeroState; effect: HeroEffect }>;

// A no-op event keeps the previous slot, so React bails out and the Motion parts do not re-render.
function reduceSlot(previous: Slot, event: HeroEvent): Slot {
  const next = heroReducer(previous.state, event);
  return next.state === previous.state && next.effect.type === "none" ? previous : next;
}

export function useHeroState(seed: HeroSeed) {
  const [slot, dispatch] = useReducer(reduceSlot, seed, (initial): Slot => ({
    state: createHeroState(initial),
    effect: { type: "none" },
  }));
  return { state: slot.state, effect: slot.effect, dispatch } as const;
}
