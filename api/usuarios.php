<?php
require_once 'config.php';

$conn = getDBConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Obtener todos los usuarios
    $result = $conn->query("
        SELECT 
            id,
            nombre,
            email,
            rol,
            activo,
            fecha_creacion
        FROM usuarios
        ORDER BY nombre ASC
    ");
    
    $usuarios = [];
    while ($row = $result->fetch_assoc()) {
        $usuarios[] = $row;
    }
    
    $conn->close();
    sendResponse($usuarios);
} else if ($method === 'POST') {
    // Crear nuevo usuario
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['nombre']) || !isset($data['email']) || !isset($data['password'])) {
        sendError('Faltan campos requeridos: nombre, email, password');
    }
    
    $nombre = trim($data['nombre']);
    $email = trim($data['email']);
    
    // Validar email único
    $checkStmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
    $checkStmt->bind_param("s", $email);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    if ($checkResult->num_rows > 0) {
        $checkStmt->close();
        $conn->close();
        sendError('Este email ya está registrado');
    }
    $checkStmt->close();
    
    $password = password_hash($data['password'], PASSWORD_DEFAULT);
    $rol = $data['rol'] ?? 'inventory_manager';
    
    // Validar que el rol sea uno de los permitidos
    $rolesPermitidos = ['admin', 'inventory_manager'];
    if (!in_array($rol, $rolesPermitidos)) {
        $conn->close();
        sendError('Rol no permitido. Solo se permiten: Administrador o Gestor de Inventario');
    }
    
    $activo = isset($data['activo']) ? (bool)$data['activo'] : true;
    
    $stmt = $conn->prepare("INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssi", $nombre, $email, $password, $rol, $activo);
    
    if ($stmt->execute()) {
        $newUserId = $conn->insert_id;
        $stmt->close();
        
        // Obtener el usuario recién creado para devolverlo
        $getStmt = $conn->prepare("SELECT id, nombre, email, rol, activo FROM usuarios WHERE id = ?");
        $getStmt->bind_param("i", $newUserId);
        $getStmt->execute();
        $result = $getStmt->get_result();
        $newUser = $result->fetch_assoc();
        $getStmt->close();
        $conn->close();
        
        sendResponse(['success' => true, 'message' => 'Usuario creado exitosamente', 'user' => $newUser]);
    } else {
        $error = $conn->error;
        $stmt->close();
        $conn->close();
        sendError('Error al crear usuario: ' . $error);
    }
} else if ($method === 'PUT') {
    try {
        // Actualizar usuario
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['id'])) {
            sendError('ID de usuario requerido');
        }
        
        $id = intval($data['id']);
        if ($id <= 0) {
            sendError('ID de usuario inválido');
        }
        
        $nombre = isset($data['nombre']) ? trim($data['nombre']) : null;
        $email = isset($data['email']) ? trim($data['email']) : null;
        $rol = $data['rol'] ?? null;
        $activo = isset($data['activo']) ? (bool)$data['activo'] : null;
        
        // Validar que el rol sea uno de los permitidos si se está actualizando
        if ($rol !== null) {
            $rolesPermitidos = ['admin', 'inventory_manager'];
            if (!in_array($rol, $rolesPermitidos)) {
                sendError('Rol no permitido. Solo se permiten: Administrador o Gestor de Inventario');
            }
        }
        
        // Si se actualiza el email, verificar que no esté duplicado
        if ($email !== null) {
            $checkEmailStmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ? AND id != ?");
            if ($checkEmailStmt) {
                $checkEmailStmt->bind_param("si", $email, $id);
                $checkEmailStmt->execute();
                $emailResult = $checkEmailStmt->get_result();
                if ($emailResult->num_rows > 0) {
                    $checkEmailStmt->close();
                    $conn->close();
                    sendError('Este email ya está registrado por otro usuario');
                }
                $checkEmailStmt->close();
            }
        }
        
        $updates = [];
        $params = [];
        $types = '';
        
        if ($nombre !== null) {
            $updates[] = "nombre = ?";
            $params[] = $nombre;
            $types .= 's';
        }
        if ($email !== null) {
            $updates[] = "email = ?";
            $params[] = $email;
            $types .= 's';
        }
        if ($rol !== null) {
            $updates[] = "rol = ?";
            $params[] = $rol;
            $types .= 's';
        }
        if ($activo !== null) {
            $updates[] = "activo = ?";
            $params[] = $activo;
            $types .= 'i';
        }
        
        if (isset($data['password']) && !empty($data['password'])) {
            $updates[] = "password = ?";
            $params[] = password_hash($data['password'], PASSWORD_DEFAULT);
            $types .= 's';
        }
        
        if (empty($updates)) {
            sendError('No hay campos para actualizar');
        }
        
        $params[] = $id;
        $types .= 'i';
        
        $sql = "UPDATE usuarios SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            $conn->close();
            sendError('Error al preparar consulta: ' . $conn->error, 500);
        }
        
        $stmt->bind_param($types, ...$params);
        
        if ($stmt->execute()) {
            $stmt->close();
            $conn->close();
            sendResponse(['success' => true, 'message' => 'Usuario actualizado exitosamente']);
        } else {
            $error = $conn->error;
            $stmt->close();
            $conn->close();
            sendError('Error al actualizar usuario: ' . $error);
        }
    } catch (Exception $e) {
        if (isset($conn)) {
            $conn->close();
        }
        sendError('Error al actualizar usuario: ' . $e->getMessage(), 500);
    }
} else if ($method === 'DELETE') {
    try {
        // Eliminar usuario
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            sendError('ID de usuario requerido');
        }
        
        // Convertir a entero
        $id = intval($id);
        
        if ($id <= 0) {
            sendError('ID de usuario inválido');
        }
        
        // Verificar que el usuario existe antes de eliminar
        $checkStmt = $conn->prepare("SELECT id, nombre, email FROM usuarios WHERE id = ?");
        if (!$checkStmt) {
            sendError('Error al preparar consulta: ' . $conn->error, 500);
        }
        
        $checkStmt->bind_param("i", $id);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        
        if ($checkResult->num_rows === 0) {
            $checkStmt->close();
            $conn->close();
            sendError('Usuario no encontrado', 404);
        }
        
        $userData = $checkResult->fetch_assoc();
        $checkStmt->close();
        
        // Iniciar transacción para asegurar integridad de datos
        $conn->begin_transaction();
        
        try {
            // Primero, actualizar referencias en movimientos (poner responsable_id a NULL)
            $updateMovimientos = $conn->prepare("UPDATE movimientos SET responsable_id = NULL WHERE responsable_id = ?");
            if ($updateMovimientos) {
                $updateMovimientos->bind_param("i", $id);
                $updateMovimientos->execute();
                $updateMovimientos->close();
            }
            
            // También actualizar referencias en pedidos (si existen)
            $updatePedidos = $conn->prepare("UPDATE pedidos SET creado_por = NULL WHERE creado_por = ?");
            if ($updatePedidos) {
                $updatePedidos->bind_param("i", $id);
                $updatePedidos->execute();
                $updatePedidos->close();
            }
            
            // Ahora eliminar el usuario
            $stmt = $conn->prepare("DELETE FROM usuarios WHERE id = ?");
            if (!$stmt) {
                throw new Exception('Error al preparar consulta de eliminación: ' . $conn->error);
            }
            
            $stmt->bind_param("i", $id);
            
            if (!$stmt->execute()) {
                throw new Exception('Error al eliminar usuario: ' . $conn->error);
            }
            
            $affected = $conn->affected_rows;
            $stmt->close();
            
            if ($affected > 0) {
                // Confirmar la transacción
                $conn->commit();
                $conn->close();
                
                sendResponse([
                    'success' => true, 
                    'message' => 'Usuario eliminado exitosamente',
                    'deleted_user' => $userData
                ]);
            } else {
                $conn->rollback();
                $conn->close();
                sendError('No se pudo eliminar el usuario. Puede que el usuario ya haya sido eliminado.');
            }
        } catch (Exception $e) {
            // Revertir la transacción en caso de error
            $conn->rollback();
            $conn->close();
            sendError('Error al eliminar usuario: ' . $e->getMessage());
        }
    } catch (Exception $e) {
        if (isset($conn)) {
            $conn->close();
        }
        sendError('Error al eliminar usuario: ' . $e->getMessage(), 500);
    }
} else {
    sendError('Método no permitido', 405);
}

