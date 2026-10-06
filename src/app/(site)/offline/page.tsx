import { Wordmark } from "@/components/site/wordmark";
import { OFFLINE } from "@/content/home/copy";

export const metadata = {
  title: OFFLINE.title.text,
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 px-6 py-20">
      <Wordmark />
      <h1 className="font-display text-4xl font-medium tracking-[-0.03em]">{OFFLINE.title.text}</h1>
      <p className="max-w-[42ch] text-center text-lg text-fg-muted">{OFFLINE.body.text}</p>
    </div>
  );
}
