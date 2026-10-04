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
import { NavIcon } from "./nav-icons";
import type { NavCommand } from "./stage";

/** The least any activation moves the camera: a full keyboard nudge, or a short hold topped up. */
const KEY_NUDGE_MS = 250;
const PRIMARY_BUTTON = 0;

const BUTTON =
  "inline-flex size-11 items-center justify-center rounded-md border border-border-strong " +
  "bg-bg-elevated text-fg hover:bg-border data-[active=true]:bg-accent data-[active=true]:text-accent-fg";

// On phones the groups dissolve (display: contents) so all nine buttons share one two-row strip;
// from sm up each group gets its own block and caption.
const GROUP = "contents sm:grid sm:justify-items-center sm:gap-1.5";
const STACK = "contents sm:grid sm:gap-1";

interface HoldButtonProps {
  readonly command: NavCommand;
  readonly label: string;
  readonly className?: string;
  readonly onHold: (pointerId: number, command: NavCommand) => void;
  readonly onRelease: (pointerId: number) => void;
  readonly onNudge: (command: NavCommand, ms: number) => void;
}

/** Drives the camera for as long as its own pointer is down. */
function HoldButton({ command, label, className, onHold, onRelease, onNudge }: HoldButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  // How long the last pointer press lasted, kept for the click that follows its release.
  const heldMs = useRef<number | null>(null);

  const press = (event: ReactPointerEvent) => {
    // Only the primary button, touch contact or pen tip holds; a right-click opens a menu that
    // would swallow the release.
    if (event.button !== PRIMARY_BUTTON) return;
    event.preventDefault();
    const { pointerId } = event;
    const pressedAt = Date.now();
    heldMs.current = null;
    ref.current?.setAttribute("data-active", "true");
    onHold(pointerId, command);

    // Release is heard on the window, so it fires even when the pointer leaves the button, and a
    // lost window focus ends the hold as well.
    const finish = () => {
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("blur", finish);
      ref.current?.setAttribute("data-active", "false");
      heldMs.current = Date.now() - pressedAt;
      onRelease(pointerId);
    };
    const onUp = (up: PointerEvent) => {
      if (up.pointerId === pointerId) finish();
    };
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("blur", finish);
  };

  // A keyboard click (detail 0) has no hold. A screen reader double-tap or switch access sends a
  // near-instant press, or none at all, so a hold shorter than a nudge is topped up to one.
  const click = (event: ReactMouseEvent) => {
    const held = event.detail === 0 ? 0 : (heldMs.current ?? 0);
    heldMs.current = null;
    const shortfall = KEY_NUDGE_MS - held;
    if (shortfall > 0) onNudge(command, shortfall);
  };

  return (
    <button
      ref={ref}
      type="button"
      className={cn(BUTTON, "touch-none select-none", className)}
      aria-label={label}
      title={label}
      onPointerDown={press}
      onClick={click}
    >
      <NavIcon name={command} />
    </button>
  );
}

function Group({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className={GROUP}>
      {children}
      <span className="hidden text-xs uppercase tracking-widest text-fg-muted sm:block">
        {caption}
      </span>
    </div>
  );
}

export interface NavPadProps {
  readonly onCommand: (command: NavCommand | null) => void;
  readonly onReset: () => void;
}

/** Pan, tilt and zoom controls pinned over the scene. */
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
    (command: NavCommand, ms: number) => {
      // A second press restarts the nudge instead of letting the first timer end it early.
      if (nudgeTimer.current !== null) window.clearTimeout(nudgeTimer.current);
      onCommandRef.current(command);
      nudgeTimer.current = window.setTimeout(() => {
        nudgeTimer.current = null;
        publish();
      }, ms);
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

  const hold = (command: NavCommand, label: string, className?: string) => (
    <HoldButton
      command={command}
      label={label}
      className={className}
      onHold={onHold}
      onRelease={onRelease}
      onNudge={onNudge}
    />
  );

  return (
    // A group, not a navigation landmark: these are camera controls, not page navigation.
    <div
      role="group"
      aria-label={c.navLabel.text}
      className={cn(
        "absolute bottom-2 right-2 grid max-w-[calc(100%-1rem)] grid-cols-5 gap-1 rounded-lg border border-border bg-bg-elevated p-1.5",
        "sm:bottom-3 sm:right-3 sm:flex sm:max-w-[calc(100%-1.5rem)] sm:flex-wrap sm:items-end sm:justify-end sm:gap-3 sm:p-2.5",
      )}
    >
      <Group caption={c.panGroup.text}>
        {/* Source order sweeps left to right, so focus order matches both the phone strip and the
            cross the sm grid places it in. */}
        <div className={cn(STACK, "sm:grid-cols-3 sm:grid-rows-3")}>
          {hold("pan-left", c.panLeft.text, "sm:col-start-1 sm:row-start-2")}
          {hold("pan-up", c.panUp.text, "sm:col-start-2 sm:row-start-1")}
          <button
            type="button"
            className={cn(BUTTON, "sm:col-start-2 sm:row-start-2")}
            aria-label={c.reset.text}
            title={c.reset.text}
            onClick={onReset}
          >
            <NavIcon name="reset" />
          </button>
          {hold("pan-down", c.panDown.text, "sm:col-start-2 sm:row-start-3")}
          {hold("pan-right", c.panRight.text, "sm:col-start-3 sm:row-start-2")}
        </div>
      </Group>
      <Group caption={c.tiltGroup.text}>
        <div className={STACK}>
          {hold("tilt-up", c.tiltUp.text)}
          {hold("tilt-down", c.tiltDown.text)}
        </div>
      </Group>
      <Group caption={c.zoomGroup.text}>
        <div className={STACK}>
          {/* An empty column on phones keeps zoom apart from tilt. */}
          {hold("zoom-in", c.zoomIn.text, "max-sm:col-start-4")}
          {hold("zoom-out", c.zoomOut.text)}
        </div>
      </Group>
    </div>
  );
}
