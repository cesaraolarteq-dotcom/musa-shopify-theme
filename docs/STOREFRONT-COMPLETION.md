# Storefront completion — October 14, 2026

Branch: `codex/storefront-completion`. Base includes Codex D2 integration plus Claude's review fixes and performance delivery through `d4614b0`. Merge conflicts in CSS/animation code were resolved in favor of Claude's newest implementation while retaining global loading and accessible native-select synchronization. No changes pushed to Claude's branch.

## Delivered

- Home shows six curated order references with a link to the complete collection. The selection setting can be disabled to display all 15.
- `/collections/all` displays the complete upcoming order catalog while there are no real products (editable switch in Collection). Once products exist, native Shopify product cards, filters and pagination take over. Filtering to zero real results never activates the preliminary catalog.
- Optional page template `page.catalog-planning` provides the same full catalog with an h1. Shared generated content keeps home, collection fallback and dedicated page in sync.
- MUSA Club page template includes an editable events section plus the native newsletter. Blocks provide EN/ES titles/descriptions, date/time/time zone, location, photo and registration URL. No event is fabricated; empty state is intentional. Registration happens at the merchant-provided link, not through the newsletter.
- Fifteen supplier photos extracted directly from product rows of the owner's PDF, stored as original JPEGs with a reference label. No invoice pages, addresses, order prices or packaging were committed. Low resolution and partial set views are explicit limitations; photo is illustrative, not a variant image. Merchant image settings override references. Confirm supplier usage rights before public release; replace with final photography.
- `imports/MUSA-products-DRAFT.csv`: 15 products / 139 variants, Draft, unpublished, tracked quantity zero and overselling denied. No retail price, purchase cost or received inventory inferred. Shopify may initialize omitted prices to zero: prices must be assigned before activation. EN base; Spanish translation worksheet provided separately.
- Legal drafts in `docs/legal/`: terms, returns, shipping and privacy in EN/ES with confirmed Texas/USA coverage and musawellnesssportwear@gmail.com. Thirty-day returns remain a draft. Entity name, public address and operational/data details remain explicit placeholders. These are not rendered as final store policies.

## Structural and privacy work

Catalog filtering initializes only when its filter/status controls exist, allowing the curated home to share the same JS without exceptions. Native select, swatch keyboard state and planned sizes remain synchronized. Native Shopify product/cart forms and their error handling are preserved. Event text is escaped; no external registration scripts are injected. Newsletter consent is explicit, unchecked and named; backend logging and double opt-in still require store validation. Configurable support contact appears in the footer, along with actual Shopify policy links only when those policies exist.

The custom theme source has no added ad/analytics integrations. That does not establish the live Shopify app/pixel configuration: content_for_header, checkout, apps and customer privacy controls require authenticated review. No fake privacy banner or unsupported no-sharing promise was introduced. See legal/README.md for remaining operational and legal checks.

## Activation in Shopify

1. Review/merge this branch, then upload a new unpublished theme ZIP or sync the intended unpublished theme. No store upload occurred in this Codex task; Claude's screenshot reports an earlier preview upload, which was not independently verified here.
2. Preview Home and `/collections/all`. Six cards on Home, 15 on empty All products. Replace reference images in section settings or create actual product media later.
3. Create a page named MUSA Club, assign template `club`, then select that page under Theme settings > MUSA contact & community. Add event blocks in the editor when actual details are ready. This exposes Club links without guessing a page URL before the page exists.
4. Optionally create another page with template `catalog-planning`. The native `/collections/all` route already works for the full catalog without a new page resource.
5. Import the CSV following imports/README.md; inspect the import preview and keep products in Draft. Assign approved prices, actual received stock/location quantities, weights, translations, licensed photos and size/care information before activation.
6. Finalize legal identity and policies with professional review; configure USA/Alaska/Hawaii/territory shipping and taxes, returns, email consent/privacy controls. Test real forms, checkout and theme-editor lifecycle before publication.

## Local evidence

Theme Check zero offenses, valid storefront JS, structural/product checks, commerce error/race regressions, all 46 color-size combinations ES/EN, filter/no-JS matrices, complete home/catalog/Club at 1440/390/320px, actual image decoding, event escaping and links. CSV row/SKU/status checks verify all 139 draft variants. Full preview contains six standalone HTML files with embedded assets and scripts; purchases and forms remain disconnected.

Run `node scripts/build-catalog.cjs`, `python scripts/build-shopify-import.py`, the renderer/validation scripts listed in README, and `python scripts/package.py`. Generated artifacts are not evidence of authenticated Shopify commerce or legal compliance.
