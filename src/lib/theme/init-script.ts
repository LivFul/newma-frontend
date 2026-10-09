import { BACKGROUND_HEX, BRAND_HEX } from "@/lib/brand";
import { THEME_COLOR_META_ID } from "./dom";
import { DEFAULT_THEME_PREFERENCE, THEME_STORAGE_KEY } from "./state";

/** Same-origin bootstrap (public/theme-init.js) so /access nonce CSP never blocks inline theme boot. */
export const THEME_INIT_SRC = "/theme-init.js";

/** Minified bootstrap body; kept in sync with public/theme-init.js (tests/unit/theme/init-script.test.ts). */
export const THEME_INIT_SCRIPT = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var d=${JSON.stringify(DEFAULT_THEME_PREFERENCE)};var p=localStorage.getItem(k);var pref=p==="light"||p==="dark"||p==="system"?p:d;var dark=pref==="dark"||(pref==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",pref==="dark");r.classList.toggle("light",pref==="light");r.style.colorScheme=dark?"dark":"light";r.dataset.theme=dark?"dark":"light";var m=document.getElementById(${JSON.stringify(THEME_COLOR_META_ID)})||document.createElement("meta");m.id=${JSON.stringify(THEME_COLOR_META_ID)};m.name="theme-color";m.content=dark?${JSON.stringify(BRAND_HEX.night)}:${JSON.stringify(BACKGROUND_HEX)};if(!m.parentNode)document.head.appendChild(m);}catch(e){}})();`;
