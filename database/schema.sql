CREATE DATABASE IF NOT EXISTS hiring_system;

CREATE TABLE IF NOT EXISTS candidato (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    correo_electronico VARCHAR(150) UNIQUE NOT NULL,
    anos_experiencia INT NOT NULL CHECK (anos_experiencia >= 0)
);

CREATE TABLE IF NOT EXISTS vacante (
    id SERIAL PRIMARY KEY,
    titulo_cargo VARCHAR(150) NOT NULL,
    anos_minimos_experiencia INT NOT NULL CHECK (anos_minimos_experiencia >= 0),
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('OPEN', 'CLOSED'))
);

CREATE TABLE IF NOT EXISTS postulacion (
    id SERIAL PRIMARY KEY,
    candidato_id INT NOT NULL,
    vacante_id INT NOT NULL,
    carta_presentacion TEXT NOT NULL,
    fuente VARCHAR(30) NOT NULL CHECK (fuente IN ('REFERRAL', 'INTERNAL', 'JOB_BOARD', 'OTHER')),
    puntaje INT NOT NULL CHECK (puntaje >= 0),
    prioridad VARCHAR(20) NOT NULL CHECK (prioridad IN ('LOW', 'MEDIUM', 'HIGH', 'TOP')),
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('RECEIVED', 'IN_REVIEW', 'REJECTED', 'HIRED')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_ultima_actualizacion_estado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_postulacion_candidato FOREIGN KEY (candidato_id) REFERENCES candidato(id) ON DELETE CASCADE,
    CONSTRAINT fk_postulacion_vacante FOREIGN KEY (vacante_id) REFERENCES vacante(id) ON DELETE CASCADE
);

-- Datos de prueba
-- Al menos tres candidatos y dos vacantes, una de ellas en estado CLOSED.

INSERT INTO candidato (nombre, correo_electronico, anos_experiencia) VALUES
('Ana Gómez', 'ana.gomez@example.com', 4),
('Carlos Pérez', 'carlos.perez@example.com', 1),
('Lucía Torres', 'lucia.torres@example.com', 5);

INSERT INTO vacante (titulo_cargo, anos_minimos_experiencia, estado) VALUES
('Desarrollador Backend Node.js Junior', 2, 'OPEN'),
('Arquitecto de Software Senior', 5, 'CLOSED');