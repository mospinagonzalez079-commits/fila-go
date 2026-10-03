const test = require('node:test')
const assert = require('node:assert/strict')
const { validateEnvironment } = require('../src/db/pool')
const { schoolDate } = require('../src/utils/school-date')

const environmentKeys = [
  'MYSQL_ADDON_HOST',
  'MYSQL_ADDON_DB',
  'MYSQL_ADDON_USER',
  'MYSQL_ADDON_PASSWORD',
  'JWT_SECRET',
]

function withEnvironment(values, callback) {
  const previous = Object.fromEntries(environmentKeys.map((key) => [key, process.env[key]]))
  try {
    for (const key of environmentKeys) {
      if (values[key] === undefined) delete process.env[key]
      else process.env[key] = values[key]
    }
    callback()
  } finally {
    for (const key of environmentKeys) {
      if (previous[key] === undefined) delete process.env[key]
      else process.env[key] = previous[key]
    }
  }
}

test('database config fails fast when required variables are missing', () => {
  withEnvironment({ JWT_SECRET: 'a'.repeat(32) }, () => {
    assert.throws(() => validateEnvironment(), /MYSQL_ADDON_HOST/)
  })
})

test('database config accepts local Clever Cloud variables and a strong token secret', () => {
  withEnvironment({
    MYSQL_ADDON_HOST: 'db.example.test',
    MYSQL_ADDON_DB: 'fila_go_test',
    MYSQL_ADDON_USER: 'fila_go_test_user',
    MYSQL_ADDON_PASSWORD: 'local-test-password',
    JWT_SECRET: 'a'.repeat(32),
  }, () => assert.doesNotThrow(() => validateEnvironment()))
})

test('school queue date uses Colombia local time around UTC midnight', () => {
  assert.equal(schoolDate(new Date('2026-01-01T03:30:00.000Z')), '2025-12-31')
})
