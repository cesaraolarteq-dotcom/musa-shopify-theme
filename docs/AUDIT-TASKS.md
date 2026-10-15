# MUSA store-readiness audit: task split (2026-10-15)

Owner goal: a store that is ready the moment photos arrive. The owner manages products, photos, prices, events and copy from Shopify alone, and customers can buy. Benchmarks: Alo Yoga, Lululemon, Gymshark, Set Active, Vuori.

Base for both roles: `claude/design-evolution` at the latest pushed commit (it already contains `codex/storefront-completion`). No price, review, fabric claim, policy or shipping promise may be invented. Every visible string goes through `locales/` in EN and ES.

## Order of work (avoids editing the same file at the same time)

1. **Claude, now:** product page presentation in `sections/main-product.liquid` (markup and CSS only; existing `data-*` hooks, form names and the JSON variant payload stay intact), the product-card badge markup in `snippets/product-card.liquid`, new design sections and snippets, header menu design, home, and page templates. Delivered on `claude/store-ready`.
2. **Codex, in parallel:** the items below that don't touch those two files: predictive search, mobile filter drawer, quick add on cards (JS plus a new snippet), and the low-stock data contract. After merging `claude/store-ready`, Codex adds the product-page logic: recommendations, dynamic checkout buttons and the low-stock line.

## Claude (design, editable from the Shopify editor)

- **D-7 Product gallery:** thumbnails, swipe and snap on mobile with a counter, and click to zoom (a dialog with a large image). Markup and CSS by Claude; zoom open/close uses the native `<dialog>` with a small inline handler, or Codex moves it into `musa.js` later.
- **D-9 Fit & fabric:** product metafields `custom.model_info` (single line), `custom.fit` (single line), `custom.fabric_care` (existing). Each shows only when filled.
- **D-11 Payment icons + "Secure checkout"** under the add button (`shop.enabled_payment_types`).
- **D-12 Shipping / returns accordions** fed by `shop.shipping_policy` / `shop.refund_policy` (excerpt plus a link). Hidden when a policy is empty.
- **D-15 Size guide table:** the size-guide page content; the owner provides the measurements. Only styling and a placeholder instruction, no invented numbers.
- **D-16 Shop menu with categories and images** (mega menu from the Shopify navigation menu plus collection images).
- **D-18 Card badges:** New (setting: days since publish, or tag `new`), Sold out, Last units (the threshold is Codex's contract, see C-13).
- **D-21 Benefits bar** with blocks; text is merchant-entered, empty by default.
- **D-22 Templates:** FAQ (collapsible blocks), About MUSA, Contact with an optional WhatsApp link setting.
- **D-23 Shop-by-category tiles** on home (collection pickers plus images).
- **D-24 Instagram / UGC grid** (image blocks with links; no external widget).

## Codex (logic and QA)

- **C-8 "Complete the look":** Shopify Product Recommendations API (`intent=complementary`, fallback `related`) rendered into a section `product-recommendations`. Claude will style the card grid; reuse `product-card`.
- **C-10 Dynamic checkout buttons:** `{{ form | payment_button }}` in the product form; keep the sticky add-to-bag and drawer behaviour correct.
- **C-13 Low stock:** "Only N left" when `inventory_management` is on and quantity ≤ a theme setting (default 3), updated on variant change. Expose `data-low-stock` on the card for D-18.
- **C-17 Filter drawer on mobile** for native `collection.filters` (Search & Discovery), with apply/clear, counts and URL state; desktop keeps the current dropdowns.
- **C-19 Quick add from cards:** a size chooser on hover/tap posting to `/cart/add.js`, then the drawer opens; sold-out sizes disabled; error states.
- **C-20 Predictive search:** `/search/suggest.json` in the header (products, collections, pages), keyboard accessible, debounced, ES/EN strings requested from Claude via HANDOFF.
- **C-QA:** extend the validators to the new sections; re-run Theme Check; verify the CSV import guidance stays current.

## Owner (Shopify admin, guided)

Products (photos, prices, inventory, weight), payments (Shopify Payments, Shop Pay, wallets, BNPL), shipping and Texas taxes, published policies, domain and removing the password, Translate & Adapt for ES product content, apps (Search & Discovery, Judge.me, Shopify Inbox, Shopify Email), pixels and the cookie banner, the MUSA Club page (template `club`) and the menus.
