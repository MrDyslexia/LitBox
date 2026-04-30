import { chromium } from "playwright"
import lighthouse from "lighthouse"
import * as fs from "fs"
import * as path from "path"
import * as net from "net"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ─── Config ──────────────────────────────────────────────────────────────────

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000"
const API_URL      = process.env.API_URL       ?? "https://provider.blocktype.cl"
const REPORTS_DIR  = path.join(__dirname, "reports")

interface PageConfig {
  path: string
  label: string
}

interface RoleConfig {
  name: string
  email: string
  password: string
  pages: PageConfig[]
}

const ROLES: RoleConfig[] = [
  {
    name: "empleado",
    email: "empleado@empresa.com",
    password: "demo1234",
    pages: [
      { path: "/empleado",          label: "Dashboard"    },
      { path: "/empleado/boletas",  label: "Mis boletas"  },
      { path: "/empleado/nueva",    label: "Nueva boleta" },
    ],
  },
  {
    name: "gestor",
    email: "gestor@empresa.com",
    password: "demo1234",
    pages: [
      { path: "/gestor",            label: "Dashboard"  },
      { path: "/gestor/por-pagar",  label: "Por pagar"  },
      { path: "/gestor/historial",  label: "Historial"  },
    ],
  },
  {
    name: "auditor",
    email: "auditor@empresa.com",
    password: "demo1234",
    pages: [
      { path: "/auditor",           label: "Dashboard" },
      { path: "/auditor/revision",  label: "Revisión"  },
    ],
  },
  {
    name: "administrador",
    email: "admin@empresa.com",
    password: "demo1234",
    pages: [
      { path: "/administrador",          label: "Dashboard" },
      { path: "/administrador/boletas",  label: "Boletas"   },
      { path: "/administrador/usuarios", label: "Usuarios"  },
    ],
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address() as net.AddressInfo
      srv.close((err) => (err ? reject(err) : resolve(addr.port)))
    })
  })
}

function score(val: number | null): string {
  if (val === null) return "N/A"
  const pct = Math.round(val * 100)
  if (pct >= 90) return `\x1b[32m${pct}\x1b[0m`  // verde
  if (pct >= 50) return `\x1b[33m${pct}\x1b[0m`  // amarillo
  return `\x1b[31m${pct}\x1b[0m`                  // rojo
}

function ms(val: number | null): string {
  if (val === null) return "N/A"
  return `${Math.round(val)}ms`
}

// ─── Login ───────────────────────────────────────────────────────────────────

// Obtiene el valor de la cookie 'auth' llamando a la API directamente desde Node.
// Evita el rate limiter por formulario y no consume cupo del browser.
async function getAuthCookieValue(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? `Login API ${res.status}`)
  }

  const setCookie = res.headers.get("set-cookie") ?? ""
  const authPart  = setCookie.split(";").find((p) => p.trim().startsWith("auth="))
  if (!authPart) throw new Error("No se recibió cookie 'auth' en la respuesta")

  return authPart.trim().replace(/^auth=/, "")
}

// Inyecta la cookie en el contexto de Playwright y navega al dashboard del rol.
async function loginWithCookie(
  context: import("playwright").BrowserContext,
  page: import("playwright").Page,
  cookieValue: string,
  rolPath: string
): Promise<void> {
  const apiHost = new URL(API_URL).hostname

  await context.addCookies([
    {
      name:     "auth",
      value:    cookieValue,
      domain:   apiHost,
      path:     "/",
      httpOnly: true,
      secure:   API_URL.startsWith("https"),
      sameSite: "Lax",
    },
  ])

  await page.goto(`${FRONTEND_URL}${rolPath}`, { waitUntil: "networkidle", timeout: 30000 })
}

// ─── Audit page ──────────────────────────────────────────────────────────────

interface AuditResult {
  role: string
  page: PageConfig
  performance: number | null
  accessibility: number | null
  bestPractices: number | null
  seo: number | null
  fcp: number | null   // First Contentful Paint (ms)
  lcp: number | null   // Largest Contentful Paint (ms)
  tbt: number | null   // Total Blocking Time (ms)
  cls: number | null   // Cumulative Layout Shift (score)
  reportFile: string
}

