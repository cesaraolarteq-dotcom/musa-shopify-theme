# Shopify connection and preview delivery

Verified on 2026-10-14 for `kypp5e-bz.myshopify.com`.

## Delivered theme

- **MUSA Seda Viva — 734ded8**, ID `189409722589`, role `UNPUBLISHED`.
- [Open the theme editor](https://admin.shopify.com/store/kypp5e-bz/themes/189409722589/editor).
- [Preview](https://kypp5e-bz.myshopify.com/?preview_theme_id=189409722589) (store access required).
- Theme source: `734ded8506b189bfe6df56ed593bf34bdd1c1b60` on `codex/storefront-completion`.
- Uploaded all 107 files from `docs/releases/MUSA-Atelier-Shopify.zip`. Remote checksums match 106 files exactly. Shopify rewrites `config/settings_data.json`; parsed JSON is identical. No missing or extra files.
- Existing Horizon (`189396517085`, MAIN) and MUSA Atelier — preview (`189405003997`, UNPUBLISHED) retain their names and roles. Neither was targeted by upload mutations.
- Theme Check: zero offenses. JavaScript syntax checks pass.

The storefront is password protected. Anonymous requests to the home, collection and Spanish preview redirect to `/password`; they do **not** verify the new theme's server-rendered pages. Review while logged into Shopify, then follow `docs/ACCEPTANCE.md`. This delivery did not create products or pages, import the draft CSV, publish languages or legal policies, change store-wide settings, or publish a live theme.

## Authentication in Codex cloud

`SHOPIFY_CLI_THEME_TOKEN` is a proxy-backed secret configured for these HTTPS destinations:

- `kypp5e-bz.myshopify.com`
- `theme-kit-access.shopifyapps.com`

The environment was published and the secret was successfully used to list themes, create this unpublished theme, upload files and verify the result. Do not request another password when this binding works. Never print secret values or persist them in files, commands, Git or handoffs.

Shopify CLI 4.9.3 detects Theme Access by a token prefix. Codex supplies a proxy placeholder instead of the raw token, so that detection does not choose the Theme Access route. Its initial connection attempt also did not use the environment's proxy correctly. A CLI failure here is not evidence that the saved password is invalid.

The working route is the same Theme Access GraphQL endpoint used by Shopify CLI, through Python's standard HTTPS proxy handling:

`https://theme-kit-access.shopifyapps.com/cli/admin/api/2026-10/graphql.json`

Set `X-Shopify-Shop` to this store and pass the injected variable in the `X-Shopify-Access-Token` header; the proxy substitutes it only for the allowed destination. Keep TLS verification enabled and reject redirects. Do not extract the underlying credential or modify the placeholder.

The local helper `/workspace/.musa-runtime/shopify_theme_access.py` contains no credentials. Running it performs **only** a read-only theme-list query:

```sh
python /workspace/.musa-runtime/shopify_theme_access.py
```

Its creation and startup instructions are saved in the environment configuration draft for reuse. Do not assume it exists in another checkout or restored task until checked. Theme Access is a theme credential; do not infer product, customer, policy or other Admin API access from a successful theme query.

## Future changes

Read `docs/HANDOFF.md`, inspect current theme IDs and roles, and preserve collaborator edits before changing any existing preview. This upload used a **new** theme from Shopify's official skeleton, then `themeFilesUpsert`, followed by read-back verification. No live-theme operation was used. Do not recreate another theme just to check connectivity, and do not repeat an uncertain creation request without listing themes first.

Publishing the Codex environment activates development configuration. Publishing a Shopify theme changes the live storefront and needs separate owner approval.
