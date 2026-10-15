# MUSA: auditoría complementaria de compra y preparación para lanzamiento

Fecha: 2026-10-14, America/Chicago. Base revisada: `0ec92d4`; último trabajo de Claude consultado: `claude/design-evolution` en `0fdec82`. Esta entrega propone mejoras y registra reproducciones; no modifica el diseño ni Shopify.

## Alcance y coordinación

Claude conserva dirección visual, comparación con otras tiendas, navegación, presentación de producto y textos ES/EN. Codex revisa corrección de compra, accesibilidad funcional, datos Shopify, pruebas e integración. El propietario aporta medidas, materiales, precios, inventario y condiciones comerciales verificadas. Las sesiones se coordinan mediante Git y HANDOFF; no hay comunicación automática con la sesión externa de Claude.

Leí los cambios recientes de Club y navegación de Claude. Su enlace a MUSA Club y su fallback al formulario de portada ya están implementados en su rama: no se deben rehacer. Su auditoría comparativa en curso todavía no figura en los commits consultados. Este documento no afirma haber inspeccionado sitios competidores; complementa esa comparación con evidencia de nuestro código y tienda.

## Correcciones de código prioritarias

| ID / prioridad | Hallazgo confirmado y consecuencia | Responsable / aceptación |
| --- | --- | --- |
| C1 / P1 | `assets/musa.js:62–79`: el carrito bloquea el puntero con CSS pero admite otra pulsación de teclado mientras espera. En Chromium, enfocar el botón de cantidad y pulsar Enter dos veces genera **dos POST simultáneos** con `line:1, quantity:2`. Las eliminaciones también usan posiciones de línea: repetir una eliminación puede afectar otra línea si los índices cambian. Ese segundo efecto es un riesgo derivado del código, no una eliminación realizada en Shopify. | Codex: una sola mutación activa, bloqueo real de controles y preferencia por clave de línea. Probar doble Enter, eliminar entre varias líneas, error 422 y recuperación sin repetir la mutación. |
| C2 / P1 | `assets/musa.js:183`, `sections/main-product.liquid:9`: cambiar el selector nativo actualiza ID y precio, pero no los chips visibles. Fixture: ID **103 / Arena / L**, precio **€99**; chips aún **Espresso / S**. Son datos ficticios de QA. El selector está recortado visualmente, pero permanece accesible al teclado. | Codex: sincronización en ambas direcciones; un único control accesible después de inicializar correctamente. Mantener selector nativo funcional sin JS. Verificar ID enviado, color, talla, precio y estados agotados en ficha y vista rápida. |
| C3 / P2 | `assets/musa.js:104–122`: abrir A, cerrar, abrir B; si B responde primero y A después, el diálogo cambia de **B a A**. No hay cancelación ni identificación de solicitudes obsoletas. | Codex: cancelar/ignorar solicitudes anteriores, incluso tras cierre o error. Aceptación: B sigue siendo B aunque A termine tarde; una respuesta obsoleta tampoco redirige al usuario. |
| C4 / P2 | `sections/marquee.liquid:4–16`, reglas `.marquee` en `assets/musa.css`: texto con animación automática de 60 segundos e infinita. Existe pausa por hover y soporte de movimiento reducido, pero ningún control enfocable para pausar. Comprobación móvil: animación `running`, **0 controles enfocables**. | Claude diseña pausa persistente o presentación estática; Codex revisa interacción si hace falta JS. Debe poder detenerse por teclado y táctil sin tener que cambiar la preferencia del sistema. No se necesita alterar la dirección visual del resto de la portada. |

Estas rutas de comercio no cambian en `0fdec82`, por lo que C1–C3 también aplican a la rama consultada de Claude. Las pruebas de regresión existentes pasan; estos escenarios nuevos no estaban cubiertos. Ver reproducción en `reproduce-commerce.py` junto a este informe.