async function auditPage(
  cdpPort: number,
  url: string,
  outputFile: string
): Promise<Omit<AuditResult, "role" | "page">> {
  const result = await lighthouse(url, {
    port: cdpPort,
    output: "html",
    logLevel: "error",
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    formFactor: "desktop",
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
    throttlingMethod: "simulate",
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
  })

  if (!result) throw new Error("Lighthouse no devolvió resultado")

  const { lhr, report } = result

  fs.writeFileSync(outputFile, report as string)

  const perf = lhr.categories["performance"]?.score ?? null
  const a11y = lhr.categories["accessibility"]?.score ?? null
  const bp   = lhr.categories["best-practices"]?.score ?? null
  const seo  = lhr.categories["seo"]?.score ?? null

  const audits = lhr.audits
  const fcp = audits["first-contentful-paint"]?.numericValue ?? null
  const lcp = audits["largest-contentful-paint"]?.numericValue ?? null
  const tbt = audits["total-blocking-time"]?.numericValue ?? null
  const cls = audits["cumulative-layout-shift"]?.numericValue ?? null

  return {
    performance: perf,
    accessibility: a11y,
    bestPractices: bp,
    seo,
    fcp,
    lcp,
    tbt,
    cls,
    reportFile: outputFile,
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
  const runDir = path.join(REPORTS_DIR, timestamp)
  fs.mkdirSync(runDir, { recursive: true })

  const cdpPort = await getFreePort()
  const results: AuditResult[] = []

  console.log(`\n\x1b[1mLitBox Performance Audit\x1b[0m`)
  console.log(`URL: ${FRONTEND_URL}`)
  console.log(`Reports: ${runDir}\n`)

  for (const role of ROLES) {
    console.log(`\x1b[1m[${role.name.toUpperCase()}]\x1b[0m Iniciando sesión...`)

    const browser = await chromium.launch({
      args: [`--remote-debugging-port=${cdpPort}`],
      headless: true,
    })

    const context = await browser.newContext()
    const page = await context.newPage()

    try {
      const cookieValue = await getAuthCookieValue(role.email, role.password)
      await loginWithCookie(context, page, cookieValue, `/${role.name}`)
      console.log(`  ✓ Login exitoso → ${page.url()}`)

      for (const pg of role.pages) {
        const fullUrl = `${FRONTEND_URL}${pg.path}`
        const safeLabel = pg.label.replace(/[^a-z0-9]/gi, "_").toLowerCase()
        const reportFile = path.join(runDir, `${role.name}_${safeLabel}.html`)

        process.stdout.write(`  Auditando ${pg.label} (${pg.path})...`)

        await page.goto(fullUrl, { waitUntil: "networkidle" })

        try {
          const metrics = await auditPage(cdpPort, fullUrl, reportFile)
          results.push({ role: role.name, page: pg, ...metrics })
          process.stdout.write(` P:${score(metrics.performance)} A:${score(metrics.accessibility)}\n`)
        } catch (err) {
          process.stdout.write(` ERROR: ${(err as Error).message}\n`)
          results.push({
            role: role.name,
            page: pg,
            performance: null,
            accessibility: null,
            bestPractices: null,
            seo: null,
            fcp: null,
            lcp: null,
            tbt: null,
            cls: null,
            reportFile: "",
          })
        }
      }
    } catch (err) {
      console.error(`  ✗ Error en rol ${role.name}: ${(err as Error).message}`)
    } finally {
      await context.close()
      await browser.close()
      // Pequeña pausa para liberar el puerto CDP entre roles
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  // ─── Resumen final ────────────────────────────────────────────────────────

  console.log(`\n${"─".repeat(90)}`)
  console.log(
    `\x1b[1m${"Rol".padEnd(15)}${"Página".padEnd(18)}${"Perf".padStart(6)}${"A11y".padStart(6)}${"BP".padStart(6)}${"SEO".padStart(6)}${"FCP".padStart(10)}${"LCP".padStart(10)}${"TBT".padStart(10)}${"CLS".padStart(8)}\x1b[0m`
  )
  console.log("─".repeat(90))

  for (const r of results) {
    const clsStr = r.cls !== null ? r.cls.toFixed(3) : "N/A"
    console.log(
      `${r.role.padEnd(15)}${r.page.label.padEnd(18)}` +
      `${(score(r.performance) + "      ").slice(0, 15).padStart(15)}` +
      `${(score(r.accessibility) + "      ").slice(0, 15).padStart(10)}` +
      `${(score(r.bestPractices) + "      ").slice(0, 15).padStart(10)}` +
      `${(score(r.seo) + "      ").slice(0, 15).padStart(10)}` +
      `${ms(r.fcp).padStart(10)}${ms(r.lcp).padStart(10)}${ms(r.tbt).padStart(10)}${clsStr.padStart(8)}`
    )
  }

  console.log("─".repeat(90))

  // Guardar resumen JSON
  const summaryFile = path.join(runDir, "summary.json")
  fs.writeFileSync(
    summaryFile,
    JSON.stringify(
      {
        timestamp,
        frontendUrl: FRONTEND_URL,
        results: results.map((r) => ({
          role: r.role,
          page: r.page,
          scores: {
            performance: r.performance ? Math.round(r.performance * 100) : null,
            accessibility: r.accessibility ? Math.round(r.accessibility * 100) : null,
            bestPractices: r.bestPractices ? Math.round(r.bestPractices * 100) : null,
            seo: r.seo ? Math.round(r.seo * 100) : null,
          },
          vitals: {
            fcp: r.fcp ? Math.round(r.fcp) : null,
            lcp: r.lcp ? Math.round(r.lcp) : null,
            tbt: r.tbt ? Math.round(r.tbt) : null,
            cls: r.cls,
          },
          reportFile: r.reportFile ? path.basename(r.reportFile) : null,
        })),
      },
      null,
      2
    )
  )

  console.log(`\n✓ Reportes HTML por página en: ${runDir}`)
  console.log(`✓ Resumen JSON: ${summaryFile}\n`)
}

main().catch((err) => {
  console.error("Error fatal:", err)
  process.exit(1)
})
