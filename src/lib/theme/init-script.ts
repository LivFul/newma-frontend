import { THEME_STORAGE_KEY } from "./state";

/** Minified bootstrap: runs before paint so stored / system dark does not flash light tokens. */
export const THEME_INIT_SCRIPT = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var p=localStorage.getItem(k);var pref=p==="light"||p==="dark"||p==="system"?p:"system";var dark=pref==="dark"||(pref==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",pref==="dark");r.classList.toggle("light",pref==="light");r.style.colorScheme=dark?"dark":"light";r.dataset.theme=dark?"dark":"light";}catch(e){}})();`;
