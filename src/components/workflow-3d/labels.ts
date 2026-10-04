import * as THREE from "three";

const PIXEL_RATIO = 2;
const PX_TO_WORLD = 0.011;
const FONT_STACK = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

export interface LabelStyle {
  readonly fontPx: number;
  readonly color: string;
  readonly background?: string;
  readonly border?: string;
  readonly padding?: number;
  readonly weight?: number;
  /** Multiplies the sprite's world size without changing the canvas resolution. */
  readonly worldScale?: number;
}

export interface LabelSprite {
  readonly sprite: THREE.Sprite;
  readonly width: number;
  readonly height: number;
}

/** A text sprite that always faces the camera: the label is drawn once to a canvas texture. */
export function createLabelSprite(lines: readonly string[], style: LabelStyle): LabelSprite {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas is unavailable, so scene labels cannot be drawn");

  const font = `${style.weight ?? 600} ${style.fontPx * PIXEL_RATIO}px ${FONT_STACK}`;
  const pad = (style.padding ?? 10) * PIXEL_RATIO;
  const lineHeight = style.fontPx * 1.28 * PIXEL_RATIO;

  ctx.font = font;
  const textWidth = Math.max(...lines.map((line) => ctx.measureText(line).width));
  canvas.width = Math.ceil(textWidth + pad * 2);
  canvas.height = Math.ceil(lineHeight * lines.length + pad * 2);

  // Resizing a canvas resets its 2D state.
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (style.background) {
    ctx.beginPath();
    ctx.roundRect(1, 1, canvas.width - 2, canvas.height - 2, 8 * PIXEL_RATIO);
    ctx.fillStyle = style.background;
    ctx.fill();
    if (style.border) {
      ctx.lineWidth = 1.5 * PIXEL_RATIO;
      ctx.strokeStyle = style.border;
      ctx.stroke();
    }
  }

  ctx.fillStyle = style.color;
  lines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, pad + lineHeight * (index + 0.5));
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  const worldScale = style.worldScale ?? 1;
  const width = (canvas.width / PIXEL_RATIO) * PX_TO_WORLD * worldScale;
  const height = (canvas.height / PIXEL_RATIO) * PX_TO_WORLD * worldScale;
  sprite.scale.set(width, height, 1);
  sprite.renderOrder = 10;

  return { sprite, width, height };
}
