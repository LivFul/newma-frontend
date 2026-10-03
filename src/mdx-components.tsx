import type { MDXComponents } from "mdx/types";

// Token-styled prose for the ecosystem detail pages. Server-only: no client component may appear in
// MDX. Body links use an underlined style (closes the P0 open item "link tokens with underline").
const components: MDXComponents = {
  h2: (props) => (
    <h2 className="mt-12 font-display text-2xl tracking-tight text-balance" {...props} />
  ),
  h3: (props) => <h3 className="mt-8 text-xl font-semibold" {...props} />,
  p: (props) => <p className="mt-4 max-w-[62ch] leading-relaxed text-fg-muted" {...props} />,
  ul: (props) => (
    <ul
      role="list"
      className="mt-4 max-w-[62ch] list-disc space-y-2 pl-6 text-fg-muted"
      {...props}
    />
  ),
  ol: (props) => (
    <ol
      role="list"
      className="mt-4 max-w-[62ch] list-decimal space-y-2 pl-6 text-fg-muted"
      {...props}
    />
  ),
  a: (props) => <a className="text-accent underline underline-offset-4 hover:text-fg" {...props} />,
  strong: (props) => <strong className="font-semibold text-fg" {...props} />,
  code: (props) => <code className="font-mono text-[0.95em] text-fg" {...props} />,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
