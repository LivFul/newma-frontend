"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

// A render or effect error inside the lazily loaded scene must never take the home page down. The
// boundary renders nothing once it has caught one and tells the viewer, which swaps the static
// diagram back. It is keyed by the viewer per attempt, so the next open starts with a fresh one.
export class SceneBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("workflow scene crashed", error, info.componentStack);
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
