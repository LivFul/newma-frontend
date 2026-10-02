import { readFileSync } from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AccessPage from "@/app/(auth)/access/page";
import { metadata } from "@/app/(auth)/access/layout";
import { PERSONAS } from "@/lib/personas";
import { expectNoAxeViolations } from "./ui/axe";

const renderPage = async (params: Record<string, string> = {}) =>
  render(await AccessPage({ searchParams: Promise.resolve(params) }));

describe("/access", () => {
  it("renders the Demo sign-in label and one form per persona posting to the BFF", async () => {
    const { container } = await renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Demo sign-in");
    const forms = container.querySelectorAll("form");
    expect(forms).toHaveLength(PERSONAS.length);
    for (const form of forms) {
      expect(form).toHaveAttribute("method", "post");
      expect(form).toHaveAttribute("action", "/api/demo/sessions");
    }
    const hidden = [...container.querySelectorAll<HTMLInputElement>('input[name="persona"]')];
    expect(hidden.map((input) => input.value)).toEqual(PERSONAS.map((p) => p.id));
    expect(hidden.every((input) => input.type === "hidden")).toBe(true);
    for (const persona of PERSONAS) {
      expect(screen.getByRole("button", { name: new RegExp(persona.label) })).toBeInTheDocument();
    }
    expect(screen.getByText(/no passwords/i)).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it("explains an expired session", async () => {
    await renderPage({ reason: "expired" });
    expect(screen.getByRole("status")).toHaveTextContent(/expired/i);
  });

  it("explains a rejected persona", async () => {
    await renderPage({ reason: "invalid" });
    expect(screen.getByRole("status")).toHaveTextContent(/not recognised/i);
  });

  it("explains that demo sign-in is disabled on this deployment", async () => {
    await renderPage({ reason: "disabled" });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Demo sign-in is not enabled on this deployment",
    );
  });

  it("exposes the persona grid as a list without an aria-label workaround", async () => {
    const { container } = await renderPage();
    const list = screen.getByRole("list");
    expect(list).toHaveAttribute("role", "list");
    expect(list).not.toHaveAttribute("aria-label");
    expect(container.querySelectorAll('[role="listitem"], li')).toHaveLength(PERSONAS.length);
  });

  it("ignores unknown reasons", async () => {
    await renderPage({ reason: "<script>" });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("is noindex and imports no demo module", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
    const dir = path.resolve(__dirname, "../../src/app/(auth)/access");
    for (const file of ["page.tsx", "layout.tsx"]) {
      const source = readFileSync(path.join(dir, file), "utf8");
      expect(source).not.toMatch(/lib\/demo|api\/demo\b(?!\/sessions")/);
      expect(source).not.toContain("NEXT_PUBLIC_DEMO_MODE");
    }
  });
});
