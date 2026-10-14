# Handoff log

Newest first. Each entry: date, author, branch, what changed, files, verification, open items.

## 2026-10-14 · Claude Code · `claude/premium-ux`
**What changed (5 improvements requested by the owner)**
1. **Variant picker:** colour swatches and size chips replace the single "Color / Size" dropdown (`snippets/variant-picker.liquid`, `snippets/swatch-color.liquid`). Swatches use Shopify's option swatch (colour or image) when the merchant sets one; otherwise they use a built-in EN/ES colour-name map. The hidden `<select name="id">` is still the source of truth and the no-JS fallback. A combination that is sold out or doesn't exist is crossed out; clicking it jumps to the nearest valid combination.
2. **Cart drawer:** `sections/cart-drawer.liquid` is rendered from `layout/theme.liquid` and re-rendered through the Section Rendering API (`sections=cart-drawer`) on `/cart/add.js` and `/cart/change.js`. It has quantity steppers, remove, discounts, subtotal, checkout and a link to the full cart page. It is controlled by the theme setting **Cart → Open the bag as a slide-out drawer** (default on). The header bag link opens it and still links to `/cart` without JS.
3. **Typography:** Cormorant Garamond (headings, variable 300–700, plus italic) and Jost (body, variable), self-hosted and preloaded with `preload_tag`. CSS uses `--font-heading` and `--font-body`.
4. **Readability:** every font size under 15px was scaled up (7–8px → 11px, 9 → 12, 10 → 12.5, 11 → 13.5, 12 → 15, 13 → 15.5, 14 → 16). Heading tracking was adjusted for Cormorant.
5. **Commerce details:** a quantity stepper; a **sticky add-to-bag bar** on phones, shown once the main button scrolls away; a **size guide dialog** that opens from the Size option when a size-guide page is set (the accordion stays); a **free-shipping progress bar** in the drawer that is hidden unless **Cart → Free shipping threshold** is above 0 (default 0, so no threshold is invented); and **Quick view** on product cards (`templates/product.quick.json`, `layout: false`, fetched with `?view=quick` and rendered in a `<dialog>`).

**Files:** `assets/musa.css`, `assets/musa.js`, `assets/*.woff2`, `layout/theme.liquid`, `sections/main-product.liquid`, `sections/cart-drawer.liquid` (new), `sections/header.liquid`, `snippets/variant-picker.liquid` (new), `snippets/swatch-color.liquid` (new), `snippets/product-card.liquid`, `snippets/icon.liquid`, `templates/product.quick.json` (new), `config/settings_schema.json`, `config/settings_data.json`, `locales/*.json`.

**Verification:** Theme Check 4.9.3 reports 0 offenses; `node --check` passes. In a local liquidjs render with mocked `/cart/add.js` and `/cart/change.js` (Chromium, 1440 and 390 px, EN/ES) I checked swatch and size selection, crossed-out sold-out values, price and button state, the quantity stepper, the size guide dialog, add to bag opening the drawer with the count updated, the drawer quantity change, Escape to close, the sticky bar on phones, and no horizontal overflow.

**Open / needs a real store:** run the add-to-cart / change / checkout flow against a real Shopify catalog; check quick view on real products; confirm the swatch colours match the real colourway names, or set swatches in Shopify; ask the merchant whether to set a free-shipping threshold, and only use one their rates actually honor.
