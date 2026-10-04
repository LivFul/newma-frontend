"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ClientError } from "@/lib/demo/client";
import { isRecord } from "@/lib/demo/guards";
import { ActionButton } from "./action-button";

const settlementHref = (id: string) => `/demo/w7-settlement/settlements/${encodeURIComponent(id)}`;

function existing(error: ClientError) {
  if (error.code !== "settlement_exists" || !isRecord(error.details)) return null;
  const id = error.details.settlement_id;
  if (typeof id !== "string") return null;
  return (
    <Link href={settlementHref(id)} className="text-sm underline underline-offset-4">
      Open the existing settlement
    </Link>
  );
}

/** Finance opens the settlement of an approved license (A9) and lands on its workspace. */
export function CreateSettlementButton({ licenseId }: { licenseId: string }) {
  const router = useRouter();
  return (
    <ActionButton
      label="Create settlement"
      endpoint="/api/demo/settlements"
      body={{ license_id: licenseId }}
      onDone={(data) => {
        const id = isRecord(data) && typeof data.id === "string" ? data.id : undefined;
        if (id) router.push(settlementHref(id));
        else router.refresh();
      }}
      extraError={existing}
    />
  );
}
