const mysql = require('mysql2/promise')

const requiredVariables = [
  'MYSQL_ADDON_HOST',
  'MYSQL_ADDON_DB',
  'MYSQL_ADDON_USER',
  'MYSQL_ADDON_PASSWORD',
]

function validateEnvironment() {
  const missing = requiredVariables.filter((name) => !process.env[name])
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters')
  }
}

function createPool() {
  validateEnvironment()

  return mysql.createPool({
    host: process.env.MYSQL_ADDON_HOST,
    database: process.env.MYSQL_ADDON_DB,
    user: process.env.MYSQL_ADDON_USER,
    password: process.env.MYSQL_ADDON_PASSWORD,
    port: Number(process.env.MYSQL_ADDON_PORT || 3306),
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 20,
    enableKeepAlive: true,
    ssl: process.env.MYSQL_SSL === 'true' ? { minVersion: 'TLSv1.2' } : undefined,
    timezone: 'Z',
    charset: 'utf8mb4',
  })
}

module.exports = { createPool, validateEnvironment }
