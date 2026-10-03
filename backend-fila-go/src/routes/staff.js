const { Router } = require('express')
const { authenticate, authorize } = require('../middleware/auth')
const { schoolDate } = require('../utils/school-date')

const router = Router()
router.use(authenticate, authorize('encargado', 'administrador'))

async function lockAuthorizedService(connection, user, serviceId) {
  const [services] = await connection.execute(
    'SELECT id FROM servicios WHERE id = ? AND activo = TRUE FOR UPDATE',
    [serviceId],
  )
  if (!services[0]) return false
  if (user.role === 'administrador') return true

  const [assignments] = await connection.execute(
    'SELECT servicio_id FROM servicios_encargados WHERE servicio_id = ? AND usuario_id = ? LIMIT 1',
    [serviceId, user.id],
  )
  return assignments.length > 0
}

router.get('/servicios/:serviceId/turnos', async (req, res, next) => {
  const serviceId = Number(req.params.serviceId)
  if (!Number.isSafeInteger(serviceId) || serviceId < 1) {
    return res.status(400).json({ error: 'Servicio no válido.' })
  }

  try {
    const db = req.app.locals.db
    const [services] = await db.execute(
      `SELECT s.id, s.nombre FROM servicios s
       LEFT JOIN servicios_encargados se ON se.servicio_id = s.id
       WHERE s.id = ? AND s.activo = TRUE
         AND (? = 'administrador' OR se.usuario_id = ?)
       LIMIT 1`,
      [serviceId, req.user.role, req.user.id],
    )
    if (!services[0]) return res.status(403).json({ error: 'No tienes asignado este servicio.' })

    const [rows] = await db.execute(
      `SELECT t.id, t.codigo, t.estado, t.solicitado_en,
              u.nombres, u.apellidos
       FROM turnos t
       INNER JOIN usuarios u ON u.id = t.usuario_id
       WHERE t.servicio_id = ? AND t.fecha = ?
         AND t.estado IN ('pendiente', 'en_atencion')
       ORDER BY FIELD(t.estado, 'en_atencion', 'pendiente'), t.numero`,
      [serviceId, schoolDate()],
    )
    return res.json({ servicio: services[0], turnos: rows })
  } catch (error) {
    return next(error)
  }
})

router.post('/servicios/:serviceId/llamar-siguiente', async (req, res, next) => {
  const serviceId = Number(req.params.serviceId)
  if (!Number.isSafeInteger(serviceId) || serviceId < 1) {
    return res.status(400).json({ error: 'Servicio no válido.' })
  }

  const connection = await req.app.locals.db.getConnection()
  const fecha = schoolDate()
  try {
    await connection.beginTransaction()
    if (!await lockAuthorizedService(connection, req.user, serviceId)) {
      await connection.rollback()
      return res.status(403).json({ error: 'No tienes asignado este servicio.' })
    }

    const [inService] = await connection.execute(
      `SELECT id FROM turnos
       WHERE servicio_id = ? AND fecha = ? AND estado = 'en_atencion'
       LIMIT 1 FOR UPDATE`,
      [serviceId, fecha],
    )
    if (inService.length) {
      await connection.rollback()
      return res.status(409).json({ error: 'Finaliza la atención actual antes de llamar otro turno.' })
    }

    const [nextTickets] = await connection.execute(
      `SELECT id, codigo FROM turnos
       WHERE servicio_id = ? AND fecha = ? AND estado = 'pendiente'
       ORDER BY numero LIMIT 1 FOR UPDATE`,
      [serviceId, fecha],
    )
    const nextTicket = nextTickets[0]
    if (!nextTicket) {
      await connection.rollback()
      return res.status(404).json({ error: 'No hay turnos pendientes.' })
    }

    await connection.execute(
      "UPDATE turnos SET estado = 'en_atencion', llamado_en = NOW() WHERE id = ?",
      [nextTicket.id],
    )
    await connection.execute(
      "INSERT INTO eventos_turno (turno_id, actor_usuario_id, evento) VALUES (?, ?, 'llamado')",
      [nextTicket.id, req.user.id],
    )
    await connection.commit()
    return res.json({ turno: { id: String(nextTicket.id), codigo: nextTicket.codigo, estado: 'en_atencion' } })
  } catch (error) {
    await connection.rollback()
    return next(error)
  } finally {
    connection.release()
  }
})

router.post('/turnos/:ticketId/finalizar', async (req, res, next) => {
  if (!/^\d+$/.test(req.params.ticketId)) {
    return res.status(400).json({ error: 'Turno no válido.' })
  }

  const connection = await req.app.locals.db.getConnection()
  try {
    await connection.beginTransaction()
    const [ticketRows] = await connection.execute(
      'SELECT id, codigo, servicio_id FROM turnos WHERE id = ? LIMIT 1',
      [req.params.ticketId],
    )
    const candidate = ticketRows[0]
    if (!candidate) {
      await connection.rollback()
      return res.status(404).json({ error: 'No se encontró el turno.' })
    }
    if (!await lockAuthorizedService(connection, req.user, candidate.servicio_id)) {
      await connection.rollback()
      return res.status(403).json({ error: 'No tienes permiso para finalizar este turno.' })
    }
    const [tickets] = await connection.execute(
      `SELECT id, codigo FROM turnos
       WHERE id = ? AND estado = 'en_atencion' FOR UPDATE`,
      [candidate.id],
    )
    const ticket = tickets[0]
    if (!ticket) {
      await connection.rollback()
      return res.status(409).json({ error: 'El turno no está en atención.' })
    }

    await connection.execute(
      "UPDATE turnos SET estado = 'atendido', finalizado_en = NOW() WHERE id = ?",
      [ticket.id],
    )
    await connection.execute(
      "INSERT INTO eventos_turno (turno_id, actor_usuario_id, evento) VALUES (?, ?, 'atendido')",
      [ticket.id, req.user.id],
    )
    await connection.commit()
    return res.json({ turno: { id: String(ticket.id), codigo: ticket.codigo, estado: 'atendido' } })
  } catch (error) {
    await connection.rollback()
    return next(error)
  } finally {
    connection.release()
  }
})

module.exports = router
