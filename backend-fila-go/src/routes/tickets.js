const { Router } = require('express')
const { z } = require('zod')
const { authenticate } = require('../middleware/auth')
const { schoolDate } = require('../utils/school-date')

const router = Router()
const createTicketSchema = z.object({ serviceId: z.coerce.number().int().positive() })

router.get('/servicios', async (req, res, next) => {
  try {
    const [rows] = await req.app.locals.db.execute(
      `SELECT id, nombre, descripcion, prefijo_turno
       FROM servicios WHERE activo = TRUE ORDER BY nombre`,
    )
    return res.json({ servicios: rows })
  } catch (error) {
    return next(error)
  }
})

router.get('/turnos/mios', authenticate, async (req, res, next) => {
  try {
    const [rows] = await req.app.locals.db.execute(
      `SELECT t.id, t.codigo, t.estado, t.fecha, t.solicitado_en,
              s.nombre AS servicio,
              CASE WHEN t.estado = 'pendiente' THEN (
                SELECT COUNT(*) FROM turnos anteriores
                WHERE anteriores.servicio_id = t.servicio_id
                  AND anteriores.fecha = t.fecha
                  AND anteriores.estado IN ('pendiente', 'en_atencion')
                  AND anteriores.numero < t.numero
              ) ELSE 0 END AS personas_antes
       FROM turnos t
       INNER JOIN servicios s ON s.id = t.servicio_id
       WHERE t.usuario_id = ?
       ORDER BY t.solicitado_en DESC
       LIMIT 20`,
      [req.user.id],
    )
    return res.json({ turnos: rows })
  } catch (error) {
    return next(error)
  }
})

router.get('/fila/:serviceId', authenticate, async (req, res, next) => {
  const serviceId = Number(req.params.serviceId)
  if (!Number.isSafeInteger(serviceId) || serviceId < 1) {
    return res.status(400).json({ error: 'Servicio no válido.' })
  }

  try {
    const [rows] = await req.app.locals.db.execute(
      `SELECT s.id AS servicio_id, s.nombre AS servicio,
              actual.codigo AS turno_en_atencion,
              (SELECT COUNT(*) FROM turnos pendientes
               WHERE pendientes.servicio_id = s.id
                 AND pendientes.fecha = ?
                 AND pendientes.estado = 'pendiente') AS pendientes
       FROM servicios s
       LEFT JOIN turnos actual
         ON actual.servicio_id = s.id
        AND actual.fecha = ?
        AND actual.estado = 'en_atencion'
       WHERE s.id = ? AND s.activo = TRUE
       LIMIT 1`,
      [schoolDate(), schoolDate(), serviceId],
    )
    if (!rows[0]) return res.status(404).json({ error: 'No se encontró el servicio.' })
    return res.json({ fila: rows[0] })
  } catch (error) {
    return next(error)
  }
})

router.post('/turnos', authenticate, async (req, res, next) => {
  if (req.user.role !== 'estudiante') {
    return res.status(403).json({ error: 'Solo un estudiante puede solicitar turno.' })
  }

  const parsed = createTicketSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Selecciona un servicio válido.' })

  const db = req.app.locals.db
  const connection = await db.getConnection()
  const fecha = schoolDate()

  try {
    await connection.beginTransaction()
    const [services] = await connection.execute(
      'SELECT id, nombre, prefijo_turno FROM servicios WHERE id = ? AND activo = TRUE FOR UPDATE',
      [parsed.data.serviceId],
    )
    const service = services[0]
    if (!service) {
      await connection.rollback()
      return res.status(404).json({ error: 'El servicio no está disponible.' })
    }

    const [activeTickets] = await connection.execute(
      `SELECT id FROM turnos
       WHERE usuario_id = ? AND estado IN ('pendiente', 'en_atencion')
       LIMIT 1 FOR UPDATE`,
      [req.user.id],
    )
    if (activeTickets.length) {
      await connection.rollback()
      return res.status(409).json({ error: 'Ya tienes un turno activo.' })
    }

    await connection.execute(
      `INSERT INTO secuencias_turno (servicio_id, fecha, ultimo_numero)
       VALUES (?, ?, 0)
       ON DUPLICATE KEY UPDATE ultimo_numero = ultimo_numero`,
      [service.id, fecha],
    )
    const [sequences] = await connection.execute(
      'SELECT ultimo_numero FROM secuencias_turno WHERE servicio_id = ? AND fecha = ? FOR UPDATE',
      [service.id, fecha],
    )
    const numero = Number(sequences[0].ultimo_numero) + 1
    await connection.execute(
      'UPDATE secuencias_turno SET ultimo_numero = ? WHERE servicio_id = ? AND fecha = ?',
      [numero, service.id, fecha],
    )

    const codigo = `${service.prefijo_turno}-${fecha.replaceAll('-', '')}-${String(numero).padStart(4, '0')}`
    const [created] = await connection.execute(
      `INSERT INTO turnos (codigo, usuario_id, servicio_id, fecha, numero)
       VALUES (?, ?, ?, ?, ?)`,
      [codigo, req.user.id, service.id, fecha, numero],
    )
    await connection.execute(
      "INSERT INTO eventos_turno (turno_id, actor_usuario_id, evento) VALUES (?, ?, 'creado')",
      [created.insertId, req.user.id],
    )
    await connection.commit()
    return res.status(201).json({ turno: { id: String(created.insertId), codigo, estado: 'pendiente', servicio: service.nombre, fecha, numero } })
  } catch (error) {
    await connection.rollback()
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya tienes un turno activo.' })
    }
    return next(error)
  } finally {
    connection.release()
  }
})

router.delete('/turnos/:ticketId', authenticate, async (req, res, next) => {
  if (!/^\d+$/.test(req.params.ticketId)) {
    return res.status(400).json({ error: 'Turno no válido.' })
  }

  const connection = await req.app.locals.db.getConnection()
  try {
    await connection.beginTransaction()
    const [result] = await connection.execute(
      `UPDATE turnos SET estado = 'cancelado'
       WHERE id = ? AND usuario_id = ? AND estado = 'pendiente'`,
      [req.params.ticketId, req.user.id],
    )
    if (!result.affectedRows) {
      await connection.rollback()
      return res.status(409).json({ error: 'El turno no existe o ya no se puede cancelar.' })
    }
    await connection.execute(
      "INSERT INTO eventos_turno (turno_id, actor_usuario_id, evento) VALUES (?, ?, 'cancelado')",
      [req.params.ticketId, req.user.id],
    )
    await connection.commit()
    return res.json({ mensaje: 'Turno cancelado.' })
  } catch (error) {
    await connection.rollback()
    return next(error)
  } finally {
    connection.release()
  }
})

module.exports = router
