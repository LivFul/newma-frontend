import { render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/analytics/events", () => ({ trackEvent: vi.fn() }));

import HomePage from "@/app/(site)/page";
import { WORKFLOW_SVG_LAYOUT, WorkflowDiagram } from "@/components/site/workflow-diagram";
import { WorkflowLegend } from "@/components/site/workflow-legend";
import { WorkflowSection } from "@/components/site/workflow-section";
import { WorkflowText } from "@/components/site/workflow-text";
import {
  WORKFLOW_CONTROLS,
  WORKFLOW_EDGE_LABELS,
  WORKFLOW_NODE_LABELS,
  WORKFLOW_NOTE_TEXT,
  WORKFLOW_SECTION,
  WORKFLOW_TONE_NAMES,
} from "@/content/home/workflow";
import { WORKFLOW_EDGES, WORKFLOW_NODES, WORKFLOW_NOTES } from "@/lib/workflow/graph";
import { expectNoAxeViolations } from "../ui/axe";

describe("WorkflowSection", () => {
  it("has a labelled level-two heading, the introduction and the caption", () => {
    const { container } = render(<WorkflowSection />);
    const section = container.querySelector("section#workflow");
    expect(section).not.toBeNull();
    const heading = screen.getByRole("heading", { level: 2, name: WORKFLOW_SECTION.heading.text });
    expect(section?.getAttribute("aria-labelledby")).toBe(heading.id);
    expect(screen.getByText(WORKFLOW_SECTION.intro.text)).toBeInTheDocument();
    expect(screen.getByText(WORKFLOW_SECTION.caption.text)).toBeInTheDocument();
  });

  it("adds no demo link of its own", () => {
    render(<WorkflowSection />);
    expect(screen.queryByRole("link", { name: "Explore the demo" })).toBeNull();
  });

  it("is axe clean", async () => {
    const { container } = render(<WorkflowSection />);
    await expectNoAxeViolations(container);
  });
});

describe("WorkflowDiagram", () => {
  it("is one image named and described by the copy", () => {
    render(<WorkflowDiagram />);
    const svg = screen.getByRole("img", { name: WORKFLOW_SECTION.svgTitle.text });
    expect(svg).toHaveAccessibleDescription(WORKFLOW_SECTION.svgDesc.text);
  });

  it("draws every step with its wrapped label lines", () => {
    const { container } = render(<WorkflowDiagram />);
    const drawn = new Set(
      [...container.querySelectorAll("tspan")].map((tspan) => tspan.textContent),
    );
    for (const node of WORKFLOW_SVG_LAYOUT.nodes) {
      for (const line of node.lines) expect(drawn.has(line), `${node.id}: ${line}`).toBe(true);
    }
    expect(WORKFLOW_SVG_LAYOUT.nodes).toHaveLength(WORKFLOW_NODES.length);
  });

  it("draws every transition with an arrowhead from a defined marker", () => {
    const { container } = render(<WorkflowDiagram />);
    const paths = [...container.querySelectorAll("path.wf-edge")];
    expect(paths).toHaveLength(WORKFLOW_EDGES.length);
    for (const path of paths) {
      const url = path.getAttribute("marker-end") ?? "";
      const id = /url\(#([^)]+)\)/.exec(url)?.[1];
      expect(id, url).toBeTruthy();
      expect(container.querySelector(`marker#${id}`), url).not.toBeNull();
    }
  });

  it("titles a labelled transition with its label, for a hover tooltip", () => {
    const { container } = render(<WorkflowDiagram />);
    const labelled = WORKFLOW_SVG_LAYOUT.edges.find((edge) => edge.id === "rights-hold")!;
    const path = [...container.querySelectorAll("path.wf-edge")].find(
      (candidate) => candidate.getAttribute("d") === labelled.d,
    );
    expect(path?.querySelector("title")?.textContent).toBe(
      WORKFLOW_EDGE_LABELS["rights-hold"]!.text,
    );
  });

  it("scrolls sideways in a named region that is a tab stop in the server markup", () => {
    render(<WorkflowDiagram />);
    expect(screen.getByRole("region", { name: WORKFLOW_CONTROLS.region.text })).toBeInTheDocument();
    // Without JavaScript a narrow screen needs the region to be keyboard-reachable; with JavaScript
    // it drops out of the tab order once measured to fit (see ScrollRegion).
    const html = renderToStaticMarkup(<WorkflowDiagram />);
    expect(html).toMatch(
      /<div[^>]*role="region"[^>]*tabindex="0"|<div[^>]*tabindex="0"[^>]*role="region"/,
    );
  });

  // Value: protects=every branch condition is visible in the drawing, not only in a hover tooltip; fails_when=a labelled transition loses its drawn tag or tags stop rendering; why_new=layout tests check placement, never what the component draws; seam=none
  it("draws each transition's condition on the diagram, not only in a tooltip", () => {
    const { container } = render(<WorkflowDiagram />);
    const drawn = [...container.querySelectorAll(".wf-tag-text")].map((text) =>
      text.textContent?.trim(),
    );
    for (const [id, { text }] of Object.entries(WORKFLOW_EDGE_LABELS)) {
      expect(
        drawn.some((line) => line && text.replace(/\s+/g, "").includes(line.replace(/\s+/g, ""))),
        id,
      ).toBe(true);
    }
    expect(container.querySelectorAll(".wf-tag")).toHaveLength(
      WORKFLOW_SVG_LAYOUT.edges.filter((edge) => edge.tag).length,
    );
  });
});

describe("WorkflowLegend", () => {
  // Value: protects=every line style the diagram draws has a named key with its own stroke pattern; fails_when=a tone is added to the graph or dropped from the legend's list; why_new=only the copy for tones is checked, never the rendered key; seam=none
  it("keys every transition kind the diagram draws, named by the copy", () => {
    const { container } = render(<WorkflowLegend />);
    const list = screen.getByRole("list", { name: WORKFLOW_CONTROLS.legend.text });
    const items = within(list).getAllByRole("listitem");
    const tones = [...new Set(WORKFLOW_EDGES.map((edge) => edge.tone))];
    expect(items).toHaveLength(tones.length);
    for (const tone of tones) {
      expect(within(list).getByText(WORKFLOW_TONE_NAMES[tone]!.text), tone).toBeInTheDocument();
      expect(container.querySelector(`line.wf-edge[data-tone="${tone}"]`), tone).not.toBeNull();
    }
  });
});

describe("WorkflowText", () => {
  it("is a closed native disclosure, so it works without JavaScript", () => {
    const { container } = render(<WorkflowText />);
    const details = container.querySelector("details")!;
    expect(details.open).toBe(false);
    expect(within(details).getByText(WORKFLOW_CONTROLS.textSummary.text).tagName).toBe("SUMMARY");
  });

  it("lists every step under its lane and every transition it leads to", () => {
    const { container } = render(<WorkflowText />);
    for (const block of Object.values(WORKFLOW_NODE_LABELS)) {
      expect(screen.getAllByText(block.text).length, block.id).toBeGreaterThan(0);
    }
    for (const block of Object.values(WORKFLOW_EDGE_LABELS)) {
      expect(screen.getByText(block.text), block.id).toBeInTheDocument();
    }
    // One drawn arrow per transition, hidden from assistive technology.
    const arrows = container.querySelectorAll("li > svg[aria-hidden='true']");
    expect(arrows).toHaveLength(WORKFLOW_EDGES.length);
  });

  // Value: protects=the guardrail notes drawn on the diagram are in the text version too, beside the step they qualify; fails_when=the text version drops a note or files it under another step; why_new=the text version only listed steps and transitions; seam=none
  it("gives every guardrail note beside the step it is attached to", () => {
    render(<WorkflowText />);
    expect(WORKFLOW_NOTES.length).toBeGreaterThan(0);
    for (const note of WORKFLOW_NOTES) {
      const text = screen.getByText(WORKFLOW_NOTE_TEXT[note.id]!.text);
      expect(text.tagName, note.id).toBe("P");
      const step = text.closest("li")!;
      expect(within(step).getByText(WORKFLOW_NODE_LABELS[note.attachTo]!.text), note.id).toBe(
        step.querySelector("p"),
      );
    }
  });

  it("says that the last step has no further steps", () => {
    render(<WorkflowText />);
    expect(screen.getAllByText(WORKFLOW_CONTROLS.textEnds.text)).toHaveLength(1);
  });

  it("keeps the heading order intact: lanes are level three", () => {
    render(<WorkflowText />);
    const levels = screen.getAllByRole("heading").map((heading) => Number(heading.tagName[1]));
    expect(new Set(levels)).toEqual(new Set([3]));
  });
});

describe("home page placement", () => {
  const renderHome = () =>
    render(
      <main>
        <HomePage />
      </main>,
    );

  it("puts the workflow directly above the six components and below the product introduction", () => {
    const { container } = renderHome();
    const product = container.querySelector("section#product")!;
    const workflow = container.querySelector("section#workflow")!;
    const components = container.querySelector("section#components")!;
    expect(product.nextElementSibling).toBe(workflow);
    expect(workflow.nextElementSibling).toBe(components);
  });

  it("keeps the six component links exactly as they were", () => {
    const { container } = renderHome();
    const links = within(container.querySelector<HTMLElement>("section#components")!).getAllByRole(
      "link",
    );
    expect(links).toHaveLength(6);
  });
});
