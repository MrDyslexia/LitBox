// ─── Utilidades ───────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function formatMonto(n: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n)
}

function layout(titulo: string, cuerpo: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${titulo}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#1e3a5f;padding:20px 32px;">
            <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">LitBox</span>
            <span style="color:#7fa8cc;font-size:13px;margin-left:12px;">Sistema de boletas</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            ${cuerpo}
            <hr style="border:none;border-top:1px solid #e8ecf0;margin:28px 0 20px;" />
            <p style="color:#94a3b8;font-size:12px;margin:0;">Este es un correo automático generado por LitBox. No responder a este mensaje.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Templates ────────────────────────────────────────────────────────────────

export function tmplBoletaCreada(opts: {
  empleadoNombre: string
  codigo: string
  tipo: string
  monto: number
  fecha: string
  descripcion: string
}) {
  return layout(
    `Boleta ${opts.codigo} registrada`,
    `<h2 style="color:#1e3a5f;font-size:18px;margin:0 0 16px;">Tu boleta fue registrada correctamente</h2>
     <p style="color:#475569;font-size:14px;margin:0 0 20px;">Hola <strong>${esc(opts.empleadoNombre)}</strong>, tu solicitud de reembolso ha sido creada y está pendiente de revisión.</p>
     <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:6px;padding:16px;margin-bottom:20px;">
       <tr><td style="font-size:13px;color:#64748b;padding:4px 0;">Código</td><td style="font-size:13px;font-weight:600;color:#1e293b;text-align:right;">${esc(opts.codigo)}</td></tr>
       <tr><td style="font-size:13px;color:#64748b;padding:4px 0;">Tipo</td><td style="font-size:13px;color:#1e293b;text-align:right;">${esc(opts.tipo)}</td></tr>
       <tr><td style="font-size:13px;color:#64748b;padding:4px 0;">Monto</td><td style="font-size:14px;font-weight:700;color:#1e3a5f;text-align:right;">${formatMonto(opts.monto)}</td></tr>
       <tr><td style="font-size:13px;color:#64748b;padding:4px 0;">Fecha del gasto</td><td style="font-size:13px;color:#1e293b;text-align:right;">${esc(opts.fecha)}</td></tr>
       <tr><td style="font-size:13px;color:#64748b;padding:4px 0;vertical-align:top;">Descripción</td><td style="font-size:13px;color:#1e293b;text-align:right;">${esc(opts.descripcion)}</td></tr>
     </table>
     <p style="color:#64748b;font-size:13px;margin:0;">Te notificaremos cuando un auditor revise tu solicitud.</p>`
  )
}

export function tmplBoletaPendienteAuditor(opts: {
  auditorNombre: string
  empleadoNombre: string
  codigo: string
  tipo: string
  monto: number
}) {
  return layout(
    `Nueva boleta pendiente de revisión — ${opts.codigo}`,
    `<h2 style="color:#1e3a5f;font-size:18px;margin:0 0 16px;">Nueva boleta pendiente de revisión</h2>
     <p style="color:#475569;font-size:14px;margin:0 0 20px;">Hola <strong>${esc(opts.auditorNombre)}</strong>, hay una nueva boleta que requiere tu revisión.</p>
     <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border-radius:6px;padding:16px;margin-bottom:20px;border-left:3px solid #f59e0b;">
       <tr><td style="font-size:13px;color:#64748b;padding:4px 0;">Empleado</td><td style="font-size:13px;font-weight:600;color:#1e293b;text-align:right;">${esc(opts.empleadoNombre)}</td></tr>
       <tr><td style="font-size:13px;color:#64748b;padding:4px 0;">Código</td><td style="font-size:13px;color:#1e293b;text-align:right;">${esc(opts.codigo)}</td></tr>
       <tr><td style="font-size:13px;color:#64748b;padding:4px 0;">Tipo</td><td style="font-size:13px;color:#1e293b;text-align:right;">${esc(opts.tipo)}</td></tr>
       <tr><td style="font-size:13px;color:#64748b;padding:4px 0;">Monto</td><td style="font-size:14px;font-weight:700;color:#1e3a5f;text-align:right;">${formatMonto(opts.monto)}</td></tr>
     </table>`
  )
}

export function tmplBoletaAprobada(opts: {
  empleadoNombre: string
  codigo: string
  monto: number
  comentario?: string
}) {
  return layout(
    `Boleta ${opts.codigo} aprobada`,
    `<h2 style="color:#16a34a;font-size:18px;margin:0 0 16px;">Tu boleta fue aprobada</h2>
     <p style="color:#475569;font-size:14px;margin:0 0 20px;">Hola <strong>${esc(opts.empleadoNombre)}</strong>, tu solicitud de reembolso ha sido <strong style="color:#16a34a;">aprobada</strong>.</p>
     <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:6px;padding:16px;margin-bottom:20px;border-left:3px solid #16a34a;">
       <tr><td style="font-size:13px;color:#64748b;padding:4px 0;">Código</td><td style="font-size:13px;color:#1e293b;text-align:right;">${esc(opts.codigo)}</td></tr>
       <tr><td style="font-size:13px;color:#64748b;padding:4px 0;">Monto aprobado</td><td style="font-size:14px;font-weight:700;color:#16a34a;text-align:right;">${formatMonto(opts.monto)}</td></tr>
       ${opts.comentario ? `<tr><td style="font-size:13px;color:#64748b;padding:4px 0;vertical-align:top;">Comentario</td><td style="font-size:13px;color:#1e293b;text-align:right;">${esc(opts.comentario)}</td></tr>` : ""}
     </table>
     <p style="color:#64748b;font-size:13px;margin:0;">El pago será gestionado según los procedimientos internos de la empresa.</p>`
  )
}

export function tmplBoletaRechazada(opts: {
  empleadoNombre: string
  codigo: string
  monto: number
  motivo?: string
}) {
  return layout(
    `Boleta ${opts.codigo} rechazada`,
    `<h2 style="color:#dc2626;font-size:18px;margin:0 0 16px;">Tu boleta fue rechazada</h2>
     <p style="color:#475569;font-size:14px;margin:0 0 20px;">Hola <strong>${esc(opts.empleadoNombre)}</strong>, lamentablemente tu solicitud de reembolso ha sido <strong style="color:#dc2626;">rechazada</strong>.</p>
     <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border-radius:6px;padding:16px;margin-bottom:20px;border-left:3px solid #dc2626;">
       <tr><td style="font-size:13px;color:#64748b;padding:4px 0;">Código</td><td style="font-size:13px;color:#1e293b;text-align:right;">${esc(opts.codigo)}</td></tr>
       <tr><td style="font-size:13px;color:#64748b;padding:4px 0;">Monto</td><td style="font-size:14px;font-weight:700;color:#dc2626;text-align:right;">${formatMonto(opts.monto)}</td></tr>
       ${opts.motivo ? `<tr><td style="font-size:13px;color:#64748b;padding:4px 0;vertical-align:top;">Motivo</td><td style="font-size:13px;color:#1e293b;text-align:right;">${esc(opts.motivo)}</td></tr>` : ""}
     </table>
     <p style="color:#64748b;font-size:13px;margin:0;">Si tienes dudas, consulta con tu auditor asignado.</p>`
  )
}

export function tmplAtrasoAuditor(opts: {
  auditorNombre: string
  codigo: string
  empleadoNombre: string
  diasHabiles: number
  aviso: number
}) {
  return layout(
    `Recordatorio: boleta ${opts.codigo} sin resolver`,
    `<h2 style="color:#d97706;font-size:18px;margin:0 0 16px;">Boleta pendiente sin atención — Aviso ${opts.aviso}/3</h2>
     <p style="color:#475569;font-size:14px;margin:0 0 20px;">Hola <strong>${esc(opts.auditorNombre)}</strong>, la siguiente boleta lleva <strong>${opts.diasHabiles} días hábiles</strong> sin ser resuelta.</p>
     <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border-radius:6px;padding:16px;margin-bottom:20px;border-left:3px solid #d97706;">
       <tr><td style="font-size:13px;color:#64748b;padding:4px 0;">Código</td><td style="font-size:13px;font-weight:600;color:#1e293b;text-align:right;">${esc(opts.codigo)}</td></tr>
       <tr><td style="font-size:13px;color:#64748b;padding:4px 0;">Empleado</td><td style="font-size:13px;color:#1e293b;text-align:right;">${esc(opts.empleadoNombre)}</td></tr>
       <tr><td style="font-size:13px;color:#64748b;padding:4px 0;">Días hábiles</td><td style="font-size:13px;color:#d97706;font-weight:700;text-align:right;">${opts.diasHabiles}</td></tr>
     </table>
     <p style="color:#64748b;font-size:13px;margin:0;">Por favor gestiona esta boleta a la brevedad.</p>`
  )
}

export function tmplAtrasoAdmin(opts: {
  adminNombre: string
  codigo: string
  empleadoNombre: string
  diasHabiles: number
  aviso: number
  escalado: boolean
}) {
  const titulo = opts.escalado ? "ESCALADO: boleta sin resolver" : "Atraso en revisión de boleta"
  return layout(
    `${titulo} — ${opts.codigo}`,
    `<h2 style="color:#${opts.escalado ? "dc2626" : "d97706"};font-size:18px;margin:0 0 16px;">${opts.escalado ? "Boleta escalada — requiere atención inmediata" : `Atraso en boleta — Aviso ${opts.aviso}/3`}</h2>
     <p style="color:#475569;font-size:14px;margin:0 0 20px;">Hola <strong>${esc(opts.adminNombre)}</strong>, la boleta <strong>${esc(opts.codigo)}</strong> lleva <strong>${opts.diasHabiles} días hábiles</strong> sin ser resuelta.${opts.escalado ? " <strong>Este es el tercer aviso y requiere escalamiento.</strong>" : ""}</p>
     <table width="100%" cellpadding="0" cellspacing="0" style="background:#${opts.escalado ? "fef2f2" : "fffbeb"};border-radius:6px;padding:16px;margin-bottom:20px;border-left:3px solid #${opts.escalado ? "dc2626" : "d97706"};">
       <tr><td style="font-size:13px;color:#64748b;padding:4px 0;">Código</td><td style="font-size:13px;font-weight:600;color:#1e293b;text-align:right;">${esc(opts.codigo)}</td></tr>
       <tr><td style="font-size:13px;color:#64748b;padding:4px 0;">Empleado</td><td style="font-size:13px;color:#1e293b;text-align:right;">${esc(opts.empleadoNombre)}</td></tr>
       <tr><td style="font-size:13px;color:#64748b;padding:4px 0;">Días hábiles</td><td style="font-size:13px;font-weight:700;color:#${opts.escalado ? "dc2626" : "d97706"};text-align:right;">${opts.diasHabiles}</td></tr>
     </table>`
  )
}

export function tmplCodigoVerificacion(opts: {
  nombre: string
  codigo: string
  motivo: "cambio_password" | "recuperacion"
}) {
  const esCambio = opts.motivo === "cambio_password"
  return layout(
    esCambio ? "Código de verificación — cambio de contraseña" : "Código de recuperación de contraseña",
    `<h2 style="color:#1e3a5f;font-size:18px;margin:0 0 16px;">${esCambio ? "Código para cambiar tu contraseña" : "Recuperación de contraseña"}</h2>
     <p style="color:#475569;font-size:14px;margin:0 0 20px;">Hola <strong>${esc(opts.nombre)}</strong>, ${esCambio ? "solicitaste cambiar tu contraseña en LitBox." : "recibimos una solicitud para restablecer tu contraseña."} Usa el siguiente código de verificación:</p>
     <div style="text-align:center;margin:24px 0;">
       <div style="display:inline-block;background:#f0f4ff;border:2px dashed #93acd8;border-radius:10px;padding:16px 40px;">
         <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#1e3a5f;font-family:monospace;">${esc(opts.codigo)}</span>
       </div>
     </div>
     <p style="color:#64748b;font-size:13px;margin:0 0 8px;text-align:center;">Este código expira en <strong>15 minutos</strong>.</p>
     <p style="color:#dc2626;font-size:12px;margin:0;text-align:center;">Si no solicitaste este cambio, ignora este correo y tu contraseña actual seguirá siendo válida.</p>`
  )
}

export function tmplBienvenida(opts: {
  nombre: string
  email: string
  password: string
  rol: string
}) {
  return layout(
    "Bienvenido a LitBox",
    `<h2 style="color:#1e3a5f;font-size:18px;margin:0 0 16px;">Bienvenido a LitBox, ${esc(opts.nombre)}</h2>
     <p style="color:#475569;font-size:14px;margin:0 0 20px;">Tu cuenta ha sido creada. A continuación encontrarás tus credenciales de acceso:</p>
     <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:6px;padding:16px;margin-bottom:20px;">
       <tr><td style="font-size:13px;color:#64748b;padding:4px 0;">Correo</td><td style="font-size:13px;font-weight:600;color:#1e293b;text-align:right;">${esc(opts.email)}</td></tr>
       <tr><td style="font-size:13px;color:#64748b;padding:4px 0;">Contraseña temporal</td><td style="font-size:13px;font-family:monospace;font-weight:700;color:#1e3a5f;text-align:right;">${esc(opts.password)}</td></tr>
       <tr><td style="font-size:13px;color:#64748b;padding:4px 0;">Rol asignado</td><td style="font-size:13px;font-weight:600;color:#1e293b;text-align:right;text-transform:capitalize;">${esc(opts.rol)}</td></tr>
     </table>
     <p style="color:#dc2626;font-size:13px;margin:0 0 8px;"><strong>Importante:</strong> por seguridad te recomendamos cambiar tu contraseña al primer inicio de sesión.</p>
     <p style="color:#64748b;font-size:13px;margin:0;">Inicia sesión en el portal de LitBox con estas credenciales.</p>`
  )
}
