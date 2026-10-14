# I1 review — 2026-10-14

Reviewed `claude/premium-ux` at `4c69fca` (fixes `9411cf0`) and D1 `claude/luxury-refine` at `9fc010c`, using git branch diffs and `docs/HANDOFF.md`. GitHub PR metadata/review API was unavailable (Forbidden).

## Findings and disposition

- PR #1 previous P1 change-error lock: resolved. HTTP 422 displays server error and removes busy state.
- PR #1 previous P2 missing section response: resolved. Successful add/change refetches markup. Failed refetch redirects to native cart; add mutation count remains one.
- PR #1 previous P2 close/reopen race: resolved in normal and reduced motion.
- D1 P2 mobile menu offset: header became 92px while menu retained 112px top (old 80px header +32px announcement). Fixed to 124px in I1 so navigation no longer starts beneath the header.
- D1 P3 badge legibility: mobile badge 10px violated AGENTS.md's 11px minimum. Fixed in I1.

No remaining blocking findings identified within the reviewed scope. This is not authenticated Shopify acceptance. D1 visual changes and their small language/reveal JS additions are accepted into I1 with the fixes above.

## Integration and validation

Merged premium/D1, portable tools and order catalog histories. Actual home template now contains the preliminary order catalog. Original featured-collection remains an optional section for future Shopify products. Package includes catalog source and AGENTS.md.

Commands: `node scripts/render-preview.cjs`, `python scripts/validate.py` (246 checks); `python scripts/validate-commerce.py`; `node scripts/render-catalog-preview.cjs`, `python scripts/validate-catalog.py`; `node scripts/render-full-preview.cjs`, `python scripts/validate-full-preview.py`; Shopify Theme Check (zero offenses); JavaScript syntax checks; `python scripts/package.py` (ZIP integrity).

Full-home evidence uses real sections and assets with offline Liquid fixtures, ES/EN at 1440/390/320px. Commerce tests use real theme JavaScript and mocked HTTP responses. Product fixture prices are test-only and never used as catalog sale prices. Native Shopify forms, real product data, Markets, theme editor and checkout require S1.
