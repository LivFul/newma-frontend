"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PWA_COPY } from "@/content/home/chrome";

// Only the install offer (the browser's deferred prompt and the iOS share-menu hint) is remembered.
// The update notice never is: it has to show again whenever a new worker takes over.
const INSTALL_DISMISS_KEY = "newma-install-dismissed";
const IDLE_FALLBACK_MS = 1500;

type BeforeInstall = Event & { prompt: () => Promise<void> };

// Storage can be missing or throw (blocked site data, some private modes). That reads as "not dismissed".
function installDismissed(): boolean {
  try {
    return window.localStorage.getItem(INSTALL_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberInstallDismissal(): void {
  try {
    window.localStorage.setItem(INSTALL_DISMISS_KEY, "1");
  } catch {
    // The offer simply shows again next visit.
  }
}

export function PwaMount() {
  const [deferred, setDeferred] = useState<BeforeInstall | null>(null);
  const [iosHint, setIosHint] = useState(() => {
    if (typeof window === "undefined") return false;
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    return ios && !standalone && !installDismissed();
  });
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return undefined;
    // Development runs without a worker: dev chunk URLs are not content-hashed, and a worker left from a
    // production build would intercept them (sw.js now refuses to answer non-immutable build output from
    // cache, but an older installed worker does not). A leftover registration of this origin's /sw.js
    // plus the newma- caches are removed; other worker scripts and caches on the origin are left alone. (Another app served earlier on this same port
    // with its own root /sw.js cannot be told apart from NEWMA's, so it is removed too.)
    if (process.env.NODE_ENV === "development") {
      const script = new URL("/sw.js", window.location.origin).href;
      const ours = (registration: ServiceWorkerRegistration) =>
        [registration.active, registration.waiting, registration.installing].some(
          (worker) => worker?.scriptURL === script,
        );
      void navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.filter(ours).map((r) => r.unregister())))
        .then(() => caches.keys())
        .then((keys) =>
          Promise.all(
            keys.filter((key) => key.startsWith("newma-")).map((key) => caches.delete(key)),
          ),
        )
        .catch(() => undefined);
      return undefined;
    }
    const hadController = Boolean(navigator.serviceWorker.controller);
    // The worker is a progressive enhancement: a failed registration leaves the site fully usable.
    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    };
    let cancelRegister: () => void;
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(register);
      cancelRegister = () => window.cancelIdleCallback(id);
    } else {
      const id = window.setTimeout(register, IDLE_FALLBACK_MS);
      cancelRegister = () => window.clearTimeout(id);
    }
    const onController = () => {
      if (hadController) setUpdated(true);
    };
    navigator.serviceWorker.addEventListener("controllerchange", onController);
    return () => {
      cancelRegister();
      navigator.serviceWorker.removeEventListener("controllerchange", onController);
    };
  }, []);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      if (!installDismissed()) setDeferred(event as BeforeInstall);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    if (updated) {
      setUpdated(false);
      return;
    }
    rememberInstallDismissal();
    setDeferred(null);
    setIosHint(false);
  };

  if (!deferred && !iosHint && !updated) return null;

  return (
    <aside
      aria-label={PWA_COPY.region.text}
      className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 max-w-sm rounded-lg border border-border bg-bg-elevated p-4 shadow-lg max-sm:left-4"
    >
      <p className="text-sm text-fg">
        {updated ? PWA_COPY.updated.text : iosHint ? PWA_COPY.iosHint.text : PWA_COPY.install.text}
      </p>
      <div className="mt-3 flex gap-2">
        {updated ? (
          <Button className="min-h-11" onClick={() => window.location.reload()}>
            {PWA_COPY.reload.text}
          </Button>
        ) : null}
        {deferred ? (
          <Button
            className="min-h-11"
            onClick={() => {
              void deferred.prompt();
              setDeferred(null);
            }}
          >
            {PWA_COPY.installAction.text}
          </Button>
        ) : null}
        <Button className="min-h-11" variant="ghost" onClick={dismiss}>
          {PWA_COPY.dismiss.text}
        </Button>
      </div>
    </aside>
  );
}
