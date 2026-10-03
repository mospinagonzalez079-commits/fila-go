const { Router } = require('express')
const { z } = require('zod')
const { authenticate, authorize } = require('../middleware/auth')

const router = Router()
router.use(authenticate, authorize('administrador'))

const updateUserSchema = z.object({
  rol: z.enum(['estudiante', 'encargado', 'administrador']).optional(),
  estado: z.enum(['activo', 'inactivo']).optional(),
}).refine((value) => value.rol !== undefined || value.estado !== undefined)

router.get('/usuarios', async (req, res, next) => {
  try {
    const [rows] = await req.app.locals.db.execute(
      `SELECT id, nombres, apellidos, codigo_institucional, correo, rol, estado, creado_en
       FROM usuarios ORDER BY creado_en DESC LIMIT 200`,
    )
    return res.json({ usuarios: rows })
  } catch (error) {
    return next(error)
  }
})

router.patch('/usuarios/:userId', async (req, res, next) => {
  if (!/^\d+$/.test(req.params.userId)) {
    return res.status(400).json({ error: 'Usuario no válido.' })
  }
  const parsed = updateUserSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Indica un rol o estado válido.' })
  }
  if (String(req.user.id) === req.params.userId && (parsed.data.estado === 'inactivo' || (parsed.data.rol && parsed.data.rol !== 'administrador'))) {
    return res.status(409).json({ error: 'No puedes desactivar ni cambiar el rol de tu propia cuenta.' })
  }

  const fields = []
  const values = []
  if (parsed.data.rol) {
    fields.push('rol = ?')
    values.push(parsed.data.rol)
  }
  if (parsed.data.estado) {
    fields.push('estado = ?')
    values.push(parsed.data.estado)
  }
  values.push(req.params.userId)

  try {
    const [result] = await req.app.locals.db.execute(
      `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`,
      values,
    )
    if (!result.affectedRows) return res.status(404).json({ error: 'No se encontró el usuario.' })
    return res.json({ mensaje: 'Usuario actualizado.' })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
