CREATE DATABASE IF NOT EXISTS simulabank
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE simulabank;

CREATE TABLE usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  correo_electronico VARCHAR(255) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  foto_perfil VARCHAR(500),
  fecha_nacimiento DATE,
  genero ENUM('masculino', 'femenino', 'otro') DEFAULT NULL,
  preferencia_tema ENUM('claro', 'oscuro', 'auto') DEFAULT 'auto',
  estado ENUM('activo', 'inactivo') DEFAULT 'activo',
  ultimo_acceso TIMESTAMP NULL,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE administradores (
  id_administrador INT NOT NULL PRIMARY KEY,
  FOREIGN KEY (id_administrador) REFERENCES usuarios(id_usuario)
    ON DELETE CASCADE
);

CREATE TABLE instructores (
  id_instructor INT NOT NULL PRIMARY KEY,
  FOREIGN KEY (id_instructor) REFERENCES usuarios(id_usuario)
    ON DELETE CASCADE
);

CREATE TABLE aprendices (
  id_aprendiz INT NOT NULL PRIMARY KEY,
  FOREIGN KEY (id_aprendiz) REFERENCES usuarios(id_usuario)
    ON DELETE CASCADE
);

-- ================================
-- Triggers para garantizar rol único y PK no nula
-- ================================
DELIMITER //

-- Trigger para instructores
CREATE TRIGGER trg_instructor_unico_rol
BEFORE INSERT ON instructores
FOR EACH ROW
BEGIN
    IF NEW.id_instructor IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'id_instructor no puede ser NULL';
    END IF;

    IF EXISTS (SELECT 1 FROM aprendices WHERE id_aprendiz = NEW.id_instructor)
       OR EXISTS (SELECT 1 FROM administradores WHERE id_administrador = NEW.id_instructor) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Este usuario ya tiene otro rol';
    END IF;
END;
//

-- Trigger para aprendices
CREATE TRIGGER trg_aprendiz_unico_rol
BEFORE INSERT ON aprendices
FOR EACH ROW
BEGIN
    IF NEW.id_aprendiz IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'id_aprendiz no puede ser NULL';
    END IF;

    IF EXISTS (SELECT 1 FROM instructores WHERE id_instructor = NEW.id_aprendiz)
       OR EXISTS (SELECT 1 FROM administradores WHERE id_administrador = NEW.id_aprendiz) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Este usuario ya tiene otro rol';
    END IF;
END;
//

-- Trigger para administradores
CREATE TRIGGER trg_admin_unico_rol
BEFORE INSERT ON administradores
FOR EACH ROW
BEGIN
    IF NEW.id_administrador IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'id_administrador no puede ser NULL';
    END IF;

    IF EXISTS (SELECT 1 FROM instructores WHERE id_instructor = NEW.id_administrador)
       OR EXISTS (SELECT 1 FROM aprendices WHERE id_aprendiz = NEW.id_administrador) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Este usuario ya tiene otro rol';
    END IF;
END;
//

DELIMITER ;

CREATE TABLE sesiones_usuarios (
  id_sesion_usuario INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  token_sesion VARCHAR(255) NOT NULL UNIQUE, -- hash del token (no el token original)
  user_agent TEXT,
  activa BOOLEAN DEFAULT TRUE,
  fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_ultimo_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  fecha_cierre TIMESTAMP NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
    ON DELETE CASCADE
);

CREATE TABLE logros (
  id_logro INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  criterio_desbloqueo JSON NOT NULL,
  condicion_tipo ENUM(
    'simulaciones_completadas',
    'simulaciones_aprobadas',
    'simulaciones_evaluativas',
    'simulaciones_aleatorias',
    'simulaciones_agrupadas'
  ) NOT NULL
);

CREATE TABLE aprendices_logros (
  id_aprendiz INT NOT NULL,
  id_logro INT NOT NULL,
  fecha_desbloqueo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_aprendiz, id_logro),
  FOREIGN KEY (id_aprendiz) REFERENCES aprendices(id_aprendiz)
    ON DELETE CASCADE,
  FOREIGN KEY (id_logro) REFERENCES logros(id_logro)
    ON DELETE CASCADE
);

CREATE TABLE salas (
  id_sala INT AUTO_INCREMENT PRIMARY KEY,
  id_instructor INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  imagen_representativa VARCHAR(500),
  codigo_acceso VARCHAR(20) NOT NULL UNIQUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_instructor) REFERENCES instructores(id_instructor)
    ON DELETE CASCADE
);

