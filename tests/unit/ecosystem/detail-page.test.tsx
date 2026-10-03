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
import { sourceLabel } from "@/content/ecosystem/registry";
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
      it("renders the title, summary, fit sentence and the MDX body", async () => {
        const entry = ECOSYSTEM[slug];
        await renderSlug(slug);
        expect(screen.getByRole("heading", { level: 1, name: entry.title })).toBeInTheDocument();
        expect(screen.getByText(entry.summary)).toBeInTheDocument();
        expect(
          screen.getByRole("heading", { level: 2, name: "How it fits the platform" }),
        ).toBeInTheDocument();
        expect(screen.getByText(entry.fit)).toBeInTheDocument();
        expect(screen.getAllByRole("heading", { level: 2 }).length).toBeGreaterThanOrEqual(4);
        expect(screen.getByText(/proposed architecture/i)).toBeInTheDocument();
      });

      it("lists its sources as an ordered list of document and section", async () => {
        const entry = ECOSYSTEM[slug];
        await renderSlug(slug);
        const heading = screen.getByRole("heading", { level: 2, name: "Sources" });
        const list = heading.parentElement!.querySelector("ol")!;
        const items = within(list).getAllByRole("listitem");
        expect(items.map((li) => li.textContent)).toEqual(entry.sources.map(sourceLabel));
      });

      it("ends with a demo block whose link is exactly /access and names the workflow and route", async () => {
        const entry = ECOSYSTEM[slug];
        const { container } = await renderSlug(slug);
        const heading = screen.getByRole("heading", { level: 2, name: "See it in the demo" });
        const block = heading.parentElement!;
        const link = within(block).getByRole("link", { name: "See it in the demo" });
        expect(link).toHaveAttribute("href", "/access");
        expect(block.textContent).toContain(entry.demo.href);
        expect(block.textContent).toContain("Opens Demo sign-in.");
        if (entry.demo.href !== "/demo") expect(block.textContent).toContain(entry.demo.workflow);
        for (const label of entry.demo.labels) expect(block.textContent).toContain(label);
        // The only /access link carries no query string (open-redirect rule).
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

  it("shows the optional and off-chain callout above the fold on the provenance page only", async () => {
    const { container } = await renderSlug("provenance-dlt");
    const callout = screen.getByRole("note");
    expect(callout).toHaveTextContent(
      "This component is optional. Records stay off-chain. In the demo it is labelled Optional, simulated.",
    );
    const h1 = container.querySelector("h1")!;
    // Above the fold: the callout follows the title block before any other section.
    expect(h1.compareDocumentPosition(callout) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(
      callout.compareDocumentPosition(
        screen.getByRole("heading", { name: "How it fits the platform" }),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(container.textContent).toContain("Optional, simulated");
    expect(container.textContent?.toLowerCase()).toContain("off-chain");
  });

  it("shows no callout on the other pages", async () => {
    await renderSlug("interface");
    expect(screen.queryByRole("note")).toBeNull();
  });
});
