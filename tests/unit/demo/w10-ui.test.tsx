import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AgreementCard } from "@/app/(platform)/demo/w10-custodian/_components/agreement-card";
import { GrievanceForm } from "@/app/(platform)/demo/w10-custodian/_components/grievance-form";
import { GrievanceList } from "@/app/(platform)/demo/w10-custodian/_components/grievance-list";
import { ObligationsTable } from "@/app/(platform)/demo/w10-custodian/_components/obligations-table";
import { OutcomeNotice } from "@/app/(platform)/demo/w10-custodian/_components/outcome-notice";
import { Summary } from "@/app/(platform)/demo/w10-custodian/_components/summary";
import { custodianAgreement, custodianView, grievance } from "./p5b-fixtures";

describe("Summary", () => {
  it("says in plain words what the view holds and shows the counts", () => {
    render(<Summary summary={custodianView().summary} />);
    const summary = screen.getByRole("region", { name: "At a glance" });
    expect(summary).toHaveTextContent("1 agreement");
    expect(summary).toHaveTextContent("1 of 3 promises are done");
    expect(summary).toHaveTextContent("1 is late");
    expect(summary).toHaveTextContent("0 open concerns");
    expect(within(summary).getAllByTestId("synthetic-badge").length).toBeGreaterThan(0);
  });

  it("uses singular and plural words correctly", () => {
    render(
      <Summary
        summary={{
          agreements: 2,
          uses_allowed: 3,
          obligations: 1,
          obligations_fulfilled: 0,
          obligations_overdue: 0,
          open_grievances: 1,
        }}
      />,
    );
    const summary = screen.getByRole("region", { name: "At a glance" });
    expect(summary).toHaveTextContent("2 agreements");
    expect(summary).toHaveTextContent("1 open concern");
    expect(summary).not.toHaveTextContent("1 open concerns");
  });
});

describe("ObligationsTable", () => {
  it("has a caption, three named columns and a status in words on every row", () => {
    render(<ObligationsTable obligations={custodianAgreement().obligations} title="Agreement A" />);
    const table = screen.getByRole("table", { name: /promises.*Agreement A/i });
    expect(
      within(table).getByRole("columnheader", { name: "What was promised" }),
    ).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "Due" })).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: "Where it stands" }),
    ).toBeInTheDocument();
    const rows = within(table).getAllByTestId("obligation-row");
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent("Done");
    expect(rows[0]).toHaveTextContent("Done on 12 February 2026");
    expect(rows[1]).toHaveTextContent("Due");
    expect(rows[1]).toHaveTextContent("Due by 31 March 2027");
    expect(rows[2]).toHaveTextContent("Late");
    expect(rows[2]).toHaveTextContent("Late: was due on 31 December 2025");
    for (const row of rows) expect(row.textContent?.trim().length).toBeGreaterThan(10);
  });

  it("says so when there are no promises", () => {
    render(<ObligationsTable obligations={[]} title="Agreement A" />);
    expect(screen.getByText("This agreement lists no promises.")).toBeInTheDocument();
  });
});

describe("GrievanceList", () => {
  it("shows each concern with its status in words, and nothing when there are none", () => {
    const { rerender } = render(
      <GrievanceList grievances={[grievance(), grievance({ id: "g2", status: "acknowledged" })]} />,
    );
    const items = screen.getAllByTestId("agreement-grievance");
    expect(items[0]).toHaveTextContent("Open");
    expect(items[0]).toHaveTextContent("The promised report did not arrive.");
    expect(items[0]).toHaveTextContent("A promise in the agreement was not kept");
    expect(items[1]).toHaveTextContent("Acknowledged");
    rerender(<GrievanceList grievances={[]} />);
    expect(
      screen.getByText("No concerns have been sent about this agreement."),
    ).toBeInTheDocument();
  });
});

