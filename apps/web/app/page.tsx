import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  BellRing,
  CalendarRange,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Users
} from 'lucide-react'

const featureHighlights = [
  {
    icon: LayoutDashboard,
    title: 'Panel intuitivo',
    description:
      'Controla citas, paquetes, staff y pagos desde un mismo tablero pensado para dueños ocupados.'
  },
  {
    icon: CalendarRange,
    title: 'Agenda inteligente',
    description:
      'Automatiza recordatorios por WhatsApp y correo, gestiona esperas y evita huecos en tu calendario.'
  },
  {
    icon: Users,
    title: 'Clientes que vuelven',
    description:
      'Segmenta por hábitos, ofrece membresías y da seguimiento al historial para experiencias memorables.'
  },
  {
    icon: BarChart3,
    title: 'Datos accionables',
    description:
      'Monitorea ventas, ocupación y rendimiento en tiempo real para tomar decisiones con confianza.'
  }
]

const steps = [
  {
    title: '1. Configura tu marca',
    description:
      'Personaliza tu landing, agrega horarios, staff y servicios en cuestión de minutos.'
  },
  {
    title: '2. Importa clientes y paquetes',
    description:
      'Subimos tu base histórica y conectamos tus planes vigentes para no perder continuidad.'
  },
  {
    title: '3. Comparte tu portal',
    description:
      'Publica enlaces en Instagram, Google y WhatsApp. Tus clientes reservan y pagan online 24/7.'
  }
]

const testimonials = [
  {
    quote:
      '“Dashboard se convirtió en nuestro front desk digital. Reducimos llamadas y llenamos huecos con la vista diaria.”',
    author: 'Valeria Paredes',
    role: 'Directora, Aura Nails Studio'
  },
  {
    quote:
      '“La migración de clientes fue guiada por su equipo. Hoy tenemos reportes diarios y membresías automáticas.”',
    author: 'Matías López',
    role: 'Co-Founder, Barbería Norte'
  }
]

