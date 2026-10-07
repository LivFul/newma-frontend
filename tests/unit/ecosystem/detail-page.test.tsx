import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", () => ({ notFound: () => notFound() }));

import DetailRoute, {
  dynamicParams,
  generateStaticParams,
} from "@/app/(site)/ecosystem/[slug]/page";
import { ECOSYSTEM, ECOSYSTEM_SLUGS } from "@/content/ecosystem/registry";
import { expectNoAxeViolations } from "../ui/axe";

async function renderSlug(slug: string) {
  const ui = await DetailRoute({ params: Promise.resolve({ slug }) });
  return render(<main>{ui}</main>);
}

describe("ecosystem detail route", () => {
  it("prerenders exactly the six slugs and 404s the rest", async () => {
    expect(dynamicParams).toBe(false);
    expect(await generateStaticParams()).toEqual(ECOSYSTEM_SLUGS.map((slug) => ({ slug })));
  });

  it("calls notFound for an unknown slug", async () => {
    await expect(renderSlug("nope")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });

  for (const slug of ECOSYSTEM_SLUGS) {
    describe(slug, () => {
      it("renders the title, headline, summary, designed functions and handoff", async () => {
        const entry = ECOSYSTEM[slug];
        await renderSlug(slug);
        expect(screen.getByRole("heading", { level: 1, name: entry.title })).toBeInTheDocument();
        expect(screen.getByText(entry.headline)).toBeInTheDocument();
        expect(screen.getByText(entry.summary)).toBeInTheDocument();
        expect(
          screen.getByRole("heading", { level: 2, name: "Designed functions" }),
        ).toBeInTheDocument();
        for (const fn of entry.designedFunctions) {
          expect(screen.getByText(fn.text)).toBeInTheDocument();
        }
        expect(screen.getByRole("heading", { level: 2, name: "Handoff" })).toBeInTheDocument();
        expect(screen.getByText(entry.handoff.text)).toBeInTheDocument();
        expect(
          screen.getByRole("heading", { level: 2, name: "How it fits the platform" }),
        ).toBeInTheDocument();
        expect(screen.getByText(entry.fit)).toBeInTheDocument();
        expect(screen.getByText(/proposed architecture/i)).toBeInTheDocument();
      });

      it("does not render a Sources section", async () => {
        await renderSlug(slug);
        expect(screen.queryByRole("heading", { level: 2, name: "Sources" })).toBeNull();
      });

      it("ends with a demo block whose link is exactly /access and names the workflow and route", async () => {
        const entry = ECOSYSTEM[slug];
        const { container } = await renderSlug(slug);
        const heading = screen.getByRole("heading", { level: 2, name: "Explore the demo" });
        const block = heading.parentElement!;
        const link = within(block).getByRole("link", { name: "Explore the demo" });
        expect(link).toHaveAttribute("href", "/access");
        expect(block.textContent).toContain(entry.demo.href);
        expect(block.textContent).toContain("Opens Demo sign-in.");
        if (entry.demo.href !== "/demo") expect(block.textContent).toContain(entry.demo.workflow);
        for (const label of entry.demo.labels) expect(block.textContent).toContain(label);
        for (const a of container.querySelectorAll('a[href^="/access"]')) {
          expect(a.getAttribute("href")).toBe("/access");
        }
      });

      it("is axe clean", async () => {
        const { container } = await renderSlug(slug);
        await expectNoAxeViolations(container);
      });
    });
  }

  it("shows the verification callout above the fold on the provenance page only", async () => {
    const { container } = await renderSlug("provenance-dlt");
    const callout = screen.getByRole("note");
    expect(callout).toHaveTextContent(
      "Digital verification supports record review; it does not independently establish consent, material identity or scientific validity.",
    );
    const h1 = container.querySelector("h1")!;
    expect(h1.compareDocumentPosition(callout) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(
      callout.compareDocumentPosition(screen.getByRole("heading", { name: "Designed functions" })) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(container.textContent?.toLowerCase()).toContain("off-chain");
  });

  it("links to the five other components, never to itself", async () => {
    for (const slug of ECOSYSTEM_SLUGS) {
      const { container, unmount } = await renderSlug(slug);
      const nav = screen.getByRole("navigation", { name: "Other components" });
      const hrefs = within(nav)
        .getAllByRole("link")
        .map((a) => a.getAttribute("href"));
      expect(hrefs).toEqual(
        ECOSYSTEM_SLUGS.filter((s) => s !== slug).map((s) => `/ecosystem/${s}`),
      );
      expect(container.querySelectorAll("nav").length).toBeGreaterThanOrEqual(1);
      unmount();
    }
  });

  it("shows no callout on the other pages", async () => {
    await renderSlug("interface");
    expect(screen.queryByRole("note")).toBeNull();
  });

  it("links back to the homepage ecosystem section", async () => {
    await renderSlug("interface");
    expect(screen.getByRole("link", { name: "Back to ecosystem" })).toHaveAttribute(
      "href",
      "/#components",
    );
  });
});
