import { createElement, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Check,
  ChevronRight,
  Clock3,
  Coffee,
  Home,
  ListOrdered,
  MapPin,
  Plus,
  Ticket,
  X,
} from 'lucide-react'
import './App.css'

const services = [
  { id: 'tienda', name: 'Tienda escolar', description: 'Compra durante el descanso', prefix: 'T', waiting: 8, minutes: 4, Icon: Coffee, color: 'bg-[#fff1db] text-[#aa6a24]' },
]

const navItems = [
  { id: 'inicio', label: 'Inicio', Icon: Home },
  { id: 'servicios', label: 'Fila de hoy', Icon: ListOrdered },
  { id: 'turnos', label: 'Mis turnos', Icon: Ticket },
]

function readTickets() {
  try {
    return JSON.parse(localStorage.getItem('fila-go-tickets') || '[]')
  } catch {
    return []
  }
}

function App() {
  const [activePage, setActivePage] = useState('inicio')
  const [tickets, setTickets] = useState(readTickets)
  const [notice, setNotice] = useState('')
  const activeTickets = tickets.filter((ticket) => ticket.status === 'waiting')
  const currentTicket = activeTickets[0]
  const today = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

  function saveTickets(nextTickets) {
    setTickets(nextTickets)
    localStorage.setItem('fila-go-tickets', JSON.stringify(nextTickets))
  }

  function requestTicket(service) {
    if (activeTickets.some((ticket) => ticket.serviceId === service.id)) {
      setNotice(`Ya tienes un turno activo en ${service.name}.`)
      window.setTimeout(() => setNotice(''), 3200)
      setActivePage('turnos')
      return
    }

    const sameServiceCount = tickets.filter((ticket) => ticket.serviceId === service.id).length
    const ticket = {
      id: `${service.prefix}-${String(14 + sameServiceCount).padStart(3, '0')}`,
      serviceId: service.id,
      serviceName: service.name,
      waiting: service.waiting + sameServiceCount,
      minutes: service.minutes,
      createdAt: new Date().toISOString(),
      status: 'waiting',
    }
    saveTickets([ticket, ...tickets])
    setNotice(`Turno ${ticket.id} creado. ¡Listo!`)
    window.setTimeout(() => setNotice(''), 3200)
    setActivePage('turnos')
  }

  function cancelTicket(ticketId) {
    saveTickets(tickets.map((ticket) => ticket.id === ticketId ? { ...ticket, status: 'cancelled' } : ticket))
  }

  const pageTitle = activePage === 'turnos' ? 'Mis turnos' : activePage === 'servicios' ? 'Fila de hoy' : 'Tu recreo, sin filas.'

  return (
    <div className="app-shell min-h-screen md:flex">
      <aside className="side-rail flex shrink-0 flex-col px-5 py-6">
        <div className="side-rail-brand mb-12 flex items-center gap-3 px-1">
          <div className="brand-mark flex items-center justify-center"><ArrowDownRight size={23} strokeWidth={2.5} /></div>
          <div>
            <p className="font-['Space_Grotesk'] text-[19px] font-bold leading-none tracking-[0]">fila<span className="text-[#d5f16b]">go</span></p>
            <p className="mt-1 text-[10px] tracking-[0] text-[#a9c1b4]">CAMPUS DIGITAL</p>
          </div>
        </div>

        <p className="side-rail-label mb-3 px-3 text-[10px] font-bold tracking-[0] text-[#84a594]">MENÚ</p>
        <nav className="flex flex-col gap-1" aria-label="Navegación principal">
          {navItems.map(({ id, label, Icon }) => (
            <button key={id} className={`nav-item flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium ${activePage === id ? 'active' : ''}`} onClick={() => setActivePage(id)}>
              {createElement(Icon, { size: 18, strokeWidth: 1.8 })}{label}
              {id === 'turnos' && activeTickets.length > 0 && <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d5f16b] px-1 text-[10px] font-bold text-[#174f3d]">{activeTickets.length}</span>}
            </button>
          ))}
        </nav>

        <div className="side-rail-footer mt-auto rounded-lg border border-white/10 bg-white/[.06] p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-white"><span className="h-2 w-2 rounded-full bg-[#d5f16b]" />Modo demostración</div>
          <p className="text-[11px] leading-5 text-[#a9c1b4]">Institución Educativa<br />Campus principal</p>
        </div>
      </aside>

      <main className="mobile-space min-w-0 flex-1 px-5 pb-8 pt-6 sm:px-8 md:px-10 md:py-8">
        <div className="page-content mx-auto">
          <header className="mb-9 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:hidden">
              <div className="brand-mark flex items-center justify-center"><ArrowDownRight size={22} /></div>
              <span className="font-['Space_Grotesk'] text-lg font-bold">fila<span className="text-[#4a785d]">go</span></span>
            </div>
            <div className="hidden items-center gap-2 text-xs font-medium text-[#77827c] md:flex"><span className="h-2 w-2 rounded-full bg-[#70a75d]" /> Jornada escolar <span className="text-[#c1c8c0]">/</span> Mi espacio</div>
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden text-xs font-medium capitalize text-[#77827c] sm:inline">{today}</span>
              <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#e4e8e0] bg-white text-[#536159]" aria-label="Notificaciones"><Bell size={17} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#ef846b]" /></button>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e4ecd8] text-xs font-bold text-[#315740]" aria-label="Perfil de Camila">CM</div>
            </div>
          </header>

          <section className="fade-in mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-bold text-[#62816d]">HOLA, CAMILA <span aria-hidden="true">✳</span></p>
              <h1 className="font-['Space_Grotesk'] text-[30px] font-semibold leading-tight tracking-[0] text-[#1d2924] sm:text-[36px]">{pageTitle}</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#77827c]">{activePage === 'turnos' ? 'Sigue el avance de tus turnos durante el descanso.' : activePage === 'servicios' ? 'Consulta la fila y toma tu lugar en la tienda escolar.' : 'Pide tu turno para la tienda escolar y aprovecha mejor el descanso.'}</p>
            </div>
            <div className="flex w-fit items-center gap-2 rounded-full border border-[#e4e8e0] bg-white px-3 py-2 text-xs font-medium text-[#627169]"><Clock3 size={14} className="text-[#62816d]" /> Receso · 10:15 a. m.</div>
          </section>

          {notice && <div role="status" className="mb-5 flex items-center justify-between rounded-lg border border-[#c9dca9] bg-[#eff6df] px-4 py-3 text-sm text-[#315740]">{notice}<Check size={17} /></div>}

          {activePage !== 'turnos' ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,.85fr)]">
              <section>
                {activePage === 'inicio' && <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="panel flex items-center justify-between px-4 py-4"><div><p className="text-[11px] font-medium text-[#77827c]">En atención</p><p className="mt-1 font-['Space_Grotesk'] text-2xl font-semibold">12</p></div><ArrowUpRight size={17} className="text-[#649071]" /></div>
                  <div className="panel flex items-center justify-between px-4 py-4"><div><p className="text-[11px] font-medium text-[#77827c]">Espera promedio</p><p className="mt-1 font-['Space_Grotesk'] text-2xl font-semibold">5 <span className="text-sm font-medium">min</span></p></div><Clock3 size={17} className="text-[#c48b47]" /></div>
                  <div className="panel col-span-2 flex items-center justify-between px-4 py-4 sm:col-span-1"><div><p className="text-[11px] font-medium text-[#77827c]">Tu turno activo</p><p className="mt-1 font-['Space_Grotesk'] text-2xl font-semibold">{activeTickets.length || '—'}</p></div><Ticket size={17} className="text-[#bd7160]" /></div>
                </div>}

                <div className="mb-3 flex items-center justify-between">
                  <div><h2 className="font-['Space_Grotesk'] text-lg font-semibold tracking-[0]">Fila de la tienda escolar</h2><p className="mt-1 text-xs text-[#77827c]">Solicita tu turno y espera donde prefieras</p></div>
                  <button onClick={() => setActivePage('servicios')} className="flex items-center gap-1 text-xs font-semibold text-[#386349] hover:text-[#174f3d]">Ver fila <ChevronRight size={15} /></button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {services.map((service, index) => {
                    const hasTicket = activeTickets.some((ticket) => ticket.serviceId === service.id)
                    return <article key={service.id} className="service-row panel fade-in flex flex-col justify-between p-4" style={{ animationDelay: `${index * 55}ms` }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className={`service-icon flex items-center justify-center rounded-lg ${service.color}`}><service.Icon size={21} strokeWidth={1.8} /></div>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${service.waiting > 6 ? 'bg-[#fff2df] text-[#a96b27]' : 'bg-[#e9f3e8] text-[#487652]'}`}>{service.waiting > 6 ? 'Concurrido' : 'Disponible'}</span>
                      </div>
                      <div className="mt-5 flex items-end justify-between gap-3">
                        <div><h3 className="text-sm font-semibold">{service.name}</h3><p className="mt-1 text-xs text-[#77827c]">{service.description}</p><div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#77827c]"><Clock3 size={13} /> ~{service.minutes} min <span className="mx-1 text-[#d3d8d1]">·</span>{service.waiting} esperando</div></div>
                        <button onClick={() => requestTicket(service)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#174f3d] text-white transition hover:bg-[#23684e]" aria-label={hasTicket ? `Ver turno de ${service.name}` : `Solicitar turno para ${service.name}`} title={hasTicket ? 'Ver turno activo' : 'Solicitar turno'}>{hasTicket ? <Check size={17} /> : <Plus size={18} />}</button>
                      </div>
                    </article>
                  })}
                </div>
              </section>

              <aside className="flex flex-col gap-5">
                <section className="panel overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[#e4e8e0] px-5 py-4"><div><h2 className="text-sm font-semibold">{currentTicket ? 'Tu turno en curso' : 'Tu próximo paso'}</h2><p className="mt-1 text-xs text-[#77827c]">{currentTicket ? currentTicket.serviceName : 'Un lugar menos en la fila.'}</p></div><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef4e4] text-[#4f7859]"><Ticket size={16} /></span></div>
                  {currentTicket ? <div className="p-5"><p className="text-[10px] font-bold tracking-[0] text-[#77827c]">NÚMERO DE TURNO</p><p className="ticket-number mt-2">{currentTicket.id}</p><div className="mt-5 flex justify-between text-xs"><span className="text-[#77827c]">Personas antes que tú</span><span className="font-semibold">{currentTicket.waiting}</span></div><div className="progress-track mt-2"><div className="progress-fill" style={{ width: `${Math.max(12, 100 - currentTicket.waiting * 8)}%` }} /></div><p className="mt-3 text-xs text-[#77827c]">Tiempo estimado: <span className="font-semibold text-[#1d2924]">~{currentTicket.waiting * currentTicket.minutes} min</span></p><button onClick={() => setActivePage('turnos')} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#174f3d] px-4 py-3 text-xs font-semibold text-white hover:bg-[#23684e]">Ver detalles <ChevronRight size={15} /></button></div> : <div className="p-5"><div className="mb-4 flex h-28 items-center justify-center rounded-lg bg-[#f4f7ed]"><div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#e6efda] text-[#4e7856]"><Ticket size={24} /><span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-white bg-[#d5f16b]" /></div></div><p className="text-center text-sm font-semibold">Pide tu turno desde aquí</p><p className="mx-auto mt-1 max-w-56 text-center text-xs leading-5 text-[#77827c]">Te avisamos cuando se acerque tu momento de pasar.</p></div>}
                </section>

                <section className="rounded-lg bg-[#e8efe2] p-5">
                  <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold tracking-[0] text-[#52725b]">UN RECESO MEJOR</p><h2 className="mt-2 max-w-52 font-['Space_Grotesk'] text-lg font-semibold leading-6 tracking-[0]">Menos espera.<br />Más tiempo para ti.</h2></div><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d5f16b] text-[#315740]"><ArrowUpRight size={20} /></div></div>
                  <div className="mt-5 flex items-center justify-between border-t border-[#d5dfcf] pt-3 text-xs text-[#5f7464]"><span>Elige un servicio y toma tu lugar</span><ArrowDownRight size={15} /></div>
                </section>

                <div className="flex items-center gap-2 px-1 text-[11px] text-[#89938c]"><MapPin size={13} /> Campus principal <span className="text-[#c9cec8]">·</span> Datos de demostración</div>
              </aside>
            </div>
          ) : (
            <section className="fade-in max-w-3xl">
              <div className="mb-4 flex items-center justify-between"><div><h2 className="font-['Space_Grotesk'] text-lg font-semibold tracking-[0]">Turnos activos</h2><p className="mt-1 text-xs text-[#77827c]">Tus reservas para esta jornada</p></div><span className="rounded-full bg-[#e9f3e8] px-3 py-1.5 text-xs font-semibold text-[#487652]">{activeTickets.length} activos</span></div>
              {activeTickets.length ? <div className="space-y-3">{activeTickets.map((ticket) => <article key={ticket.id} className="panel flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#eef4e4] text-[#52725b]"><Ticket size={21} /></div><div><p className="text-sm font-semibold">{ticket.serviceName}</p><p className="mt-1 text-xs text-[#77827c]">Creado {new Date(ticket.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} · {ticket.waiting} personas antes</p></div></div><div className="flex items-center justify-between gap-5 sm:justify-end"><span className="font-['Space_Grotesk'] text-2xl font-semibold">{ticket.id}</span><button onClick={() => cancelTicket(ticket.id)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e4e8e0] text-[#9b6156] hover:bg-[#fff2ef]" aria-label={`Cancelar turno ${ticket.id}`} title="Cancelar turno"><X size={17} /></button></div></article>)}</div> : <div className="panel flex flex-col items-center px-6 py-14 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eef4e4] text-[#52725b]"><Ticket size={24} /></div><h3 className="mt-4 text-sm font-semibold">Todavía no tienes turnos</h3><p className="mt-2 max-w-xs text-xs leading-5 text-[#77827c]">Elige un servicio disponible para reservar tu lugar en la fila.</p><button onClick={() => setActivePage('servicios')} className="mt-5 flex items-center gap-2 rounded-lg bg-[#174f3d] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#23684e]">Explorar servicios <ChevronRight size={15} /></button></div>}
              <div className="mt-8 mb-4"><h2 className="font-['Space_Grotesk'] text-lg font-semibold tracking-[0]">Historial reciente</h2><p className="mt-1 text-xs text-[#77827c]">Turnos anteriores en este dispositivo</p></div>
              {tickets.filter((ticket) => ticket.status !== 'waiting').length ? <div className="divide-y divide-[#e4e8e0] rounded-lg border border-[#e4e8e0] bg-white px-5">{tickets.filter((ticket) => ticket.status !== 'waiting').map((ticket) => <div key={ticket.id} className="flex items-center justify-between py-4"><div><p className="text-sm font-medium">{ticket.serviceName}</p><p className="mt-1 text-xs text-[#77827c]">{ticket.id}</p></div><span className="text-xs text-[#89938c]">Cancelado</span></div>)}</div> : <p className="rounded-lg border border-dashed border-[#d8ded5] px-5 py-6 text-center text-xs text-[#89938c]">Aquí aparecerán tus turnos finalizados.</p>}
            </section>
          )}

          <footer className="mt-10 border-t border-[#e4e8e0] pt-4 text-[10px] text-[#89938c]">Fila Go <span className="px-1">·</span> Versión de demostración <span className="px-1">·</span> Los turnos se guardan en este dispositivo</footer>
        </div>
      </main>
    </div>
  )
}

export default App
