import { glyphShapes } from "@/components/ecosystem-graphic/glyphs";
import type { GlyphKey, ToneToken } from "@/components/ecosystem-graphic/geometry";
import { BRAND_HEX } from "@/lib/brand";

export const OG_SIZE = Object.freeze({ width: 1200, height: 630 });
export const OG_CONTENT_TYPE = "image/png";

const TONE_HEX: Readonly<Record<ToneToken, string>> = {
  "--color-accent": BRAND_HEX.accent,
  "--color-eco-compute": BRAND_HEX.ecoCompute,
  "--color-warning": BRAND_HEX.warningInk,
  "--color-success": BRAND_HEX.successInk,
  "--color-border-strong": BRAND_HEX.muted,
  "--color-eco-optional": BRAND_HEX.ecoOptional,
};

export type OgCardProps = Readonly<{
  title: string;
  kicker?: string;
  glyph?: GlyphKey;
  tone?: ToneToken;
  /** Data URI of the horizontal lockup. Omitted in unit tests, which keep the text stand-in. */
  logoSrc?: string;
}>;

// Static card for next/og (satori): flex layout and inline styles only, no external fetch, no webfont.
export function OgCard({ title, kicker, glyph, tone = "--color-accent", logoSrc }: OgCardProps) {
  const ink = TONE_HEX[tone];
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: BRAND_HEX.background,
        color: BRAND_HEX.foreground,
        padding: 72,
      }}
    >
      {logoSrc ? (
        // satori renders a raw img; next/image is not available inside ImageResponse.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoSrc} width={460} height={82} alt="" />
      ) : (
        <div style={{ display: "flex", fontSize: 40, gap: 14 }}>
          <span>LivFul</span>
          <span style={{ color: BRAND_HEX.muted }}>/</span>
          <span style={{ fontWeight: 700 }}>NEWMA</span>
        </div>
      )}
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 48 }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>
          {kicker ? <div style={{ fontSize: 34, color: BRAND_HEX.muted }}>{kicker}</div> : null}
          <div style={{ fontSize: 76, lineHeight: 1.08, fontWeight: 700 }}>{title}</div>
        </div>
        {glyph ? (
          <svg
            width={260}
            height={260}
            viewBox="-24 -24 48 48"
            fill="none"
            stroke={ink}
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: ink }}
          >
            {glyphShapes(glyph)}
          </svg>
        ) : null}
      </div>
      <div style={{ display: "flex", height: 6, width: 160, background: ink }} />
    </div>
  );
}
