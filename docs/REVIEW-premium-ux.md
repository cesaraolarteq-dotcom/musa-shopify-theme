# Review: claude/premium-ux

Reviewed by Codex on 2026-10-14. Head reviewed: `1b35ec7dab282d862257ef3926df30cbee418445`. Read the branch's `docs/HANDOFF.md` and `AGENTS.md`. This review uses an exported snapshot without changing Claude's branch or the active Codex work.

Recommendation: **request changes before integration**.

## P1 — Cart change errors leave the drawer controls locked

Location: `assets/musa.js:48–55`.

On `/cart/change.js` HTTP 422 (for example, a stock/quantity rejection), `fetch` resolves successfully and JSON parsing succeeds. The handler never checks `r.ok`. Because the error response has no `sections`, the drawer is not replaced, and `.is-busy` is never removed. CSS applies `pointer-events:none` to the panel, preventing further quantity changes and pointer interaction with checkout or close. No inventory error is presented.

Reproduced in Chromium with the actual branch JavaScript and a mocked 422 `{status:422, description:"Inventory limit"}` response: `.drawer-panel.is-busy` remained true after completion.

Requested correction: check HTTP/application errors, present a localized accessible message, and always clear busy state in `finally` on the current drawer panel. Keep valid section replacement on successful responses.

## P2 — Successful add with a failed section render shows stale cart state

Location: `assets/musa.js:194–198` (also `drawer.render` at lines 27–30).

Bundled section rendering can return `sections: {"cart-drawer": null}` while the cart mutation itself succeeds. `drawer.render` silently returns without reporting failure, and the submit handler then opens the old drawer as though it has been refreshed. Starting from an empty cart, the customer sees an empty bag and count 0 even after the item was added, which can encourage duplicate adds.

Reproduced with actual branch JavaScript and a mocked successful add response containing a null drawer section: the old empty drawer opened and its count remained 0.

Requested correction: make rendering success explicit and recover by fetching fresh drawer/cart state or navigating to the native cart route. Do not retry the add mutation when only rendering failed, as that would duplicate the purchase quantity. Apply equivalent handling to cart-change section failures.

## P2 — Delayed close can hide a reopened drawer and leave scrolling locked

Location: `assets/musa.js:19–24`, with `open()` at lines 9–16.

`close()` schedules `el.hidden=true` after 320ms without storing/canceling the timer. If the shopper closes and reopens the bag before that timer expires, `open()` adds `drawer-locked`, then the old timeout hides the reopened drawer. The result is an invisible drawer and a document that remains scroll-locked.

Reproduced in Chromium: click Bag → Escape → immediately click Bag → wait 400ms. Both drawer `hidden` and HTML `drawer-locked` were true.

Requested correction: cancel pending close timers on reopen, or use a transition completion handler guarded by the current open state. Cover both normal and reduced-motion operation.

## Verification and limits

- Shopify CLI 4.9.3 Theme Check: zero offenses for the reviewed snapshot.
- `node --check assets/musa.js`: passed.
- Three browser reproductions use the actual branch JavaScript with small DOM fixtures and mocked responses; they are not live Shopify tests.
- The standalone browser reproduction script is retained in the reviewing cloud instance at `/tmp/musa-review-browser.py`; its findings and response conditions are fully recorded above for reproduction elsewhere.
- No authenticated Shopify catalog, checkout or email-delivery acceptance was performed. No merge, publication or store-resource change was made.
- The branch extends commerce files beyond the initial design-only split, but its handoff clearly reports those changes. Confirm ownership of those files for the next round before both tools edit them.
