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
        $tipo = $_GET['tipo'] ?? '';
        
        if ($id) {
            $stmt = $conn->prepare("SELECT m.*, p.nombre as producto_nombre, u.nombre as responsable_nombre 
                                   FROM movimientos m 
                                   LEFT JOIN productos p ON m.producto_id = p.id 
                                   LEFT JOIN usuarios u ON m.responsable_id = u.id 
                                   WHERE m.id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $movimiento = $result->fetch_assoc();
            $stmt->close();
            
            sendResponse($movimiento);
        } else {
            $sql = "SELECT m.*, p.nombre as producto_nombre, u.nombre as responsable_nombre 
                   FROM movimientos m 
                   LEFT JOIN productos p ON m.producto_id = p.id 
                   LEFT JOIN usuarios u ON m.responsable_id = u.id 
                   WHERE 1=1";
            
            $params = [];
            $types = '';
            
            if (!empty($search)) {
                $sql .= " AND (p.nombre LIKE ? OR m.referencia LIKE ?)";
                $searchTerm = "%$search%";
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $types .= "ss";
            }
            
            if (!empty($tipo) && $tipo !== 'all') {
                $sql .= " AND m.tipo = ?";
                $params[] = $tipo;
                $types .= "s";
            }
            
            $sql .= " ORDER BY m.fecha_movimiento DESC";
            
            if (!empty($params)) {
                $stmt = $conn->prepare($sql);
                $stmt->bind_param($types, ...$params);
                $stmt->execute();
            } else {
                $stmt = $conn->prepare($sql);
                $stmt->execute();
            }
            $result = $stmt->get_result();
            
            $movimientos = [];
            while ($row = $result->fetch_assoc()) {
                $movimientos[] = $row;
            }
            $stmt->close();
            
            sendResponse($movimientos);
        }
        break;
        
    case 'POST':
        try {
            $json = file_get_contents('php://input');
            $data = json_decode($json, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                sendError('Error al decodificar JSON: ' . json_last_error_msg(), 400);
            }
            
            $tipo = $data['tipo'] ?? '';
            $producto_id = $data['producto_id'] ?? null;
            $cantidad = intval($data['cantidad'] ?? 0);
            $responsable_id = intval($data['responsable_id'] ?? 1);
            $referencia = trim($data['referencia'] ?? '');
            $notas = trim($data['notas'] ?? '');
            
            // Validar campos requeridos
            if (empty($tipo) || !in_array($tipo, ['entry', 'exit'])) {
                sendError('Tipo de movimiento inválido', 400);
            }
            
            if (!$producto_id || !is_numeric($producto_id)) {
                sendError('Producto requerido', 400);
            }
            
            if ($cantidad <= 0) {
                sendError('La cantidad debe ser mayor a 0', 400);
            }
            
            // Si no se proporciona referencia, generarla automáticamente
            if (empty($referencia)) {
                // Contar movimientos del mismo tipo para generar número secuencial
                $countStmt = $conn->prepare("SELECT COUNT(*) as total FROM movimientos WHERE tipo = ?");
                $countStmt->bind_param("s", $tipo);
                $countStmt->execute();
                $countResult = $countStmt->get_result();
                $countRow = $countResult->fetch_assoc();
                $nextNumber = intval($countRow['total']) + 1;
                $countStmt->close();
                
                // Generar referencia: ENTR-0001 para entradas, SAL-0001 para salidas
                if ($tipo === 'entry') {
                    $referencia = 'ENTR-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
                } else {
                    $referencia = 'SAL-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
                }
            }
            
            // Verificar que el producto existe
            $checkProductStmt = $conn->prepare("SELECT id, stock, nombre FROM productos WHERE id = ? AND activo = TRUE");
            $checkProductStmt->bind_param("i", $producto_id);
            $checkProductStmt->execute();
            $productResult = $checkProductStmt->get_result();
            
            if ($productResult->num_rows === 0) {
                $checkProductStmt->close();
                sendError('Producto no encontrado o inactivo', 404);
            }
            
            $productoData = $productResult->fetch_assoc();
            $stockActual = intval($productoData['stock']);
            
            // Verificar que hay suficiente stock para salidas
            if ($tipo === 'exit' && $stockActual < $cantidad) {
                $checkProductStmt->close();
                sendError("Stock insuficiente. Stock actual: $stockActual, solicitado: $cantidad", 400);
            }
            
            $checkProductStmt->close();
            
            // Verificar que el responsable existe
            $checkUserStmt = $conn->prepare("SELECT id, nombre FROM usuarios WHERE id = ? AND activo = TRUE");
            $checkUserStmt->bind_param("i", $responsable_id);
            $checkUserStmt->execute();
            $userResult = $checkUserStmt->get_result();
            
            if ($userResult->num_rows === 0) {
                $checkUserStmt->close();
                sendError('Usuario responsable no encontrado o inactivo', 404);
            }
            
            $userData = $userResult->fetch_assoc();
            $checkUserStmt->close();
            
            // Iniciar transacción
            $conn->begin_transaction();
            
            try {
                // Insertar movimiento
                $stmt = $conn->prepare("INSERT INTO movimientos (tipo, producto_id, cantidad, responsable_id, referencia, notas) 
                                       VALUES (?, ?, ?, ?, ?, ?)");
                if (!$stmt) {
                    throw new Exception('Error al preparar consulta: ' . $conn->error);
                }
                
                $stmt->bind_param("siiiss", $tipo, $producto_id, $cantidad, $responsable_id, $referencia, $notas);
                
                if (!$stmt->execute()) {
                    throw new Exception('Error al insertar movimiento: ' . $conn->error);
                }
                
                $movimiento_id = $conn->insert_id;
                $stmt->close();
            
            // Actualizar stock del producto
            if ($tipo === 'entry') {
                $updateStmt = $conn->prepare("UPDATE productos SET stock = stock + ? WHERE id = ?");
            } else {
                $updateStmt = $conn->prepare("UPDATE productos SET stock = stock - ? WHERE id = ?");
            }
            $updateStmt->bind_param("ii", $cantidad, $producto_id);
            $updateStmt->execute();
            $updateStmt->close();
            
            // Verificar si el stock está por debajo del mínimo (para generar alerta)
            $checkStmt = $conn->prepare("SELECT stock, stock_minimo, nombre FROM productos WHERE id = ?");
            $checkStmt->bind_param("i", $producto_id);
            $checkStmt->execute();
            $producto = $checkStmt->get_result()->fetch_assoc();
            $checkStmt->close();
            
            if ($producto && $producto['stock'] < $producto['stock_minimo']) {
                $alertStmt = $conn->prepare("INSERT INTO alertas (tipo, titulo, mensaje, producto_id, severidad) 
                                            VALUES ('low_stock', ?, ?, ?, 'high')");
                $titulo = "Stock Bajo - " . $producto['nombre'];
                $mensaje = "El producto está por debajo del umbral mínimo (" . $producto['stock'] . "/" . $producto['stock_minimo'] . ")";
                $alertStmt->bind_param("ssi", $titulo, $mensaje, $producto_id);
                $alertStmt->execute();
                $alertStmt->close();
            }
            
                // Registrar en auditoría
                try {
                    $auditStmt = $conn->prepare("INSERT INTO auditoria (usuario_id, nombre_usuario, accion, entidad, entidad_id, cambios) 
                                                VALUES (?, ?, ?, ?, ?, ?)");
                    if ($auditStmt) {
                        $usuario_id = 1; // En producción obtener de sesión
                        $nombre_usuario = $userData['nombre'] ?? 'Sistema';
                        $accion = 'Registro de movimiento';
                        $entidad = 'Movimiento';
                        $entidad_id_str = (string)$movimiento_id;
                        $tipo_texto = $tipo === 'entry' ? 'Entrada' : 'Salida';
                        $cambios = "$tipo_texto de inventario - $cantidad unidades - Ref: $referencia";
                        $auditStmt->bind_param("isssss", $usuario_id, $nombre_usuario, $accion, $entidad, $entidad_id_str, $cambios);
                        $auditStmt->execute();
                        $auditStmt->close();
                    }
                } catch (Exception $e) {
                    // Continuar aunque falle la auditoría
                }
                
                $conn->commit();
                sendResponse(['success' => true, 'id' => $movimiento_id, 'message' => 'Movimiento registrado exitosamente', 'referencia' => $referencia], 201);
                
            } catch (Exception $e) {
                $conn->rollback();
                throw $e;
            }
        } catch (Exception $e) {
            sendError('Error al registrar movimiento: ' . $e->getMessage() . ' en línea ' . $e->getLine(), 500);
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
