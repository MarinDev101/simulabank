CREATE DATABASE  IF NOT EXISTS `simulabank` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `simulabank`;
-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: simulabank
-- ------------------------------------------------------
-- Server version	9.2.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `administradores`
--

DROP TABLE IF EXISTS `administradores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `administradores` (
  `id_administrador` int NOT NULL,
  PRIMARY KEY (`id_administrador`),
  CONSTRAINT `administradores_ibfk_1` FOREIGN KEY (`id_administrador`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_admin_unico_rol` BEFORE INSERT ON `administradores` FOR EACH ROW BEGIN
    IF NEW.id_administrador IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'id_administrador no puede ser NULL';
    END IF;

    IF EXISTS (SELECT 1 FROM instructores WHERE id_instructor = NEW.id_administrador)
       OR EXISTS (SELECT 1 FROM aprendices WHERE id_aprendiz = NEW.id_administrador) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Este usuario ya tiene otro rol';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `aprendices`
--

DROP TABLE IF EXISTS `aprendices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `aprendices` (
  `id_aprendiz` int NOT NULL,
  PRIMARY KEY (`id_aprendiz`),
  CONSTRAINT `aprendices_ibfk_1` FOREIGN KEY (`id_aprendiz`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_aprendiz_unico_rol` BEFORE INSERT ON `aprendices` FOR EACH ROW BEGIN
    IF NEW.id_aprendiz IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'id_aprendiz no puede ser NULL';
    END IF;

    IF EXISTS (SELECT 1 FROM instructores WHERE id_instructor = NEW.id_aprendiz)
       OR EXISTS (SELECT 1 FROM administradores WHERE id_administrador = NEW.id_aprendiz) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Este usuario ya tiene otro rol';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `aprendices_logros`
--

