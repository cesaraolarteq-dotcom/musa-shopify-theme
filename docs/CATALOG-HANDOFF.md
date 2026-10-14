# Catálogo real del pedido: entrega para Claude Code

El propietario confirmó que se vende exactamente como se compra: **cada set completo** y cada prenda individual por separado. Esta rama aporta una sección de catálogo preliminar con datos reales del pedido JY20260930, sin modificar los archivos visuales ni la lógica de carrito que Claude está trabajando.

## Estructura confirmada

| Categoría | Referencias de venta |
| --- | ---: |
| Sets de 2 piezas | 9 |
| Sets de 3 piezas | 4 |
| Enterizos | 1 |
| Leggings individuales | 1 |
| Total | 15 |

Son 46 combinaciones referencia/color y 139 variantes de color/talla con cantidad positiva en el pedido. El stock pedido no está confirmado como recibido. No se crean productos independientes para los componentes de los sets.

## Archivos y uso

- `catalog/musa-products.json`: fuente de los 15 productos, descripciones ES/EN, referencias del proveedor, agrupación, colores originales y tallas. No contiene costos de compra, datos personales de la factura ni cantidades por variante. Los precios de venta siguen en `null`.
- `sections/catalog-planning.liquid`: sección opcional **MUSA Upcoming collection** para el editor Shopify, con 15 campos de imagen (uno por referencia), categorías y selectores de color que muestran las tallas correspondientes.
- `snippets/catalog-planning-pi-*.liquid`: tarjetas generadas a partir del JSON. No editarlas manualmente; regenerar con `node scripts/build-catalog.cjs`.
- `assets/musa-catalog.css` y `assets/musa-catalog.js`: estilos e interacciones aislados bajo `musa-catalog` / `data-catalog-*`. La tipografía hereda `--font-heading` y `--font-body` cuando el tema los define.
- `templates/page.catalog-planning.json`: plantilla de página independiente, opcional.
- `docs/catalog-preview/`: referencias HTML ES/EN y capturas. Descargar ambos HTML juntos permite cambiar idioma localmente. No es una tienda conectada.

Para incluirlo en el diseño, integrar esta rama y añadir la sección **MUSA Upcoming collection** desde el editor al tema sin publicar, o añadir una sección de tipo `catalog-planning` al índice cuando Claude prepare su integración. Sustituir entonces el bloque de las cuatro prendas conceptuales para evitar dos catálogos diferentes. La portada actual no se ha modificado desde esta rama.

Las categorías son agrupaciones del catálogo preliminar; todavía no son colecciones creadas en el administrador Shopify. La sección permite explorar los modelos, pero no representa objetos `product` reales ni añade artículos al carrito. Tras cargar los productos nativos y sus precios, utilizar el bloque nativo de colección y retirar esta sección preliminar para evitar dos fuentes de catálogo.

## Datos que deben conservarse

- `PI-01` a `PI-15` son referencias internas de esta revisión, no SKUs asignados por el proveedor.
- `PI-12` (top + leggings) y `PI-13` (top + bra + leggings) aún no tienen código del proveedor en la factura.
- `PI-07`, rosa cerezo, solo tiene talla L; no agregar S/M por defecto.
- `PI-12` solo tiene M/L en sus cuatro colores.
- XL solo se pidió para `PI-01` y `PI-15`.
- Los nombres de color ES/EN son traducciones descriptivas provisionales. No se inventaron colores hexadecimales ni fotografías.
- La equivalencia del proveedor S=4, M=6, L=8, XL=10 no es una guía de medidas corporal verificada.
- `PI-14` figura como “jumpsuit 2796” y su fotografía muestra un enterizo/body de manga larga. No describirlo como un conjunto ni como enterizo de pierna larga.
- No publicar el PDF de compra, costos, etiquetas, bolsas ni cargos logísticos como productos. No usar un costo de compra como precio de venta.

## Verificación

```sh
node scripts/build-catalog.cjs
node scripts/render-catalog-preview.cjs
python scripts/validate-catalog.py
npx --yes @shopify/cli@4.9.3 theme check --path .
node --check assets/musa-catalog.js
```

El renderer usa LiquidJS instalado normalmente o en `../.musa-tools/node_modules`, igual que el entorno compartido. La salida predeterminada es `../musa-catalog-preview`; se puede cambiar con `MUSA_CATALOG_OUTPUT_DIR`. QA requiere Python Playwright y Chromium (opcionalmente `MUSA_CHROMIUM_PATH`).

Se comprobó cada una de las 139 combinaciones contra el análisis del pedido. Los tests verifican categorías, tallas dependientes del color, layouts ES/EN a 1440/390/320px, funcionamiento sin JavaScript y ausencia de botones de compra. Las imágenes son espacios reservados editables; no se extrajeron las fotos del proveedor como imágenes finales de venta.

Pendiente para Shopify: acceso autenticado, crear productos como borradores, confirmar códigos faltantes, precios de venta, fotos y recepción física antes de cargar inventario vendible. Ningún producto ni colección se creó en la tienda durante esta entrega.
