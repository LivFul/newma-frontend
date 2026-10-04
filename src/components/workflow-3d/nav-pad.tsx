"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { WORKFLOW_CONTROLS } from "@/content/home/workflow";
import { cn } from "@/lib/cn";
import type { NavCommand } from "./stage";

/** A keyboard activation (Enter or Space) has no hold, so it nudges the camera for this long. */
const KEY_NUDGE_MS = 250;
const PRIMARY_BUTTON = 0;

const BUTTON =
  "inline-flex size-10 items-center justify-center rounded-md border border-border-strong " +
  "bg-bg-elevated/70 text-fg hover:bg-border data-[active=true]:bg-accent data-[active=true]:text-accent-fg";

interface HoldButtonProps {
  readonly command: NavCommand;
  readonly label: string;
  readonly glyph: string;
  readonly onHold: (pointerId: number, command: NavCommand) => void;
  readonly onRelease: (pointerId: number) => void;
  readonly onNudge: (command: NavCommand) => void;
}

/** Drives the camera for as long as its own pointer is down. */
function HoldButton({ command, label, glyph, onHold, onRelease, onNudge }: HoldButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);

  const press = (event: ReactPointerEvent) => {
    // Only the primary button, touch contact or pen tip holds; a right-click opens a menu that
    // would swallow the release.
    if (event.button !== PRIMARY_BUTTON) return;
    event.preventDefault();
    const { pointerId } = event;
    ref.current?.setAttribute("data-active", "true");
    onHold(pointerId, command);

    // Release is heard on the window, so it fires even when the pointer leaves the button, and a
    // lost window focus ends the hold as well.
    const finish = () => {
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("blur", finish);
      ref.current?.setAttribute("data-active", "false");
      onRelease(pointerId);
    };
    const onUp = (up: PointerEvent) => {
      if (up.pointerId === pointerId) finish();
    };
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("blur", finish);
  };

  // A click with no pointer behind it (detail 0) came from the keyboard.
  const keyboardClick = (event: ReactMouseEvent) => {
    if (event.detail === 0) onNudge(command);
  };

  return (
    <button
      ref={ref}
      type="button"
      className={cn(BUTTON, "touch-none select-none")}
      aria-label={label}
      title={label}
      onPointerDown={press}
      onClick={keyboardClick}
    >
      <span aria-hidden="true">{glyph}</span>
    </button>
  );
}

function Group({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="grid justify-items-center gap-1.5">
      {children}
      <span className="text-xs uppercase tracking-widest text-fg-muted">{caption}</span>
    </div>
  );
}

export interface NavPadProps {
  readonly onCommand: (command: NavCommand | null) => void;
  readonly onReset: () => void;
}

/** Translucent pan, tilt and zoom controls pinned over the scene. */
export function NavPad({ onCommand, onReset }: NavPadProps) {
  const c = WORKFLOW_CONTROLS;

  // The latest callback, so the hold bookkeeping below stays stable across re-renders.
  const onCommandRef = useRef(onCommand);
  useEffect(() => {
    onCommandRef.current = onCommand;
  });

  // Each held pointer owns its command, so releasing one button never cancels another that is
  // still held (two fingers, or a finger and a mouse).
  const held = useRef(new Map<number, NavCommand>());
  const nudgeTimer = useRef<number | null>(null);

  const publish = useCallback(() => {
    const commands = [...held.current.values()];
    onCommandRef.current(commands.length > 0 ? commands[commands.length - 1]! : null);
  }, []);

  const onHold = useCallback(
    (pointerId: number, command: NavCommand) => {
      held.current.set(pointerId, command);
      publish();
    },
    [publish],
  );
  const onRelease = useCallback(
    (pointerId: number) => {
      if (held.current.delete(pointerId)) publish();
    },
    [publish],
  );

  const onNudge = useCallback(
    (command: NavCommand) => {
      // A second press restarts the nudge instead of letting the first timer end it early.
      if (nudgeTimer.current !== null) window.clearTimeout(nudgeTimer.current);
      onCommandRef.current(command);
      nudgeTimer.current = window.setTimeout(() => {
        nudgeTimer.current = null;
        publish();
      }, KEY_NUDGE_MS);
    },
    [publish],
  );

  // The pad leaving the page ends any hold and any pending nudge.
  useEffect(() => {
    const heldNow = held.current;
    return () => {
      if (nudgeTimer.current !== null) window.clearTimeout(nudgeTimer.current);
      heldNow.clear();
      onCommandRef.current(null);
    };
  }, []);

  const hold = (command: NavCommand, label: string, glyph: string) => (
    <HoldButton
      command={command}
      label={label}
      glyph={glyph}
      onHold={onHold}
      onRelease={onRelease}
      onNudge={onNudge}
    />
  );
  const gap = <span aria-hidden="true" />;

  return (
    // A group, not a navigation landmark: these are camera controls, not page navigation.
    <div
      role="group"
      aria-label={c.navLabel.text}
      className="absolute bottom-3 right-3 flex max-w-[calc(100%-1.5rem)] flex-wrap items-end justify-end gap-3 rounded-2xl border border-border bg-bg/85 p-2.5 backdrop-blur"
    >
      <Group caption={c.panGroup.text}>
        <div className="grid grid-cols-3 gap-1">
          {gap}
          {hold("pan-up", c.panUp.text, "▲")}
          {gap}
          {hold("pan-left", c.panLeft.text, "◀")}
          <button
            type="button"
            className={BUTTON}
            aria-label={c.reset.text}
            title={c.reset.text}
            onClick={onReset}
          >
            <span aria-hidden="true">{"⌂"}</span>
          </button>
          {hold("pan-right", c.panRight.text, "▶")}
          {gap}
          {hold("pan-down", c.panDown.text, "▼")}
          {gap}
        </div>
      </Group>
      <Group caption={c.tiltGroup.text}>
        <div className="grid gap-1">
          {hold("tilt-up", c.tiltUp.text, "⇑")}
          {hold("tilt-down", c.tiltDown.text, "⇓")}
        </div>
      </Group>
      <Group caption={c.zoomGroup.text}>
        <div className="grid gap-1">
          {hold("zoom-in", c.zoomIn.text, "+")}
          {hold("zoom-out", c.zoomOut.text, "−")}
        </div>
      </Group>
    </div>
  );
}