DROP TABLE IF EXISTS `aprendices_logros`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `aprendices_logros` (
  `id_aprendiz` int NOT NULL,
  `id_logro` int NOT NULL,
  `fecha_desbloqueo` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_aprendiz`,`id_logro`),
  KEY `id_logro` (`id_logro`),
  CONSTRAINT `aprendices_logros_ibfk_1` FOREIGN KEY (`id_aprendiz`) REFERENCES `aprendices` (`id_aprendiz`) ON DELETE CASCADE,
  CONSTRAINT `aprendices_logros_ibfk_2` FOREIGN KEY (`id_logro`) REFERENCES `logros` (`id_logro`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `carpetas_personales`
--

DROP TABLE IF EXISTS `carpetas_personales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carpetas_personales` (
  `id_carpeta_personal` int NOT NULL AUTO_INCREMENT,
  `id_aprendiz` int NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_carpeta_personal`),
  KEY `id_aprendiz` (`id_aprendiz`),
  CONSTRAINT `carpetas_personales_ibfk_1` FOREIGN KEY (`id_aprendiz`) REFERENCES `aprendices` (`id_aprendiz`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `carpetas_salas_vistas_aprendices`
--

DROP TABLE IF EXISTS `carpetas_salas_vistas_aprendices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carpetas_salas_vistas_aprendices` (
  `id_carpeta_sala_vista_aprendiz` int NOT NULL AUTO_INCREMENT,
  `id_sala_aprendiz` int NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_carpeta_sala_vista_aprendiz`),
  KEY `id_sala_aprendiz` (`id_sala_aprendiz`),
  CONSTRAINT `carpetas_salas_vistas_aprendices_ibfk_1` FOREIGN KEY (`id_sala_aprendiz`) REFERENCES `salas_aprendices` (`id_sala_aprendiz`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `carpetas_salas_vistas_instructores`
--

DROP TABLE IF EXISTS `carpetas_salas_vistas_instructores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carpetas_salas_vistas_instructores` (
  `id_carpeta_sala_vista_instructor` int NOT NULL AUTO_INCREMENT,
  `id_sala_aprendiz` int NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_carpeta_sala_vista_instructor`),
  KEY `id_sala_aprendiz` (`id_sala_aprendiz`),
  CONSTRAINT `carpetas_salas_vistas_instructores_ibfk_1` FOREIGN KEY (`id_sala_aprendiz`) REFERENCES `salas_aprendices` (`id_sala_aprendiz`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `clientes_simulados`
--

DROP TABLE IF EXISTS `clientes_simulados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes_simulados` (
  `id_cliente_simulado` int NOT NULL AUTO_INCREMENT,
  `id_simulacion` int NOT NULL,
  `genero` enum('hombre','mujer') NOT NULL,
  `urlAvatar` varchar(80) DEFAULT NULL,
  `nombre` varchar(255) NOT NULL,
  `edad` varchar(50) NOT NULL,
  `profesion` varchar(255) NOT NULL,
  `situacion_actual` text NOT NULL,
  `motivacion` text NOT NULL,
  `nivel_conocimiento` varchar(255) NOT NULL,
  `perfil_riesgo` varchar(255) NOT NULL,
  `objetivo` text NOT NULL,
  `escenario_narrativo` text NOT NULL,
  `id_tipo_cliente` int DEFAULT NULL,
  `id_perfil_cliente` int DEFAULT NULL,
  PRIMARY KEY (`id_cliente_simulado`),
  UNIQUE KEY `id_simulacion` (`id_simulacion`),
  KEY `id_tipo_cliente` (`id_tipo_cliente`),
  KEY `id_perfil_cliente` (`id_perfil_cliente`),
  CONSTRAINT `clientes_simulados_ibfk_1` FOREIGN KEY (`id_simulacion`) REFERENCES `simulaciones` (`id_simulacion`) ON DELETE CASCADE,
  CONSTRAINT `clientes_simulados_ibfk_2` FOREIGN KEY (`id_tipo_cliente`) REFERENCES `tipos_clientes` (`id_tipo_cliente`) ON DELETE RESTRICT,
  CONSTRAINT `clientes_simulados_ibfk_3` FOREIGN KEY (`id_perfil_cliente`) REFERENCES `perfiles_clientes` (`id_perfil_cliente`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codigos_verificacion`
--

DROP TABLE IF EXISTS `codigos_verificacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codigos_verificacion` (
  `id_codigo_verificacion` int NOT NULL AUTO_INCREMENT,
  `correo_electronico` varchar(255) NOT NULL,
  `codigo` varchar(6) NOT NULL,
  `nombres` varchar(100) DEFAULT NULL,
  `apellidos` varchar(100) DEFAULT NULL,
  `contrasena_hash` varchar(255) DEFAULT NULL,
  `tipo` enum('registro','recuperacion') NOT NULL DEFAULT 'registro',
  `intentos` int DEFAULT '0',
  `usado` tinyint(1) DEFAULT '0',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_expiracion` timestamp NOT NULL,
  PRIMARY KEY (`id_codigo_verificacion`),
  KEY `idx_tipo_correo` (`tipo`,`correo_electronico`),
  KEY `idx_correo_codigo` (`correo_electronico`,`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `etapas_conversacion`
--

DROP TABLE IF EXISTS `etapas_conversacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `etapas_conversacion` (
  `id_etapa_conversacion` int NOT NULL AUTO_INCREMENT,
  `id_producto_bancario` int NOT NULL,
  `numero_orden` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `objetivo` text NOT NULL,
  `quien_inicia` enum('Asesor','Cliente') NOT NULL,
  `validaciones` json NOT NULL,
  `sugerencias_aprendizaje` json NOT NULL,
  `instrucciones_ia_cliente` json NOT NULL,
  PRIMARY KEY (`id_etapa_conversacion`),
  UNIQUE KEY `uq_producto_orden` (`id_producto_bancario`,`numero_orden`),
  CONSTRAINT `etapas_conversacion_ibfk_1` FOREIGN KEY (`id_producto_bancario`) REFERENCES `productos_bancarios` (`id_producto_bancario`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `evidencias_personales`
--

DROP TABLE IF EXISTS `evidencias_personales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evidencias_personales` (
  `id_simulacion` int NOT NULL,
  `id_carpeta_personal` int DEFAULT NULL,
  `numero_evidencia` int NOT NULL,
  `fecha_agregado` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` enum('visible','archivada') DEFAULT 'visible',
  `peso_pdf_kb` bigint DEFAULT NULL,
  PRIMARY KEY (`id_simulacion`),
  KEY `id_carpeta_personal` (`id_carpeta_personal`),
  CONSTRAINT `evidencias_personales_ibfk_1` FOREIGN KEY (`id_simulacion`) REFERENCES `simulaciones` (`id_simulacion`) ON DELETE CASCADE,
  CONSTRAINT `evidencias_personales_ibfk_2` FOREIGN KEY (`id_carpeta_personal`) REFERENCES `carpetas_personales` (`id_carpeta_personal`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `evidencias_salas_vistas_aprendices`
--

DROP TABLE IF EXISTS `evidencias_salas_vistas_aprendices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evidencias_salas_vistas_aprendices` (
  `id_simulacion` int NOT NULL,
  `id_sala_aprendiz` int NOT NULL,
  `id_carpeta_sala_vista_aprendiz` int DEFAULT NULL,
  `estado` enum('no_revisada','revisada','archivada') DEFAULT 'no_revisada',
  `calificacion` json DEFAULT NULL,
  `aprobada` tinyint(1) DEFAULT NULL,
  `porcentaje` decimal(5,2) DEFAULT NULL,
  `fecha_entrega` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_revision` timestamp NULL DEFAULT NULL,
  `fecha_archivado` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_simulacion`),
  KEY `id_sala_aprendiz` (`id_sala_aprendiz`),
  KEY `id_carpeta_sala_vista_aprendiz` (`id_carpeta_sala_vista_aprendiz`),
  CONSTRAINT `evidencias_salas_vistas_aprendices_ibfk_1` FOREIGN KEY (`id_simulacion`) REFERENCES `simulaciones` (`id_simulacion`) ON DELETE CASCADE,
  CONSTRAINT `evidencias_salas_vistas_aprendices_ibfk_2` FOREIGN KEY (`id_sala_aprendiz`) REFERENCES `salas_aprendices` (`id_sala_aprendiz`) ON DELETE CASCADE,
  CONSTRAINT `evidencias_salas_vistas_aprendices_ibfk_3` FOREIGN KEY (`id_carpeta_sala_vista_aprendiz`) REFERENCES `carpetas_salas_vistas_aprendices` (`id_carpeta_sala_vista_aprendiz`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `evidencias_salas_vistas_instructores`
--

DROP TABLE IF EXISTS `evidencias_salas_vistas_instructores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evidencias_salas_vistas_instructores` (
  `id_simulacion` int NOT NULL,
  `id_sala_aprendiz` int NOT NULL,
  `id_carpeta_sala_vista_instructor` int DEFAULT NULL,
  `estado` enum('no_revisada','revisada','archivada') DEFAULT 'no_revisada',
  `calificacion` json DEFAULT NULL,
  `aprobada` tinyint(1) DEFAULT NULL,
  `porcentaje` decimal(5,2) DEFAULT NULL,
  `fecha_entrega` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_revision` timestamp NULL DEFAULT NULL,
  `fecha_archivado` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_simulacion`),
  KEY `id_sala_aprendiz` (`id_sala_aprendiz`),
  KEY `id_carpeta_sala_vista_instructor` (`id_carpeta_sala_vista_instructor`),
  CONSTRAINT `evidencias_salas_vistas_instructores_ibfk_1` FOREIGN KEY (`id_simulacion`) REFERENCES `simulaciones` (`id_simulacion`) ON DELETE CASCADE,
  CONSTRAINT `evidencias_salas_vistas_instructores_ibfk_2` FOREIGN KEY (`id_sala_aprendiz`) REFERENCES `salas_aprendices` (`id_sala_aprendiz`) ON DELETE CASCADE,
  CONSTRAINT `evidencias_salas_vistas_instructores_ibfk_3` FOREIGN KEY (`id_carpeta_sala_vista_instructor`) REFERENCES `carpetas_salas_vistas_instructores` (`id_carpeta_sala_vista_instructor`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `instructores`
--

DROP TABLE IF EXISTS `instructores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `instructores` (
  `id_instructor` int NOT NULL,
  PRIMARY KEY (`id_instructor`),
  CONSTRAINT `instructores_ibfk_1` FOREIGN KEY (`id_instructor`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_instructor_unico_rol` BEFORE INSERT ON `instructores` FOR EACH ROW BEGIN
    IF NEW.id_instructor IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'id_instructor no puede ser NULL';
    END IF;

    IF EXISTS (SELECT 1 FROM aprendices WHERE id_aprendiz = NEW.id_instructor)
       OR EXISTS (SELECT 1 FROM administradores WHERE id_administrador = NEW.id_instructor) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Este usuario ya tiene otro rol';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `logros`
--

DROP TABLE IF EXISTS `logros`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `logros` (
  `id_logro` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `imagen` text NOT NULL,
  `descripcion` text NOT NULL,
  `criterios_desbloqueo` json NOT NULL,
  `condicion_tipo` enum('simulaciones_completadas','simulaciones_evaluativas','simulaciones_agrupadas') NOT NULL,
  PRIMARY KEY (`id_logro`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `perfiles_clientes`
--

DROP TABLE IF EXISTS `perfiles_clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `perfiles_clientes` (
  `id_perfil_cliente` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `tipo_cliente` text NOT NULL,
  `rango_cop` text NOT NULL,
  `enfoque_atencion` text NOT NULL,
  PRIMARY KEY (`id_perfil_cliente`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `perfiles_productos`
--

DROP TABLE IF EXISTS `perfiles_productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `perfiles_productos` (
  `id_perfil_cliente` int NOT NULL,
  `id_producto_bancario` int NOT NULL,
  PRIMARY KEY (`id_perfil_cliente`,`id_producto_bancario`),
  KEY `id_producto_bancario` (`id_producto_bancario`),
  CONSTRAINT `perfiles_productos_ibfk_1` FOREIGN KEY (`id_perfil_cliente`) REFERENCES `perfiles_clientes` (`id_perfil_cliente`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `perfiles_productos_ibfk_2` FOREIGN KEY (`id_producto_bancario`) REFERENCES `productos_bancarios` (`id_producto_bancario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `productos_bancarios`
--

DROP TABLE IF EXISTS `productos_bancarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productos_bancarios` (
  `id_producto_bancario` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `categoria` enum('Captacion','Colocacion') NOT NULL,
  `concepto` text NOT NULL,
  `caracteristicas` json NOT NULL,
  `beneficios` json NOT NULL,
  `requisitos` json NOT NULL,
  PRIMARY KEY (`id_producto_bancario`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `salas`
--

DROP TABLE IF EXISTS `salas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salas` (
  `id_sala` int NOT NULL AUTO_INCREMENT,
  `id_instructor` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text,
  `imagen_representativa` varchar(500) DEFAULT NULL,
  `codigo_acceso` varchar(20) NOT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_sala`),
  UNIQUE KEY `codigo_acceso` (`codigo_acceso`),
  KEY `id_instructor` (`id_instructor`),
  CONSTRAINT `salas_ibfk_1` FOREIGN KEY (`id_instructor`) REFERENCES `instructores` (`id_instructor`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `salas_aprendices`
--

DROP TABLE IF EXISTS `salas_aprendices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salas_aprendices` (
  `id_sala_aprendiz` int NOT NULL AUTO_INCREMENT,
  `id_sala` int NOT NULL,
  `id_aprendiz` int NOT NULL,
  `fecha_asignacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_sala_aprendiz`),
  UNIQUE KEY `id_aprendiz` (`id_aprendiz`),
  KEY `id_sala` (`id_sala`),
  CONSTRAINT `salas_aprendices_ibfk_1` FOREIGN KEY (`id_sala`) REFERENCES `salas` (`id_sala`) ON DELETE CASCADE,
  CONSTRAINT `salas_aprendices_ibfk_2` FOREIGN KEY (`id_aprendiz`) REFERENCES `aprendices` (`id_aprendiz`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sesiones_usuarios`
--

DROP TABLE IF EXISTS `sesiones_usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sesiones_usuarios` (
  `id_sesion_usuario` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `token_sesion` varchar(255) NOT NULL,
  `user_agent` text,
  `activa` tinyint(1) DEFAULT '1',
  `fecha_inicio` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_ultimo_acceso` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `fecha_cierre` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_sesion_usuario`),
  UNIQUE KEY `token_sesion` (`token_sesion`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `sesiones_usuarios_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=130 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `simulaciones`
--

DROP TABLE IF EXISTS `simulaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `simulaciones` (
  `id_simulacion` int NOT NULL AUTO_INCREMENT,
  `id_aprendiz` int NOT NULL,
  `id_producto_bancario` int NOT NULL,
  `producto_seleccion` enum('especifico','aleatorio') NOT NULL,
  `modo` enum('aprendizaje','evaluativo') NOT NULL,
  `sonido_interaccion` enum('automatico','manual') NOT NULL,
  `destino_evidencia` enum('personal','sala') NOT NULL,
  `perfil_cliente` json NOT NULL,
  `aspectos_clave_registrados` json NOT NULL,
  `conversacion_asesoria` json NOT NULL,
  `recomendaciones_aprendizaje_ia` json DEFAULT NULL,
  `analisis_desempeno` text,
  `tiempo_duracion_segundos` int DEFAULT '0',
  `etapa_actual_index` int DEFAULT '0',
  `estado` enum('en_proceso','finalizada','pausada') DEFAULT 'en_proceso',
  `fecha_inicio` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_ultima_interaccion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `fecha_finalizacion` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_simulacion`),
  KEY `id_aprendiz` (`id_aprendiz`),
  KEY `id_producto_bancario` (`id_producto_bancario`),
  CONSTRAINT `simulaciones_ibfk_1` FOREIGN KEY (`id_aprendiz`) REFERENCES `aprendices` (`id_aprendiz`) ON DELETE CASCADE,
  CONSTRAINT `simulaciones_ibfk_2` FOREIGN KEY (`id_producto_bancario`) REFERENCES `productos_bancarios` (`id_producto_bancario`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `solicitudes_salas`
--

DROP TABLE IF EXISTS `solicitudes_salas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitudes_salas` (
  `id_solicitud_sala` int NOT NULL AUTO_INCREMENT,
  `id_aprendiz` int NOT NULL,
  `id_sala` int NOT NULL,
  `estado` enum('en_espera','aceptado','rechazado','expulsado') DEFAULT 'en_espera',
  `fecha_solicitud` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_solicitud_sala`),
  UNIQUE KEY `uq_solicitud_unica` (`id_aprendiz`,`id_sala`),
  KEY `fk_solicitudes_sala` (`id_sala`),
  CONSTRAINT `fk_solicitudes_aprendiz` FOREIGN KEY (`id_aprendiz`) REFERENCES `aprendices` (`id_aprendiz`) ON DELETE CASCADE,
  CONSTRAINT `fk_solicitudes_sala` FOREIGN KEY (`id_sala`) REFERENCES `salas` (`id_sala`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tipos_clientes`
--

DROP TABLE IF EXISTS `tipos_clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipos_clientes` (
  `id_tipo_cliente` int NOT NULL AUTO_INCREMENT,
  `tipo` varchar(100) NOT NULL,
  `actua` text NOT NULL,
  `ejemplo` text NOT NULL,
  PRIMARY KEY (`id_tipo_cliente`),
  UNIQUE KEY `tipo` (`tipo`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `correo_electronico` varchar(255) NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  `nombres` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `foto_perfil` mediumtext,
  `fecha_nacimiento` date DEFAULT NULL,
  `genero` enum('masculino','femenino','otro') DEFAULT NULL,
  `preferencia_tema` enum('claro','oscuro','auto') DEFAULT 'auto',
  `estado` enum('activo','inactivo') DEFAULT 'activo',
  `ultimo_acceso` timestamp NULL DEFAULT NULL,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `correo_electronico` (`correo_electronico`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping events for database 'simulabank'
--

--
-- Dumping routines for database 'simulabank'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-04  2:17:56