Para repetir el diagnóstico desde la raíz del repositorio: `node scripts/render-preview.cjs` prepara la ficha ficticia y `python docs/audits/reproduce-commerce.py` imprime las tres discrepancias. Requiere Playwright y Chromium; respeta `MUSA_OUTPUT_DIR` y `MUSA_CHROMIUM_PATH`. Las rutas de prueba se interceptan en memoria y se bloquea el resto de la red. Es un diagnóstico del fallo actual, no una prueba de aceptación que certifique su corrección.

## Antes de aceptar ventas

| Prioridad | Situación / mejora | Criterio de cierre |
| --- | --- | --- |
| Lanzamiento | La portada usa siempre `catalog-planning` (`templates/index.json`, `sections/catalog-planning.liquid`). Sus seis referencias no se convierten automáticamente en tarjetas comprables cuando se crean productos. La colección All products sí tiene una transición al catálogo real. | Codex prepara selección desde una colección Shopify; Claude conserva la composición. Al activar el catálogo, cada tarjeta abre el producto real, muestra su precio/estado y refleja cambios de Shopify. No activar compras para referencias sin precios. |
| Lanzamiento | Consulta autenticada a `shop` devuelve **My Store** y dominio principal `kypp5e-bz.myshopify.com`. `layout/theme.liquid` y el footer consumen ese nombre. | Propietario configura nombre MUSA y dominio elegido; verificar títulos, búsqueda, correo de pedidos y datos de contacto. La razón social del vendedor es un dato distinto del nombre comercial. |
| Lanzamiento | El archivo de importación preparado contiene 15 modelos / 139 variantes como borrador. No prueba que estén importados o vendibles; no incluye precios de venta ni fotos de producto. Los precios omitidos pueden acabar en cero. | Revisar catálogo real: precios por variante, sets completos, fotos asociadas, cantidades recibidas, pesos y colecciones. Probar variantes especiales como PI-07 rosa solo L, PI-12 M/L y XL solo PI-01/PI-15. No confundir inventario recibido con unidades pedidas. |
| Lanzamiento | Guía de tallas y cuidado tienen soporte técnico, pero `templates/product.json` no selecciona una guía. Faltan datos verificados para inspirar confianza al comprar ropa. | Medidas en pulgadas/cm, cómo medir y ajuste por modelo. Para sets, explicar piezas incluidas y si comparten talla. Materiales/cuidado y datos de la modelo solo cuando estén confirmados. No inferir compresión, opacidad o soporte deportivo de una foto. |
| Lanzamiento | Políticas EN/ES siguen siendo borradores con datos pendientes (`docs/legal/README.md`). El footer y newsletter enlazan políticas Shopify solo cuando existen. | Identificar vendedor legal, contacto/dirección adecuados, plazos operativos y política aprobada; instalar versiones coherentes y enlazar envío/devolución junto a la compra. Revisar privacidad real de apps/píxeles y consentimiento. No existe garantía de blindaje legal por instalar una plantilla. |
| Lanzamiento | Mercado confirmado: USA, Alaska, Hawái y territorios. El tema no configura transportistas, impuestos o pagos. | Validar cobertura con direcciones de prueba representativas, costes y plazos reales, impuestos/pagos según configuración del negocio, correo de confirmación y pedido de prueba con reembolso. No presentar un umbral de envío gratuito inventado. |
| Lanzamiento | Diccionarios ES/EN presentes no prueban que ambos idiomas estén publicados ni que productos, menús y políticas estén traducidos. La consulta `shopLocales` fue denegada por falta de `read_locales`/`read_markets_home`. | Verificar en Shopify ambos idiomas, contenido comercial y conservación de página al cambiar idioma. No solicitar otra contraseña Theme Access para resolver un permiso que no cubre. |

## Mejoras de experiencia después del bloque crítico