const stats = [
  { label: 'Negocios gestionando agenda', value: '200+' },
  { label: 'Reservas confirmadas cada mes', value: '27K' },
  { label: 'Promedio de retención', value: '92%' }
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="relative border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-sky-500 to-cyan-400 text-sm font-semibold text-slate-950">
              DB
            </span>
            Dashboard
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-300 md:flex">
            <a href="#features" className="transition hover:text-white">Características</a>
            <a href="#product" className="transition hover:text-white">Producto</a>
            <a href="#steps" className="transition hover:text-white">Implementación</a>
            <a href="#stories" className="transition hover:text-white">Historias</a>
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/login"
              className="rounded-full border border-white/20 px-4 py-2 font-medium text-slate-100 transition hover:border-white/40 hover:text-white"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Crear cuenta
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-y-0 left-1/2 h-[120%] w-[120%] -translate-x-1/2 rotate-6 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_55%)]" />
            <div className="absolute left-0 top-0 h-72 w-72 -translate-x-1/3 -translate-y-1/3 rounded-full bg-gradient-to-br from-indigo-500/50 via-sky-500/40 to-transparent blur-3xl" />
            <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 translate-y-1/3 rounded-full bg-gradient-to-tr from-fuchsia-500/40 via-purple-500/30 to-transparent blur-3xl" />
          </div>
          <div className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-28 pt-24 text-center">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
              Plataforma all-in-one para negocios de servicios
            </span>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl md:text-6xl">
              Lanza un portal de reservas premium y automatiza tu atención al cliente en horas, no semanas
            </h1>
            <p className="mt-7 max-w-2xl text-lg text-slate-200">
              Dashboard combina agenda inteligente, paquetes, recordatorios y analítica avanzada en una experiencia moderna para tu equipo y tus clientes.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-indigo-500 px-7 py-3 text-base font-semibold text-slate-950 shadow-xl shadow-slate-900/30 transition hover:opacity-90"
              >
                Probar gratis
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-white/30 px-6 py-3 text-base font-semibold text-white transition hover:border-white/60"
              >
                Ya soy cliente
              </Link>
            </div>
            <div className="mt-16 grid w-full gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl sm:grid-cols-3">
              {stats.map((item) => (
                <div key={item.label} className="text-center">
                  <div className="text-3xl font-semibold text-white sm:text-4xl">{item.value}</div>
                  <p className="mt-2 text-sm uppercase tracking-wide text-white/70">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="product" className="relative bg-slate-950 py-24">
          <div className="absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-white/10 to-transparent" />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">Tu portal lucirá tan bien como tu marca</h2>
              <p className="text-lg text-slate-300">
                Plantillas listas para personalizar con tus fotos, paleta y tono de comunicación. Integra catálogo, promociones y testimonios para convertir visitantes en clientes fieles.
              </p>
              <div className="flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-6 w-6 text-cyan-300" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Experiencia branded end-to-end</h3>
                    <p className="mt-1 text-sm text-slate-300">
                      Dominio personalizado, botones acorde a tu branding y textos multilenguaje para cada público.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BellRing className="mt-0.5 h-6 w-6 text-indigo-300" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Notificaciones que generan acción</h3>
                    <p className="mt-1 text-sm text-slate-300">
                      Envía confirmaciones, recordatorios y follow-ups automáticos con links de pago en un clic.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-sky-400/30 via-indigo-500/20 to-purple-500/20 blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-slate-900/40 backdrop-blur">
                <div className="mb-5 flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/80">
                  <span>Tus citas de hoy</span>
                  <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-medium text-emerald-300">
                    12 confirmadas
                  </span>
                </div>
                <div className="space-y-4">
                  {["Color personalizado", "Spa premium", "Barbería VIP", "Limpieza facial"].map((service) => (
                    <div key={service} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{service}</p>
                        <span className="text-xs text-white/60">Cliente confirmado • 16:00</span>
                      </div>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/70">
                        Listo
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="bg-slate-950 py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">Un stack completo para tu operación</h2>
              <p className="mt-4 text-lg text-slate-300">
                Cada módulo funciona en conjunto para darte visibilidad total, reducir tareas manuales y aumentar ingresos sin contratar más personal administrativo.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-2">
              {featureHighlights.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg transition hover:border-white/30 hover:bg-white/10"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300/60 to-indigo-500/60">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="mt-3 text-slate-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-900 py-24" id="steps">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">Implementación acompañada</h2>
              <p className="mt-4 text-lg text-slate-300">
                Un onboarding guiado por especialistas para que tu negocio esté listo en horas. Sin costos ocultos ni contratos largos.
              </p>
            </div>
            <div className="relative mx-auto max-w-3xl border-l border-white/10 pl-8">
              {steps.map((step) => (
                <div key={step.title} className="relative mb-10 last:mb-0">
                  <div className="absolute -left-[34px] flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-xs font-semibold text-slate-950">
                    {step.title.split('.')[0]}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg">
                    <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                    <p className="mt-2 text-sm text-slate-300">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        <section id="pricing" className="bg-slate-950 py-24">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">Planes simples para crecer</h2>
              <p className="mt-4 text-lg text-slate-300">
                Empieza con lo esencial y desbloquea staff avanzado, paquetes y reportes cuando tu negocio esté listo.
              </p>
            </div>
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="group relative rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur transition hover:border-white/30 hover:bg-white/10">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-2xl font-semibold text-white">Esencial</h3>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-200">Ideal para iniciar</span>
                </div>
                <div className="text-4xl font-semibold text-white">US$39<span className="text-base font-normal text-white/60"> /mes</span></div>
                <p className="mt-4 text-sm text-slate-300">
                  Agenda online, portal de clientes y recordatorios automáticos para un equipo pequeño.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-slate-200">
                  <li className="flex items-start gap-2"><span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-sm text-cyan-300">✓</span> Agenda ilimitada con recordatorios por correo y WhatsApp.</li>
                  <li className="flex items-start gap-2"><span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-sm text-cyan-300">✓</span> Portal del cliente con historial básico y reservas 24/7.</li>
                  <li className="flex items-start gap-2"><span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-sm text-cyan-300">✓</span> Panel de ventas y métricas esenciales.</li>
                </ul>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/register"
                    className="inline-flex flex-1 items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    Probar plan Esencial
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex flex-1 items-center justify-center rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/60"
                  >
                    Solicitar demo
                  </Link>
                </div>
              </div>
              <div className="group relative rounded-3xl border border-cyan-400/40 bg-gradient-to-br from-sky-500/20 via-indigo-500/10 to-purple-600/10 p-8 backdrop-blur">
                <div className="absolute -right-4 -top-4 rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-950 shadow-lg shadow-cyan-500/40">
                  Más popular
                </div>
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-2xl font-semibold text-white">Profesional</h3>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90">Todo el equipo</span>
                </div>
                <div className="text-4xl font-semibold text-white">US$69<span className="text-base font-normal text-white/70"> /mes</span></div>
                <p className="mt-4 text-sm text-white/80">
                  Incluye todo en Esencial más módulo de staff, paquetes y reportes avanzados para hacer crecer tu operación.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-white/90">
                  <li className="flex items-start gap-2"><span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-sm text-slate-900">✓</span> Horarios por colaborador, asignaciones por servicio y control de ausencias.</li>
                  <li className="flex items-start gap-2"><span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-sm text-slate-900">✓</span> Paquetes y membresías con sesiones consumidas y ventas recurrentes.</li>
                  <li className="flex items-start gap-2"><span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-sm text-slate-900">✓</span> Reportes descargables, objetivos por staff y comparativos mensuales.</li>
                  <li className="flex items-start gap-2"><span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-sm text-slate-900">✓</span> Branding avanzado, dominios personalizados y soporte prioritario.</li>
                </ul>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/register"
                    className="inline-flex flex-1 items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    Quiero el plan Profesional
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex flex-1 items-center justify-center rounded-full border border-white/60 px-5 py-3 text-sm font-semibold text-white transition hover:border-white"
                  >
                    Hablar con ventas
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-950 py-24" id="stories">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid gap-10 md:grid-cols-2">
              {testimonials.map((testimonial) => (
                <div key={testimonial.author} className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
                  <ShieldCheck className="h-8 w-8 text-cyan-300" />
                  <p className="mt-6 text-lg text-slate-100">{testimonial.quote}</p>
                  <div className="mt-6 text-sm font-semibold text-white">{testimonial.author}</div>
                  <div className="text-sm text-slate-300">{testimonial.role}</div>
                </div>
              ))}
              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900 p-8 backdrop-blur">
                <h3 className="text-2xl font-semibold text-white">Beneficios inmediatos</h3>
                <ul className="mt-6 space-y-4 text-slate-200">
                  {["Confirmaciones automáticas por WhatsApp y correo","Membresías y paquetes prepagados","Portal del cliente con historial y sesiones restantes","Reportes descargables para tus números"].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <ShieldCheck className="mt-1 h-5 w-5 text-emerald-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Solicitar demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-900 py-24">
          <div className="mx-auto flex max-w-5xl flex-col gap-10 rounded-3xl border border-white/10 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 px-8 py-12 text-white shadow-2xl shadow-slate-950 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold sm:text-4xl">¿Listo para modernizar tu agenda?</h2>
              <p className="mt-4 max-w-xl text-lg text-white/80">
                Empieza gratis hoy mismo y paga solo cuando necesites funciones avanzadas. Nuestro equipo está listo para ayudarte a importar datos y formar a tu staff.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Crear cuenta gratuita
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/80 px-6 py-3 text-base font-semibold text-white transition hover:border-white"
              >
                Ya soy cliente
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-slate-950 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} Dashboard. Todos los derechos reservados.</span>
          <div className="flex flex-wrap items-center gap-4">
            <a href="#features" className="hover:text-white">Características</a>
            <a href="#product" className="hover:text-white">Producto</a>
            <a href="#steps" className="hover:text-white">Implementación</a>
            <Link href="/login" className="hover:text-white">Acceso clientes</Link>
            <Link href="/register" className="hover:text-white">Crear cuenta</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