CREATE TABLE solicitudes_salas (
  id_solicitud_sala INT AUTO_INCREMENT PRIMARY KEY,
  id_aprendiz INT NOT NULL,
  id_sala INT NOT NULL,
  estado ENUM('en_espera', 'aceptado', 'rechazado', 'expulsado') DEFAULT 'en_espera',
  fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_solicitudes_aprendiz FOREIGN KEY (id_aprendiz)
    REFERENCES aprendices(id_aprendiz)
    ON DELETE CASCADE,
  CONSTRAINT fk_solicitudes_sala FOREIGN KEY (id_sala)
    REFERENCES salas(id_sala)
    ON DELETE CASCADE,
  CONSTRAINT uq_solicitud_unica UNIQUE (id_aprendiz, id_sala)
);

CREATE TABLE salas_aprendices (
  id_sala_aprendiz INT AUTO_INCREMENT PRIMARY KEY,
  id_sala INT NOT NULL,
  id_aprendiz INT NOT NULL UNIQUE,
  fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_sala) REFERENCES salas(id_sala)
    ON DELETE CASCADE,
  FOREIGN KEY (id_aprendiz) REFERENCES aprendices(id_aprendiz)
    ON DELETE CASCADE
);

CREATE TABLE productos_bancarios (
  id_producto_bancario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  categoria ENUM('Captacion', 'Colocacion') NOT NULL,
  concepto TEXT NOT NULL,
  caracteristicas JSON NOT NULL,
  beneficios JSON NOT NULL,
  requisitos JSON NOT NULL
);

CREATE TABLE tipos_clientes (
  id_tipo_cliente INT AUTO_INCREMENT PRIMARY KEY,
  tipo VARCHAR(100) NOT NULL UNIQUE,
  actua TEXT NOT NULL,
  ejemplo TEXT NOT NULL
);

CREATE TABLE perfiles_clientes (
  id_perfil_cliente INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  tipo_cliente TEXT NOT NULL,
  rango_cop TEXT NOT NULL,
  enfoque_atencion TEXT NOT NULL
);

CREATE TABLE perfiles_productos (
  id_perfil_cliente INT NOT NULL,
  id_producto_bancario INT NOT NULL,
  PRIMARY KEY (id_perfil_cliente, id_producto_bancario),
  FOREIGN KEY (id_perfil_cliente) REFERENCES perfiles_clientes(id_perfil_cliente)
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (id_producto_bancario) REFERENCES productos_bancarios(id_producto_bancario)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE etapas_conversacion (
  id_etapa_conversacion INT AUTO_INCREMENT PRIMARY KEY,
  id_producto_bancario INT NOT NULL,
  numero_orden INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  objetivo TEXT NOT NULL,
  quien_inicia ENUM('Asesor', 'Cliente') NOT NULL,
  validaciones JSON NOT NULL,
  sugerencias_aprendizaje JSON NOT NULL,
  instrucciones_ia_cliente JSON NOT NULL,
  FOREIGN KEY (id_producto_bancario) REFERENCES productos_bancarios(id_producto_bancario)
    ON DELETE CASCADE,
  CONSTRAINT uq_producto_orden UNIQUE (id_producto_bancario, numero_orden)
);

CREATE TABLE simulaciones (
  id_simulacion INT AUTO_INCREMENT PRIMARY KEY,
  id_aprendiz INT NOT NULL,
  id_producto_bancario INT NOT NULL,
  producto_seleccion ENUM('especifico', 'aleatorio') NOT NULL,
  modo ENUM('aprendizaje', 'evaluativo') NOT NULL,
  sonido_habilitado BOOLEAN DEFAULT TRUE,
  destino_evidencia ENUM('personal', 'sala') NOT NULL,
  perfil_cliente JSON NOT NULL,
  aspectos_clave_registrados JSON NOT NULL,
  conversacion_asesoria JSON NOT NULL,
  recomendaciones_aprendizaje_ia JSON,
  opinion_ia TEXT,
  tiempo_duracion_segundos INT DEFAULT 0,

  -- Control
  etapa_actual_index INT DEFAULT 0,
  estado ENUM('en_proceso', 'finalizada', 'pausada') DEFAULT 'en_proceso',

  -- Tiempos
  fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_ultima_interaccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  fecha_finalizacion TIMESTAMP NULL,

  -- Relaciones
  FOREIGN KEY (id_aprendiz) REFERENCES aprendices(id_aprendiz) ON DELETE CASCADE,
  FOREIGN KEY (id_producto_bancario) REFERENCES productos_bancarios(id_producto_bancario) ON DELETE RESTRICT
);

CREATE TABLE clientes_simulados (
  id_cliente_simulado INT AUTO_INCREMENT PRIMARY KEY,
  id_simulacion INT NOT NULL UNIQUE,  -- Relación 1:1
  genero ENUM('hombre', 'mujer') NOT NULL,
  urlAvatar VARCHAR(80),
  nombre VARCHAR(255) NOT NULL,
  edad VARCHAR(50) NOT NULL,
  profesion VARCHAR(255) NOT NULL,
  situacion_actual TEXT NOT NULL,
  motivacion TEXT NOT NULL,
  nivel_conocimiento VARCHAR(255) NOT NULL,
  perfil_riesgo VARCHAR(255) NOT NULL,
  objetivo TEXT NOT NULL,
  escenario_narrativo TEXT NOT NULL,

  id_tipo_cliente INT NULL,
  id_perfil_cliente INT NULL,

  FOREIGN KEY (id_simulacion) REFERENCES simulaciones(id_simulacion) ON DELETE CASCADE,
  FOREIGN KEY (id_tipo_cliente) REFERENCES tipos_clientes(id_tipo_cliente) ON DELETE RESTRICT,
  FOREIGN KEY (id_perfil_cliente) REFERENCES perfiles_clientes(id_perfil_cliente) ON DELETE RESTRICT
);

CREATE TABLE carpetas_personales (
  id_carpeta_personal INT AUTO_INCREMENT PRIMARY KEY,
  id_aprendiz INT NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_aprendiz) REFERENCES aprendices(id_aprendiz)
    ON DELETE CASCADE
);