1. **Ficha de producto que resuelva dudas.** Claude define jerarquía; Codex conecta campos reales. Primera imagen nítida, frente/espalda/detalles y escala; piezas completas del set; talla y disponibilidad evidentes; envío/devoluciones cerca del botón. La primera imagen de ficha actualmente usa `loading: lazy` igual que las demás (`main-product.liquid:5`): priorizar solo la imagen principal y medir LCP móvil antes/después, sin prometer una puntuación no medida.
2. **Fotos y exploración.** Sustituir las referencias de 148–251 px por fotos finales autorizadas. No cambiar la foto al elegir un color si no hay imagen real de esa variante. Zoom accesible, con cierre por Escape y retorno de foco, es útil una vez existan imágenes de suficiente calidad. Las fotos parciales de PI-12/PI-13 no representan todas las piezas del set.
3. **Encontrar producto.** Mantener categorías simples basadas en el pedido (sets de 2/3 piezas, enterizos, leggings); habilitar filtros reales por talla, color, tipo y disponibilidad. Colecciones ya tienen filtrado, ordenación y paginación: falta comprobar su configuración con productos reales, no reconstruirlos. Búsqueda predictiva y mejores estados sin resultados son una segunda fase para este catálogo pequeño.
4. **Ayuda y poscompra.** Ruta clara a contacto, guía de tallas, envíos, devoluciones y seguimiento; comprobar entrega de formularios y correos. Una página FAQ breve debe responder preguntas reales con condiciones aprobadas. Crear y asignar páginas no ocurre por subir sus plantillas.
5. **Medición y rendimiento.** Definir eventos vista de producto, añadir al carrito, inicio de checkout y compra mediante herramientas Shopify compatibles con privacidad; verificar que no se duplican. Medir móvil real, incluyendo LCP/INP/CLS, después de fotos/apps finales. No tomar una captura local como prueba de velocidad, ventas o accesibilidad completa.

No priorizar ahora wishlist, chatbot, puntos, carruseles extra, urgencia comercial o múltiples apps. Primero una compra fiable y productos bien explicados. Reseñas y disponibilidad deben ser reales; no usar testimonios ni escasez inventados.

## Pruebas y límites de esta entrega

- `python scripts/validate-commerce.py`: pasan errores 422, recuperación de sección, fallback al carrito y reapertura normal/reduced motion.
- `python scripts/validate-d2.py`: pasan 46 combinaciones color/talla por idioma, teclado, sincronización del catálogo de referencia, lifecycle y fallbacks sin JS/script fallido. La sincronización del catálogo de referencia es distinta del bug C2 en fichas de productos reales.
- Nuevas reproducciones Chromium de C1–C3; observación del marquee en el HTML de referencia generado para el tema.
- Consulta Shopify de temas: Horizon sigue MAIN; ambas vistas MUSA siguen UNPUBLISHED. Consulta de identidad exitosa; consulta de idiomas denegada. No se inspeccionaron datos de clientes ni se ejecutaron compras.
- La tienda está protegida por contraseña; no se certifica el recorrido visual/checkout del storefront en producción. La existencia de Theme Access permite revisar temas, no garantiza acceso a todos los ajustes del negocio.

## Entrega propuesta para combinar con Claude

**Ronda C1 (Codex):** corregir las tres fallas de comercio y añadir regresiones concretas, conservando hooks y estilos. Después preparar la transición de catálogo de referencia a colección real.

**Ronda D3 (Claude):** entregar auditoría competitiva con URLs y observaciones verificadas; priorizar ficha, categorías, ayuda y pausa del marquee. Mantener `data-*`, formularios e IDs usados por Codex. Entregar cambios visuales como commits separados de cualquier lógica.

**Ronda de contenido (propietario):** precios, medidas/ajuste, fotos autorizadas, políticas y operación. No hace falta esperar esos datos para corregir C1–C3.

**Integración:** leer ambas entregas, revisar diff y probar desktop/móvil ES/EN; acordar qué tema de preview actualizar antes de tocarlo, para preservar cambios de editor/Claude. Aceptación final en Shopify antes de publicar. Este informe no integra ni sube cambios de diseño en curso.
