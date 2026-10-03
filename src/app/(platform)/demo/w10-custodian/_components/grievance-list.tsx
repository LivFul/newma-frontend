import type { Grievance } from "@/lib/demo/types";

/** The concerns already sent about one agreement, with their status in words. */
export function GrievanceList({ grievances }: { grievances: readonly Grievance[] }) {
  if (grievances.length === 0) {
    return <p className="text-sm">No concerns have been sent about this agreement.</p>;
  }
  return (
    <ul className="list-none space-y-2 p-0">
      {grievances.map((grievance) => (
        <li
          key={grievance.id}
          data-testid="agreement-grievance"
          className="rounded-md border border-border p-3 text-sm"
        >
          <p className="font-medium">
            {grievance.status === "open" ? "Open" : "Acknowledged"}: {grievance.category_text}
          </p>
          <p>{grievance.description}</p>
        </li>
      ))}
    </ul>
  );
}
