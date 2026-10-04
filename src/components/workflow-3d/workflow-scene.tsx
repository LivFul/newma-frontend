"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  WORKFLOW_CONTROLS,
  WORKFLOW_EDGE_LABELS,
  WORKFLOW_NODE_LABELS,
  WORKFLOW_NOTE_TEXT,
  WORKFLOW_SECTION,
} from "@/content/home/workflow";
import { textsOf } from "@/lib/workflow/copy";
import { NavPad } from "./nav-pad";
import { createWorkflowScene, type SceneController } from "./scene";

export interface WorkflowSceneProps {
  /** CSS aspect-ratio of the static diagram, the box size when no measured height is given. */
  readonly aspect: string;
  /** Height of the static diagram as measured before the swap, so the page does not shift. */
  readonly height?: number;
  /** Called once the renderer has started, so the viewer announces a view that really works. */
  readonly onReady: () => void;
  /** Called when the scene cannot start (for example, no WebGL), so the page keeps the diagram. */
  readonly onFailure: (reason: SceneFailure) => void;
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

const SCENE_COPY = {
  nodeLabels: textsOf(WORKFLOW_NODE_LABELS),
  edgeLabels: textsOf(WORKFLOW_EDGE_LABELS),
  noteText: textsOf(WORKFLOW_NOTE_TEXT),
};

// The three-dimensional twin of the static diagram. This module, three.js included, is a separate
// chunk that the viewer fetches only when a visitor asks for it.
/** "no-webgl" when the browser cannot create a WebGL context, which a retry would not fix. */
export type SceneFailure = "no-webgl" | "error";

const failureOf = (error: unknown): SceneFailure =>
  error instanceof Error && /webgl/i.test(error.message) ? "no-webgl" : "error";

export function WorkflowScene({ aspect, height, onReady, onFailure }: WorkflowSceneProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SceneController | null>(null);
  const [separated, setSeparated] = useState(false);

  useEffect(() => {
    const container = stageRef.current;
    if (!container) return;
    try {
      controllerRef.current = createWorkflowScene(container, {
        copy: SCENE_COPY,
        reducedMotion: window.matchMedia(REDUCED_MOTION).matches,
      });
    } catch (error) {
      onFailure(failureOf(error));
      return;
    }
    onReady();
    return () => {
      controllerRef.current?.dispose();
      controllerRef.current = null;
    };
  }, [onFailure, onReady]);

  const toggleSeparated = () => {
    const next = !separated;
    setSeparated(next);
    controllerRef.current?.setSeparated(next);
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border border-border bg-bg-elevated"
      style={height ? { height } : { aspectRatio: aspect }}
      data-workflow-scene
    >
      <div
        ref={stageRef}
        role="img"
        aria-label={WORKFLOW_SECTION.svgTitle.text}
        aria-describedby="workflow-scene-desc"
        className="absolute inset-0"
      />
      <span id="workflow-scene-desc" className="sr-only">
        {WORKFLOW_SECTION.svgDesc.text}
      </span>
      <div className="absolute left-3 top-3">
        <Button
          size="sm"
          variant="secondary"
          className="min-h-11"
          aria-pressed={separated}
          onClick={toggleSeparated}
        >
          {WORKFLOW_CONTROLS.separate.text}
        </Button>
      </div>
      <NavPad
        onCommand={(command) => controllerRef.current?.setNavigation(command)}
        onReset={() => controllerRef.current?.resetView()}
      />
    </div>
  );
}
