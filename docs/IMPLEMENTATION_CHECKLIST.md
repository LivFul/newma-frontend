# NEWMA Website — Implementation Checklist (Not for Publication)

Internal notes from implementing `NEWMA_Website_Content_Consolidated.md`. Do not expose this file through public routes or client bundles.

## Approval requirements

| Item                      | Status               | Notes                                                                                     |
| ------------------------- | -------------------- | ----------------------------------------------------------------------------------------- |
| NEWMA mission wording     | **Pending approval** | Implemented per consolidated draft §6 Mission. Obtain formal approval before publication. |
| Vision sentence           | Implemented          | Exact user-supplied aspiration wording in About Newma.                                    |
| Brand and legal entity    | **Pending approval** | "NEWMA by LivFul Therapeutics" retained via wordmark. Copyright not published.            |
| Closing section placement | Implemented          | Optional closing CTA placed after About Newma, immediately before layout footer.          |
| Search metadata           | Implemented          | Title and description from consolidated Suggested Search Metadata.                        |

## Omitted from visitor interface (no approved destination)

| Control                                        | Reason                                 |
| ---------------------------------------------- | -------------------------------------- |
| Footer contact link / address                  | No approved NEWMA contact destination. |
| Footer copyright line                          | Legal owner and wording not verified.  |
| "Discuss a research project" (closing section) | No approved research-enquiry route.    |

## Demo and access controls

| Control                     | Label            | Destination | Notes                                                                              |
| --------------------------- | ---------------- | ----------- | ---------------------------------------------------------------------------------- |
| Header primary              | Access NEWMA     | `/access`   | Sign-in / persona picker for synthetic demo.                                       |
| Hero, product, closing CTAs | Explore the demo | `/access`   | Preferred content-spec label; destination is demo sign-in, not an in-browser demo. |
| Footer link                 | Explore the demo | `/access`   | Same as above.                                                                     |
| Detail page demo block      | Explore the demo | `/access`   | Heading and CTA updated from legacy "See it in the demo".                          |

## Staff access

| Control            | Label                 | Destination                 | Notes                                                                                                                   |
| ------------------ | --------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Header Aveloz link | Aveloz (LivFul staff) | `https://aveloz.livful.com` | Retained; purpose is LivFul staff tooling behind Cloudflare Access. Publication requirement not independently verified. |

## Workflow

- Existing SVG + optional Three.js workflow preserved.
- Scientific discovery steps (8-step text alternative) and software request flow are separate subsections.
- Detailed graph node labels remain from prior workflow diagram; consolidated seven-label sequence is reflected in the text alternative, not relabelled on the graph.

## Component pages

- Routes unchanged at `/ecosystem/<slug>`.
- Body content driven from `registry.ts` (headline, description, designed functions, handoff).
- MDX files retained in repo but no longer rendered on detail pages.
