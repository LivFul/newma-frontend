import type { CopyBlock } from "../types";

const block = (id: string, text: string, claim: string): CopyBlock =>
  Object.freeze({ id, text, claims: Object.freeze([claim]) });

export const PURPOSE_HEADING: CopyBlock = Object.freeze({
  id: "about.purpose.heading",
  text: "Purpose",
  claims: Object.freeze([]),
});

export const MISSION_HEADING: CopyBlock = Object.freeze({
  id: "about.mission.heading",
  text: "Mission",
  claims: Object.freeze([]),
});

export const VISION_HEADING: CopyBlock = Object.freeze({
  id: "about.vision.heading",
  text: "Vision",
  claims: Object.freeze([]),
});

export const APPROACH_HEADING: CopyBlock = Object.freeze({
  id: "about.approach.heading",
  text: "Approach",
  claims: Object.freeze([]),
});

export const PURPOSE_LEDE = block(
  "about.purpose.lede",
  "NEWMA is being developed by LivFul Therapeutics to connect authorized botanical knowledge with rigorous research into potential starting points for future medicines.",
  "C-26",
);

export const PURPOSE = block(
  "about.purpose",
  "Its purpose is to bring knowledge, materials, computational hypotheses and experimental evidence into a discovery process that respects the people and conditions behind each contribution. The needs of underserved populations and the biodiversity of the Global South inform this direction.",
  "C-26",
);

export const MISSION = block(
  "about.mission",
  "Enable research teams to turn authorized medicinal plant knowledge and authenticated materials into reproducible, experimentally supported discovery decisions, preserving attribution, confidentiality and benefit-sharing obligations.",
  "C-26",
);

export const VISION = block(
  "about.vision",
  "Become a trusted health innovation platform provider for the Global South \u2014 anchoring Global South biodiversity in modern medicine.",
  "C-27",
);

export type ApproachItem = Readonly<{ title: CopyBlock; text: CopyBlock }>;

const approach = (id: string, title: string, text: string): ApproachItem =>
  Object.freeze({
    title: Object.freeze({ id: `${id}.title`, text: title, claims: Object.freeze(["C-28"]) }),
    text: Object.freeze({ id: `${id}.text`, text, claims: Object.freeze(["C-28"]) }),
  });

export const APPROACH: readonly ApproachItem[] = Object.freeze([
  approach(
    "about.approach.needs",
    "Start with unmet needs.",
    "Keep the health challenges of underserved populations in view when shaping research priorities.",
  ),
  approach(
    "about.approach.evidence",
    "Follow the evidence.",
    "Use computation to prioritize hypotheses and controlled experiments to test them. Keep scientists responsible for evidence acceptance and advancement.",
  ),
  approach(
    "about.approach.respect",
    "Respect knowledge and its custodians.",
    "Carry attribution, confidentiality, permitted uses and benefit obligations through the discovery process. Check authorization before retrieving or using restricted knowledge.",
  ),
  approach(
    "about.approach.collaboration",
    "Build through collaboration.",
    "Connect scientific teams, laboratory partners and authorized knowledge holders around clearly defined research responsibilities.",
  ),
  approach(
    "about.approach.learn",
    "Learn from reviewed results.",
    "Use accepted positive and negative observations to inform later research, with separate authorization and validation for changes to predictive model training.",
  ),
]);
