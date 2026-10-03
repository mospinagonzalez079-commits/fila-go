const { Router } = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { rateLimit } = require('express-rate-limit')
const { z } = require('zod')
const { authenticate } = require('../middleware/auth')

const router = Router()
const credentialsLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' },
})

const registerSchema = z.object({
  nombres: z.string().trim().min(2).max(100),
  apellidos: z.string().trim().min(2).max(100),
  codigoInstitucional: z.string().trim().min(2).max(40).optional(),
  correo: z.string().trim().email().max(190).transform((value) => value.toLowerCase()),
  password: z.string().min(8).refine((value) => Buffer.byteLength(value, 'utf8') <= 72),
})

const loginSchema = z.object({
  correo: z.string().trim().email().max(190).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(72),
})

function makeToken(user) {
  return jwt.sign({ role: user.rol }, process.env.JWT_SECRET, {
    subject: String(user.id),
    expiresIn: '8h',
  })
}

function publicUser(user) {
  return {
    id: String(user.id),
    nombres: user.nombres,
    apellidos: user.apellidos,
    correo: user.correo,
    rol: user.rol,
  }
}

router.post('/registro', credentialsLimit, async (req, res, next) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Revisa los datos del formulario.' })
  }

  const { nombres, apellidos, codigoInstitucional, correo, password } = parsed.data
  const db = req.app.locals.db

  try {
    const passwordHash = await bcrypt.hash(password, 12)
    const [result] = await db.execute(
      `INSERT INTO usuarios (nombres, apellidos, codigo_institucional, correo, password_hash, rol)
       VALUES (?, ?, ?, ?, ?, 'estudiante')`,
      [nombres, apellidos, codigoInstitucional || null, correo, passwordHash],
    )

    const user = { id: result.insertId, nombres, apellidos, correo, rol: 'estudiante' }
    return res.status(201).json({ token: makeToken(user), usuario: publicUser(user) })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El correo o código institucional ya está registrado.' })
    }
    return next(error)
  }
})

router.post('/sesion', credentialsLimit, async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Escribe un correo y una contraseña válidos.' })
  }

  try {
    const [rows] = await req.app.locals.db.execute(
      `SELECT id, nombres, apellidos, correo, password_hash, rol
       FROM usuarios WHERE correo = ? AND estado = 'activo' LIMIT 1`,
      [parsed.data.correo],
    )
    const user = rows[0]
    const passwordMatches = user
      ? await bcrypt.compare(parsed.data.password, user.password_hash)
      : await bcrypt.compare(parsed.data.password, '$2a$12$wE3ImYmrcJquNGHT1LuQzO2.bQh4TxZkQq4KxaxQnQfCF86M2Qf6K')

    if (!user || !passwordMatches) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' })
    }

    return res.json({ token: makeToken(user), usuario: publicUser(user) })
  } catch (error) {
    return next(error)
  }
})

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const [rows] = await req.app.locals.db.execute(
      `SELECT id, nombres, apellidos, correo, rol
       FROM usuarios WHERE id = ? AND estado = 'activo' LIMIT 1`,
      [req.user.id],
    )
    if (!rows[0]) return res.status(401).json({ error: 'La cuenta no está activa.' })
    return res.json({ usuario: publicUser(rows[0]) })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
