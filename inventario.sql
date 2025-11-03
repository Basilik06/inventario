-- Base de Datos: Sistema de Control de Inventarios
-- MySQL/MariaDB para XAMPP

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS sistema_inventarios CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sistema_inventarios;

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'inventory_manager', 'buyer', 'auditor') DEFAULT 'inventory_manager',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabla de Proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(200) NOT NULL,
    contacto VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    direccion TEXT,
    productos_suministrados INT DEFAULT 0,
    total_pedidos INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabla de Categorías
CREATE TABLE IF NOT EXISTS categorias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabla de Productos
CREATE TABLE IF NOT EXISTS productos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sku VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    categoria_id INT,
    stock INT DEFAULT 0,
    stock_minimo INT DEFAULT 0,
    precio DECIMAL(10, 2) DEFAULT 0.00,
    proveedor_id INT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL,
    INDEX idx_categoria (categoria_id),
    INDEX idx_proveedor (proveedor_id),
    INDEX idx_sku (sku)
) ENGINE=InnoDB;

-- Tabla de Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero_pedido VARCHAR(50) UNIQUE NOT NULL,
    proveedor_id INT NOT NULL,
    estado ENUM('created', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'created',
    monto_total DECIMAL(10, 2) DEFAULT 0.00,
    fecha_entrega_estimada DATE,
    notas TEXT,
    creado_por INT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
    FOREIGN KEY (creado_por) REFERENCES usuarios(id),
    INDEX idx_proveedor (proveedor_id),
    INDEX idx_estado (estado)
) ENGINE=InnoDB;

-- Tabla de Detalles de Pedido
CREATE TABLE IF NOT EXISTS pedido_productos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pedido_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    INDEX idx_pedido (pedido_id),
    INDEX idx_producto (producto_id)
) ENGINE=InnoDB;

-- Tabla de Movimientos
CREATE TABLE IF NOT EXISTS movimientos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tipo ENUM('entry', 'exit') NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    responsable_id INT,
    referencia VARCHAR(100),
    notas TEXT,
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (responsable_id) REFERENCES usuarios(id),
    INDEX idx_producto (producto_id),
    INDEX idx_tipo (tipo),
    INDEX idx_fecha (fecha_movimiento)
) ENGINE=InnoDB;

-- Tabla de Alertas
CREATE TABLE IF NOT EXISTS alertas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tipo ENUM('low_stock', 'order_delayed', 'system', 'threshold') NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT,
    producto_id INT,
    severidad ENUM('high', 'medium', 'low') DEFAULT 'medium',
    leida BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL,
    INDEX idx_leida (leida),
    INDEX idx_severidad (severidad),
    INDEX idx_tipo (tipo)
) ENGINE=InnoDB;

-- Tabla de Auditoría
CREATE TABLE IF NOT EXISTS auditoria (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    nombre_usuario VARCHAR(100),
    accion VARCHAR(100) NOT NULL,
    entidad VARCHAR(50) NOT NULL,
    entidad_id VARCHAR(50),
    cambios TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_usuario (usuario_id),
    INDEX idx_entidad (entidad),
    INDEX idx_fecha (fecha)
) ENGINE=InnoDB;

-- Insertar datos iniciales

