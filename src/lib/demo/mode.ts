// The only module allowed to read NEXT_PUBLIC_DEMO_MODE (prompt §3.3; scripts/check-demo-isolation.sh).
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}
