
-- Esquema de base de datos para el sistema de control de jornada
-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS apliumapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE apliumapp;

-- Tabla de roles
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL
);

-- Tabla de departamentos
CREATE TABLE IF NOT EXISTS departamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL
);

-- Tabla de empleados
CREATE TABLE IF NOT EXISTS empleados (
    id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    dni VARCHAR(20) UNIQUE,
    rol_id INT,
    departamento_id INT,
    cargo VARCHAR(100),
    division VARCHAR(100),
    pais VARCHAR(100),
    ciudad VARCHAR(100),
    direccion TEXT,
    codigo_postal VARCHAR(20),
    telefono VARCHAR(20),
    avatar VARCHAR(255),
    dispositivo_autorizado VARCHAR(255),
    ip_autorizada VARCHAR(45),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE SET NULL,
    FOREIGN KEY (departamento_id) REFERENCES departamentos(id) ON DELETE SET NULL
);

-- Tabla de jornadas
CREATE TABLE IF NOT EXISTS jornadas (
    id VARCHAR(36) PRIMARY KEY,
    empleado_id VARCHAR(36) NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio DATETIME,
    hora_fin DATETIME,
    duracion_total INT COMMENT 'Duración en segundos',
    firma TEXT,
    estado ENUM('no_iniciada', 'activa', 'pausada', 'finalizada') DEFAULT 'no_iniciada',
    ip_inicio VARCHAR(45),
    ip_fin VARCHAR(45),
    dispositivo_inicio VARCHAR(255),
    dispositivo_fin VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL,
    FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE
);

-- Tabla de ubicaciones
CREATE TABLE IF NOT EXISTS ubicaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    jornada_id VARCHAR(36) NOT NULL,
    tipo ENUM('inicio', 'fin', 'pausa_inicio', 'pausa_fin') NOT NULL,
    latitud DECIMAL(10, 8) NOT NULL,
    longitud DECIMAL(11, 8) NOT NULL,
    precision_gps DECIMAL(10, 2),
    timestamp DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (jornada_id) REFERENCES jornadas(id) ON DELETE CASCADE
);

-- Tabla de pausas
CREATE TABLE IF NOT EXISTS pausas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    jornada_id VARCHAR(36) NOT NULL,
    motivo TEXT NOT NULL,
    hora_inicio DATETIME NOT NULL,
    hora_fin DATETIME,
    duracion INT COMMENT 'Duración en segundos',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL,
    FOREIGN KEY (jornada_id) REFERENCES jornadas(id) ON DELETE CASCADE
);

-- Tabla de zonas permitidas (geofencing)
CREATE TABLE IF NOT EXISTS zonas_permitidas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    latitud_centro DECIMAL(10, 8) NOT NULL,
    longitud_centro DECIMAL(11, 8) NOT NULL,
    radio_metros DECIMAL(10, 2) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL
);

-- Tabla para asignar zonas permitidas a empleados
CREATE TABLE IF NOT EXISTS empleado_zona (
    empleado_id VARCHAR(36) NOT NULL,
    zona_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (empleado_id, zona_id),
    FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE,
    FOREIGN KEY (zona_id) REFERENCES zonas_permitidas(id) ON DELETE CASCADE
);

-- Tabla de ausencias
CREATE TABLE IF NOT EXISTS ausencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empleado_id VARCHAR(36) NOT NULL,
    tipo ENUM('vacaciones', 'enfermedad', 'permiso', 'asuntos_propios', 'otros') NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    motivo TEXT,
    aprobado BOOLEAN DEFAULT FALSE,
    aprobado_por VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL,
    FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE,
    FOREIGN KEY (aprobado_por) REFERENCES empleados(id) ON DELETE SET NULL
);

-- Tabla de logs y auditoría
CREATE TABLE IF NOT EXISTS logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empleado_id VARCHAR(36),
    accion VARCHAR(100) NOT NULL,
    detalles TEXT,
    ip VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE SET NULL
);

-- Inserta roles por defecto
INSERT INTO roles (nombre, descripcion) VALUES 
('administrador', 'Acceso completo al sistema'),
('empleado', 'Acceso a registro de jornada propio'),
('supervisor', 'Acceso a registros de empleados bajo su supervisión'),
('rrhh', 'Acceso a reportes y gestión de personal');

-- Inserta departamentos de ejemplo
INSERT INTO departamentos (nombre, descripcion) VALUES 
('APLIUM Aplicaciones Tele', 'Departamento principal'),
('RRHH', 'Recursos humanos'),
('Finanzas', 'Gestión financiera');
