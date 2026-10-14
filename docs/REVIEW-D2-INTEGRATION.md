# D2 Seda Viva — review and integration

Reviewed source: `claude/design-evolution` at `4b327c0` (including `3895582`). Base: `main` at `0de1dac`. Integration branch: `codex/d2-integration`. Read the final follow-up in docs/HANDOFF.md before integration.

## Scope confirmed

The catalog styling overrides stay scoped in `assets/musa.css`. The catalog JSON, generated Liquid markup, `musa-catalog.css` and `musa-catalog.js` are unchanged from main. The latest Claude follow-up DOES add catalog enhancement logic in `musa-silk.js`: color swatches, keyboard radio navigation and size tags, with the native select as the source of truth. It also removes Palette and restores the light Club. Those follow-up changes are included.

## Review findings addressed in integration

- P2 transparent header without silk JS: floating styles now require the controller's `silk-ready` class. The default header stays solid and readable if JS is disabled or the silk script fails.
- P3 reduced-motion changes retaining inline opacity: changing the preference clears hero/magnetic transforms and word opacity, stops canvas animation and restarts it when appropriate. Size-tag animations also respect reduced motion.
- Prior Palette invisibility finding: the section was removed by Claude. Reveal CSS additionally requires successful observer initialization instead of hiding authored content preemptively.
- Requested standalone catalog support: load silk JS once in the global layout; remove the section-specific loader. Swatches now work on catalog pages without the silk hero.
- Enhanced-select accessibility/synchronization: remove the visually hidden select from keyboard/accessibility navigation while retaining its form/data role; synchronize radios and tags when a native change event occurs.
- Canvas lifecycle: cancel frames, abort per-canvas global listeners and disconnect its observer on Shopify section unload. Recompute header state on section reorder.

Codex made the integration CSS/JS/layout adjustments on its own branch. Claude's source branch was not changed. Design ownership returns to Claude; commerce code remains unchanged.

## Validation

- Shopify Theme Check: zero offenses; all three storefront JS files pass syntax checks.
- Existing structural/product suite: 253 checks; cart regressions still pass.
- Full integrated homepage: ES/EN at 1440/390/320px, no horizontal overflow or browser JS errors, working filters and mobile language switch.
- D2 tests: all 46 color/size combinations in each language, swatch keyboard navigation, native-select synchronization, menu at 92px, live reduced-motion preference changes, standalone catalog, failed silk script and no-JS fallbacks. Section unload stops canvas drawing and clears the floating-header state.
- Catalog source checks: 15 references, 46 color combinations, 139 variants; no purchase costs or invented sale prices, complete sets retained, all 15 no-JS color/size matrices readable.
- Full preview renderer now embeds the actual silk script. Its offline notice moved below the page to avoid changing fixed-header geometry. Screenshots and bilingual HTML regenerated from this integration.

Commands: `node scripts/render-full-preview.cjs`; `python scripts/validate-full-preview.py`; `python scripts/validate-d2.py`; `python scripts/validate-commerce.py`; `node scripts/render-preview.cjs`; `python scripts/validate.py`; `node scripts/render-catalog-preview.cjs`; `python scripts/validate-catalog.py`; Shopify Theme Check; `python scripts/package.py`.

## Remaining acceptance

No blocking findings remain in the tested default configuration. These are local Liquid fixtures and mocked commerce tests, not authenticated Shopify rendering. Test real theme-editor reorder/reload, real commerce and mobile performance in S1. Before enabling a campaign video, provide accessible pause and verify reduced-motion handling for video (current default uses canvas). Approximate swatch colors need confirmation against actual photography. No Shopify upload/publication or direct main push.
