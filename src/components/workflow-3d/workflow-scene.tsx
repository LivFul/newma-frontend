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
  /** CSS aspect-ratio of the static diagram, so the scene fills exactly the same box. */
  readonly aspect: string;
  /** Called when the scene cannot start (for example, no WebGL), so the page keeps the diagram. */
  readonly onFailure: () => void;
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

const SCENE_COPY = {
  nodeLabels: textsOf(WORKFLOW_NODE_LABELS),
  edgeLabels: textsOf(WORKFLOW_EDGE_LABELS),
  noteText: textsOf(WORKFLOW_NOTE_TEXT),
};

// The three-dimensional twin of the static diagram. This module, three.js included, is a separate
// chunk that the viewer fetches only when a visitor asks for it.
export function WorkflowScene({ aspect, onFailure }: WorkflowSceneProps) {
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
    } catch {
      onFailure();
      return;
    }
    return () => {
      controllerRef.current?.dispose();
      controllerRef.current = null;
    };
  }, [onFailure]);

  const toggleSeparated = () => {
    const next = !separated;
    setSeparated(next);
    controllerRef.current?.setSeparated(next);
  };

  return (
    <div
      className="relative min-h-[26rem] w-full overflow-hidden rounded-lg border border-border bg-bg-elevated"
      style={{ aspectRatio: aspect }}
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
        <Button size="sm" variant="secondary" aria-pressed={separated} onClick={toggleSeparated}>
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
