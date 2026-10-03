# Fila Go: requisitos y diseño técnico

**Institución:** Institución Educativa Rural Santa María  
**Propósito:** organizar la fila de la tienda escolar durante los descansos.  
**Estado:** propuesta inicial consolidada a partir de los manuales entregados; validar con la institución antes de producción.

## Actores

- **Estudiante:** se registra, inicia sesión, toma un turno, consulta el avance y cancela su turno pendiente.
- **Encargado de tienda:** consulta la fila, llama al siguiente turno y finaliza la atención.
- **Administrador:** consulta y administra usuarios, roles y estados de cuenta.

## Requisitos funcionales

| Código | Requisito | Criterio de aceptación | Prioridad |
| --- | --- | --- | --- |
| RF-01 | Registro de usuario | Un estudiante puede crear una cuenta con los campos obligatorios validados; no se aceptan cuentas duplicadas. Las cuentas de encargado y administrador solo las crea o habilita un administrador. | Alta |
| RF-02 | Inicio de sesión | El sistema valida las credenciales y muestra un mensaje genérico si no son válidas. | Alta |
| RF-03 | Solicitar turno | Un estudiante autenticado puede solicitar un turno para la tienda escolar. | Alta |
| RF-04 | Generar turno | El sistema asigna un código único, conserva el orden de llegada y registra el turno como pendiente. | Alta |
| RF-05 | Consultar turno | El estudiante consulta código, estado y posición aproximada de su turno. | Alta |
| RF-06 | Ver fila | Se muestran el turno en atención y los turnos pendientes; el avance se actualiza al cambiar la fila. | Alta |
| RF-07 | Cancelar turno | El estudiante puede cancelar su turno pendiente; el turno sale de la fila. No puede cancelar uno ya atendido. | Media |
| RF-08 | Gestionar turnos | El encargado autorizado ve los turnos pendientes y puede actualizar su estado. | Alta |
| RF-09 | Llamar siguiente turno | El encargado llama el turno pendiente más antiguo; pasa a estado “en atención” y el cambio se refleja al estudiante. | Alta |
| RF-10 | Finalizar atención | El encargado marca como atendido el turno que está en atención. | Alta |
| RF-11 | Cerrar sesión | El usuario finaliza su sesión y necesita autenticarse para volver a las funciones privadas. | Media |
| RF-12 | Administrar usuarios | El administrador consulta usuarios y puede cambiar su rol o estado; la operación está restringida al administrador. | Media |

## Requisitos no funcionales

Los criterios medibles siguientes son **objetivos iniciales propuestos**, no cifras presentes en los manuales. Deben confirmarse con el colegio y probarse antes de producción.

| Código | Característica | Criterio de aceptación |
| --- | --- | --- |
| RNF-01 | Usabilidad | El flujo de tomar un turno se completa desde una pantalla clara, con confirmación y mensajes de error comprensibles. |
| RNF-02 | Rendimiento | Objetivo propuesto: respuestas P95 menores a 2 s con hasta 50 usuarios concurrentes en la red escolar. |
| RNF-03 | Compatibilidad | La PWA funciona en versiones vigentes de Chrome/Android, Safari/iOS y navegadores modernos de escritorio. |
| RNF-04 | Adaptabilidad | El contenido y los controles funcionan desde 320 px de ancho hasta pantallas de escritorio, sin desplazamiento horizontal. |
| RNF-05 | Seguridad | HTTPS en producción, contraseñas con hash seguro, secretos solo en variables de entorno y autorización por rol comprobada en el backend. |
| RNF-06 | Disponibilidad | El servicio debe estar operativo en los horarios de descanso definidos por la institución; el horario y nivel de disponibilidad quedan por acordar. |
| RNF-07 | Mantenibilidad | Frontend y backend separados, módulos con responsabilidades claras, lint y pruebas para las operaciones críticas. |
| RNF-08 | Confiabilidad | No se confirma una operación antes de persistirla; la generación concurrente de turnos es transaccional y evita duplicados. |
| RNF-09 | Facilidad de aprendizaje | Un estudiante nuevo puede identificar cómo tomar y consultar un turno sin capacitación extensa. |
| RNF-10 | Escalabilidad | El esquema separa usuarios, tienda, turnos y eventos para permitir mejoras sin reconstruir el modelo completo. |

## Reglas de negocio

1. Solo un estudiante autenticado puede solicitar un turno.
2. Una cuenta puede tener como máximo un turno activo (pendiente o en atención) a la vez.
3. La fila se atiende por orden de creación; los turnos cancelados no bloquean el avance.
4. Solo un encargado asignado puede gestionar la fila de la tienda.
5. Solo un administrador puede administrar cuentas y roles.
6. El estado recorre `pendiente -> en_atencion -> atendido`; un turno pendiente también puede pasar a `cancelado`.
7. Los cambios de estado se registran para mantener trazabilidad.
8. Si el dispositivo está sin conexión, la PWA no debe afirmar que creó o canceló un turno sin confirmación del servidor.

## Historias de usuario