CREATE TABLE evidencias_personales (
  id_simulacion INT PRIMARY KEY,
  id_carpeta_personal INT NULL,
  fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_simulacion) REFERENCES simulaciones(id_simulacion)
    ON DELETE CASCADE,
  FOREIGN KEY (id_carpeta_personal) REFERENCES carpetas_personales(id_carpeta_personal)
    ON DELETE SET NULL
);

CREATE TABLE carpetas_salas_vistas_instructores (
  id_carpeta_sala_vista_instructor INT AUTO_INCREMENT PRIMARY KEY,
  id_sala_aprendiz INT NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_sala_aprendiz) REFERENCES salas_aprendices(id_sala_aprendiz)
    ON DELETE CASCADE
);

CREATE TABLE evidencias_salas_vistas_instructores (
  id_simulacion INT PRIMARY KEY,
  id_sala_aprendiz INT NOT NULL,
  id_carpeta_sala_vista_instructor INT NULL,
  estado ENUM('no_revisada', 'revisada', 'archivada') DEFAULT 'no_revisada',
  calificacion JSON NULL,
  aprobada BOOLEAN DEFAULT NULL,
  porcentaje DECIMAL(5,2) DEFAULT NULL,
  fecha_entrega TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_revision TIMESTAMP NULL,
  fecha_archivado TIMESTAMP NULL,
  FOREIGN KEY (id_simulacion) REFERENCES simulaciones(id_simulacion)
    ON DELETE CASCADE,
  FOREIGN KEY (id_sala_aprendiz) REFERENCES salas_aprendices(id_sala_aprendiz)
    ON DELETE CASCADE,
  FOREIGN KEY (id_carpeta_sala_vista_instructor) REFERENCES carpetas_salas_vistas_instructores(id_carpeta_sala_vista_instructor)
    ON DELETE SET NULL
);

CREATE TABLE carpetas_salas_vistas_aprendices (
  id_carpeta_sala_vista_aprendiz INT AUTO_INCREMENT PRIMARY KEY,
  id_sala_aprendiz INT NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_sala_aprendiz) REFERENCES salas_aprendices(id_sala_aprendiz)
    ON DELETE CASCADE
);

CREATE TABLE evidencias_salas_vistas_aprendices (
  id_simulacion INT PRIMARY KEY,
  id_sala_aprendiz INT NOT NULL,
  id_carpeta_sala_vista_aprendiz INT NULL,
  estado ENUM('no_revisada', 'revisada', 'archivada') DEFAULT 'no_revisada',
  calificacion JSON NULL,
  aprobada BOOLEAN DEFAULT NULL,
  porcentaje DECIMAL(5,2) DEFAULT NULL,
  fecha_entrega TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_revision TIMESTAMP NULL,
  fecha_archivado TIMESTAMP NULL,
  FOREIGN KEY (id_simulacion) REFERENCES simulaciones(id_simulacion)
    ON DELETE CASCADE,
  FOREIGN KEY (id_sala_aprendiz) REFERENCES salas_aprendices(id_sala_aprendiz)
    ON DELETE CASCADE,
  FOREIGN KEY (id_carpeta_sala_vista_aprendiz) REFERENCES carpetas_salas_vistas_aprendices(id_carpeta_sala_vista_aprendiz)
    ON DELETE SET NULL
);
