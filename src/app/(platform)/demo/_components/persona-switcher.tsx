"use client";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { switchPersona } from "@/lib/demo/persona-client";
import { PERSONAS, type PersonaId } from "@/lib/personas";

// Native <select>: accessible and light. Talks to the BFF route only, never to the API client.
export function PersonaSwitcher({ persona }: { persona: PersonaId }) {
  const router = useRouter();
  const id = useId();
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  const switchTo = (next: PersonaId) => {
    setError(undefined);
    startTransition(async () => {
      if (!(await switchPersona(next))) {
        setError("Could not switch persona. Try again.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="place text-fg-muted">
        Persona
      </label>
      <select
        id={id}
        value={persona}
        aria-busy={pending || undefined}
        onChange={(event) => switchTo(event.target.value as PersonaId)}
        className="min-h-10 rounded-md border border-fg bg-bg-elevated px-3 text-sm text-fg"
      >
        {PERSONAS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
