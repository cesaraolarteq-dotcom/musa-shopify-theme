# MUSA — draft product import

`MUSA-products-DRAFT.csv` contains 15 products and 139 variants from the approved order catalog. Sets stay complete. English is the base content; `MUSA-translations-es.json` is a translation worksheet for Translate & Adapt after Shopify assigns product IDs. It is not a second product import file.

Import via Shopify Products > Import. Review the import preview before accepting. Do not select overwrite existing products unless deliberately updating these handles. Keep all products in Draft and all sales channels unpublished. Importing is an admin action; this repository has not performed it.

No retail price or purchase cost is supplied. Shopify may initialize missing prices to 0.00: that is NOT a selling price. Do not activate any product before assigning and checking every variant's real retail price. Inventory tracker is Shopify with quantity 0 and policy deny as a safety default, not a statement about the purchased/received quantity. Confirm location inventory after actual receiving. No weight is invented; configure weights and shipping rates before activation. No payment, tax or shipping setup is performed by this CSV.

Before activation: complete legal merchant identity and policies; confirm title/color translations, photos and usage rights, compositions/care and size guides; add retail prices, actual inventory and weights; validate taxation/markets and USA shipping zones (including Alaska/Hawaii/territories); test checkout and return workflow. First inspect the 15 handles and 139 unique variants. PI-07 pink only L; PI-12 M/L only; XL only PI-01/PI-15.

Supplier reference images are in theme assets for visual review, not in the import. Replace them with final licensed photographs when preparing real product records. PI-12/PI-13 references show partial set views; descriptions remain complete-set descriptions. Do not infer fit, fabric composition or performance claims from these pictures.
