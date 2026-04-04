# LitBox — Roadmap y funcionalidades pendientes

## Estado actual del proyecto

**LitBox** es una plataforma web de gestión de boletas de gastos y reembolsos corporativos.

### Stack
- **Frontend**: Next.js 16 (Turbopack) + Tailwind CSS + shadcn/ui — corre en puerto 3000
- **Backend**: Bun + Elysia + MongoDB (Mongoose) — corre en puerto 3001
- **Infraestructura**: Nginx reverse proxy, dominio `blocktype.cl` (frontend) y `provider.blocktype.cl` (backend)

### Roles de usuario
| Rol | Capacidades |
|---|---|
| `empleado` | Crear y consultar sus propias boletas |
| `auditor` | Revisar, aprobar y rechazar cualquier boleta |
| `administrador` | Gestión completa: boletas, usuarios y configuración |

### Funcionalidades implementadas
- Autenticación JWT con cookies httpOnly
- CRUD de boletas con paginación, filtros y búsqueda
- Subida de imágenes/PDF adjuntos a boletas
- Dashboards por rol (empleado, auditor, administrador)
- Notificaciones en tiempo real vía WebSocket (broadcaster en backend, hook `useBoletasSync` en frontend)
- Diseño responsive (mobile-first)
- Breadcrumb navigation y accesos rápidos
- Script de inicio con sesión tmux `LitBox` (`start.sh`)

---

## Funcionalidad pendiente: Sistema de notificaciones por correo

### Descripción general
Enviar emails automáticos en respuesta a eventos del sistema. El administrador puede configurar qué notificaciones recibe. Los auditores y empleados reciben notificaciones fijas según el evento.

### Proveedor
SMTP genérico (configurar con `nodemailer`). Credenciales vía variables de entorno.

### Variables de entorno a agregar en `.env` del backend
```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=user@example.com
SMTP_PASS=secret
SMTP_FROM="LitBox <noreply@blocktype.cl>"
```

### Matriz de notificaciones

| Evento | Empleado | Auditores (todos activos) | Admin |
|---|---|---|---|
| Boleta creada | ✅ confirmación | ✅ alerta de revisión pendiente | toggle `creacion` |
| Boleta aprobada | ✅ con monto aprobado | — | toggle `aprobacion` |
| Boleta rechazada | ✅ con motivo | — | toggle `rechazo` |
| Atraso aviso 1 y 2 (cada 5 días hábiles) | — | ✅ recordatorio | toggle `atraso` |
| Atraso aviso 3 (escalado) | — | ✅ | ✅ **siempre**, ignora toggle |
| Usuario creado | ✅ bienvenida + credenciales | — | — |

### Cambios en modelos

**User** — agregar campo solo para `rol === "administrador"`:
```ts
notificaciones?: {
  creacion:   boolean
  aprobacion: boolean
  rechazo:    boolean
  atraso:     boolean
}
```

**Boleta** — agregar campos de seguimiento de atrasos:
```ts
conteoAvisosAtraso: number    // default 0, máximo útil: 3
ultimoAvisoAtraso?: Date
```

### Archivos nuevos a crear

```
Backend/src/
├── config/email.ts                   # Config SMTP desde env
├── services/
│   ├── email.service.ts              # Envío SMTP con nodemailer
│   └── notificaciones.service.ts     # Lógica: quién recibe qué
├── templates/emails.ts               # HTML de cada tipo de email
└── jobs/atrasos.job.ts               # Job diario (setInterval 24h)
```

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `models/User.ts` | Campo `notificaciones` |
| `models/Boleta.ts` | Campos `conteoAvisosAtraso` y `ultimoAvisoAtraso` |
| `controllers/boleta.controller.ts` | Llamar a `notificaciones.service` tras crear/aprobar/rechazar |
| `controllers/user.controller.ts` | Email de bienvenida al crear usuario |
| `config/env.ts` | Variables SMTP |
| `index.ts` | Iniciar job de atrasos al arrancar |
| `routes/config.ts` | Nuevo — `GET /api/config/notificaciones`, `PATCH /api/config/notificaciones` |

### Cambios en Frontend

**`components/admin-dashboard.tsx`** — Nueva pestaña "Configuración":
- 4 toggles (Switch de shadcn/ui): creación, aprobación, rechazo, atraso
- Guarda contra `PATCH /api/config/notificaciones`
- Solo visible para `rol === "administrador"`

**`lib/api.ts`** — Agregar:
```ts
export const configApi = {
  getNotificaciones: () => req<NotificacionesConfig>("/api/config/notificaciones"),
  updateNotificaciones: (data: NotificacionesConfig) =>
    req("/api/config/notificaciones", { method: "PATCH", body: JSON.stringify(data) }),
}
```

### Lógica del job de atrasos

El job corre diariamente. Por cada boleta en `pendiente` o `en_revision`:
1. Calcular días hábiles (lun–vie) desde `fechaCreacion`
2. Si `diasHabiles >= 5 * (conteoAvisosAtraso + 1)` y `conteoAvisosAtraso < 3`:
   - Enviar email a todos los auditores activos
   - Si `conteoAvisosAtraso === 2` (tercer aviso): forzar email al admin
   - Sino: enviar al admin solo si `notificaciones.atraso === true`
   - Incrementar `conteoAvisosAtraso`
   - Actualizar `ultimoAvisoAtraso = now()`

Los días hábiles son lunes a viernes. Feriados chilenos no contemplados en v1.
