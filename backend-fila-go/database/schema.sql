CREATE TABLE IF NOT EXISTS usuarios (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  codigo_institucional VARCHAR(40) NULL,
  correo VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('estudiante', 'encargado', 'administrador') NOT NULL DEFAULT 'estudiante',
  estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_correo (correo),
  UNIQUE KEY uq_usuarios_codigo (codigo_institucional),
  KEY ix_usuarios_rol_estado (rol, estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS servicios (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255) NULL,
  prefijo_turno VARCHAR(4) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_servicios_nombre (nombre),
  UNIQUE KEY uq_servicios_prefijo (prefijo_turno)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO servicios (nombre, descripcion, prefijo_turno)
VALUES ('Tienda escolar', 'Atención de estudiantes durante los descansos', 'T');

CREATE TABLE IF NOT EXISTS servicios_encargados (
  servicio_id BIGINT UNSIGNED NOT NULL,
  usuario_id BIGINT UNSIGNED NOT NULL,
  asignado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (servicio_id, usuario_id),
  KEY ix_servicios_encargados_usuario (usuario_id),
  CONSTRAINT fk_servicios_encargados_servicio
    FOREIGN KEY (servicio_id) REFERENCES servicios (id) ON DELETE RESTRICT,
  CONSTRAINT fk_servicios_encargados_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS secuencias_turno (
  servicio_id BIGINT UNSIGNED NOT NULL,
  fecha DATE NOT NULL,
  ultimo_numero INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (servicio_id, fecha),
  CONSTRAINT fk_secuencias_turno_servicio
    FOREIGN KEY (servicio_id) REFERENCES servicios (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS turnos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(24) NOT NULL,
  usuario_id BIGINT UNSIGNED NOT NULL,
  servicio_id BIGINT UNSIGNED NOT NULL,
  fecha DATE NOT NULL,
  numero INT UNSIGNED NOT NULL,
  estado ENUM('pendiente', 'en_atencion', 'atendido', 'cancelado') NOT NULL DEFAULT 'pendiente',
  solicitado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  llamado_en DATETIME NULL,
  finalizado_en DATETIME NULL,
  usuario_activo_id BIGINT UNSIGNED
    GENERATED ALWAYS AS (
      CASE
        WHEN estado IN ('pendiente', 'en_atencion') THEN usuario_id
        ELSE NULL
      END
    ) STORED,
  PRIMARY KEY (id),
  UNIQUE KEY uq_turnos_codigo (codigo),
  UNIQUE KEY uq_turnos_servicio_fecha_numero (servicio_id, fecha, numero),
  UNIQUE KEY uq_turnos_un_activo_por_usuario (usuario_activo_id),
  KEY ix_turnos_cola (servicio_id, fecha, estado, numero),
  KEY ix_turnos_usuario_fecha (usuario_id, fecha),
  CONSTRAINT fk_turnos_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE RESTRICT,
  CONSTRAINT fk_turnos_servicio
    FOREIGN KEY (servicio_id) REFERENCES servicios (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS eventos_turno (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  turno_id BIGINT UNSIGNED NOT NULL,
  actor_usuario_id BIGINT UNSIGNED NULL,
  evento ENUM('creado', 'llamado', 'atendido', 'cancelado') NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_eventos_turno_fecha (turno_id, creado_en),
  KEY ix_eventos_actor (actor_usuario_id),
  CONSTRAINT fk_eventos_turno_turno
    FOREIGN KEY (turno_id) REFERENCES turnos (id) ON DELETE RESTRICT,
  CONSTRAINT fk_eventos_turno_actor
    FOREIGN KEY (actor_usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