### HU-01: Registro (prioridad alta)
**Como** estudiante, **quiero** registrarme en Fila Go, **para** utilizar el sistema de turnos.

- Solicita los datos obligatorios y valida su formato.
- Rechaza correo/código ya registrado.
- Una cuenta pública nueva queda con rol de estudiante.
- Confirma el registro sin exponer datos de otras cuentas.

### HU-02: Inicio de sesión (prioridad alta)
**Como** estudiante, **quiero** iniciar sesión, **para** acceder a las funciones de Fila Go.

- Solicita credenciales y las valida en el servidor.
- Credenciales correctas habilitan solo las funciones permitidas por el rol.
- Credenciales incorrectas muestran un mensaje claro sin revelar si existe la cuenta.

### HU-03: Solicitar turno (prioridad alta)
**Como** estudiante, **quiero** solicitar un turno virtual, **para** evitar permanecer en una fila física.

- Requiere sesión autenticada.
- Permite solicitar turno para la tienda escolar.
- Genera un turno único en estado pendiente.
- Impide crear otro turno activo para la misma cuenta.

### HU-04: Consultar turno (prioridad alta)
**Como** estudiante, **quiero** consultar mi turno, **para** saber cuándo se acerca mi atención.

- Muestra código y estado actual.
- Muestra posición aproximada actualizada.
- Identifica cuando el encargado llama al turno y comienza la atención.

### HU-05: Cancelar turno (prioridad media)
**Como** estudiante, **quiero** cancelar un turno que ya no necesito, **para** liberar mi lugar.

- La opción está disponible solo mientras el turno está pendiente.
- Pide confirmación antes de cancelar.
- Al confirmar, cambia el estado y el turno deja de contar en la fila.

### HU-06: Ver fila (prioridad alta)
**Como** estudiante, **quiero** ver el avance de la fila, **para** calcular cuánto falta para mi turno.

- Muestra el turno en atención y los pendientes.
- Identifica la posición propia del estudiante.
- Refresca el avance cuando cambian los turnos.

### HU-07: Gestionar turnos (prioridad alta)
**Como** encargado, **quiero** visualizar y gestionar los turnos, **para** organizar la atención.

- Solo un encargado autorizado accede a la vista de gestión.
- Ve la cola pendiente en orden y reconoce el siguiente turno.
- Los cambios de estado se reflejan en la vista del estudiante.

### HU-08: Llamar siguiente turno (prioridad alta)
**Como** encargado, **quiero** llamar el siguiente turno, **para** atender en orden.

- El sistema selecciona el turno pendiente más antiguo.
- El encargado lo pasa a “en atención”.
- El estudiante puede ver el nuevo estado.

### HU-09: Administrar usuarios (prioridad media)
**Como** administrador, **quiero** gestionar usuarios, **para** controlar el acceso al sistema.

- Consulta cuentas, roles y estado.
- Puede activar/desactivar una cuenta y asignar roles autorizados.
- La API rechaza la operación para usuarios que no sean administradores.

### HU-10: Cerrar sesión (prioridad media)
**Como** usuario, **quiero** cerrar sesión, **para** proteger mi cuenta al terminar.

- Hay una acción visible para cerrar sesión.
- La sesión/token deja de ser válido según el mecanismo elegido.
- Las páginas privadas requieren autenticarse de nuevo.

## Trazabilidad

| Historia | Requisitos relacionados |
| --- | --- |
| HU-01 | RF-01 |
| HU-02 | RF-02 |
| HU-03 | RF-03, RF-04 |
| HU-04 | RF-05 |
| HU-05 | RF-07 |
| HU-06 | RF-05, RF-06 |
| HU-07 | RF-08 |
| HU-08 | RF-09 |
| HU-09 | RF-12 |
| HU-10 | RF-11 |

## Modelo relacional propuesto

- `usuarios` 1:N `turnos`: una cuenta puede tener historial de turnos.
- `servicios` 1:N `turnos`: en el MVP se registra la tienda escolar como servicio.
- `usuarios` N:M `servicios` mediante `servicios_encargados`: asigna encargados autorizados.
- `servicios` 1:N `secuencias_turno`: contador independiente por servicio y fecha.
- `turnos` 1:N `eventos_turno`: conserva las acciones y cambios de estado.

El DDL MySQL inicial está en [`../backend-fila-go/database/schema.sql`](../backend-fila-go/database/schema.sql). La conexión remota, credenciales, política final de sesión y datos definitivos del registro quedan pendientes antes de integrar/probar el backend.

## Supuestos por confirmar

- La primera versión administra una única tienda escolar, sin pedidos ni pagos en línea.
- El código/correo institucional disponible para el registro y sus campos obligatorios deben confirmarse con el colegio.
- El encargado no puede crear usuarios con rol administrador; el administrador asigna los roles de operación.
- El tiempo estimado en fila se definirá con datos reales; no se debe mostrar una estimación falsa.
- El contenido visual del enlace Figma debe contrastarse: no fue accesible desde esta sesión.
