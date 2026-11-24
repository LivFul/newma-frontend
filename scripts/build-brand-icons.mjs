#!/usr/bin/env node
// Builds every NEWMA logo, icon and social size from the two vector masters in
// docs/newma_brand_pack/00_source (extracted from NEWMA_GUIDE_V1.pdf, text outlined):
//   newma-logo.svg  paths in order: n+e (ink), w+ʌʌ+a (gradient), ™ (ink), tagline (ink)
//   newma-mark.svg  the wʌʌ wave (the guide's "DNA wave") on its own
// Writes the site assets to public/brand + public/favicon.ico, and the brand pack to docs/newma_brand_pack.
// Usage: node scripts/build-brand-icons.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
// sharp ships with next; resolve it from there rather than adding a direct dependency.
const sharp = require(require.resolve("sharp", { paths: [require.resolve("next")] }));

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "docs/newma_brand_pack/00_source");
const PUB = path.join(ROOT, "public/brand");
const PACK = path.join(ROOT, "docs/newma_brand_pack");

export const BRAND = {
  forest: "#244322",
  sage: "#9ba77d",
  lavender: "#86809c",
  white: "#ffffff",
  black: "#000000",
};

const read = (f) => readFileSync(path.join(SRC, f), "utf8");
const paths = (svg) => [...svg.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]);
const viewBox = (svg) =>
  svg
    .match(/viewBox="([^"]+)"/)[1]
    .split(/\s+/)
    .map(Number);

const logoSvg = read("newma-logo.svg");
const [NE, WMA, TM, TAG] = paths(logoSvg);
const LOGO_VB = viewBox(logoSvg);
// The wordmark is the logo without the tagline: same origin and height, cropped after the ™.
const WORDMARK_VB = [LOGO_VB[0], LOGO_VB[1], 364.1, LOGO_VB[3]];
const markSvg = read("newma-mark.svg");
const [MARK] = paths(markSvg);
const MARK_VB = viewBox(markSvg);

const GRADIENT = (id) =>
  `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="398" y1="300" x2="626" y2="352">` +
  `<stop offset="0" stop-color="${BRAND.forest}"/><stop offset=".33" stop-color="#40573f"/>` +
  `<stop offset=".4" stop-color="${BRAND.sage}"/><stop offset=".72" stop-color="${BRAND.sage}"/>` +
  `<stop offset="1" stop-color="${BRAND.lavender}"/></linearGradient>`;
const MARK_GRADIENT = (id) =>
  `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${MARK_VB[0]}" y1="${MARK_VB[1]}" ` +
  `x2="${MARK_VB[0] + MARK_VB[2]}" y2="${MARK_VB[1] + MARK_VB[3]}">` +
  `<stop offset="0" stop-color="${BRAND.forest}"/><stop offset=".55" stop-color="${BRAND.sage}"/>` +
  `<stop offset="1" stop-color="${BRAND.lavender}"/></linearGradient>`;

