# Correos de MUSA para Shopify

Plantillas con el estilo de MUSA para 4 notificaciones, en inglés (`-en`) y español (`-es`).

| Archivo | Notificación en Shopify |
| --- | --- |
| `order-confirmation-*.liquid` | Order confirmation / Confirmación del pedido |
| `shipping-confirmation-*.liquid` | Shipping confirmation / Confirmación de envío |
| `abandoned-checkout-*.liquid` | Abandoned checkout / Pago abandonado |
| `customer-welcome-*.liquid` | Customer account welcome / Bienvenida a la cuenta |

## Paso 1 (5 minutos, sin código): logo y color para todos los correos
1. En Shopify ve a **Configuración → Notificaciones → Notificaciones al cliente**.
2. Toca **Personalizar plantillas de correo electrónico**.
3. **Logotipo:** sube `musa-email-logo.png` (está en esta carpeta). **Ancho:** 140 px.
4. **Color de acento:** `#3F2519` (espresso MUSA).
5. Guarda. Con esto, los más de 30 correos de Shopify ya llevan tu logo y tu color.

## Paso 2: diseño completo en los 4 correos principales
Para cada notificación de la tabla:
1. Abre la notificación y toca **Editar código**.
2. Borra todo el contenido y pega el del archivo correspondiente (`-en` o `-es`).
3. Toca **Vista previa** para revisarlo con un pedido de ejemplo.
4. **Guarda.**

Si algo no se ve bien, **Restablecer al predeterminado** devuelve el correo original de Shopify. No se pierde nada.

## ¿Inglés o español?
Pega la versión del idioma principal de tu tienda. Si más adelante publicas los dos idiomas, revisa si tu administrador permite traducir las notificaciones; si no, usa el idioma de la mayoría de tus clientas.

## Notas
- Los correos usan el nombre y el correo de tu tienda (**Configuración → Detalles de la tienda**). Hoy la tienda se llama "My Store": cámbialo a **MUSA** antes de lanzar.
- No prometen tiempos de envío ni descuentos: solo muestran los datos reales del pedido.
- El carrito abandonado se activa en **Configuración → Pago → Pagos abandonados**.
