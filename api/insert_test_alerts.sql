-- Script para insertar alertas de prueba
-- Ejecutar este script en la base de datos para ver las alertas no leídas
-- NOTA: Asegúrate de estar usando la base de datos correcta antes de ejecutar

USE inventario;

-- Eliminar alertas de prueba anteriores si existen (opcional)
-- DELETE FROM alertas WHERE titulo LIKE 'Stock Bajo - Producto%' OR titulo = 'Pedido Pendiente' OR titulo = 'Movimiento de Inventario' OR titulo = 'Revisión Requerida' OR titulo = 'Alerta de Sistema' OR titulo = 'Notificación General';

INSERT INTO alertas (tipo, titulo, mensaje, severidad, producto_id, leida, fecha_creacion) VALUES
('low_stock', 'Stock Bajo - Producto 1', 'El producto está por debajo del umbral mínimo (5/20)', 'high', NULL, 0, NOW()),
('low_stock', 'Stock Bajo - Producto 2', 'El producto está por debajo del umbral mínimo (8/15)', 'medium', NULL, 0, NOW()),
('low_stock', 'Stock Bajo - Producto 3', 'El producto está por debajo del umbral mínimo (10/25)', 'high', NULL, 0, NOW()),
('order_delayed', 'Pedido Pendiente', 'Hay un pedido que requiere atención inmediata', 'high', NULL, 0, NOW()),
('system', 'Movimiento de Inventario', 'Se registró una salida importante de inventario', 'medium', NULL, 0, NOW()),
('threshold', 'Revisión Requerida', 'Se requiere revisar el nivel de stock de varios productos', 'low', NULL, 0, NOW()),
('system', 'Alerta de Sistema', 'El sistema ha detectado una inconsistencia en los datos', 'high', NULL, 0, NOW()),
('threshold', 'Notificación General', 'Nueva actualización disponible en el sistema', 'low', NULL, 0, NOW());

-- Verificar que se insertaron correctamente
SELECT COUNT(*) as total_no_leidas FROM alertas WHERE leida = 0;

