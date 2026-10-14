# Working on MUSA (shared rules for Codex and Claude Code)

This file is for Codex. `CLAUDE.md` holds the same rules for Claude Code. Keep the two consistent.

Read `README.md`, `docs/CONTENT.md`, `docs/DELIVERY.md`, `docs/ACCEPTANCE.md` and `docs/HANDOFF.md` before changing anything.

## Product rules
- Brand: **musa — welcome to your new era**. Spanish hero: **Bienvenida a tu nueva era**.
- Modern editorial luxury, warm espresso/ivory/sand. Organic-wave brand references are in `docs/DESIGN-REFERENCES.md`. Headings use Cormorant Garamond and body text uses Jost; both are self-hosted woff2 in `assets/` (OFL).
- Keep `locales/en.default.json` and `locales/es.json` in sync for every new UI string.
- Never invent prices, inventory, fabric claims, reviews, policies, shipping thresholds or photography.
- Keep native Shopify product, cart, newsletter and contact forms working, with no mock commerce.
- Minimum readable size: body text is at least 15px; small uppercase labels are at least 11px.

## Collaboration
- Work on a branch named `codex/<topic>` (Claude uses `claude/<topic>`) and open a PR into `main`. Don't push straight to `main`.
- After each task, add a dated entry to `docs/HANDOFF.md`: what changed, which files, how it was verified, and what is still open.
- Run `npx --yes @shopify/cli@4.9.3 theme check --path .` (it must report 0 offenses) and `node --check assets/musa.js` before opening a PR.
- Don't commit credentials, `.shopify` runtime files, caches or `node_modules`.
- Never publish the theme or change store resources without the owner's explicit approval. Upload only as a new unpublished theme.
