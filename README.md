# Fila Go

PWA para organizar los turnos de la tienda escolar de la Institución Educativa Rural Santa María.

## Estado actual

- El frontend React/Vite tiene una pantalla demo para consultar la fila y crear/cancelar turnos locales.
- Los turnos demo se guardan en `localStorage`; todavía no requieren autenticación y no se sincronizan entre dispositivos.
- El backend Express tiene rutas para registro/sesión, fila, turnos, acciones de encargado y administración. Aún no se ha conectado ni probado contra Clever Cloud.
- El esquema MySQL está en [`backend-fila-go/database/schema.sql`](backend-fila-go/database/schema.sql); los requisitos e historias están en [`docs/Requisitos_y_diseno_tecnico.md`](docs/Requisitos_y_diseno_tecnico.md).
- Los requisitos, reglas de negocio e historias consolidadas están en [`docs/Requisitos_y_diseno_tecnico.md`](docs/Requisitos_y_diseno_tecnico.md).

## Ejecutar el frontend

```powershell
cd frontend-fila-go
npm install
npm run dev
```

Para validar la versión de producción:

```powershell
npm run lint
npm run build
```

## Preparar el backend

Rota la contraseña que se compartió en el chat antes de usarla. Copia `backend-fila-go/.env.example` a `backend-fila-go/.env`, completa allí los datos nuevos de Clever Cloud y define un `JWT_SECRET` aleatorio de al menos 32 caracteres. `.env` está excluido de Git; no publiques sus valores.

```powershell
cd backend-fila-go
npm install
npm run dev
```

El servidor inicia en `http://localhost:3001`. `GET /api/health` no toca MySQL; `GET /api/health/ready` hace una consulta real a la base.

## Pendiente antes del despliegue

- Confirmar la nueva contraseña y que `.env` local esté completo; entonces se hará una sola prueba de conectividad y se aplicará el esquema dentro del límite de consultas acordado.
- Conectar los flujos del frontend a la API y validar autenticación/roles con las cuentas de prueba del colegio.
- Configurar `CORS_ORIGIN` y `JWT_SECRET` de producción en las variables de Vercel. El frontend y el backend se desplegarán como dos proyectos con raíz independiente.
