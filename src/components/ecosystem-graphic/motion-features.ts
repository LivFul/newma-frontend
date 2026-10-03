import { domAnimation } from "motion/react";
import { HERO_CHUNK_MARKER } from "./hero-marker";

// Loaded on demand by LazyMotion. domAnimation covers variants and tweens, which is all the explode
// needs (no layout animation, drag or gestures).
export const MOTION_FEATURES_CHUNK = HERO_CHUNK_MARKER;
export default domAnimation;
