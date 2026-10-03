const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const { createPool } = require('./db/pool')
const authRoutes = require('./routes/auth')
const ticketRoutes = require('./routes/tickets')
const staffRoutes = require('./routes/staff')
const adminRoutes = require('./routes/admin')

const app = express()
const db = createPool()
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error('Origin is not allowed by CORS'))
  },
}))
app.use(express.json({ limit: '12kb' }))
app.locals.db = db

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))
app.get('/api/health/ready', async (_req, res, next) => {
  try {
    await db.execute('SELECT 1')
    return res.json({ status: 'ready' })
  } catch (error) {
    return next(error)
  }
})

app.use('/api/auth', authRoutes)
app.use('/api', ticketRoutes)
app.use('/api/encargado', staffRoutes)
app.use('/api/admin', adminRoutes)

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }))
app.use((error, _req, res, next) => {
  if (res.headersSent) return next(error)
  const status = error.type === 'entity.parse.failed' ? 400 : 500
  if (status === 500) console.error('API request failed:', error.code || error.name || 'unknown error')
  return res.status(status).json({
    error: status === 400 ? 'El cuerpo de la solicitud no es JSON válido.' : 'No se pudo completar la solicitud.',
  })
})

module.exports = app
