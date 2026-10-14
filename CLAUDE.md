# Working on MUSA with Claude Code

This repository contains MUSA — Atelier, a native Shopify Online Store 2.0 theme for `kypp5e-bz.myshopify.com`.

Read `README.md`, `docs/CONTENT.md`, `docs/DELIVERY.md` and `docs/ACCEPTANCE.md` first. Current local validation evidence is in `docs/theme-check.json` and `docs/local-validation.txt`. Those results do not establish authenticated Shopify acceptance.

## Design and product requirements

- Brand slogan: **musa — welcome to your new era**. Spanish hero: **Bienvenida a tu nueva era**. The footer retains the English brand signature.
- Direction: modern editorial luxury, warm espresso/ivory/sand, generous spacing, original supplied logos, responsive layouts and reduced-motion support.
- Additional user-supplied visual references: read `docs/DESIGN-REFERENCES.md`. They show broad organic waves in light and dark tonal compositions, with the original wordmark and `@hellomusa.us` signature. The note records design guidance; the two original images are not archived here. This reference update does not itself request a storefront redesign.
- Keep English and Spanish custom UI dictionaries in sync. Shopify-managed content requires separate translations and language publication in store settings.
- There are no real products yet. Four original garment illustrations are clearly labeled design concepts. Do not invent actual pricing, inventory, fabric claims, reviews, policies or photography.
- Native Shopify product/cart/newsletter/contact forms must remain functional. Do not replace commerce routes with mock interactions.
- Do not commit credentials, `.shopify` runtime files, caches or `node_modules`.

## Verification

Use Node >=22.12.0. From the checkout, a portable CLI check is:

```sh
npx --yes @shopify/cli@4.9.3 theme check --path .
node --check assets/musa.js
```

Cloud-specific preview generation and Chromium QA are documented in README.md. Browser-ready design references and screenshots are also retained in `docs/preview/`; these HTML files are offline previews with shopping and email submission disconnected.

`scripts/render-preview.cjs` and `scripts/package.py` currently use `/workspace` output/tool paths. Adapt those helper paths if running outside the Codex cloud machine; do not confuse that constraint with a Shopify theme runtime dependency. The theme itself requires no Node build step to upload.

## Shopify integration

No authenticated store upload or publication has occurred. Use Shopify's authorized login flow and upload only as a **new unpublished theme** for review. Do not publish or change shared store resources without the owner's explicit instruction. Follow `docs/ACCEPTANCE.md` before claiming checkout, email delivery, app integration or store language routing is verified.