describe("GrievanceForm (plain HTML, no JavaScript)", () => {
  const renderForm = () =>
    render(<GrievanceForm agreement={custodianAgreement()} idempotencyKey="key-abc" />);

  it("is a post form to the BFF with the record and the key as hidden fields", () => {
    const { container } = renderForm();
    const form = container.querySelector("form")!;
    expect(form).toHaveAttribute("method", "post");
    expect(form).toHaveAttribute("action", "/api/demo/grievances");
    expect(container.querySelector('input[name="rights_record_id"]')).toHaveAttribute(
      "value",
      "rec-1",
    );
    expect(container.querySelector('input[name="rights_record_id"]')).toHaveAttribute(
      "type",
      "hidden",
    );
    expect(container.querySelector('input[name="idempotency_key"]')).toHaveAttribute(
      "value",
      "key-abc",
    );
  });

  it("has labelled controls: category, optional promise and description with a length hint", () => {
    renderForm();
    expect(screen.getByLabelText("What is your concern about?")).toBeInTheDocument();
    const promise = screen.getByLabelText("Which promise is it about? (optional)");
    expect(
      within(promise)
        .getAllByRole("option")
        .map((o) => o.textContent),
    ).toEqual([
      "Not about one promise",
      "Send a yearly progress report",
      "Share a summary of results",
      "Offer a training day",
    ]);
    const description = screen.getByLabelText("Tell us what happened (required)");
    expect(description).toHaveAttribute("name", "description");
    expect(description).toHaveAttribute("maxlength", "1000");
    expect(description).not.toHaveAttribute("required");
    expect(description).not.toHaveAttribute("minlength");
    expect(screen.getByText(/at least 10 characters/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send concern" })).toHaveAttribute("type", "submit");
  });

  it("lists the five categories in plain words", () => {
    renderForm();
    const options = within(screen.getByLabelText("What is your concern about?")).getAllByRole(
      "option",
    );
    expect(options.map((o) => o.getAttribute("value"))).toEqual([
      "obligation_not_met",
      "use_outside_agreement",
      "consent_concern",
      "benefit_not_received",
      "other",
    ]);
  });
});

describe("OutcomeNotice", () => {
  it("announces a sent concern in a focusable section named by its heading", () => {
    render(<OutcomeNotice raised="grv-1" error={undefined} />);
    const section = screen.getByRole("region", { name: "Your concern was sent" });
    expect(section).toHaveAttribute("id", "outcome");
    expect(section).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("status")).toHaveTextContent("Your concern was sent");
  });

  it("does not read a hand-typed ?raised= as a success", () => {
    render(<OutcomeNotice raised="grv-1" error={undefined} raisedKnown={false} />);
    expect(screen.queryByText(/Your concern was sent/)).toBeNull();
  });

  it.each([
    ["validation_error", "Please describe your concern in at least 10 characters and at most 1000"],
    ["persona_forbidden", "Only a community liaison can send a concern"],
    ["not_found", "could not find"],
    ["idempotency_conflict", "already sent"],
    ["upstream_error", "not available"],
  ])("reads %s as a plain sentence in an alert", (code, text) => {
    render(<OutcomeNotice raised={undefined} error={code} />);
    expect(screen.getByRole("alert")).toHaveTextContent(text);
  });

  it("ignores an unknown error code and an unsafe raised id", () => {
    const { container } = render(<OutcomeNotice raised="<script>" error="evil_code" />);
    expect(container).toHaveTextContent("");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("renders nothing visible when there is no outcome", () => {
    const { container } = render(<OutcomeNotice raised={undefined} error={undefined} />);
    expect(container).toHaveTextContent("");
  });
});

describe("AgreementCard", () => {
  it("shows what the agreement says: who, status, validity and what is and is not allowed", () => {
    render(<AgreementCard agreement={custodianAgreement()} idempotencyKey="k" />);
    const card = screen.getByRole("article");
    expect(within(card).getByRole("heading", { level: 2 })).toHaveTextContent("Exemplaria viridis");
    expect(card).toHaveTextContent("Community Cooperative A — fictional");
    expect(card).toHaveTextContent("This agreement is in force.");
    expect(card).toHaveTextContent("It runs from 1 January 2026 and has no end date.");
    expect(within(card).getByRole("list", { name: "What is allowed" })).toHaveTextContent(
      "Research use is allowed.",
    );
    expect(within(card).getByRole("list", { name: "What is not allowed" })).toHaveTextContent(
      "Selling or licensing for profit is not allowed.",
    );
  });

  it("reads a withdrawn agreement as taken back", () => {
    render(
      <AgreementCard
        agreement={custodianAgreement({
          status: "withdrawn",
          status_text: "Consent was withdrawn.",
        })}
        idempotencyKey="k"
      />,
    );
    expect(screen.getByText(/taken back/i)).toBeInTheDocument();
  });

  it("puts the form in a closed details element only when the persona may raise a concern", () => {
    const { container, rerender } = render(
      <AgreementCard agreement={custodianAgreement()} idempotencyKey="k" />,
    );
    const details = container.querySelector("details")!;
    expect(details).not.toHaveAttribute("open");
    expect(within(details).getByText("Raise a concern about this agreement")).toBeInTheDocument();
    rerender(
      <AgreementCard
        agreement={custodianAgreement({ can_raise_grievance: false })}
        idempotencyKey="k"
      />,
    );
    expect(container.querySelector("details")).toBeNull();
    expect(screen.getByText(/Only a community liaison can send a concern/)).toBeInTheDocument();
  });

  it("opens the form and marks the description invalid when the last post for it was refused", () => {
    const { container } = render(
      <AgreementCard agreement={custodianAgreement()} idempotencyKey="k" refused />,
    );
    expect(container.querySelector("details")).toHaveAttribute("open");
    const description = screen.getByLabelText("Tell us what happened (required)");
    expect(description).toHaveAttribute("aria-invalid", "true");
    expect(description.getAttribute("aria-describedby")).toContain("error-rec-1");
    expect(container.querySelector("#error-rec-1")).toHaveTextContent("at least 10 characters");
  });

  it("names the form after the agreement heading", () => {
    render(<AgreementCard agreement={custodianAgreement()} idempotencyKey="k" refused />);
    expect(screen.getByRole("form", { name: /Exemplaria viridis/ })).toBeInTheDocument();
  });

  it("names each summary with the agreement title for assistive technology", () => {
    render(<AgreementCard agreement={custodianAgreement()} idempotencyKey="k" />);
    expect(
      screen.getByText(/Exemplaria viridis.*fictional.*Cooperative/, { selector: ".sr-only" }),
    ).toBeInTheDocument();
  });

  it("lists the grievances already raised about the agreement", () => {
    render(
      <AgreementCard
        agreement={custodianAgreement({ grievances: [grievance()] })}
        idempotencyKey="k"
      />,
    );
    expect(screen.getAllByTestId("agreement-grievance")).toHaveLength(1);
  });
});
