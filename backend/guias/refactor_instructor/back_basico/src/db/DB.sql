CREATE DATABASE futbol_equipos;
USE futbol_equipos;

CREATE TABLE equipos(
    id_equipo INT AUTO_INCREMENT PRIMARY KEY,
    nombre_equipo VARCHAR(100) NOT NULL
);

-- Insert = POST
Insert Into equipos (nombre_equipo)
Values
("Alemania"),
("Holanda"),
("Suecia"),
("Francia"),
("Noruega");

-- Select = GET
Select * From equipos;
