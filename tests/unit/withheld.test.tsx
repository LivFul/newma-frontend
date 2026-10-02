import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Withheld } from "@/components/ui/withheld";
import { JsonView } from "@/components/ui/json-view";
import { StatusBadge } from "@/components/ui";

describe("Withheld", () => {
  it("renders the word withheld with a field-specific label", () => {
    render(<Withheld field="value" />);
    const cell = screen.getByLabelText("withheld: value");
    expect(cell).toHaveTextContent("withheld");
  });
});

describe("JsonView", () => {
  it("pretty-prints and highlights a path", () => {
    render(<JsonView value={{ a: { b: 1 } }} label="Manifest" highlightPath="a.b" />);
    const region = screen.getByRole("region", { name: "Manifest" });
    expect(region).toHaveTextContent('"b": 1');
    expect(screen.getByText(/Altered field: a\.b/)).toBeInTheDocument();
  });
});

describe("StatusBadge (GateStatus, A-P0-F13)", () => {
  it.each(["NOT_STARTED", "PENDING", "PASS", "FAIL", "HOLD", "INVALIDATED"] as const)(
    "renders %s",
    (status) => {
      render(<StatusBadge status={status} />);
      expect(screen.getByText(status)).toBeInTheDocument();
    },
  );
});
