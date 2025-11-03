-- Script para actualizar el ENUM de estados en la tabla pedidos
-- Este script cambia los valores del ENUM de inglés a español

-- Actualizar el ENUM a los nuevos valores
ALTER TABLE pedidos 
MODIFY COLUMN estado ENUM(
    'pendiente',
    'confirmado',
    'enviado',
    'en_transito',
    'entregado',
    'cancelado'
) DEFAULT 'pendiente';

-- Mapear los estados antiguos a los nuevos valores
UPDATE pedidos SET estado = 'pendiente' WHERE estado = 'created' OR estado IS NULL OR estado = '';
UPDATE pedidos SET estado = 'confirmado' WHERE estado = 'confirmed';
UPDATE pedidos SET estado = 'enviado' WHERE estado = 'shipped';
UPDATE pedidos SET estado = 'entregado' WHERE estado = 'delivered';
UPDATE pedidos SET estado = 'cancelado' WHERE estado = 'cancelled';

-- Verificar que se actualizó correctamente
SELECT id, numero_pedido, estado FROM pedidos LIMIT 10;

