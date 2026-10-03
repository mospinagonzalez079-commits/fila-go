require('dotenv').config({ path: require('node:path').resolve(__dirname, '../.env') })

const app = require('./app')
const port = Number(process.env.PORT || 3001)
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Fila Go API listening on port ${port}`)
})

async function shutdown() {
  server.close(async () => {
    await app.locals.db.end()
    process.exit(0)
  })
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
