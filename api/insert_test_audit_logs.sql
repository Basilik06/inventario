-- Script para insertar logs de auditoría de prueba en otro año (2024)
-- Ejecutar este script en la base de datos para probar el filtro por año
-- NOTA: Asegúrate de estar usando la base de datos correcta antes de ejecutar

USE inventario;

INSERT INTO auditoria (usuario_id, nombre_usuario, accion, entidad, entidad_id, cambios, fecha) VALUES
(1, 'Ana García', 'Creación de producto', 'Producto', '100', 'Nuevo producto creado - Laptop HP EliteBook', '2024-01-15 10:30:00'),
(2, 'Pedro Sánchez', 'Actualización de producto', 'Producto', '101', 'Stock actualizado: 50 → 35', '2024-02-20 14:15:00'),
(1, 'Ana García', 'Creación de pedido', 'Pedido', '50', 'Nuevo pedido creado - Proveedor: TechCorp S.A.', '2024-03-10 09:00:00'),
(3, 'María López', 'Registro de movimiento', 'Movimiento', '200', 'Entrada de inventario - 100 unidades', '2024-04-05 11:45:00'),
(2, 'Pedro Sánchez', 'Actualización de proveedor', 'Proveedor', '10', 'Email actualizado a nuevo@proveedor.com', '2024-05-12 16:20:00'),
(1, 'Ana García', 'Eliminación de producto', 'Producto', '102', 'Producto eliminado permanentemente', '2024-06-18 08:30:00'),
(3, 'María López', 'Registro de movimiento', 'Movimiento', '201', 'Salida de inventario - 25 unidades', '2024-07-22 13:10:00'),
(2, 'Pedro Sánchez', 'Actualización de pedido', 'Pedido', '51', 'Estado cambiado a entregado', '2024-08-30 15:45:00'),
(1, 'Ana García', 'Creación de categoría', 'Categoría', '5', 'Nueva categoría: Equipos de Red', '2024-09-14 10:00:00'),
(3, 'María López', 'Actualización de producto', 'Producto', '103', 'Precio actualizado: $50.00 → $45.00', '2024-10-25 09:30:00'),
(2, 'Pedro Sánchez', 'Registro de movimiento', 'Movimiento', '202', 'Entrada de inventario - 75 unidades', '2024-11-08 14:20:00'),
(1, 'Ana García', 'Actualización de pedido', 'Pedido', '52', 'Estado cambiado a en tránsito', '2024-12-15 11:15:00');

-- Verificar que se insertaron correctamente
SELECT COUNT(*) as total_2024 FROM auditoria WHERE YEAR(fecha) = 2024;