-- Usuarios (password: '123456' hasheado con password_hash PHP)
INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES
('Ana García', 'ana.garcia@empresa.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', TRUE),
('Pedro Sánchez', 'pedro.sanchez@empresa.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'inventory_manager', TRUE),
('María López', 'maria.lopez@empresa.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'buyer', TRUE),
('Juan Martínez', 'juan.martinez@empresa.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'auditor', TRUE);

-- Categorías
INSERT INTO categorias (nombre, descripcion) VALUES
('Electrónica', 'Equipos electrónicos y dispositivos'),
('Periféricos', 'Periféricos de computadora'),
('Mobiliario', 'Muebles de oficina'),
('Suministros', 'Suministros de oficina y consumibles');

-- Proveedores
INSERT INTO proveedores (nombre, contacto, email, telefono, direccion, productos_suministrados, total_pedidos) VALUES
('TechCorp S.A.', 'Carlos Rodríguez', 'ventas@techcorp.com', '+34 912 345 678', 'Av. Tecnología 123, Madrid', 45, 127),
('Office Supplies Inc.', 'María López', 'contacto@officesupplies.com', '+34 913 456 789', 'C/ Suministros 45, Barcelona', 32, 89),
('Muebles Corp', 'Juan Martínez', 'info@mueblescorp.com', '+34 914 567 890', 'Polígono Industrial 7, Valencia', 18, 54);

-- Productos
INSERT INTO productos (sku, nombre, descripcion, categoria_id, stock, stock_minimo, precio, proveedor_id) VALUES
('SKU-001', 'Laptop Dell Inspiron 15', 'Laptop empresarial con procesador Intel i7', 1, 45, 20, 899.99, 1),
('SKU-002', 'Monitor LG 27"', 'Monitor LED Full HD con ajuste de altura', 1, 12, 15, 249.99, 1),
('SKU-003', 'Teclado Mecánico Logitech', 'Teclado mecánico retroiluminado RGB', 2, 67, 30, 89.99, 2),
('SKU-004', 'Mouse Inalámbrico', 'Mouse ergonómico inalámbrico 2.4GHz', 2, 8, 25, 29.99, 2),
('SKU-005', 'Silla Ergonómica Pro', 'Silla de oficina con soporte lumbar ajustable', 3, 23, 10, 349.99, 3),
('SKU-006', 'Escritorio Standing Desk', 'Escritorio ajustable en altura eléctrico', 3, 15, 8, 599.99, 3),
('SKU-007', 'Papel Bond A4 (Resma)', 'Resma de 500 hojas papel bond blanco', 4, 156, 100, 4.99, 2),
('SKU-008', 'Cartucho Tinta HP Negro', 'Cartucho de tinta original HP 664XL', 4, 7, 20, 35.99, 1);

-- Pedidos
INSERT INTO pedidos (numero_pedido, proveedor_id, estado, monto_total, fecha_entrega_estimada, creado_por) VALUES
('PO-2025-001', 1, 'shipped', 4999.80, '2025-10-25', 1),
('PO-2025-002', 2, 'confirmed', 4199.20, '2025-10-28', 2),
('PO-2025-003', 3, 'delivered', 5249.85, '2025-10-18', 1),
('PO-2025-004', 1, 'created', 1079.70, '2025-10-30', 2);

-- Detalles de Pedido
INSERT INTO pedido_productos (pedido_id, producto_id, cantidad, precio_unitario, subtotal) VALUES
(1, 2, 20, 249.99, 4999.80),
(2, 4, 50, 29.99, 1499.50),
(2, 3, 30, 89.99, 2699.70),
(3, 5, 15, 349.99, 5249.85),
(4, 8, 30, 35.99, 1079.70);

-- Movimientos
INSERT INTO movimientos (tipo, producto_id, cantidad, responsable_id, referencia, notas) VALUES
('entry', 1, 25, 1, 'PO-2025-001', 'Recepción pedido mensual'),
('exit', 3, 15, 2, 'SO-2025-045', 'Venta área comercial'),
('entry', 7, 100, 3, 'PO-2025-002', NULL),
('exit', 2, 8, 1, 'SO-2025-046', 'Asignación nuevo departamento'),
('entry', 5, 15, 4, 'PO-2025-003', NULL);

-- Alertas
INSERT INTO alertas (tipo, titulo, mensaje, producto_id, severidad, leida) VALUES
('low_stock', 'Stock Bajo - Cartucho Tinta HP Negro', 'El producto está por debajo del umbral mínimo (7/20)', 8, 'high', FALSE),
('low_stock', 'Stock Bajo - Monitor LG 27"', 'El producto está por debajo del umbral mínimo (12/15)', 2, 'medium', FALSE),
('low_stock', 'Stock Bajo - Mouse Inalámbrico', 'El producto está por debajo del umbral mínimo (8/25)', 4, 'high', TRUE),
('order_delayed', 'Pedido próximo a vencer', 'Pedido #PO-2025-001 debe llegar en 2 días', NULL, 'medium', FALSE);

-- Auditoría
INSERT INTO auditoria (usuario_id, nombre_usuario, accion, entidad, entidad_id, cambios) VALUES
(1, 'Ana García', 'Actualización de producto', 'Producto', '2', 'Stock actualizado: 20 → 12'),
(2, 'Pedro Sánchez', 'Creación de pedido', 'Pedido', '4', 'Nuevo pedido creado - Proveedor: TechCorp S.A.'),
(1, 'Ana García', 'Registro de movimiento', 'Movimiento', '1', 'Entrada de inventario - 25 unidades'),
(3, 'María López', 'Actualización de proveedor', 'Proveedor', '2', 'Teléfono actualizado'),
(1, 'Ana García', 'Eliminación de alerta', 'Alerta', '5', 'Alerta marcada como resuelta');

-- Actualizar totales de proveedores
UPDATE proveedores SET productos_suministrados = (
    SELECT COUNT(*) FROM productos WHERE proveedor_id = proveedores.id
);

UPDATE proveedores SET total_pedidos = (
    SELECT COUNT(*) FROM pedidos WHERE proveedor_id = proveedores.id
);

-- Vista para Dashboard - Resumen de Inventario
CREATE OR REPLACE VIEW vista_dashboard AS
SELECT 
    (SELECT COUNT(*) FROM productos WHERE activo = TRUE) as total_productos,
    (SELECT SUM(stock) FROM productos WHERE activo = TRUE) as inventario_total,
    (SELECT COUNT(*) FROM productos WHERE stock < stock_minimo AND activo = TRUE) as productos_stock_bajo,
    (SELECT SUM(stock * precio) FROM productos WHERE activo = TRUE) as valor_total_inventario,
    (SELECT COUNT(*) FROM pedidos WHERE estado NOT IN ('delivered', 'cancelled')) as pedidos_pendientes,
    (SELECT COUNT(*) FROM alertas WHERE leida = FALSE) as alertas_no_leidas;

