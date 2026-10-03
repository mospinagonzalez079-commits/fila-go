const jwt = require('jsonwebtoken')

async function authenticate(req, res, next) {
  const authorization = req.get('authorization') || ''
  const [scheme, token] = authorization.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Debes iniciar sesión.' })
  }

  let claims
  try {
    claims = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return res.status(401).json({ error: 'La sesión no es válida o ha expirado.' })
  }

  const [rows] = await req.app.locals.db.execute(
    "SELECT id, rol FROM usuarios WHERE id = ? AND estado = 'activo' LIMIT 1",
    [claims.sub],
  )
  if (!rows[0]) return res.status(401).json({ error: 'La cuenta no está activa.' })

  req.user = { id: String(rows[0].id), role: rows[0].rol }
  return next()
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permiso para esta acción.' })
    }
    return next()
  }
}

module.exports = { authenticate, authorize }
