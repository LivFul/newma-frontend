import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NavPad } from "@/components/workflow-3d/nav-pad";
import { WORKFLOW_CONTROLS } from "@/content/home/workflow";

afterEach(() => vi.useRealTimers());

const c = WORKFLOW_CONTROLS;

describe("NavPad", () => {
  it("offers every control with an accessible name from the copy", () => {
    render(<NavPad onCommand={vi.fn()} onReset={vi.fn()} />);
    const names = [
      c.panUp,
      c.panDown,
      c.panLeft,
      c.panRight,
      c.tiltUp,
      c.tiltDown,
      c.zoomIn,
      c.zoomOut,
      c.reset,
    ];
    for (const block of names) {
      expect(screen.getByRole("button", { name: block.text }), block.id).toBeInTheDocument();
    }
    // A labelled group rather than a navigation landmark: these are camera controls.
    expect(screen.getByRole("group", { name: c.navLabel.text })).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).toBeNull();
    for (const group of [c.panGroup, c.tiltGroup, c.zoomGroup]) {
      expect(screen.getByText(group.text)).toBeInTheDocument();
    }
  });

  // Value: protects=44px touch targets and icon-only buttons named by the copy; fails_when=buttons shrink below size-11, an icon loses aria-hidden or focusable=false, or a text glyph creeps back into the accessible name; why_new=the pad's sizing and icons had no coverage; seam=none
  it("draws each control as a 44px button with a decorative icon and a name from the copy", () => {
    render(<NavPad onCommand={vi.fn()} onReset={vi.fn()} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(9);
    for (const button of buttons) {
      expect(button).toHaveClass("size-11");
      expect(button.textContent).toBe("");
      const icons = button.querySelectorAll("svg");
      expect(icons).toHaveLength(1);
      expect(icons[0]).toHaveAttribute("aria-hidden", "true");
      expect(icons[0]).toHaveAttribute("focusable", "false");
    }
    expect(buttons.map((b) => b.getAttribute("aria-label")).sort()).toEqual(
      [
        c.panUp,
        c.panDown,
        c.panLeft,
        c.panRight,
        c.tiltUp,
        c.tiltDown,
        c.zoomIn,
        c.zoomOut,
        c.reset,
      ]
        .map((block) => block.text)
        .sort(),
    );
  });

  it("drives the camera while a button is held and stops on release anywhere", () => {
    const onCommand = vi.fn();
    render(<NavPad onCommand={onCommand} onReset={vi.fn()} />);
    const button = screen.getByRole("button", { name: c.zoomIn.text });

    fireEvent.pointerDown(button);
    expect(onCommand).toHaveBeenLastCalledWith("zoom-in");
    expect(button).toHaveAttribute("data-active", "true");

    // The pointer is released away from the button, on the window.
    fireEvent.pointerUp(window);
    expect(onCommand).toHaveBeenLastCalledWith(null);
    expect(button).toHaveAttribute("data-active", "false");
  });

  it("stops when the browser cancels the pointer", () => {
    const onCommand = vi.fn();
    render(<NavPad onCommand={onCommand} onReset={vi.fn()} />);
    fireEvent.pointerDown(screen.getByRole("button", { name: c.panLeft.text }));
    fireEvent.pointerCancel(window);
    expect(onCommand).toHaveBeenLastCalledWith(null);
  });

  it("stops listening after a release, so a later pointer-up does nothing", () => {
    const onCommand = vi.fn();
    render(<NavPad onCommand={onCommand} onReset={vi.fn()} />);
    fireEvent.pointerDown(screen.getByRole("button", { name: c.tiltUp.text }));
    fireEvent.pointerUp(window);
    onCommand.mockClear();
    fireEvent.pointerUp(window);
    expect(onCommand).not.toHaveBeenCalled();
  });

  // Value: protects=Enter or Space moves the camera by one nudge, not two; fails_when=the pointer top-up also fires on a detail-0 click; why_new=the old assertion allowed any number of nudges; seam=none
  it("nudges the camera briefly for a keyboard activation, which has no hold", () => {
    vi.useFakeTimers();
    const onCommand = vi.fn();
    render(<NavPad onCommand={onCommand} onReset={vi.fn()} />);
    // detail 0 is how a browser reports a click made with Enter or Space.
    fireEvent.click(screen.getByRole("button", { name: c.panRight.text }), { detail: 0 });
    // Exactly once: the pointer top-up must not stack a second nudge on a keyboard click.
    expect(onCommand.mock.calls).toEqual([["pan-right"]]);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onCommand).toHaveBeenLastCalledWith(null);
  });

  // Value: protects=a long hold stops on release with no extra movement from its click; fails_when=the click after a pointer press nudges regardless of how long the press lasted; why_new=the old test clicked with no press at all, which now (rightly) nudges; seam=none
  it("adds nothing on the click that follows a hold longer than a nudge", () => {
    vi.useFakeTimers();
    const onCommand = vi.fn();
    render(<NavPad onCommand={onCommand} onReset={vi.fn()} />);
    const button = screen.getByRole("button", { name: c.zoomOut.text });
    fireEvent.pointerDown(button);
    act(() => {
      vi.advanceTimersByTime(400);
    });
    fireEvent.pointerUp(window);
    fireEvent.click(button, { detail: 1 });
    expect(onCommand).toHaveBeenLastCalledWith(null);
    expect(onCommand.mock.calls.filter(([cmd]) => cmd === "zoom-out")).toHaveLength(1);
  });

  // Value: protects=VoiceOver double-tap and switch access still move the camera; fails_when=only detail-0 clicks nudge, so a near-instant press and release moves nothing; why_new=no test covered an assistive-tech activation; seam=none
  it("tops a near-instant tap up to one nudge", () => {
    vi.useFakeTimers();
    const onCommand = vi.fn();
    render(<NavPad onCommand={onCommand} onReset={vi.fn()} />);
    const button = screen.getByRole("button", { name: c.panUp.text });
    fireEvent.pointerDown(button);
    fireEvent.pointerUp(window);
    fireEvent.click(button, { detail: 1 });
    // One press call, one top-up nudge.
    expect(onCommand.mock.calls.filter(([cmd]) => cmd === "pan-up")).toHaveLength(2);
    expect(onCommand).toHaveBeenLastCalledWith("pan-up");
    act(() => {
      vi.advanceTimersByTime(249);
    });
    expect(onCommand).toHaveBeenLastCalledWith("pan-up");
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onCommand).toHaveBeenLastCalledWith(null);
  });

  // Value: protects=a short hold moves exactly one nudge in total, not hold plus a full nudge; fails_when=the top-up ignores the time already held; why_new=the shortfall arithmetic had no coverage; seam=none
  it("tops a short hold up only by the time it fell short", () => {
    vi.useFakeTimers();
    const onCommand = vi.fn();
    render(<NavPad onCommand={onCommand} onReset={vi.fn()} />);
    const button = screen.getByRole("button", { name: c.tiltDown.text });
    fireEvent.pointerDown(button);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    fireEvent.pointerUp(window);
    fireEvent.click(button, { detail: 1 });
    act(() => {
      vi.advanceTimersByTime(149);
    });
    expect(onCommand).toHaveBeenLastCalledWith("tilt-down");
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onCommand).toHaveBeenLastCalledWith(null);
  });

  // Value: protects=a click with no pointer behind it (some screen readers) still nudges once; fails_when=the top-up requires a preceding pointer press; why_new=assistive tech may synthesise only the click; seam=none
  it("nudges once for a click that no pointer press preceded", () => {
    const onCommand = vi.fn();
    render(<NavPad onCommand={onCommand} onReset={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: c.zoomOut.text }), { detail: 1 });
    expect(onCommand.mock.calls).toEqual([["zoom-out"]]);
  });

  it("ignores a secondary mouse button, whose context menu would swallow the release", () => {
    const onCommand = vi.fn();
    render(<NavPad onCommand={onCommand} onReset={vi.fn()} />);
    fireEvent.pointerDown(screen.getByRole("button", { name: c.panUp.text }), { button: 2 });
    expect(onCommand).not.toHaveBeenCalled();
  });

  it("ends a hold when the window loses focus", () => {
    const onCommand = vi.fn();
    render(<NavPad onCommand={onCommand} onReset={vi.fn()} />);
    fireEvent.pointerDown(screen.getByRole("button", { name: c.zoomOut.text }));
    fireEvent.blur(window);
    expect(onCommand).toHaveBeenLastCalledWith(null);
  });

  it("lets each held pointer own its command, so releasing one keeps the other going", () => {
    const onCommand = vi.fn();
    render(<NavPad onCommand={onCommand} onReset={vi.fn()} />);
    fireEvent.pointerDown(screen.getByRole("button", { name: c.panLeft.text }), { pointerId: 1 });
    fireEvent.pointerDown(screen.getByRole("button", { name: c.zoomIn.text }), { pointerId: 2 });
    expect(onCommand).toHaveBeenLastCalledWith("zoom-in");

    fireEvent.pointerUp(window, { pointerId: 2 });
    expect(onCommand).toHaveBeenLastCalledWith("pan-left");

    fireEvent.pointerUp(window, { pointerId: 1 });
    expect(onCommand).toHaveBeenLastCalledWith(null);
  });

  it("ignores a release from a pointer that is not the one holding the button", () => {
    const onCommand = vi.fn();
    render(<NavPad onCommand={onCommand} onReset={vi.fn()} />);
    fireEvent.pointerDown(screen.getByRole("button", { name: c.tiltDown.text }), { pointerId: 1 });
    onCommand.mockClear();
    fireEvent.pointerUp(window, { pointerId: 9 });
    expect(onCommand).not.toHaveBeenCalled();
    fireEvent.pointerUp(window, { pointerId: 1 });
    expect(onCommand).toHaveBeenLastCalledWith(null);
  });

  it("restarts the nudge on a second keyboard press instead of ending it early", () => {
    vi.useFakeTimers();
    const onCommand = vi.fn();
    render(<NavPad onCommand={onCommand} onReset={vi.fn()} />);
    const button = screen.getByRole("button", { name: c.panRight.text });
    fireEvent.click(button, { detail: 0 });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    fireEvent.click(button, { detail: 0 });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    // 400 ms in, the first timer would have fired at 250 ms; the second nudge is still running.
    expect(onCommand).toHaveBeenLastCalledWith("pan-right");
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(onCommand).toHaveBeenLastCalledWith(null);
  });

  it("stops the camera when the pad leaves the page mid-hold", () => {
    const onCommand = vi.fn();
    const { unmount } = render(<NavPad onCommand={onCommand} onReset={vi.fn()} />);
    fireEvent.pointerDown(screen.getByRole("button", { name: c.panDown.text }));
    onCommand.mockClear();
    unmount();
    expect(onCommand).toHaveBeenLastCalledWith(null);
  });

  it("resets the view from the centre button", () => {
    const onReset = vi.fn();
    render(<NavPad onCommand={vi.fn()} onReset={onReset} />);
    fireEvent.click(screen.getByRole("button", { name: c.reset.text }), { detail: 1 });
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
