-- Crear base de datos
CREATE DATABASE IF NOT EXISTS crud_angular;
-- Usar la base de datos
USE crud_angular;

-- Crear tabla personas
CREATE TABLE IF NOT EXISTS personas (
	id_persona INT AUTO_INCREMENT PRIMARY KEY,
	nombre VARCHAR(100),
	apellido VARCHAR(100),
  tipo_identificacion VARCHAR(50),
  nuip INT,
  email VARCHAR(100),
  clave VARCHAR(500),
  salario DECIMAL(10,2),
  activo BOOLEAN DEFAULT TRUE,
  fecha_registro DATE DEFAULT (CURRENT_DATE),
  imagen LONGBLOB
);
SELECT * FROM personas;

-- Crear tabla usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100),
  email VARCHAR(100)
);
SELECT * FROM usuarios;

INSERT INTO personas (nombre, apellido, tipo_identificacion, nuip, email, clave, salario, activo)
VALUES ('Test', 'User', 'CC', 123456, 'test@test.com', 'password', 1000.50, 1);