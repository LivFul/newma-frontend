// Value: protects=scene labels are sized from the measured text and drawn on top of the scene; fails_when=the sprite scale stops following the canvas size or labels start depth-testing behind meshes; why_new=no test covered label sprites; seam=none
// Value: protects=a browser without a 2D canvas fails loudly instead of drawing blank labels; fails_when=createLabelSprite silently continues with no context; why_new=the scene's fallback relies on this throw; seam=none
import * as THREE from "three";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createLabelSprite } from "@/components/workflow-3d/labels";

/** The 2D context calls a label makes; jsdom has no canvas backend, so this records them. */
function fakeContext(charWidth: number) {
  return {
    font: "",
    textAlign: "",
    textBaseline: "",
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    measureText: (text: string) => ({ width: text.length * charWidth }),
    beginPath: vi.fn(),
    roundRect: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createLabelSprite", () => {
  it("sizes the sprite from the widest line and draws a bordered card on top of the scene", () => {
    const context = fakeContext(10);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    );

    const { sprite } = createLabelSprite(["short", "a longer line"], {
      fontPx: 20,
      color: "#fff",
      background: "#000",
      border: "#f00",
      padding: 8,
      weight: 500,
      worldScale: 2,
    });

    const material = sprite.material as THREE.SpriteMaterial;
    const canvas = material.map!.image as HTMLCanvasElement;
    // 13 characters at 10 px plus 8 px padding each side, all at the 2x pixel ratio.
    expect(canvas.width).toBe(13 * 10 + 8 * 2 * 2);
    expect(sprite.scale.x).toBeCloseTo((canvas.width / 2) * 0.011 * 2, 6);
    expect(sprite.scale.y).toBeCloseTo((canvas.height / 2) * 0.011 * 2, 6);
    expect(context.fillText).toHaveBeenCalledTimes(2);
    expect(context.stroke).toHaveBeenCalledTimes(1);
    expect(context.font.startsWith("500 40px")).toBe(true);
    expect(material.depthTest).toBe(false);
    expect(sprite.renderOrder).toBeGreaterThan(0);
  });

  it("draws plain text with default weight, padding and scale when no card is asked for", () => {
    const context = fakeContext(5);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    );

    const { sprite } = createLabelSprite(["x"], { fontPx: 10, color: "#fff" });

    expect(context.fill).not.toHaveBeenCalled();
    expect(context.font.startsWith("600 20px")).toBe(true);
    const canvas = (sprite.material as THREE.SpriteMaterial).map!.image as HTMLCanvasElement;
    expect(canvas.width).toBe(5 + 10 * 2 * 2);
  });

  it("throws when the browser has no 2D canvas", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

    expect(() => createLabelSprite(["x"], { fontPx: 10, color: "#fff" })).toThrow(/2D canvas/);
  });
});
