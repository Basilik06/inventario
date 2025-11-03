<?php
// Desactivar errores visuales que puedan romper el JSON
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

require_once 'config.php';

try {
    $conn = getDBConnection();
} catch (Exception $e) {
    sendError('Error de conexión: ' . $e->getMessage(), 500);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $id = $_GET['id'] ?? null;
        $search = $_GET['search'] ?? '';
        
        if ($id) {
            $stmt = $conn->prepare("SELECT * FROM proveedores WHERE id = ? AND activo = TRUE");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $proveedor = $result->fetch_assoc();
            $stmt->close();
            
            if ($proveedor) {
                sendResponse($proveedor);
            } else {
                sendError('Proveedor no encontrado', 404);
            }
        } else {
            $sql = "SELECT * FROM proveedores WHERE activo = TRUE";
            
            if (!empty($search)) {
                $sql .= " AND (nombre LIKE ? OR contacto LIKE ?)";
                $searchTerm = "%$search%";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("ss", $searchTerm, $searchTerm);
            } else {
                $stmt = $conn->prepare($sql);
            }
            
            $stmt->execute();
            $result = $stmt->get_result();
            
            $proveedores = [];
            while ($row = $result->fetch_assoc()) {
                $proveedores[] = $row;
            }
            $stmt->close();
            
            sendResponse($proveedores);
        }
        break;
        
    case 'POST':
        try {
            $json = file_get_contents('php://input');
            $data = json_decode($json, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                sendError('Error al decodificar JSON: ' . json_last_error_msg(), 400);
            }
            
            $nombre = trim($data['nombre'] ?? '');
            $contacto = trim($data['contacto'] ?? '');
            $email = trim($data['email'] ?? '');
            $telefono = trim($data['telefono'] ?? '');
            $direccion = trim($data['direccion'] ?? '');
            
            // Validar campos requeridos
            if (empty($nombre)) {
                sendError('El nombre es requerido', 400);
            }
            
            if (empty($contacto)) {
                sendError('El contacto es requerido', 400);
            }
            
            if (empty($email)) {
                sendError('El email es requerido', 400);
            }
            
            if (empty($telefono)) {
                sendError('El teléfono es requerido', 400);
            }
            
            $stmt = $conn->prepare("INSERT INTO proveedores (nombre, contacto, email, telefono, direccion) 
                                   VALUES (?, ?, ?, ?, ?)");
            if (!$stmt) {
                sendError('Error al preparar consulta: ' . $conn->error, 500);
            }
            
            $stmt->bind_param("sssss", $nombre, $contacto, $email, $telefono, $direccion);
            
            if ($stmt->execute()) {
                $proveedor_id = $conn->insert_id;
                
                // Registrar en auditoría
                try {
                    $auditStmt = $conn->prepare("INSERT INTO auditoria (usuario_id, nombre_usuario, accion, entidad, entidad_id, cambios) 
                                                VALUES (?, ?, ?, ?, ?, ?)");
                    if ($auditStmt) {
                        $usuario_id = 1; // En producción obtener de sesión
                        $nombre_usuario = 'Sistema';
                        $accion = 'Creación de proveedor';
                        $entidad = 'Proveedor';
                        $entidad_id_str = (string)$proveedor_id;
                        $cambios = "Nuevo proveedor: $nombre";
                        $auditStmt->bind_param("isssss", $usuario_id, $nombre_usuario, $accion, $entidad, $entidad_id_str, $cambios);
                        $auditStmt->execute();
                        $auditStmt->close();
                    }
                } catch (Exception $e) {
                    // Continuar aunque falle la auditoría
                }
                
                $stmt->close();
                sendResponse(['success' => true, 'id' => $proveedor_id, 'message' => 'Proveedor creado exitosamente'], 201);
            } else {
                $error = $conn->error;
                $stmt->close();
                sendError('Error al crear proveedor: ' . $error, 500);
            }
        } catch (Exception $e) {
            sendError('Error al crear proveedor: ' . $e->getMessage() . ' en línea ' . $e->getLine(), 500);
        } catch (Error $e) {
            sendError('Error fatal: ' . $e->getMessage() . ' en línea ' . $e->getLine(), 500);
        }
        break;
        
    case 'PUT':
        try {
            $json = file_get_contents('php://input');
            $data = json_decode($json, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                sendError('Error al decodificar JSON: ' . json_last_error_msg(), 400);
            }
            
            $id = $data['id'] ?? null;
            
            if (!$id || !is_numeric($id)) {
                sendError('ID de proveedor requerido', 400);
            }
            
            $nombre = trim($data['nombre'] ?? '');
            $contacto = trim($data['contacto'] ?? '');
            $email = trim($data['email'] ?? '');
            $telefono = trim($data['telefono'] ?? '');
            $direccion = trim($data['direccion'] ?? '');
            
            // Validar campos requeridos
            if (empty($nombre)) {
                sendError('El nombre es requerido', 400);
            }
            
            $stmt = $conn->prepare("UPDATE proveedores SET nombre = ?, contacto = ?, email = ?, telefono = ?, direccion = ? WHERE id = ?");
            if (!$stmt) {
                sendError('Error al preparar consulta: ' . $conn->error, 500);
            }
            
            $stmt->bind_param("sssssi", $nombre, $contacto, $email, $telefono, $direccion, $id);
            
            if ($stmt->execute()) {
                // Registrar en auditoría
                try {
                    $auditStmt = $conn->prepare("INSERT INTO auditoria (usuario_id, nombre_usuario, accion, entidad, entidad_id, cambios) 
                                                VALUES (?, ?, ?, ?, ?, ?)");
                    if ($auditStmt) {
                        $usuario_id = 1;
                        $nombre_usuario = 'Sistema';
                        $accion = 'Actualización de proveedor';
                        $entidad = 'Proveedor';
                        $entidad_id_str = (string)$id;
                        $cambios = "Proveedor actualizado: $nombre";
                        $auditStmt->bind_param("isssss", $usuario_id, $nombre_usuario, $accion, $entidad, $entidad_id_str, $cambios);
                        $auditStmt->execute();
                        $auditStmt->close();
                    }
                } catch (Exception $e) {
                    // Continuar aunque falle la auditoría
                }
                
                $stmt->close();
                sendResponse(['success' => true, 'message' => 'Proveedor actualizado exitosamente']);
            } else {
                $error = $conn->error;
                $stmt->close();
                sendError('Error al actualizar proveedor: ' . $error, 500);
            }
        } catch (Exception $e) {
            sendError('Error al actualizar proveedor: ' . $e->getMessage() . ' en línea ' . $e->getLine(), 500);
        } catch (Error $e) {
            sendError('Error fatal: ' . $e->getMessage() . ' en línea ' . $e->getLine(), 500);
        }
        break;
        
    case 'DELETE':
        try {
            $id = $_GET['id'] ?? null;
            
            if (!$id || !is_numeric($id)) {
                sendError('ID de proveedor requerido', 400);
            }
            
            // Verificar que el proveedor existe
            $checkStmt = $conn->prepare("SELECT id, nombre FROM proveedores WHERE id = ?");
            $checkStmt->bind_param("i", $id);
            $checkStmt->execute();
            $checkResult = $checkStmt->get_result();
            
            if ($checkResult->num_rows === 0) {
                $checkStmt->close();
                sendError('Proveedor no encontrado', 404);
            }
            
            $proveedorData = $checkResult->fetch_assoc();
            $proveedorNombre = $proveedorData['nombre'];
            $checkStmt->close();
            
            // Eliminar físicamente el proveedor de la base de datos
            // Nota: Las claves foráneas en productos tienen ON DELETE SET NULL, así que los productos
            // simplemente tendrán proveedor_id = NULL al eliminar el proveedor
            
            // Opcional: Verificar si hay productos asociados y advertir
            $productsCheck = $conn->prepare("SELECT COUNT(*) as total FROM productos WHERE proveedor_id = ?");
            $productsCheck->bind_param("i", $id);
            $productsCheck->execute();
            $productsResult = $productsCheck->get_result();
            $productsRow = $productsResult->fetch_assoc();
            $totalProducts = intval($productsRow['total']);
            $productsCheck->close();
            
            // Eliminar físicamente el proveedor
            $stmt = $conn->prepare("DELETE FROM proveedores WHERE id = ?");
            if (!$stmt) {
                sendError('Error al preparar consulta: ' . $conn->error, 500);
            }
            
            $stmt->bind_param("i", $id);
            
            if ($stmt->execute()) {
                $affected = $conn->affected_rows;
                
                // Registrar en auditoría
                try {
                    $auditStmt = $conn->prepare("INSERT INTO auditoria (usuario_id, nombre_usuario, accion, entidad, entidad_id, cambios) 
                                                VALUES (?, ?, ?, ?, ?, ?)");
                    if ($auditStmt) {
                        $usuario_id = 1;
                        $nombre_usuario = 'Sistema';
                        $accion = 'Eliminación de proveedor';
                        $entidad = 'Proveedor';
                        $entidad_id_str = (string)$id;
                        $cambios = "Proveedor eliminado permanentemente: $proveedorNombre";
                        if ($totalProducts > 0) {
                            $cambios .= " (Se desvinculó de $totalProducts producto(s))";
                        }
                        $auditStmt->bind_param("isssss", $usuario_id, $nombre_usuario, $accion, $entidad, $entidad_id_str, $cambios);
                        $auditStmt->execute();
                        $auditStmt->close();
                    }
                } catch (Exception $e) {
                    // Continuar aunque falle la auditoría
                }
                
                $stmt->close();
                
                if ($affected > 0) {
                    sendResponse([
                        'success' => true, 
                        'message' => 'Proveedor eliminado permanentemente de la base de datos',
                        'affected_rows' => $affected,
                        'products_affected' => $totalProducts
                    ]);
                } else {
                    sendResponse(['success' => false, 'message' => 'No se pudo eliminar el proveedor']);
                }
            } else {
                $error = $conn->error;
                $stmt->close();
                
                // Si hay error de clave foránea, informar al usuario
                if (strpos($error, 'foreign key') !== false || strpos($error, 'FOREIGN KEY') !== false) {
                    sendError('No se puede eliminar el proveedor porque tiene pedidos o relaciones asociadas. Elimina primero los registros relacionados.', 409);
                } else {
                    sendError('Error al eliminar proveedor: ' . $error, 500);
                }
            }
        } catch (Exception $e) {
            sendError('Error al eliminar proveedor: ' . $e->getMessage() . ' en línea ' . $e->getLine(), 500);
        } catch (Error $e) {
            sendError('Error fatal: ' . $e->getMessage() . ' en línea ' . $e->getLine(), 500);
        }
        break;
        
    default:
        sendError('Método no permitido', 405);
}

if (isset($conn) && $conn) {
    $conn->close();
}
