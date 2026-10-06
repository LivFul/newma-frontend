"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "newma-install-dismissed";

type BeforeInstall = Event & { prompt: () => Promise<void> };

export function PwaMount() {
  const [deferred, setDeferred] = useState<BeforeInstall | null>(null);
  const [iosHint, setIosHint] = useState(() => {
    if (typeof window === "undefined") return false;
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    return ios && !standalone && window.localStorage.getItem(DISMISS_KEY) !== "1";
  });
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
      const id = idle(() => {
        navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
      });
      const onController = () => setUpdated(true);
      navigator.serviceWorker.addEventListener("controllerchange", onController);
      return () => {
        if (typeof window.cancelIdleCallback === "function")
          window.cancelIdleCallback(id as number);
        navigator.serviceWorker.removeEventListener("controllerchange", onController);
      };
    }
    return undefined;
  }, []);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstall);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const hide = () => {
    setDeferred(null);
    setIosHint(false);
    setUpdated(false);
    window.localStorage.setItem(DISMISS_KEY, "1");
  };

  if (!deferred && !iosHint && !updated) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50 max-w-sm rounded-xl border border-border bg-bg-elevated p-4 shadow-lg">
      <p className="text-sm text-fg">
        {updated
          ? "A new version of NEWMA is available. Reload to update."
          : iosHint
            ? "Install NEWMA: tap Share, then Add to Home Screen."
            : "Install NEWMA on this device for a full-screen app."}
      </p>
      <div className="mt-3 flex gap-2">
        {updated ? (
          <Button size="sm" onClick={() => window.location.reload()}>
            Reload
          </Button>
        ) : null}
        {deferred ? (
          <Button
            size="sm"
            onClick={() => {
              void deferred.prompt();
              hide();
            }}
          >
            Install
          </Button>
        ) : null}
        <Button size="sm" variant="ghost" onClick={hide}>
          Not now
        </Button>
      </div>
    </div>
  );
}
