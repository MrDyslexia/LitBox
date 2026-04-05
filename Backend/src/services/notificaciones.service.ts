import { User } from "../models/User"
import { sendMail } from "./email.service"
import {
  tmplBoletaCreada,
  tmplBoletaPendienteAuditor,
  tmplBoletaAprobada,
  tmplBoletaRechazada,
  tmplBienvenida,
} from "../templates/emails"

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface BoletaInfo {
  codigo: string
  tipo: string
  monto: number
  fecha: Date
  descripcion: string
}

interface EmpleadoInfo {
  nombre: string
  email: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAdmins() {
  return User.find({ rol: "administrador", activo: true }).select("nombre email notificaciones").lean()
}

async function getAuditores() {
  return User.find({ rol: "auditor", activo: true }).select("nombre email").lean()
}

// ─── Eventos ──────────────────────────────────────────────────────────────────

export async function notificarBoletaCreada(boleta: BoletaInfo, empleado: EmpleadoInfo) {
  // 1. Empleado: confirmación
  await sendMail({
    to: empleado.email,
    subject: `[LitBox] Boleta ${boleta.codigo} registrada`,
    html: tmplBoletaCreada({
      empleadoNombre: empleado.nombre,
      codigo: boleta.codigo,
      tipo: boleta.tipo,
      monto: boleta.monto,
      fecha: boleta.fecha.toLocaleDateString("es-CL"),
      descripcion: boleta.descripcion,
    }),
  })

  // 2. Auditores activos + admins con toggle "creacion" en paralelo
  const [auditores, admins] = await Promise.all([getAuditores(), getAdmins()])

  const mailPromises: Promise<void>[] = auditores.map((auditor) =>
    sendMail({
      to: auditor.email,
      subject: `[LitBox] Nueva boleta pendiente de revisión — ${boleta.codigo}`,
      html: tmplBoletaPendienteAuditor({
        auditorNombre: auditor.nombre,
        empleadoNombre: empleado.nombre,
        codigo: boleta.codigo,
        tipo: boleta.tipo,
        monto: boleta.monto,
      }),
    })
  )

  for (const admin of admins) {
    const notif = admin.notificaciones
    if (!notif || notif.creacion) {
      mailPromises.push(
        sendMail({
          to: admin.email,
          subject: `[LitBox] Nueva boleta creada — ${boleta.codigo}`,
          html: tmplBoletaPendienteAuditor({
            auditorNombre: admin.nombre,
            empleadoNombre: empleado.nombre,
            codigo: boleta.codigo,
            tipo: boleta.tipo,
            monto: boleta.monto,
          }),
        })
      )
    }
  }

  await Promise.allSettled(mailPromises)
}

export async function notificarBoletaAprobada(
  boleta: BoletaInfo,
  empleado: EmpleadoInfo,
  comentario?: string
) {
  // 1. Empleado: aprobación con monto
  await sendMail({
    to: empleado.email,
    subject: `[LitBox] Boleta ${boleta.codigo} aprobada`,
    html: tmplBoletaAprobada({
      empleadoNombre: empleado.nombre,
      codigo: boleta.codigo,
      monto: boleta.monto,
      comentario,
    }),
  })

  // 2. Admins con toggle "aprobacion" activo — en paralelo
  const admins = await getAdmins()
  const adminMails = admins
    .filter((admin) => !admin.notificaciones || admin.notificaciones.aprobacion)
    .map((admin) =>
      sendMail({
        to: admin.email,
        subject: `[LitBox] Boleta aprobada — ${boleta.codigo}`,
        html: tmplBoletaAprobada({
          empleadoNombre: empleado.nombre,
          codigo: boleta.codigo,
          monto: boleta.monto,
          comentario,
        }),
      })
    )
  await Promise.allSettled(adminMails)
}

export async function notificarBoletaRechazada(
  boleta: BoletaInfo,
  empleado: EmpleadoInfo,
  motivo?: string
) {
  // 1. Empleado: rechazo con motivo
  await sendMail({
    to: empleado.email,
    subject: `[LitBox] Boleta ${boleta.codigo} rechazada`,
    html: tmplBoletaRechazada({
      empleadoNombre: empleado.nombre,
      codigo: boleta.codigo,
      monto: boleta.monto,
      motivo,
    }),
  })

  // 2. Admins con toggle "rechazo" activo — en paralelo
  const admins = await getAdmins()
  const adminMails = admins
    .filter((admin) => !admin.notificaciones || admin.notificaciones.rechazo)
    .map((admin) =>
      sendMail({
        to: admin.email,
        subject: `[LitBox] Boleta rechazada — ${boleta.codigo}`,
        html: tmplBoletaRechazada({
          empleadoNombre: empleado.nombre,
          codigo: boleta.codigo,
          monto: boleta.monto,
          motivo,
        }),
      })
    )
  await Promise.allSettled(adminMails)
}

export async function notificarBienvenida(opts: {
  nombre: string
  email: string
  password: string
  rol: string
}) {
  await sendMail({
    to: opts.email,
    subject: "[LitBox] Bienvenido — tus credenciales de acceso",
    html: tmplBienvenida(opts),
  })
}
