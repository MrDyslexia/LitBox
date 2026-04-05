import { Boleta } from "../models/Boleta"
import { User } from "../models/User"
import { sendMail } from "../services/email.service"
import { tmplAtrasoAuditor, tmplAtrasoAdmin } from "../templates/emails"

// ─── Días hábiles (lun–vie) desde una fecha hasta hoy ────────────────────────

function diasHabilesDesde(desde: Date): number {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const inicio = new Date(desde)
  inicio.setHours(0, 0, 0, 0)

  let dias = 0
  const cursor = new Date(inicio)
  while (cursor < hoy) {
    const dow = cursor.getDay()
    if (dow !== 0 && dow !== 6) dias++
    cursor.setDate(cursor.getDate() + 1)
  }
  return dias
}

// ─── Job principal ────────────────────────────────────────────────────────────

export async function runAtrasosJob() {
  console.log("[atrasos] Iniciando revisión de boletas atrasadas...")

  const boletas = await Boleta.find({
    estado: { $in: ["pendiente", "en_revision"] },
    conteoAvisosAtraso: { $lt: 3 },
  })
    .populate("empleado", "nombre email")
    .lean()

  const auditores = await User.find({ rol: "auditor", activo: true })
    .select("nombre email")
    .lean()

  const admins = await User.find({ rol: "administrador", activo: true })
    .select("nombre email notificaciones")
    .lean()

  let procesadas = 0

  for (const boleta of boletas) {
    const dias = diasHabilesDesde(boleta.fechaCreacion)
    const umbral = 5 * ((boleta.conteoAvisosAtraso ?? 0) + 1)

    if (dias < umbral) continue

    const aviso = (boleta.conteoAvisosAtraso ?? 0) + 1
    const escalado = aviso === 3
    const empleado = boleta.empleado as unknown as { nombre: string; email: string }

    const mailPromises: Promise<void>[] = []

    // Avisar a auditores
    for (const auditor of auditores) {
      mailPromises.push(
        sendMail({
          to: auditor.email,
          subject: `[LitBox] Recordatorio: boleta ${boleta.codigo} sin resolver (aviso ${aviso}/3)`,
          html: tmplAtrasoAuditor({
            auditorNombre: auditor.nombre,
            codigo: boleta.codigo,
            empleadoNombre: empleado.nombre,
            diasHabiles: dias,
            aviso,
          }),
        })
      )
    }

    // Avisar a admins
    for (const admin of admins) {
      const notif = admin.notificaciones
      const debeNotificar = escalado || !notif || notif.atraso

      if (debeNotificar) {
        mailPromises.push(
          sendMail({
            to: admin.email,
            subject: `[LitBox] ${escalado ? "ESCALADO" : "Atraso"}: boleta ${boleta.codigo} sin resolver`,
            html: tmplAtrasoAdmin({
              adminNombre: admin.nombre,
              codigo: boleta.codigo,
              empleadoNombre: empleado.nombre,
              diasHabiles: dias,
              aviso,
              escalado,
            }),
          })
        )
      }
    }

    await Promise.allSettled(mailPromises)

    // Actualizar contadores en la boleta
    await Boleta.findByIdAndUpdate(boleta._id, {
      $inc: { conteoAvisosAtraso: 1 },
      ultimoAvisoAtraso: new Date(),
    })

    procesadas++
  }

  console.log(`[atrasos] Revisión completada — ${procesadas} boleta(s) con atraso notificadas.`)
}

// ─── Iniciar job con intervalo de 24h ─────────────────────────────────────────

export function iniciarAtrasosJob() {
  // Correr una vez al iniciar y luego cada 24h
  runAtrasosJob().catch((err) => console.error("[atrasos] Error en job:", err))
  setInterval(
    () => runAtrasosJob().catch((err) => console.error("[atrasos] Error en job:", err)),
    24 * 60 * 60 * 1000
  )
}
