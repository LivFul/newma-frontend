import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FieldDisclosureTable } from "@/app/(platform)/demo/_components/field-disclosure";
import {
  ExportStatusText,
  LockStateText,
  ObligationStatusText,
} from "@/app/(platform)/demo/_components/status-text";
import type { FieldDisclosure } from "@/lib/demo/types";

const disclosed: FieldDisclosure = {
  path: "identity.name",
  section: "identity",
  label: "Compound name",
  status: "disclosed",
  value: "Synthetic compound alpha",
  withheld_reason: null,
  synthetic: true,
};
const withheld: FieldDisclosure = {
  path: "provenance.collection_location",
  section: "provenance",
  label: "Collection location",
  status: "withheld",
  value: null,
  withheld_reason: {
    code: "restricted_field",
    message: "This field is never disclosed.",
    rights_record_id: null,
  },
  synthetic: true,
};

describe("FieldDisclosureTable", () => {
  it("shows a disclosed value with a Synthetic badge", () => {
    render(<FieldDisclosureTable caption="Disclosed fields" rows={[disclosed]} />);
    const row = screen.getByRole("row", { name: /Compound name/ });
    expect(within(row).getByText("Synthetic compound alpha")).toBeInTheDocument();
    expect(within(row).getByTestId("synthetic-badge")).toBeInTheDocument();
  });

  it("shows the word withheld with the reason code and message, never a value", () => {
    render(<FieldDisclosureTable caption="Withheld fields" rows={[withheld]} />);
    const row = screen.getByRole("row", { name: /Collection location/ });
    expect(within(row).getByTestId("withheld")).toHaveTextContent("withheld");
    expect(row).toHaveTextContent("withheld: Collection location");
    expect(row).toHaveTextContent("restricted_field");
    expect(row).toHaveTextContent("This field is never disclosed.");
  });

  it("never renders a value for a withheld row even when the fixture carries one (hostile)", () => {
    const hostile = { ...withheld, value: "TOP-SECRET-LOCATION" } as FieldDisclosure;
    const { container } = render(<FieldDisclosureTable caption="Fields" rows={[hostile]} />);
    expect(container).not.toHaveTextContent("TOP-SECRET-LOCATION");
    expect(screen.getByTestId("withheld")).toBeInTheDocument();
  });

  it("is not blank when a withheld row has no reason", () => {
    render(
      <FieldDisclosureTable caption="Fields" rows={[{ ...withheld, withheld_reason: null }]} />,
    );
    expect(screen.getByTestId("withheld")).toHaveTextContent("withheld");
  });

  it("renders non-string values as compact JSON and an empty list with a note", () => {
    const { rerender } = render(
      <FieldDisclosureTable
        caption="Fields"
        rows={[{ ...disclosed, value: { score: 0.5, tags: ["a"] } }]}
      />,
    );
    expect(screen.getByText('{"score":0.5,"tags":["a"]}')).toBeInTheDocument();
    rerender(<FieldDisclosureTable caption="Fields" rows={[]} emptyText="No fields." />);
    expect(screen.getByText("No fields.")).toBeInTheDocument();
  });
});

describe("status texts carry words as well as symbols (never colour alone)", () => {
  it.each([
    ["active", "Active"],
    ["expired", "Expired"],
    ["suspended", "Suspended"],
  ] as const)("export %s", (status, word) => {
    render(<ExportStatusText status={status} />);
    expect(screen.getByText(word)).toBeInTheDocument();
  });

  it.each([
    ["fulfilled", "Done"],
    ["due", "Due"],
    ["overdue", "Late"],
  ] as const)("obligation %s", (status, word) => {
    render(<ObligationStatusText status={status} />);
    expect(screen.getByText(word)).toBeInTheDocument();
  });

  it.each([
    ["locked", "Locked"],
    ["open", "Open"],
  ] as const)("lock state %s", (state, word) => {
    render(<LockStateText state={state} />);
    expect(screen.getByText(word)).toBeInTheDocument();
  });

  it("hides the decorative symbol from assistive technology", () => {
    const { container } = render(<ExportStatusText status="suspended" />);
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});
