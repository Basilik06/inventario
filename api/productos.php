<?php
// Desactivar errores visuales que puedan romper el JSON
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    $conn = getDBConnection();
} catch (Exception $e) {
    sendError('Error de conexión: ' . $e->getMessage(), 500);
}

switch ($method) {
    case 'GET':
        $id = $_GET['id'] ?? null;
        $search = $_GET['search'] ?? '';
        $categoria = $_GET['categoria'] ?? '';
        
        if ($id) {
            // Obtener un producto específico
            $stmt = $conn->prepare("SELECT p.*, c.nombre as categoria_nombre, pr.nombre as proveedor_nombre 
                                   FROM productos p 
                                   LEFT JOIN categorias c ON p.categoria_id = c.id 
                                   LEFT JOIN proveedores pr ON p.proveedor_id = pr.id 
                                   WHERE p.id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $producto = $result->fetch_assoc();
            $stmt->close();
            
            if ($producto) {
                sendResponse($producto);
            } else {
                sendError('Producto no encontrado', 404);
            }
        } else {
            // Obtener lista de productos
            $sql = "SELECT p.*, c.nombre as categoria_nombre, pr.nombre as proveedor_nombre 
                   FROM productos p 
                   LEFT JOIN categorias c ON p.categoria_id = c.id 
                   LEFT JOIN proveedores pr ON p.proveedor_id = pr.id 
                   WHERE p.activo = TRUE";
            
            $params = [];
            $types = '';
            
            if (!empty($search)) {
                $sql .= " AND (p.nombre LIKE ? OR p.sku LIKE ?)";
                $searchTerm = "%$search%";
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $types .= "ss";
            }
            
            if (!empty($categoria) && $categoria !== 'all') {
                $sql .= " AND c.nombre = ?";
                $params[] = $categoria;
                $types .= "s";
            }
            
            // Si no hay parámetros, simplemente ejecutar sin bind_param
            
            $sql .= " ORDER BY p.fecha_actualizacion DESC";
            
            if (!empty($params)) {
                $stmt = $conn->prepare($sql);
                $stmt->bind_param($types, ...$params);
                $stmt->execute();
            } else {
                $stmt = $conn->prepare($sql);
                $stmt->execute();
            }
            $result = $stmt->get_result();
            
            $productos = [];
            while ($row = $result->fetch_assoc()) {
                $productos[] = $row;
            }
            $stmt->close();
            
            sendResponse($productos);
        }
        break;
        
    case 'POST':
        try {
            $json = file_get_contents('php://input');
            $data = json_decode($json, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                sendError('Error al decodificar JSON: ' . json_last_error_msg(), 400);
            }
            
            $sku = $data['sku'] ?? '';
            $nombre = $data['nombre'] ?? '';
            $descripcion = $data['descripcion'] ?? '';
            $categoria_id = $data['categoria_id'] ?? null;
            $stock = intval($data['stock'] ?? 0);
            $stock_minimo = intval($data['stock_minimo'] ?? 0);
            $precio = floatval($data['precio'] ?? 0);
            $proveedor_id = $data['proveedor_id'] ?? null;
            
            // Validar campos requeridos
            if (empty($nombre)) {
                sendError('El nombre es requerido', 400);
            }
            
            // Si no se proporciona SKU, generarlo automáticamente
            if (empty($sku)) {
                // Generar SKU automáticamente basado en la cantidad de productos
                $countResult = $conn->query("SELECT COUNT(*) as total FROM productos");
                $countRow = $countResult->fetch_assoc();
                $nextNumber = intval($countRow['total']) + 1;
                
                // Generar SKU con formato PROD-0001, PROD-0002, etc.
                $sku = 'PROD-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
            }
            
            // Verificar que el SKU no exista (evitar duplicados)
            $checkStmt = $conn->prepare("SELECT id FROM productos WHERE sku = ?");
            $checkStmt->bind_param("s", $sku);
            $checkStmt->execute();
            $checkResult = $checkStmt->get_result();
            
            // Si el SKU existe, generar uno nuevo automáticamente
            if ($checkResult->num_rows > 0) {
                $countResult = $conn->query("SELECT COUNT(*) as total FROM productos");
                $countRow = $countResult->fetch_assoc();
                $nextNumber = intval($countRow['total']) + 1;
                $attempts = 0;
                while ($attempts < 100) { // Límite de intentos
                    $sku = 'PROD-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
                    $checkStmt->bind_param("s", $sku);
                    $checkStmt->execute();
                    $checkResult = $checkStmt->get_result();
                    if ($checkResult->num_rows == 0) {
                        break; // SKU disponible encontrado
                    }
                    $nextNumber++;
                    $attempts++;
                }
            }
            $checkStmt->close();
            
            // Obtener categoria_id por nombre si es necesario
            if (!is_numeric($categoria_id) && !empty($data['categoria'])) {
                $catStmt = $conn->prepare("SELECT id FROM categorias WHERE nombre = ?");
                if (!$catStmt) {
                    sendError('Error al preparar consulta de categoría: ' . $conn->error, 500);
                }
                $catStmt->bind_param("s", $data['categoria']);
                $catStmt->execute();
                $catResult = $catStmt->get_result();
                if ($catRow = $catResult->fetch_assoc()) {
                    $categoria_id = $catRow['id'];
                } else {
                    sendError('Categoría no encontrada: ' . $data['categoria'], 400);
                }
                $catStmt->close();
            }
            
            if ($categoria_id === null) {
                sendError('La categoría es requerida', 400);
            }
            
            // Obtener proveedor_id por nombre si es necesario
            if (!is_numeric($proveedor_id) && !empty($data['proveedor'])) {
                $provStmt = $conn->prepare("SELECT id FROM proveedores WHERE nombre = ?");
                if (!$provStmt) {
                    sendError('Error al preparar consulta de proveedor: ' . $conn->error, 500);
                }
                $provStmt->bind_param("s", $data['proveedor']);
                $provStmt->execute();
                $provResult = $provStmt->get_result();
                if ($provRow = $provResult->fetch_assoc()) {
                    $proveedor_id = $provRow['id'];
                } else {
                    sendError('Proveedor no encontrado: ' . $data['proveedor'], 400);
                }
                $provStmt->close();
            }
            
            if ($proveedor_id === null) {
                sendError('El proveedor es requerido', 400);
            }
            
            $stmt = $conn->prepare("INSERT INTO productos (sku, nombre, descripcion, categoria_id, stock, stock_minimo, precio, proveedor_id) 
                                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            if (!$stmt) {
                sendError('Error al preparar consulta: ' . $conn->error, 500);
            }
            
            $stmt->bind_param("sssiiidd", $sku, $nombre, $descripcion, $categoria_id, $stock, $stock_minimo, $precio, $proveedor_id);
            
            if ($stmt->execute()) {
                $producto_id = $conn->insert_id;
                
                // Registrar en auditoría (sin bloquear si falla)
                try {
                    $auditStmt = $conn->prepare("INSERT INTO auditoria (usuario_id, nombre_usuario, accion, entidad, entidad_id, cambios) 
                                                VALUES (?, ?, ?, ?, ?, ?)");
                    if ($auditStmt) {
                        $usuario_id = 1;
                        $nombre_usuario = 'Ana García';
                        $accion = 'Creación de producto';
                        $entidad = 'Producto';
                        $entidad_id_str = (string)$producto_id;
                        $cambios = "Nuevo producto: $nombre";
                        // bind_param tipos: i (usuario_id), s (nombre_usuario), s (accion), s (entidad), s (entidad_id), s (cambios)
                        $auditStmt->bind_param("isssss", $usuario_id, $nombre_usuario, $accion, $entidad, $entidad_id_str, $cambios);
                        $auditStmt->execute();
                        $auditStmt->close();
                    }
                } catch (Exception $e) {
                    // Continuar aunque falle la auditoría
                }
                
                $stmt->close();
                sendResponse(['success' => true, 'id' => $producto_id, 'message' => 'Producto creado exitosamente'], 201);
            } else {
                $error = $conn->error;
                $stmt->close();
                sendError('Error al ejecutar consulta: ' . $error, 500);
            }
        } catch (Exception $e) {
            sendError('Error al procesar solicitud: ' . $e->getMessage() . ' en línea ' . $e->getLine(), 500);
        } catch (Error $e) {
            sendError('Error fatal: ' . $e->getMessage() . ' en línea ' . $e->getLine(), 500);
        }
        break;
        
    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'] ?? null;
        
        if (!$id) {
            sendError('ID de producto requerido');
        }
        
        $sku = $data['sku'] ?? '';
        $nombre = $data['nombre'] ?? '';
        $descripcion = $data['descripcion'] ?? '';
        $categoria_id = $data['categoria_id'] ?? null;
        $stock = $data['stock'] ?? 0;
        $stock_minimo = $data['stock_minimo'] ?? 0;
        $precio = $data['precio'] ?? 0;
        $proveedor_id = $data['proveedor_id'] ?? null;
        $activo = isset($data['activo']) ? (bool)$data['activo'] : null;
        
        // Obtener el estado actual del producto para comparar
        $checkStmt = $conn->prepare("SELECT activo FROM productos WHERE id = ?");
        $checkStmt->bind_param("i", $id);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        $currentProduct = $checkResult->fetch_assoc();
        $checkStmt->close();
        
        $soloCambioEstado = false;
        if ($activo !== null && isset($currentProduct['activo'])) {
            $soloCambioEstado = ($activo != $currentProduct['activo']);
        }
        
        // Obtener categoria_id por nombre si es necesario
        if (!is_numeric($categoria_id) && !empty($data['categoria'])) {
            $catStmt = $conn->prepare("SELECT id FROM categorias WHERE nombre = ?");
            $catStmt->bind_param("s", $data['categoria']);
            $catStmt->execute();
            $catResult = $catStmt->get_result();
            if ($catRow = $catResult->fetch_assoc()) {
                $categoria_id = $catRow['id'];
            }
            $catStmt->close();
        }
        
        // Obtener proveedor_id por nombre si es necesario
        if (!is_numeric($proveedor_id) && !empty($data['proveedor'])) {
            $provStmt = $conn->prepare("SELECT id FROM proveedores WHERE nombre = ?");
            $provStmt->bind_param("s", $data['proveedor']);
            $provStmt->execute();
            $provResult = $provStmt->get_result();
            if ($provRow = $provResult->fetch_assoc()) {
                $proveedor_id = $provRow['id'];
            }
            $provStmt->close();
        }
        
        // Construir la consulta UPDATE incluyendo activo si se proporciona
        if ($activo !== null) {
            $stmt = $conn->prepare("UPDATE productos SET sku = ?, nombre = ?, descripcion = ?, categoria_id = ?, stock = ?, stock_minimo = ?, precio = ?, proveedor_id = ?, activo = ? WHERE id = ?");
            $stmt->bind_param("sssiiiddii", $sku, $nombre, $descripcion, $categoria_id, $stock, $stock_minimo, $precio, $proveedor_id, $activo, $id);
        } else {
            $stmt = $conn->prepare("UPDATE productos SET sku = ?, nombre = ?, descripcion = ?, categoria_id = ?, stock = ?, stock_minimo = ?, precio = ?, proveedor_id = ? WHERE id = ?");
            $stmt->bind_param("sssiiiddi", $sku, $nombre, $descripcion, $categoria_id, $stock, $stock_minimo, $precio, $proveedor_id, $id);
        }
        
        if ($stmt->execute()) {
            // Registrar en auditoría
            $auditStmt = $conn->prepare("INSERT INTO auditoria (usuario_id, nombre_usuario, accion, entidad, entidad_id, cambios) 
                                        VALUES (?, ?, ?, ?, ?, ?)");
            $usuario_id = 1; // En producción obtener de sesión
            $nombre_usuario = 'Sistema';
            // Si solo cambió el estado activo, usar "Actualización de estado", sino "Actualización de producto"
            $accion = $soloCambioEstado ? 'Actualización de estado' : 'Actualización de producto';
            $entidad = 'Producto';
            $entidad_id_str = (string)$id;
            $cambios = $soloCambioEstado ? "Estado actualizado: " . ($activo ? 'activo' : 'inactivo') : "Producto actualizado: $nombre";
            $auditStmt->bind_param("isssss", $usuario_id, $nombre_usuario, $accion, $entidad, $entidad_id_str, $cambios);
            $auditStmt->execute();
            $auditStmt->close();
            
            sendResponse(['success' => true, 'message' => 'Producto actualizado exitosamente']);
        } else {
            sendError('Error al actualizar producto: ' . $conn->error);
        }
        $stmt->close();
        break;
        
    case 'DELETE':
        $id = $_GET['id'] ?? null;
        
        if (!$id || !is_numeric($id)) {
            sendError('ID de producto requerido');
        }
        
        // Verificar que el producto existe antes de eliminar
        $checkStmt = $conn->prepare("SELECT id, nombre, sku FROM productos WHERE id = ?");
        $checkStmt->bind_param("i", $id);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        
        if ($checkResult->num_rows === 0) {
            $checkStmt->close();
            sendError('Producto no encontrado', 404);
        }
        
        $productoData = $checkResult->fetch_assoc();
        $productoNombre = $productoData['nombre'];
        $productoSku = $productoData['sku'];
        $checkStmt->close();
        
        // Eliminar físicamente el producto de la base de datos
        // Nota: Las claves foráneas en movimientos y alertas tienen ON DELETE SET NULL o manejo manual
        // Las claves foráneas en pedido_productos no tienen ON DELETE, así que las manejaremos manualmente
        
        // Primero, eliminar los detalles de pedidos relacionados (si existen)
        // Opcional: puedes comentar esto si prefieres mantener el historial de pedidos
        $deletePedidosStmt = $conn->prepare("DELETE FROM pedido_productos WHERE producto_id = ?");
        $deletePedidosStmt->bind_param("i", $id);
        $deletePedidosStmt->execute();
        $deletePedidosStmt->close();
        
        // Ahora eliminar el producto (las alertas y movimientos ya tienen ON DELETE SET NULL)
        $stmt = $conn->prepare("DELETE FROM productos WHERE id = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            $affected = $conn->affected_rows;
            
            // Registrar en auditoría
            try {
                $auditStmt = $conn->prepare("INSERT INTO auditoria (usuario_id, nombre_usuario, accion, entidad, entidad_id, cambios) 
                                            VALUES (?, ?, ?, ?, ?, ?)");
                $usuario_id = 1; // En producción obtener de sesión
                $nombre_usuario = 'Sistema';
                $accion = 'Eliminación de producto';
                $entidad = 'Producto';
                $entidad_id_str = (string)$id;
                $cambios = "Producto eliminado: $productoNombre (SKU: $productoSku)";
                $auditStmt->bind_param("isssss", $usuario_id, $nombre_usuario, $accion, $entidad, $entidad_id_str, $cambios);
                $auditStmt->execute();
                $auditStmt->close();
            } catch (Exception $e) {
                // Continuar aunque falle la auditoría
            }
            
            $stmt->close();
            
            if ($affected > 0) {
                sendResponse(['success' => true, 'message' => 'Producto eliminado permanentemente de la base de datos', 'affected_rows' => $affected]);
            } else {
                sendResponse(['success' => false, 'message' => 'No se pudo eliminar el producto']);
            }
        } else {
            $error = $conn->error;
            $stmt->close();
            
            // Si hay error de clave foránea, informar al usuario
            if (strpos($error, 'foreign key') !== false || strpos($error, 'FOREIGN KEY') !== false) {
                sendError('No se puede eliminar el producto porque tiene movimientos o pedidos asociados. Elimina primero los registros relacionados.', 409);
            } else {
                sendError('Error al eliminar producto: ' . $error, 500);
            }
        }
        break;
        
    default:
        sendError('Método no permitido', 405);
}

if (isset($conn) && $conn) {
    $conn->close();
}
