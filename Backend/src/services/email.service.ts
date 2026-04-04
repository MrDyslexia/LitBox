import { transporter } from "../config/email"
import { env } from "../config/env"

export async function sendMail(opts: {
  to: string | string[]
  subject: string
  html: string
}) {
  if (!env.smtp.host || !env.smtp.user) {
    console.warn("[email] SMTP no configurado — correo omitido:", opts.subject)
    return
  }

  try {
    await transporter.sendMail({
      from: env.smtp.from,
      to: Array.isArray(opts.to) ? opts.to.join(", ") : opts.to,
      subject: opts.subject,
      html: opts.html,
    })
  } catch (err) {
    // Los errores de email no deben romper el flujo principal
    console.error("[email] Error al enviar correo:", err)
  }
}
