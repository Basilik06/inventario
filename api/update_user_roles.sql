-- Actualizar roles de usuarios a 'inventory_manager' si no son 'admin' o 'inventory_manager'
UPDATE usuarios 
SET rol = 'inventory_manager' 
WHERE rol NOT IN ('admin', 'inventory_manager');

