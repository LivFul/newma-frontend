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

  it("nudges the camera briefly for a keyboard activation, which has no hold", () => {
    vi.useFakeTimers();
    const onCommand = vi.fn();
    render(<NavPad onCommand={onCommand} onReset={vi.fn()} />);
    // detail 0 is how a browser reports a click made with Enter or Space.
    fireEvent.click(screen.getByRole("button", { name: c.panRight.text }), { detail: 0 });
    expect(onCommand).toHaveBeenCalledWith("pan-right");
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onCommand).toHaveBeenLastCalledWith(null);
  });

  it("ignores the click that follows a pointer press, which the press already handled", () => {
    const onCommand = vi.fn();
    render(<NavPad onCommand={onCommand} onReset={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: c.zoomOut.text }), { detail: 1 });
    expect(onCommand).not.toHaveBeenCalled();
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
