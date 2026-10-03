const block = (id: string, text: string, claims: string[]) => ({ id, text, claims });

export const HERO = block(
  "fixture.hero",
  "NEWMA is a proposed platform that connects authorized knowledge to scientist-approved experiments.",
  ["C-20"],
);
export const NOTE = block("fixture.note", "Computational outputs remain hypotheses.", ["C-21"]);
export const TOOLS = block(
  "fixture.tools",
  "The agent is designed to use Hermes Agent and Open Policy Agent, hosted by Vercel and Railway.",
  ["C-21"],
);
export const HREF = "/demo/w3-agent";
