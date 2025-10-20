


-- Tabla de políticas y normativas
CREATE TABLE politicas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    contenido TEXT NOT NULL,
    tipo ENUM('plataforma', 'banco_simulado') NOT NULL,
    version VARCHAR(20) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- =================================================================
-- TABLA: mensajes_simulacion
-- Descripción: Mensajes del chat de la simulación
-- =================================================================
CREATE TABLE mensajes_simulacion (

    emisor ENUM('aprendiz', 'cliente_ia') NOT NULL,


    contenido_texto TEXT,


    etapa_asesoria ENUM('saludo', 'identificacion_necesidades', 'presentacion_producto', 'manejo_objeciones', 'cierre') NOT NULL,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mensaje TEXT NOT NULL,


);

-- =================================================================
-- TABLA: simulaciones
-- Descripción: Registro de simulaciones realizadas
-- =================================================================
CREATE TABLE simulaciones (

    estado ENUM('en_progreso', 'completada', 'abandonada') DEFAULT 'en_progreso',
    etapa_actual ENUM('saludo', 'identificacion_necesidades', 'presentacion_producto', 'manejo_objeciones', 'cierre') DEFAULT 'saludo',

    puntuacion_final DECIMAL(5,2) NULL, -- Del 0.00 al 100.00
    estado ENUM('en_progreso', 'completada', 'calificada', 'archivada') DEFAULT 'en_progreso',
resultado_final TEXT,

);
