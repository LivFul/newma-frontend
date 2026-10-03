import type { ComponentType, ReactNode } from "react";
import type { PartGeometry } from "./geometry";

export type HeroView = "assembled" | "exploded";

export type PartProps = {
  geometry: PartGeometry;
  index: number;
  view: HeroView;
  children: ReactNode;
};

export type PartComponent = ComponentType<PartProps>;
