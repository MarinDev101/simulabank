

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
