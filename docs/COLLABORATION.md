# MUSA: colaboración entre Codex y Claude Code

Objetivo compartido: llevar el tema a una experiencia de moda deportiva femenina moderna y de lujo, manteniendo Shopify nativo, español e inglés y el slogan **musa — welcome to your new era**.

Los roles son una distribución práctica para este proyecto. Cada herramienta trabaja en su propia sesión: este documento no conecta automáticamente los agentes ni confirma que el otro haya iniciado trabajo.

## Responsabilidades y archivos

| Responsable | Trabajo | Archivos propios |
| --- | --- | --- |
| Claude Code | Dirección de arte, ondas orgánicas claras/oscuras, portada, tipografía, composición, navegación visual, responsive y textos ES/EN | `assets/musa.css`, nuevos assets visuales, `sections/hero.liquid`, `sections/manifesto.liquid`, `sections/editorial.liquid`, `sections/header.liquid`, `sections/footer.liquid`, `sections/featured-collection.liquid`, `sections/newsletter.liquid`, `locales/`, `templates/index.json`, `docs/preview/` |
| Codex | Lógica de Shopify, variantes, cantidades, carrito, búsqueda/filtros, formularios funcionales, pruebas, herramientas y empaquetado | `assets/musa.js`, `sections/main-*.liquid`, `snippets/`, `scripts/`, evidencias de validación en `docs/` |
| Codex, como integrador | Revisar interfaces compartidas, integrar ramas comprobadas y actualizar el estado de entrega | `layout/`, `config/`, demás `templates/`, grupos de secciones, `README.md`, `CLAUDE.md`, este documento |

La propiedad no impide proponer mejoras en otro archivo: se registra la necesidad y su responsable hace el cambio. Si un trabajo requiere transferir temporalmente un archivo, dejar el acuerdo explícito antes de editarlo. No cambiar los archivos del otro rol a la vez.

Los hooks `data-*` usados por `assets/musa.js`, nombres de campos/formularios Shopify, IDs vinculados por `aria-controls` y snippets compartidos son contratos. Claude conserva estos contratos al trabajar la presentación; Codex comunica cualquier cambio necesario. Las nuevas traducciones solicitadas por Codex se pasan a Claude para mantener un único editor de `locales/` durante una ronda.

## Ramas y entrega

1. Cada sesión consulta `git status`, hace fetch explícito de `main` y revisa este documento. Preservar cambios ajenos. Usar el checkout existente; no crear worktrees sin petición explícita.
2. Claude trabaja en `claude/design-evolution`; Codex en `codex/commerce-quality`. Si dos herramientas comparten el mismo directorio local, trabajar por turnos: Git no permite que un checkout tenga dos ramas activas simultáneamente. En máquinas separadas, cada una usa su propio clon.
3. No hacer force-push, rebase de commits ajenos ni pushes simultáneos a `main`. Proponer la integración con PR o enlace de comparación y el SHA de entrega.
4. Entregar: archivos cambiados, resultado visible/funcional, pruebas realizadas, limitaciones y solicitudes al otro rol. Las capturas deben corresponder al commit entregado.
5. Codex integra después de comprobar el diff y los controles adecuados; si hay cambios concurrentes en `main`, resolverlos conservando ambos trabajos y repetir las pruebas afectadas.

## Primera ronda

| Tarea | Responsable | Estado |
| --- | --- | --- |
| C1: hacer portables las herramientas de preview/QA/empaquetado fuera de `/workspace` | Codex | Pendiente de entrega técnica |
| C2: comprobar que el código de variantes, agotados y cantidades sigue funcionando | Codex | Se ejecuta junto con C1 |
| D1: proponer y aplicar una evolución visual usando las referencias de ondas orgánicas claras/oscuras | Claude Code | Lista para iniciar en su sesión; no iniciada desde Codex |
| D2: entregar capturas desktop/móvil ES/EN y revisar jerarquía, contraste y navegación | Claude Code | Después de D1 |
| I1: integrar diseño y lógica y repetir controles afectados | Codex | Después de ambas entregas |
| S1: instalar como tema sin publicar y probar en Shopify | Codex + propietario | Pendiente de acceso autenticado |

## Condiciones de entrega

Theme Check sin errores; JavaScript válido; ES/EN completos; layouts sin desbordamiento; menú accesible; variantes y cantidades correctas. El preview usa ilustraciones de muestra identificadas y no permite compras ficticias. No inventar catálogo, precios, beneficios técnicos, reseñas o políticas.

Los tests locales no certifican checkout ni formularios reales. La aceptación autenticada sigue `docs/ACCEPTANCE.md`. No publicar en Shopify sin instrucción expresa del propietario.

## Mensaje para iniciar Claude Code

> Lee CLAUDE.md y docs/COLLABORATION.md. Trabaja en claude/design-evolution desde main actualizado. Asume D1/D2: evolución visual high-end con las referencias de ondas orgánicas clara y oscura, el logo original y el slogan “musa — welcome to your new era”. Respeta los archivos asignados a Codex y los contratos de Shopify/JS. Conserva ambos idiomas y las etiquetas de productos conceptuales. Entrega el commit, capturas y comprobaciones; no publiques en Shopify. Si necesitas cambiar lógica o archivos de otro responsable, documenta la solicitud antes de editarlos.
