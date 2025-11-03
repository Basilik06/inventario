<?php
require_once 'config.php';

$conn = getDBConnection();

try {
    // Actualizar roles de usuarios a 'inventory_manager' si no son 'admin' o 'inventory_manager'
    $sql = "UPDATE usuarios 
            SET rol = 'inventory_manager' 
            WHERE rol NOT IN ('admin', 'inventory_manager')";
    
    $result = $conn->query($sql);
    
    if ($result) {
        $affected = $conn->affected_rows;
        sendResponse([
            'success' => true,
            'message' => "Se actualizaron $affected usuario(s) al rol 'Gestor de Inventario'",
            'affected_rows' => $affected
        ]);
    } else {
        sendError('Error al actualizar roles: ' . $conn->error);
    }
} catch (Exception $e) {
    sendError('Error: ' . $e->getMessage());
} finally {
    $conn->close();
}

