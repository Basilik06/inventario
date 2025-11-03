-- Script para actualizar los estados de pedidos
-- Ejecutar este script en la base de datos para actualizar el ENUM de estados

ALTER TABLE pedidos 
MODIFY COLUMN estado ENUM(
    'pendiente',
    'enviado',
    'en_transito',
    'entregado',
    'cancelado'
) DEFAULT 'pendiente';

-- Actualizar los estados existentes a los nuevos valores
UPDATE pedidos SET estado = 'pendiente' WHERE estado = 'created' OR estado = 'pendiente';
UPDATE pedidos SET estado = 'enviado' WHERE estado = 'enviado_proveedor' OR estado = 'espera_confirmacion' OR estado = 'confirmed' OR estado = 'confirmado';
UPDATE pedidos SET estado = 'en_transito' WHERE estado = 'shipped' OR estado = 'en_transito';
UPDATE pedidos SET estado = 'entregado' WHERE estado = 'delivered' OR estado = 'entregado';
UPDATE pedidos SET estado = 'cancelado' WHERE estado = 'cancelled' OR estado = 'cancelado';

