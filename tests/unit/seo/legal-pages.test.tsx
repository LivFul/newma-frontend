import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PrivacyPage from "@/app/(site)/legal/privacy/page";
import TermsPage from "@/app/(site)/legal/terms/page";
import { PRIVACY } from "@/content/legal/privacy";
import { TERMS } from "@/content/legal/terms";
import { expectNoAxeViolations } from "../ui/axe";

const DRAFT = "Draft for review — not legal advice";

describe.each([
  ["Privacy", PrivacyPage, PRIVACY],
  ["Terms", TermsPage, TERMS],
])("%s page", (title, Page, doc) => {
  it("has one h1, leads with the draft label and has no digits in its text", () => {
    const { container } = render(
      <main>
        <Page />
      </main>,
    );
    expect(screen.getByRole("heading", { level: 1, name: title })).toBeInTheDocument();
    const firstParagraph = container.querySelector("p")!;
    expect(firstParagraph.textContent).toBe(DRAFT);
    expect(container.textContent).not.toMatch(/\d/);
    expect(doc.sections.length).toBeGreaterThanOrEqual(3);
  });
  it("names no jurisdiction, regime or controller", () => {
    const { container } = render(
      <main>
        <Page />
      </main>,
    );
    expect(container.textContent).not.toMatch(
      /\b(GDPR|CCPA|HIPAA|Nagoya|California|European|controller of|data controller)\b/i,
    );
  });
  it("is axe clean", async () => {
    const { container } = render(
      <main>
        <Page />
      </main>,
    );
    await expectNoAxeViolations(container);
  });
});

describe("legal statements", () => {
  it("privacy says the analytics are cookieless and the demo uses one session cookie", () => {
    const text = PRIVACY.sections.flatMap((s) => s.paragraphs.map((p) => p.text)).join(" ");
    expect(text).toContain("Vercel Web Analytics, which is cookieless");
    expect(text).toMatch(/one session cookie/);
    expect(text).toContain("Contact details to be supplied by LivFul.");
  });
  it("terms restate that the demo is synthetic and not evidence of performance", () => {
    const text = TERMS.sections.flatMap((s) => s.paragraphs.map((p) => p.text)).join(" ");
    expect(text).toMatch(/synthetic data/);
    expect(text).toMatch(/not evidence of scientific performance, deployment or compliance/);
  });
});
