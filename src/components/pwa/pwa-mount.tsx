"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PWA_COPY } from "@/content/home/chrome";

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
    if (!("serviceWorker" in navigator)) return undefined;
    const hadController = Boolean(navigator.serviceWorker.controller);
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
    const id = idle(() => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    });
    const onController = () => {
      if (hadController) setUpdated(true);
    };
    navigator.serviceWorker.addEventListener("controllerchange", onController);
    return () => {
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(id as number);
      navigator.serviceWorker.removeEventListener("controllerchange", onController);
    };
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
    <aside
      aria-label={PWA_COPY.region.text}
      className="fixed right-4 bottom-4 z-50 max-w-sm rounded-xl border border-border bg-bg-elevated p-4 shadow-lg"
    >
      <p className="text-sm text-fg">
        {updated ? PWA_COPY.updated.text : iosHint ? PWA_COPY.iosHint.text : PWA_COPY.install.text}
      </p>
      <div className="mt-3 flex gap-2">
        {updated ? (
          <Button size="sm" onClick={() => window.location.reload()}>
            {PWA_COPY.reload.text}
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
            {PWA_COPY.installAction.text}
          </Button>
        ) : null}
        <Button size="sm" variant="ghost" onClick={hide}>
          {PWA_COPY.dismiss.text}
        </Button>
      </div>
    </aside>
  );
}
