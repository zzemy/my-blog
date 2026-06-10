# Frontend Style Boundaries

This project uses Tailwind CSS, global CSS, and CSS modules together. Do not treat one layer as a replacement for all styling.

## Layers

- `app/globals.css`: Tailwind entry, theme tokens, font faces, root variables, and base layer only.
- `app/styles/article.css`: base rendered-article typography and article shell primitives.
- `app/styles/article-components.css`: reusable article-body blocks such as callouts, tabs, code windows, galleries, media, and tables.
- `app/styles/article-skin.css`: visual skin overrides for rendered article content. Keep it scoped to `.article-content`.
- `*.module.css`: page-specific or complex component-specific styling. Use this when selectors, pseudo-elements, SVG internals, or local variants would make Tailwind class strings unreadable.
- Tailwind utilities: ordinary React component layout, spacing, alignment, state styling, and simple responsive behavior.

## Rules

- Do not add page-specific selectors to `globals.css`.
- Do not add broad `.article-content ...` overrides for one page; use a local CSS module.
- Do not encode article-rendered DOM rules as long Tailwind arbitrary variants.
- Use CSS variables for shared design tokens and theme-dependent values.
- Keep Tailwind in JSX for controlled component markup, not for generated Markdown/Tiptap DOM internals.
- If a style is reused by rendered articles, put it in `article-components.css`; if it is only for one page, keep it local.
