CREATE DATABASE  IF NOT EXISTS `tienda_bicicletas` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `tienda_bicicletas`;
-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: tienda_bicicletas
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
-- Table structure for table `detalles_venta`
--

DROP TABLE IF EXISTS `detalles_venta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalles_venta` (
  `id_detalle_venta` int NOT NULL AUTO_INCREMENT,
  `cantidad_producto` int NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `id_producto` int DEFAULT NULL,
  `id_venta` int DEFAULT NULL,
  PRIMARY KEY (`id_detalle_venta`),
  KEY `id_producto` (`id_producto`),
  KEY `id_venta` (`id_venta`),
  CONSTRAINT `detalles_venta_ibfk_1` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`),
  CONSTRAINT `detalles_venta_ibfk_2` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id_venta`),
  CONSTRAINT `detalles_venta_chk_1` CHECK ((`cantidad_producto` > 0)),
  CONSTRAINT `detalles_venta_chk_2` CHECK ((`precio_unitario` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalles_venta`
--

LOCK TABLES `detalles_venta` WRITE;
/*!40000 ALTER TABLE `detalles_venta` DISABLE KEYS */;
INSERT INTO `detalles_venta` VALUES (1,15,3899000.00,8,1),(2,15,149000.00,3,1),(3,1,1299000.00,2,1),(4,11,189000.00,18,1),(5,15,129000.00,4,2),(6,2,359000.00,21,3),(7,12,629000.00,23,3),(8,3,3499000.00,5,4),(9,3,149000.00,3,5),(10,1,149000.00,3,6);
/*!40000 ALTER TABLE `detalles_venta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `marcas`
--

DROP TABLE IF EXISTS `marcas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `marcas` (
  `id_marca` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) DEFAULT NULL,
  `logo` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_marca`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `marcas`
--

LOCK TABLES `marcas` WRITE;
/*!40000 ALTER TABLE `marcas` DISABLE KEYS */;
INSERT INTO `marcas` VALUES (1,'CAMPAGNOLO','1751946778216-713488680.svg'),(2,'CANNONDALE','1751946787375-898496405.svg'),(3,'CASTELLI','1751946794798-606810188.svg'),(4,'CRANKBROTHERS','1751946800798-701630808.svg'),(5,'GIANT','1751946806782-106361890.svg'),(6,'MERIDA','1751946812735-323551891.svg'),(7,'PINARELLO','1751946818175-410931603.svg'),(8,'SCOTT','1751946826270-182254324.svg'),(9,'SHIMANO','1751946839670-51855957.svg'),(10,'SPECIALIZED','1751946844702-635067166.svg'),(11,'SRAM','1751946849470-683532119.svg'),(13,'TREK','1751946872453-352993604.svg');
/*!40000 ALTER TABLE `marcas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pqrs`
--

DROP TABLE IF EXISTS `pqrs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pqrs` (
  `id_pqrs` int NOT NULL AUTO_INCREMENT,
  `tipo` enum('peticion','queja','reclamo','sugerencia') NOT NULL,
  `detalle` text NOT NULL,
  `estado` enum('pendiente','resuelto') DEFAULT 'pendiente',
  `fecha_pqrs` datetime DEFAULT CURRENT_TIMESTAMP,
  `id_usuario` int DEFAULT NULL,
  PRIMARY KEY (`id_pqrs`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `pqrs_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pqrs`
--

LOCK TABLES `pqrs` WRITE;
/*!40000 ALTER TABLE `pqrs` DISABLE KEYS */;
INSERT INTO `pqrs` VALUES (2,'queja','Asunto: Inconformidad con la atencin en tiendaHola equipo de BikeStore,Les escribo para expresar mi inconformidad por la atencin que recib en su tienda fsica el pasado [fecha]. Esper ms de 20 minutos sin que nadie me atendiera, a pesar de que el lugar no estaba lleno. Me pareci una falta de organizacin.Espero puedan mejorar este aspecto.[Sebastian]','pendiente','2025-07-07 23:24:35',1),(3,'reclamo','Asunto: Pedido retrasado sin informacinBuenas tardes,Realic un pedido en su tienda online el da [fecha], con numero de orden XXXX, pero an no lo he recibido y no he recibido actualizaciones del estado del envo. Se supona que llegara en 5 das hbiles.Solicito informacin urgente sobre mi pedido.Gracias,[SEBASTIAN]','pendiente','2025-07-07 23:25:20',1),(4,'sugerencia','Asunto: Mejora en el seguimiento de pedidosHola BikeStore,Sugiero mejorar el sistema de seguimiento de pedidos en su pagina web. Actualmente es muy limitado y no muestra informacin clara ni actualizada sobre el estado del envo. Un panel ms detallado ayudara mucho.Gracias por su atencin,[SEBASTIAN]','resuelto','2025-07-07 23:25:47',1);
/*!40000 ALTER TABLE `pqrs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productos`
--

DROP TABLE IF EXISTS `productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productos` (
  `id_producto` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `precio_venta` decimal(10,2) NOT NULL,
  `descripcion` varchar(500) DEFAULT NULL,
  `destacado` tinyint(1) DEFAULT '0',
  `imagen` varchar(255) DEFAULT NULL,
  `categoria` varchar(100) DEFAULT NULL,
  `id_marca` int DEFAULT NULL,
  PRIMARY KEY (`id_producto`),
  KEY `id_marca` (`id_marca`),
  CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`id_marca`) REFERENCES `marcas` (`id_marca`) ON DELETE SET NULL,
  CONSTRAINT `productos_chk_1` CHECK ((`precio_venta` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
INSERT INTO `productos` VALUES (2,'Garmin Edge 530',1299000.00,'Computador GPS de ciclismo con pantalla a color de 2.6\", seguimiento en tiempo real, navegación paso a paso, análisis de rendimiento y compatibilidad con sensores externos (velocidad, cadencia. ETC)',1,'1751947009779-92374832.png','accesorios',1),(3,'Luces LED recargables Knog Blinder Mini',149000.00,'Set de luces LED ultrabrillantes, resistentes al agua, con carga USB integrada y visibilidad de hasta 800 metros. Múltiples modos de parpadeo, ideal para ciclismo urbano o de carretera.',1,'1751947052058-535564276.png','accesorios',2),(4,'Bomba portátil Topeak RaceRocket',129000.00,'Inflador electrico de aleación de aluminio, compacto y ligero. Compatible con válvulas Presta y Schrader, ideal para llevar en el marco o el bolsillo. Infla hasta 120 psi con facilidad.',1,'1751947134681-651587155.png','accesorios',3),(5,'Trek Marlin 7',3499000.00,'Bicicleta de montaña con cuadro de aluminio, suspensión RockShox, 18 velocidades y frenos de disco hidráulicos. Ideal para cross country y senderos técnicos.',1,'1751947209315-786404240.png','bicicletas',13),(6,'Giant Contend AR 4',4299000.00,'Bicicleta de ruta de aluminio con geometría cómoda, transmisión Shimano Claris y frenos de disco mecánicos. Perfecta para rutas largas en carretera.',1,'1751947250680-146080767.png','bicicletas',5),(7,'Specialized Sirrus 2.0',2799000.00,'Bicicleta urbana híbrida con cuadro ligero, frenos de disco y cambios Shimano de 8 velocidades. Ideal para desplazamientos diarios y ejercicio.',1,'1751947297319-399761264.png','bicicletas',10),(8,'Scott Aspect 950',3899000.00,'MTB de entrada con horquilla Suntour, frenos de disco hidráulicos y ruedas 29\". Buena opción para principiantes en montaña.',0,'1751947353533-210058148.png','bicicletas',8),(9,'Cannondale Trail 5',4499000.00,'Bicicleta de montaña con transmisión Shimano Deore, horquilla de 100 mm con bloqueo y diseño optimizado para senderos exigentes.',1,'1751947397597-477236886.png','bicicletas',2),(10,'Bianchi Via Nirone 7 Claris',5799000.00,'Bicicleta de ruta clásica con cuadro de aluminio y horquilla de carbono. Estilo italiano y comodidad para fondo y entrenamiento.',0,'1751947443252-149298598.png','bicicletas',3),(11,'GW Alligator 3.0',1799000.00,'Bicicleta MTB económica con 21 velocidades, frenos de disco mecánicos y diseño juvenil. Ideal para uso recreativo.',1,'1751947485523-410812284.png','bicicletas',9),(12,'Merida Big Nine 20',3600000.00,'MTB rígida con transmisión Shimano Altus de 18 velocidades, ruedas 29\" y horquilla de 100 mm. Rendimiento confiable a buen precio.',0,'1751947562266-820694639.png','bicicletas',6),(13,'Orbea Vector 153',3999000.00,'Bicicleta urbana con diseño limpio, cuadro de aluminio, transmisión Shimano Acera y frenos hidráulicos. Excelente para la ciudad. :D',1,'1751947618601-679218660.png','bicicletas',13),(14,'Bontrager Starvos WaveCel',599000.00,'Casco de ruta con tecnología WaveCel para mayor protección contra impactos rotacionales. Ligero, ventilado y con sistema de ajuste BOA.',1,'1751947760494-11844216.png','indumentarias',4),(15,'Giro Fixture MIPS',429000.00,'Casco MTB con sistema MIPS para protección cerebral. Diseño robusto, visera integrada y excelente ventilación.',0,'1751947821046-530447145.png','indumentarias',13),(16,'Oakley Sutro Prizm Road',789000.00,'Gafas deportivas con lentes Prizm que mejoran el contraste en la carretera. Diseño envolvente y protección UV total.',1,'1751947858780-292935348.png','indumentarias',11),(17,'RockBros Fotocromáticas',159000.00,'Gafas con lentes que se adaptan a la luz solar. Ligeras, con protección UV400 y antideslizantes.',1,'1751947888700-162200915.png','indumentarias',8),(18,'Fox Ranger Full Finger RED',189000.00,'Guantes largos ideales para MTB. Palma acolchada, agarre antideslizante y compatibilidad con pantallas táctiles.',1,'1751947942076-990404441.png','indumentarias',2),(19,'Fox Ranger Full Finger BLUE',129000.00,'Guantes cortos con gel en la palma para mayor confort. Transpirables y con cierre de velcro.',1,'1751947981787-370372241.png','indumentarias',2),(20,'Maillot Specialized RBX Comp',299000.00,'Camiseta de ciclismo con tejido transpirable, tres bolsillos traseros y corte ajustado para ruta.',1,'1751948019675-848614869.png','indumentarias',10),(21,'Culotte Castelli Entrata Bibshort',359000.00,'Pantaloneta con tirantes, badana de gel y ajuste ergonómico. Ideal para recorridos largos.',1,'1751948058706-882925200.png','indumentarias',NULL),(23,'Fizik Terra X5',629000.00,'Zapatillas MTB con ajuste BOA y suela de goma para tracción en terrenos complicados. Ligeras y resistentes.',1,'1751948127009-154383980.png','indumentarias',7);
/*!40000 ALTER TABLE `productos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stocks`
--

DROP TABLE IF EXISTS `stocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stocks` (
  `id_stock` int NOT NULL AUTO_INCREMENT,
  `stock` int NOT NULL,
  `stock_minimo` int NOT NULL DEFAULT '0',
  `estado` enum('disponible','agotado') DEFAULT 'disponible',
  `fecha_actualizacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `id_producto` int DEFAULT NULL,
  PRIMARY KEY (`id_stock`),
  UNIQUE KEY `id_producto` (`id_producto`),
  CONSTRAINT `stocks_ibfk_1` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`) ON DELETE CASCADE,
  CONSTRAINT `stocks_chk_1` CHECK ((`stock` >= 0)),
  CONSTRAINT `stocks_chk_2` CHECK ((`stock_minimo` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stocks`
--

LOCK TABLES `stocks` WRITE;
/*!40000 ALTER TABLE `stocks` DISABLE KEYS */;
INSERT INTO `stocks` VALUES (2,14,5,'disponible','2025-07-07 23:44:43',2),(3,4,5,'agotado','2025-07-07 23:51:51',3),(4,0,5,'agotado','2025-07-07 23:45:51',4),(5,12,5,'disponible','2025-07-07 23:47:10',5),(6,15,5,'disponible','2025-07-07 23:18:20',6),(7,15,5,'disponible','2025-07-07 23:18:25',7),(8,0,5,'agotado','2025-07-07 23:44:43',8),(9,15,5,'disponible','2025-07-07 23:18:34',9),(10,15,5,'disponible','2025-07-07 23:18:39',10),(11,15,5,'disponible','2025-07-07 23:18:44',11),(12,15,5,'disponible','2025-07-07 23:18:48',12),(13,15,5,'disponible','2025-07-07 23:18:54',13),(14,15,5,'disponible','2025-07-07 23:18:58',14),(15,15,5,'disponible','2025-07-07 23:19:03',15),(16,15,5,'disponible','2025-07-07 23:19:07',16),(17,15,5,'disponible','2025-07-07 23:19:14',17),(18,4,5,'agotado','2025-07-07 23:44:43',18),(19,15,5,'disponible','2025-07-07 23:19:23',19),(20,15,5,'disponible','2025-07-07 23:19:29',20),(21,13,5,'disponible','2025-07-07 23:46:47',21),(23,3,5,'agotado','2025-07-07 23:46:47',23);
/*!40000 ALTER TABLE `stocks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `telefono` varchar(20) NOT NULL,
  `correo` varchar(100) NOT NULL,
  `contraseña` varchar(255) NOT NULL,
  `rol` enum('cliente','admin','super_usuario') DEFAULT 'cliente',
  `fecha_registro` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `telefono` (`telefono`),
  UNIQUE KEY `correo` (`correo`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Sebastiann','Marinn','3206501238','sebastianmarinv5@gmail.com','$2b$10$adf995ukVUsw8ogQvmK5/OZStQFG6dR7FtXq7cTmJB5F/ioKPWsKK','cliente','2025-07-07 21:58:31'),(2,'Deyko','Rat','3234567890','deykorat12345@gmail.com','$2b$10$.AKRw1zYEi2R8tVqb4P2YuwcvJooWWbr5ZWww4FNfF/x/KJiN.vPG','super_usuario','2025-07-07 21:59:34'),(3,'Freddy','VegaSS','3134356789','freddyvega@gmail.com','$2b$10$8zIaz1WYLFVZxKzq6mffbOfRKC4ROQoOCuPGJrRhVA2IkGfXPvUuG','cliente','2025-07-07 23:29:58'),(4,'Maicol','Dazaa','3133133133','maicoldaza46@gmail.com','$2b$10$jTWHVsZ3qop6QqjkotF5H.Rm/piChO4xTHnzizNoGhEN6drVdKJ1e','admin','2025-07-07 23:30:50');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ventas`
--

DROP TABLE IF EXISTS `ventas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ventas` (
  `id_venta` int NOT NULL AUTO_INCREMENT,
  `cantidad_productos` int NOT NULL,
  `precio_productos` decimal(10,2) NOT NULL,
  `metodo_pago` enum('visa','mastercard','maestro','paypal') NOT NULL,
  `numero_tarjeta` varchar(50) DEFAULT NULL,
  `fecha_venta` datetime DEFAULT CURRENT_TIMESTAMP,
  `id_usuario` int DEFAULT NULL,
  PRIMARY KEY (`id_venta`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `ventas_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `ventas_chk_1` CHECK ((`cantidad_productos` > 0)),
  CONSTRAINT `ventas_chk_2` CHECK ((`precio_productos` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ventas`
--

LOCK TABLES `ventas` WRITE;
/*!40000 ALTER TABLE `ventas` DISABLE KEYS */;
INSERT INTO `ventas` VALUES (1,42,64098000.00,'paypal','3434565678788888','2025-07-07 23:44:43',1),(2,15,1935000.00,'mastercard','1111111111111111','2025-07-07 23:45:51',1),(3,14,8266000.00,'mastercard','4444444444444444','2025-07-07 23:46:47',3),(4,3,10497000.00,'mastercard','3333333333333333','2025-07-07 23:47:10',3),(5,3,447000.00,'maestro','3333333333333333','2025-07-07 23:51:27',1),(6,1,149000.00,'maestro','3333333333333333','2025-07-07 23:51:51',1);
/*!40000 ALTER TABLE `ventas` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-08  0:35:01
