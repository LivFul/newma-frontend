"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui";

export function SignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  const signOut = () =>
    startTransition(async () => {
      const response = await fetch("/api/demo/sessions", { method: "DELETE" }).catch(
        () => undefined,
      );
      if (!response?.ok) {
        setError("Sign-out failed. Try again.");
        return;
      }
      router.push("/access");
    });

  return (
    <div className="flex flex-col gap-1">
      <Button variant="ghost" size="sm" onClick={signOut} disabled={pending}>
        Sign out
      </Button>
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
