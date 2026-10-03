import { describe, expect, it } from "vitest";
import {
  heroReducer,
  INITIAL_HERO_STATE,
  type HeroEvent,
  type HeroState,
} from "@/components/ecosystem-graphic/state";
import { ECOSYSTEM_SLUGS } from "@/content/ecosystem/registry";

const run = (events: readonly HeroEvent[], from: HeroState = INITIAL_HERO_STATE) =>
  events.reduce(
    (acc, event) => {
      const result = heroReducer(acc.state, event);
      return { state: result.state, effect: result.effect };
    },
    { state: from, effect: { type: "none" } as ReturnType<typeof heroReducer>["effect"] },
  );
const view = (events: readonly HeroEvent[], from?: HeroState) => run(events, from).state.view;
const FIRST = ECOSYSTEM_SLUGS[0];
const SECOND = ECOSYSTEM_SLUGS[1];
const LAST = ECOSYSTEM_SLUGS[5];

describe("heroReducer", () => {
  it("starts assembled, unpinned, unsuppressed with nothing active", () => {
    expect(INITIAL_HERO_STATE).toMatchObject({
      view: "assembled",
      pinned: false,
      suppressed: false,
      active: null,
    });
    expect(Object.isFrozen(INITIAL_HERO_STATE)).toBe(true);
  });

  it("never mutates the previous state", () => {
    const before = INITIAL_HERO_STATE;
    const { state } = heroReducer(before, { type: "pointerEnter" });
    expect(state).not.toBe(before);
    expect(before.view).toBe("assembled");
    expect(Object.isFrozen(state)).toBe(true);
  });

  describe("pointer and focus", () => {
    it("explodes on pointer enter and collapses on leave", () => {
      expect(view([{ type: "pointerEnter" }])).toBe("exploded");
      expect(view([{ type: "pointerEnter" }, { type: "pointerLeave" }])).toBe("assembled");
    });
    it("explodes on focus in and records the active slug, collapses on focus out", () => {
      const inside = run([{ type: "focusIn", slug: SECOND }]);
      expect(inside.state).toMatchObject({ view: "exploded", active: SECOND });
      const out = run([{ type: "focusIn", slug: SECOND }, { type: "focusOut" }]);
      expect(out.state).toMatchObject({ view: "assembled", active: null });
    });
    it("keeps the view open while either focus or the pointer is still inside", () => {
      expect(
        view([
          { type: "pointerEnter" },
          { type: "focusIn", slug: FIRST },
          { type: "pointerLeave" },
        ]),
      ).toBe("exploded");
      expect(
        view([{ type: "pointerEnter" }, { type: "focusIn", slug: FIRST }, { type: "focusOut" }]),
      ).toBe("exploded");
    });
  });

  describe("pin (Explore components)", () => {
    it("toggle pins the exploded view and a second toggle unpins it", () => {
      const pinned = run([{ type: "toggle" }]).state;
      expect(pinned).toMatchObject({ view: "exploded", pinned: true });
      expect(run([{ type: "toggle" }], pinned).state).toMatchObject({
        view: "assembled",
        pinned: false,
      });
    });
    it("a pinned view survives pointer leave, focus out and outside taps (hybrid pointers)", () => {
      const events: HeroEvent[] = [
        { type: "toggle" },
        { type: "pointerEnter" },
        { type: "pointerLeave" },
        { type: "focusIn", slug: FIRST },
        { type: "focusOut" },
        { type: "outsideTap" },
      ];
      expect(run(events).state).toMatchObject({ view: "exploded", pinned: true });
    });
    it("unpinning while the pointer is still inside leaves it exploded", () => {
      expect(view([{ type: "pointerEnter" }, { type: "toggle" }, { type: "toggle" }])).toBe(
        "exploded",
      );
    });
  });

  describe("escape and suppression", () => {
    it("collapses, unpins and suppresses while focus stays inside", () => {
      const { state } = run([
        { type: "toggle" },
        { type: "focusIn", slug: SECOND },
        { type: "escape" },
      ]);
      expect(state).toMatchObject({
        view: "assembled",
        pinned: false,
        suppressed: true,
        active: SECOND,
      });
    });
    it("ignores a pointer enter while suppressed, and clears suppression when the pointer leaves", () => {
      const suppressed = run([
        { type: "pointerEnter" },
        { type: "focusIn", slug: FIRST },
        { type: "escape" },
        { type: "pointerLeave" },
        { type: "pointerEnter" },
      ]).state;
      // pointerLeave cleared suppression, so the second enter explodes again.
      expect(suppressed.view).toBe("exploded");
      const stillSuppressed = run([
        { type: "focusIn", slug: FIRST },
        { type: "escape" },
        { type: "pointerEnter" },
      ]).state;
      expect(stillSuppressed).toMatchObject({ view: "assembled", suppressed: true });
    });
    it("clears suppression when focus leaves", () => {
      const { state } = run([
        { type: "focusIn", slug: FIRST },
        { type: "escape" },
        { type: "focusOut" },
      ]);
      expect(state.suppressed).toBe(false);
    });
    it("an arrow or Tab-driven focus in after escape explodes again", () => {
      const afterEscape = run([{ type: "focusIn", slug: FIRST }, { type: "escape" }]).state;
      expect(run([{ type: "focusIn", slug: SECOND }], afterEscape).state).toMatchObject({
        view: "exploded",
        suppressed: false,
        active: SECOND,
      });
      expect(run([{ type: "arrow", direction: "next" }], afterEscape).state).toMatchObject({
        view: "exploded",
        suppressed: false,
      });
    });
    it("escape on an assembled view changes nothing", () => {
      expect(run([{ type: "escape" }]).state).toEqual(INITIAL_HERO_STATE);
    });
  });

  describe("keyboard movement", () => {
    const focused = (slug: (typeof ECOSYSTEM_SLUGS)[number]) =>
      run([{ type: "focusIn", slug }]).state;
    it("next moves to the following slug and asks the UI to focus it", () => {
      const { effect, state } = run([{ type: "arrow", direction: "next" }], focused(FIRST));
      expect(effect).toEqual({ type: "focus", slug: SECOND });
      expect(state.active).toBe(SECOND);
    });
    it("previous moves back", () => {
      const { effect } = run([{ type: "arrow", direction: "prev" }], focused(SECOND));
      expect(effect).toEqual({ type: "focus", slug: FIRST });
    });
    it("walks all six in order", () => {
      const visited: string[] = [FIRST];
      let state = focused(FIRST);
      for (let i = 0; i < 5; i += 1) {
        const result = heroReducer(state, { type: "arrow", direction: "next" });
        state = result.state;
        if (result.effect.type === "focus") visited.push(result.effect.slug);
      }
      expect(visited).toEqual([...ECOSYSTEM_SLUGS]);
    });
    it("does not wrap at either end", () => {
      expect(run([{ type: "arrow", direction: "prev" }], focused(FIRST)).effect.type).toBe("none");
      expect(run([{ type: "arrow", direction: "next" }], focused(LAST)).effect.type).toBe("none");
      expect(run([{ type: "arrow", direction: "next" }], focused(LAST)).state.active).toBe(LAST);
    });
    it("home and end jump to the first and last", () => {
      expect(run([{ type: "home" }], focused(LAST)).effect).toEqual({ type: "focus", slug: FIRST });
      expect(run([{ type: "end" }], focused(FIRST)).effect).toEqual({ type: "focus", slug: LAST });
    });
    it("arrows with no active component start at the ends", () => {
      expect(run([{ type: "arrow", direction: "next" }]).effect).toEqual({
        type: "focus",
        slug: FIRST,
      });
      expect(run([{ type: "arrow", direction: "prev" }]).effect).toEqual({
        type: "focus",
        slug: LAST,
      });
    });
  });

  describe("touch", () => {
    it("the first tap while assembled explodes and prevents navigation", () => {
      const { state, effect } = run([
        { type: "tap", slug: SECOND, touch: true, view: "assembled" },
      ]);
      expect(state.view).toBe("exploded");
      expect(effect).toEqual({ type: "preventNavigation" });
    });
    it("the second tap on a component while exploded navigates", () => {
      const open = run([{ type: "tap", slug: SECOND, touch: true, view: "assembled" }]).state;
      const second = run([{ type: "tap", slug: SECOND, touch: true, view: open.view }], open);
      expect(second.effect).toEqual({ type: "navigate", slug: SECOND });
      expect(second.state.view).toBe("exploded");
    });
    it("a tap on empty graphic space while exploded does nothing", () => {
      const open = run([{ type: "toggle" }]).state;
      expect(
        run([{ type: "tap", slug: null, touch: true, view: "exploded" }], open).effect,
      ).toEqual({ type: "none" });
    });
    it("a tap outside collapses an unpinned touch-opened view", () => {
      const open = run([{ type: "tap", slug: SECOND, touch: true, view: "assembled" }]).state;
      expect(run([{ type: "outsideTap" }], open).state.view).toBe("assembled");
    });
    it("unpinning clears a touch-opened view too", () => {
      const open = run([{ type: "tap", slug: FIRST, touch: true, view: "assembled" }]).state;
      expect(run([{ type: "toggle" }, { type: "toggle" }], open).state.view).toBe("assembled");
    });
    it("mouse clicks are never intercepted", () => {
      const { effect, state } = run([
        { type: "tap", slug: FIRST, touch: false, view: "assembled" },
      ]);
      expect(effect).toEqual({ type: "none" });
      expect(state.view).toBe("assembled");
    });
    it("a mouse pointer leave does not collapse a pinned view", () => {
      expect(view([{ type: "toggle" }, { type: "pointerEnter" }, { type: "pointerLeave" }])).toBe(
        "exploded",
      );
    });
  });
});
