import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PwaMount } from "@/components/pwa/pwa-mount";
import { PWA_COPY } from "@/content/home/chrome";

class FakeServiceWorker extends EventTarget {
  controller: object | null = null;
  register = vi.fn(() => Promise.resolve({}));
}

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";

function installServiceWorker(controller: object | null = null) {
  const worker = new FakeServiceWorker();
  worker.controller = controller;
  Object.defineProperty(navigator, "serviceWorker", { value: worker, configurable: true });
  return worker;
}

function offerInstall() {
  const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
    prompt: vi.fn(() => Promise.resolve()),
  });
  act(() => {
    window.dispatchEvent(event);
  });
  return event;
}

const prompt = () => screen.queryByRole("complementary", { name: PWA_COPY.region.text });

beforeEach(() => {
  window.localStorage.clear();
  window.requestIdleCallback = ((callback: IdleRequestCallback) => {
    callback({ didTimeout: false, timeRemaining: () => 0 });
    return 1;
  }) as typeof window.requestIdleCallback;
  window.cancelIdleCallback = vi.fn();
});

afterEach(() => {
  // Unmount while the fake worker still exists: the effect cleanup reads navigator.serviceWorker.
  cleanup();
  Reflect.deleteProperty(navigator, "serviceWorker");
  Reflect.deleteProperty(window, "requestIdleCallback");
  Reflect.deleteProperty(window, "cancelIdleCallback");
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("PwaMount", () => {
  // Value: protects=the worker registers at the site root and nothing shows until there is something to say; fails_when=registration scope or path changes, or the prompt renders on load; why_new=PwaMount had no test; seam=none
  it("registers the worker and stays silent until there is something to offer", () => {
    const worker = installServiceWorker();
    render(<PwaMount />);
    expect(worker.register).toHaveBeenCalledWith("/sw.js", { scope: "/" });
    expect(prompt()).toBeNull();
  });

  // Value: protects=a browser without service workers renders nothing and does not throw; fails_when=the serviceWorker feature check is removed so navigator.serviceWorker is dereferenced; why_new=PwaMount had no test; seam=none
  it("does nothing in a browser without service worker support", () => {
    const { container } = render(<PwaMount />);
    expect(container).toBeEmptyDOMElement();
  });

  // Value: protects=the browser install prompt is held, offered, fired once on Install, and the offer closes; fails_when=preventDefault is dropped, Install no longer calls prompt(), or the offer stays open after; why_new=PwaMount had no test; seam=none
  it("offers the install prompt the browser deferred and closes the offer once it is used", async () => {
    const user = userEvent.setup();
    installServiceWorker();
    render(<PwaMount />);
    const event = offerInstall();
    expect(event.defaultPrevented).toBe(true);
    expect(prompt()).toHaveTextContent(PWA_COPY.install.text);
    await user.click(screen.getByRole("button", { name: PWA_COPY.installAction.text }));
    expect(event.prompt).toHaveBeenCalledTimes(1);
    expect(prompt()).toBeNull();
  });

  // Value: protects=iPhone and iPad visitors in a browser tab get the share-menu hint, installed apps do not, and a dismissed hint stays gone; fails_when=the UA, standalone or dismissal check breaks; why_new=PwaMount had no test; seam=none
  it("shows the share-menu hint on iOS only outside the installed app, and remembers dismissal", async () => {
    const user = userEvent.setup();
    installServiceWorker();
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(IPHONE_UA);

    const standalone = vi
      .spyOn(window, "matchMedia")
      .mockReturnValue({ matches: true } as MediaQueryList);
    const installed = render(<PwaMount />);
    expect(prompt()).toBeNull();
    installed.unmount();
    standalone.mockRestore();

    const first = render(<PwaMount />);
    expect(prompt()).toHaveTextContent(PWA_COPY.iosHint.text);
    await user.click(screen.getByRole("button", { name: PWA_COPY.dismiss.text }));
    expect(prompt()).toBeNull();
    first.unmount();

    render(<PwaMount />);
    expect(prompt()).toBeNull();
  });

  // Value: protects=the update notice appears only when a new worker replaces a running one, and Reload reloads the page; fails_when=a first install triggers the notice or Reload stops reloading; why_new=PwaMount had no test; seam=none
  it("announces an update only when a new worker takes over a controlled page, and reloads on request", async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload });

    const firstVisit = installServiceWorker(null);
    const initial = render(<PwaMount />);
    act(() => {
      firstVisit.dispatchEvent(new Event("controllerchange"));
    });
    expect(prompt()).toBeNull();
    initial.unmount();

    const returning = installServiceWorker({});
    render(<PwaMount />);
    act(() => {
      returning.dispatchEvent(new Event("controllerchange"));
    });
    expect(prompt()).toHaveTextContent(PWA_COPY.updated.text);
    await user.click(screen.getByRole("button", { name: PWA_COPY.reload.text }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  // Value: protects=a dismissed install offer stays dismissed for the browser's deferred prompt too, not only for the iOS hint; fails_when=the saved dismissal is not read before the deferred prompt is offered; why_new=only the iOS hint honoured the saved dismissal, so Chrome and Android re-offered on every load; seam=none
  it("keeps a dismissed install offer dismissed on the next visit", async () => {
    const user = userEvent.setup();
    installServiceWorker();
    const first = render(<PwaMount />);
    offerInstall();
    await user.click(screen.getByRole("button", { name: PWA_COPY.dismiss.text }));
    expect(prompt()).toBeNull();
    first.unmount();

    render(<PwaMount />);
    const again = offerInstall();
    expect(again.defaultPrevented).toBe(true);
    expect(prompt()).toBeNull();
  });

  // Value: protects=dismissing the update notice is not remembered, so it cannot hide the iOS install hint for good; fails_when=the update dismissal writes the install key; why_new=one shared key let an update dismissal suppress the iOS hint permanently; seam=none
  it("does not remember a dismissed update notice", async () => {
    const user = userEvent.setup();
    const worker = installServiceWorker({});
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(IPHONE_UA);
    render(<PwaMount />);
    act(() => {
      worker.dispatchEvent(new Event("controllerchange"));
    });
    expect(prompt()).toHaveTextContent(PWA_COPY.updated.text);
    await user.click(screen.getByRole("button", { name: PWA_COPY.dismiss.text }));
    expect(window.localStorage.getItem("newma-install-dismissed")).toBeNull();
    expect(prompt()).toHaveTextContent(PWA_COPY.iosHint.text);
  });

  // Value: protects=the prompt renders and dismisses even when the browser blocks storage, instead of crashing the page; fails_when=localStorage is read or written without a guard; why_new=a SecurityError during render took the whole client tree down; seam=none
  it("still works when storage is blocked", async () => {
    const user = userEvent.setup();
    installServiceWorker();
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(IPHONE_UA);
    const blocked = () => {
      throw new DOMException("blocked", "SecurityError");
    };
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(blocked);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(blocked);
    expect(() => render(<PwaMount />)).not.toThrow();
    expect(prompt()).toHaveTextContent(PWA_COPY.iosHint.text);
    await user.click(screen.getByRole("button", { name: PWA_COPY.dismiss.text }));
    expect(prompt()).toBeNull();
  });

  // Value: protects=a rejected worker registration leaves the site quiet and usable; fails_when=the registration rejection is left unhandled or surfaces a prompt; why_new=the .catch branch was untested; seam=none
  it("survives a rejected worker registration", async () => {
    const worker = installServiceWorker();
    worker.register.mockRejectedValueOnce(new Error("blocked"));
    render(<PwaMount />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(worker.register).toHaveBeenCalledTimes(1);
    expect(prompt()).toBeNull();
  });

  // Value: protects=registration waits for an idle moment, falls back to a timer where requestIdleCallback is missing, and never fires after unmount; fails_when=the fallback timer is not cleared on unmount or fires early; why_new=the fallback branch and the unmount cleanup were untested; seam=none
  it("falls back to a timer without requestIdleCallback and cancels it on unmount", () => {
    vi.useFakeTimers();
    Reflect.deleteProperty(window, "requestIdleCallback");
    const worker = installServiceWorker();
    const mounted = render(<PwaMount />);
    vi.advanceTimersByTime(1499);
    expect(worker.register).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(worker.register).toHaveBeenCalledTimes(1);
    mounted.unmount();

    const second = installServiceWorker();
    render(<PwaMount />).unmount();
    vi.advanceTimersByTime(5000);
    expect(second.register).not.toHaveBeenCalled();
  });
});
