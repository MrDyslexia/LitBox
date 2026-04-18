# Changes — Sesión UX/UI (2026-04-17)

## Contexto

Inicio de rediseño UX/UI del Frontend de LitBox para el cliente ITransporte.
Base de referencia: commit `e742ff6`.

---

## Archivos modificados

### `Frontend/app/globals.css`

**Fuente:**
- Cambiada de `Inter` a `Barlow` (Google Fonts, pesos 400/500/600/700)
- Import de Google Fonts agregado al tope del archivo

**Colores light mode — cambio de primario:**
- `--primary`: taupe `#6E6259` → azul corporativo `#006cff` (`oklch(0.52 0.24 264)`)
- `--ring`: naranja-rojo → azul `oklch(0.52 0.24 264)` (foco alineado al primario)
- `--sidebar-primary`: naranja-rojo → azul `oklch(0.52 0.24 264)` (ítems activos sidebar)
- `--sidebar-ring`: naranja-rojo → azul

**Dark mode — reemplazado completamente:**
- Antes: paleta azul-navy inconsistente con la marca (`oklch 243°`)
- Ahora: fondos cálidos carbón/taupe (`oklch 55°`), primario azul, acento naranja-rojo
- Sidebar dark: taupe muy oscuro (`oklch(0.10 0.004 55)`)
- Todos los tokens alineados: background, card, popover, muted, border, input, ring, chart 1-5, sidebar completo

### `Frontend/components/login-page.tsx`

**Toda la lógica/estado/handlers preservados sin cambios.**

Solo cambios visuales:

**LeftPanel (panel izquierdo xl+):**
- Fondo: gradiente carbón oscuro `linear-gradient(160deg, #18191c → #282b2e → #1d2235)`
- Decoración: patrón de grilla sutil (rgba blanco 3.5%) + glow radial azul en esquina superior derecha
- Logo: imagen ITransporte (`logo.png`, versión dark bg) con `filter: brightness(0) invert(1)` para blanco
- Badge "LitBox" con ícono naranja `#e04303` + borde azul
- Chip "Plataforma Corporativa" con borde/fondo azul tenue
- Heading `2.5rem` bold: "Gestión de boletas / centralizada." (palabra azul `#006cff`)
- Features: 3 ítems separados por bordes `rgba(255,255,255,0.08)`, numerados en azul
- Footer: copyright + decoración de puntos (pill azul)

**MobileHeader:**
- Fondo `#18191c` (carbón oscuro consistente con panel izquierdo)
- Logo ITransporte blanco + divisor + badge LitBox

**Formularios (3 pasos: login, forgot_email, forgot_codigo):**
- Inputs: `h-11` (mejor target táctil)
- Tipografía: heading `1.9rem` bold, labels `font-semibold`
- Botón primario: variant default de shadcn (usa `--primary` → azul automático, sin override inline)
- `cursor-pointer` en todos los elementos interactivos
- `¿Olvidaste tu contraseña?`: usa clase `text-primary` (azul)
- Error state: fondo rojo suave con borde

**Demo accounts (intencional — producto demo para compradores):**
- Separador horizontal con label "Demo"
- Grid 2 columnas con botones que tienen `hover:border-primary hover:text-primary`
- Contraseña mostrada con `<code>` sobre fondo muted

---

## Decisiones de diseño

| Decisión | Razón |
|---|---|
| Primario = azul `#006cff` en lugar de taupe | Azul es el color interactivo principal de ITransporte (68 ocurrencias vs 34 del taupe). Botones y focus rings en azul es estándar corporativo |
| Taupe sigue en sidebar background (`--sidebar`) | Sidebar ya tiene variable independiente; no necesita cambiar |
| Gradiente carbón en panel izquierdo | Más sofisticado que fondo plano; evita depender de `--primary` para fondos oscuros |
| `filter: brightness(0) invert(1)` en logo | Convierte logo a blanco sin necesidad de variante SVG separada |
| Dark mode hue 55° (taupe) en lugar de 243° (navy) | Alineado a identidad de marca ITransporte; navy era completamente fuera de marca |

---

## Próximos pasos sugeridos

1. Revisar sidebar de cada rol (empleado, auditor, gestor, administrador) con el nuevo primario azul
2. Revisar dashboards: cards de estadísticas, tablas, badges de estado
3. Revisar componentes de formularios (nueva boleta, configuración)
4. Revisar modo dark en todas las vistas
5. Considerar añadir logo ITransporte en sidebar de cada rol