const fmt = (n) => +n.toFixed(2);
const svgDoc = (vb, body, label, { scale = 4, bg } = {}) => {
  const [x, y, w, h] = vb.map(fmt);
  const rect = bg ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${bg}"/>` : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" ` +
    `width="${Math.round(w * scale)}" height="${Math.round(h * scale)}" role="img" aria-label="${label}">` +
    `<title>${label}</title>${rect}${body}</svg>\n`
  );
};

/** One lockup in one colourway. `wma` may be a colour or "gradient". */
function lockup(kind, { ink, wma = ink, bg, id = "g" }) {
  const fill = wma === "gradient" ? `url(#${id})` : wma;
  const defs = wma === "gradient" ? `<defs>${GRADIENT(id)}</defs>` : "";
  let body = `${defs}<path fill="${ink}" d="${NE}"/><path fill="${fill}" d="${WMA}"/><path fill="${ink}" d="${TM}"/>`;
  if (kind === "logo") body += `<path fill="${ink}" d="${TAG}"/>`;
  const vb = kind === "logo" ? LOGO_VB : WORDMARK_VB;
  const label = kind === "logo" ? "newma, AI-Powered Ethnobotanical Drug Discovery" : "newma";
  return svgDoc(vb, body, label, { bg });
}

/** Square tile with the mark centred. `inset` is the share of the side the mark spans. */
function tile({
  size = 64,
  bg = BRAND.white,
  radius = 0.22,
  inset = 0.74,
  mark = "gradient",
  id = "m",
}) {
  const [mx, my, mw, mh] = MARK_VB;
  const s = (size * inset) / mw;
  const tx = (size - mw * s) / 2 - mx * s;
  const ty = (size - mh * s) / 2 - my * s;
  const fill = mark === "gradient" ? `url(#${id})` : mark;
  const defs = mark === "gradient" ? `<defs>${MARK_GRADIENT(id)}</defs>` : "";
  const r = fmt(size * radius);
  const back = bg ? `<rect width="${size}" height="${size}" rx="${r}" fill="${bg}"/>` : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="newma icon">` +
    `<title>newma icon</title>${defs}${back}` +
    `<path transform="matrix(${fmt(s * 1000) / 1000} 0 0 ${fmt(s * 1000) / 1000} ${fmt(tx)} ${fmt(ty)})" fill="${fill}" d="${MARK}"/></svg>\n`
  );
}

/** Bare mark (no tile) in one colour or the brand gradient. */
function bareMark(colour, id = "b") {
  const fill = colour === "gradient" ? `url(#${id})` : colour;
  const defs = colour === "gradient" ? `<defs>${MARK_GRADIENT(id)}</defs>` : "";
  return svgDoc(MARK_VB, `${defs}<path fill="${fill}" d="${MARK}"/>`, "newma mark", { scale: 8 });
}

/** Wide social / banner art: soft brand gradient ground with the reversed logo centred. */
function banner(w, h, { logoWidth = 0.56 } = {}) {
  const [lx, ly, lw, lh] = LOGO_VB;
  const s = (w * logoWidth) / lw;
  const tx = (w - lw * s) / 2 - lx * s;
  const ty = (h - lh * s) / 2 - ly * s;
  const body =
    `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${BRAND.forest}"/>` +
    `<stop offset=".55" stop-color="#5d7350"/><stop offset="1" stop-color="${BRAND.lavender}"/></linearGradient>` +
    `<radialGradient id="fog" cx=".18" cy=".2" r=".6"><stop offset="0" stop-color="#0f2410" stop-opacity=".55"/>` +
    `<stop offset="1" stop-color="#0f2410" stop-opacity="0"/></radialGradient></defs>` +
    `<rect width="${w}" height="${h}" fill="url(#bg)"/><rect width="${w}" height="${h}" fill="url(#fog)"/>` +
    `<g transform="matrix(${fmt(s * 1000) / 1000} 0 0 ${fmt(s * 1000) / 1000} ${fmt(tx)} ${fmt(ty)})" fill="#fff">` +
    `<path d="${NE}"/><path d="${WMA}"/><path d="${TM}"/><path d="${TAG}"/></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="newma"><title>newma</title>${body}</svg>\n`;
}

/**
 * The wʌʌ wave rendered as a bitmap: the gradient mark is sampled on a coarse grid and each cell becomes
 * a square, thinning out from left to right so the wave "dissolves" like the guide's bitmap motif.
 * Deterministic (seeded), so rebuilding does not churn the file.
 */
async function bitmapWave({ cols = 84, cell = 6 } = {}) {
  const [, , mw, mh] = MARK_VB;
  const rows = Math.round((cols * mh) / mw);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_VB.join(" ")}" width="${cols}" height="${rows}"><defs>${MARK_GRADIENT("w")}</defs><path fill="url(#w)" d="${MARK}"/></svg>`;
  const { data, info } = await sharp(Buffer.from(svg))
    .resize(cols, rows)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const rects = [];
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 4;
      const a = data[i + 3] / 255;
      const keep = 0.95 - 0.55 * (x / info.width); // denser on the left, sparser on the right
      if (a > 0.35 && rand() < keep) {
        const hex = `#${[0, 1, 2].map((k) => data[i + k].toString(16).padStart(2, "0")).join("")}`;
        const size = rand() < 0.2 ? cell * 0.6 : cell * 0.86;
        const off = (cell - size) / 2;
        rects.push(
          `<rect x="${x * cell + off}" y="${y * cell + off}" width="${fmt(size)}" height="${fmt(size)}" fill="${hex}"/>`,
        );
      } else if (a > 0.05 && rand() < 0.25) {
        rects.push(
          `<rect x="${x * cell + cell * 0.3}" y="${y * cell + cell * 0.3}" width="${fmt(cell * 0.4)}" height="${fmt(cell * 0.4)}" fill="${BRAND.sage}" opacity=".7"/>`,
        );
      }
    }
  }
  const W = info.width * cell;
  const H = info.height * cell;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">${rects.join("")}</svg>
`;
}

const write = (file, data) => {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, data);
};
const png = async (svg, file, { width, height, density = 72, flatten } = {}) => {
  let img = sharp(Buffer.from(svg), { density });
  if (width || height)
    img = img.resize(width, height, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } });
  if (flatten) img = img.flatten({ background: flatten });
  mkdirSync(path.dirname(file), { recursive: true });
  await img.png({ compressionLevel: 9 }).toFile(file);
};
const pngBuffer = (svg, size) =>
  sharp(Buffer.from(svg), {
    density: 72 * Math.max(1, size / Number(svg.match(/width="(\d+)"/)[1])),
  })
    .resize(size, size)
    .png()
    .toBuffer();

/** Multi-image ICO with PNG payloads (supported by every current browser). */
async function ico(svg, sizes, file) {
  const images = await Promise.all(sizes.map((s) => pngBuffer(svg, s)));
  const header = Buffer.alloc(6 + 16 * sizes.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  sizes.forEach((s, i) => {
    const e = 6 + 16 * i;
    header.writeUInt8(s >= 256 ? 0 : s, e);
    header.writeUInt8(s >= 256 ? 0 : s, e + 1);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(images[i].length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += images[i].length;
  });
  write(file, Buffer.concat([header, ...images]));
}

async function main() {
  // ---- Lockups ----------------------------------------------------------------------------------
  const lockups = {
    "newma-logo-primary": lockup("logo", { ink: BRAND.forest, wma: "gradient", id: "lp" }),
    "newma-logo-reversed": lockup("logo", { ink: BRAND.white, bg: BRAND.forest }),
    "newma-logo-reversed-transparent": lockup("logo", { ink: BRAND.white }),
    "newma-logo-mono-ink": lockup("logo", { ink: BRAND.forest }),
    "newma-logo-mono-white": lockup("logo", { ink: BRAND.white }),
    "newma-logo-mono-black": lockup("logo", { ink: BRAND.black }),
    "newma-wordmark-primary": lockup("wordmark", { ink: BRAND.forest, wma: "gradient", id: "wp" }),
    "newma-wordmark-reversed": lockup("wordmark", { ink: BRAND.white }),
    "newma-wordmark-mono-ink": lockup("wordmark", { ink: BRAND.forest }),
    "newma-wordmark-mono-white": lockup("wordmark", { ink: BRAND.white }),
    "newma-wordmark-mono-black": lockup("wordmark", { ink: BRAND.black }),
  };
  for (const [name, svg] of Object.entries(lockups)) {
    write(path.join(PACK, "01_logo/svg", `${name}.svg`), svg);
    for (const w of [600, 1200, 2800]) {
      await png(svg, path.join(PACK, "01_logo/png", `${name}-${w}.png`), {
        width: w,
        density: 300,
      });
    }
  }
  // Site copies: primary on light grounds, transparent reversed on dark grounds.
  write(path.join(PUB, "newma-logo.svg"), lockups["newma-logo-primary"]);
  write(path.join(PUB, "newma-logo-reversed.svg"), lockups["newma-logo-reversed-transparent"]);
  write(path.join(PUB, "newma-wordmark.svg"), lockups["newma-wordmark-primary"]);
  write(path.join(PUB, "newma-wordmark-reversed.svg"), lockups["newma-wordmark-reversed"]);

  // ---- Mark / icon ------------------------------------------------------------------------------
  const icons = {
    "newma-icon-color": bareMark("gradient", "ic"),
    "newma-icon-mono-ink": bareMark(BRAND.forest),
    "newma-icon-mono-white": bareMark(BRAND.white),
    "newma-icon-mono-black": bareMark(BRAND.black),
    "newma-icon-tile": tile({ size: 1024, id: "it" }),
  };
  for (const [name, svg] of Object.entries(icons)) {
    write(path.join(PACK, "02_icon/svg", `${name}.svg`), svg);
    for (const s of [128, 256, 512, 1024]) {
      await png(svg, path.join(PACK, "02_icon/png", `${name}-${s}.png`), {
        width: s,
        height: s,
        density: 600,
      });
    }
  }

  // ---- Favicons + PWA ---------------------------------------------------------------------------
  // Tab-sized icons need more contrast than the gradient gives: white wave on forest, drawn larger.
  const fav = tile({ size: 64, bg: BRAND.forest, mark: BRAND.white, inset: 0.8, id: "f" });
  const appleTile = tile({ size: 180, radius: 0, inset: 0.7, id: "a" }); // iOS applies its own mask
  const maskable = tile({ size: 512, radius: 0, inset: 0.62, id: "k" }); // mark inside the 80% safe zone
  const anyIcon = tile({ size: 512, inset: 0.72, id: "y" });
  const pinned = svgDoc(MARK_VB, `<path d="${MARK}"/>`, "newma mark", { scale: 1 });

  const favicons = {
    "favicon.svg": fav,
    "safari-pinned-tab.svg": pinned,
  };
  const rasters = [
    ["favicon-16.png", fav, 16],
    ["favicon-32.png", fav, 32],
    ["favicon-48.png", fav, 48],
    ["apple-touch-icon.png", appleTile, 180],
    ["icon-192.png", anyIcon, 192],
    ["icon-512.png", anyIcon, 512],
    ["icon-192-maskable.png", maskable, 192],
    ["icon-512-maskable.png", maskable, 512],
  ];
  for (const [name, svg] of Object.entries(favicons)) {
    write(path.join(PUB, name), svg);
    write(path.join(PACK, "03_favicon", name), svg);
  }
  for (const [name, svg, size] of rasters) {
    const buf = await pngBuffer(svg, size);
    write(path.join(PUB, name), buf);
  }
  const packNames = {
    "favicon-16x16.png": [fav, 16],
    "favicon-32x32.png": [fav, 32],
    "favicon-48x48.png": [fav, 48],
    "apple-touch-icon.png": [appleTile, 180],
    "android-chrome-192x192.png": [anyIcon, 192],
    "android-chrome-512x512.png": [anyIcon, 512],
    "maskable-icon-512x512.png": [maskable, 512],
    "mstile-150x150.png": [tile({ size: 150, radius: 0, inset: 0.62, id: "t" }), 150],
  };
  for (const [name, [svg, size]] of Object.entries(packNames)) {
    write(path.join(PACK, "03_favicon", name), await pngBuffer(svg, size));
  }
  await ico(fav, [16, 32, 48], path.join(ROOT, "public/favicon.ico"));
  await ico(fav, [16, 32, 48], path.join(PACK, "03_favicon/favicon.ico"));

  // ---- App icons + avatars ----------------------------------------------------------------------
  const app = {
    "newma-app-icon-light-rounded": tile({ size: 1024, id: "l1" }),
    "newma-app-icon-light-square": tile({ size: 1024, radius: 0, id: "l2" }),
    "newma-app-icon-dark-rounded": tile({
      size: 1024,
      bg: BRAND.forest,
      mark: BRAND.white,
      id: "d1",
    }),
    "newma-app-icon-dark-square": tile({
      size: 1024,
      bg: BRAND.forest,
      radius: 0,
      mark: BRAND.white,
      id: "d2",
    }),
    "newma-avatar-light-circle": tile({ size: 1024, radius: 0.5, inset: 0.62, id: "c1" }),
    "newma-avatar-dark-circle": tile({
      size: 1024,
      bg: BRAND.forest,
      radius: 0.5,
      inset: 0.62,
      mark: BRAND.white,
      id: "c2",
    }),
  };
  for (const [name, svg] of Object.entries(app)) {
    write(path.join(PACK, "04_app_icons", `${name}.svg`), svg);
    for (const s of [512, 1024])
      write(path.join(PACK, "04_app_icons", `${name}-${s}.png`), await pngBuffer(svg, s));
  }

  // ---- Social + stationery ----------------------------------------------------------------------
  const social = {
    "newma-og-image-1200x630": [1200, 630],
    "newma-linkedin-banner-1584x396": [1584, 396],
    "newma-x-header-1500x500": [1500, 500],
  };
  for (const [name, [w, h]] of Object.entries(social)) {
    const svg = banner(w, h, { logoWidth: w / h > 3 ? 0.42 : 0.62 });
    write(path.join(PACK, "05_social", `${name}.svg`), svg);
    await png(svg, path.join(PACK, "05_social", `${name}.png`));
  }
  write(
    path.join(PACK, "05_social/newma-profile-avatar-512.png"),
    await pngBuffer(app["newma-avatar-light-circle"], 512),
  );
  await png(
    lockups["newma-logo-primary"],
    path.join(PACK, "06_stationery/email-signature-logo.png"),
    {
      width: 400,
      density: 300,
    },
  );

  // ---- Bitmap wave (guide: "Design elements, bitmap effect") ----------------------------------------
  write(path.join(ROOT, "public/images/bitmap-wave.svg"), await bitmapWave());
  write(path.join(PACK, "02_icon/svg/newma-bitmap-wave.svg"), await bitmapWave());

  console.log("brand assets written to public/brand, public/favicon.ico and docs/newma_brand_pack");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
