import type { Metadata } from "next";
import {
  Badge,
  Button,
  StatusBadge,
  Dialog,
  DialogContent,
  DialogTrigger,
  Tooltip,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Primitives — NEWMA",
  robots: { index: false, follow: false },
};

export default function PrimitivesPage() {
  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-3xl space-y-8 p-8">
      <h1 className="text-3xl font-semibold">Primitives</h1>
      <section aria-labelledby="buttons">
        <h2 id="buttons" className="text-xl">
          Buttons
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </div>
      </section>
      <section aria-labelledby="badges">
        <h2 id="badges" className="text-xl">
          Badges
        </h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Neutral</Badge>
          <Badge tone="warning">Synthetic</Badge>
          <StatusBadge status="PASS" />
          <StatusBadge status="HOLD" />
          <StatusBadge status="NOT_STARTED" />
        </div>
      </section>
      <section aria-labelledby="dialog">
        <h2 id="dialog" className="text-xl">
          Dialog
        </h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary">Open dialog</Button>
          </DialogTrigger>
          <DialogContent title="Example dialog" description="Demo step-up confirmation pattern.">
            <Button>Confirm</Button>
          </DialogContent>
        </Dialog>
      </section>
      <section aria-labelledby="tooltip">
        <h2 id="tooltip" className="text-xl">
          Tooltip
        </h2>
        <Tooltip content="Synthetic value">
          <Button variant="ghost">Hover or focus me</Button>
        </Tooltip>
      </section>
    </main>
  );
}
