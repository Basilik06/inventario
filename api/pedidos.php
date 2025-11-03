<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

require_once 'config.php';

// Funciones de mapeo (ahora la BD usa español directamente)
function estadoToBD($estado_es) {
    // Mapeo del frontend (español) a BD (español)
    // El frontend tiene: pendiente, confirmado, enviado, entregado, cancelado
    // La BD tiene: pendiente, enviado, en_transito, entregado, cancelado
    $mapeo = [
        'pendiente' => 'pendiente',
        'confirmado' => 'en_transito', // confirmado en frontend -> en_transito en BD
        'enviado' => 'enviado',       // enviado en frontend -> enviado en BD
        'entregado' => 'entregado',
        'cancelado' => 'cancelado',
        // Compatibilidad con valores antiguos
        'en_transito' => 'en_transito',
        'created' => 'pendiente',
        'confirmed' => 'en_transito',
        'shipped' => 'enviado',
        'delivered' => 'entregado',
        'cancelled' => 'cancelado'
    ];
    return $mapeo[$estado_es] ?? $estado_es;
}

function estadoFromBD($estado_bd) {
    // Mapeo de BD (español) a frontend (español)
    // La BD tiene: pendiente, enviado, en_transito, entregado, cancelado
    // El frontend espera: pendiente, confirmado, enviado, entregado, cancelado
    $mapeo = [
        'pendiente' => 'pendiente',
        'enviado' => 'enviado',       // enviado en BD -> enviado en frontend
        'en_transito' => 'confirmado', // en_transito en BD -> confirmado en frontend
        'entregado' => 'entregado',
        'cancelado' => 'cancelado',
        // Compatibilidad con valores antiguos
        'created' => 'pendiente',
        'confirmed' => 'confirmado',
        'confirmado' => 'confirmado',
        'shipped' => 'enviado',
        'delivered' => 'entregado',
        'cancelled' => 'cancelado'
    ];
    return $mapeo[$estado_bd] ?? $estado_bd;
}

function mapearPedido($pedido) {
    if (isset($pedido['estado'])) {
        $pedido['estado'] = estadoFromBD($pedido['estado']);
    }
    return $pedido;
}

$method = $_SERVER['REQUEST_METHOD'];
$conn = getDBConnection();

switch ($method) {
    case 'GET':
        $id = $_GET['id'] ?? null;
        $search = $_GET['search'] ?? '';
        $estado = $_GET['estado'] ?? $_GET['status'] ?? '';
        
        if ($id) {
            $stmt = $conn->prepare("SELECT p.*, pr.nombre as proveedor_nombre, u.nombre as creado_por_nombre 
                                   FROM pedidos p 
                                   LEFT JOIN proveedores pr ON p.proveedor_id = pr.id 
                                   LEFT JOIN usuarios u ON p.creado_por = u.id 
                                   WHERE p.id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $pedido = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            
            // Mapear estado de BD a frontend
            if ($pedido) {
                $pedido = mapearPedido($pedido);
            }
            
            // Obtener productos del pedido
            $prodStmt = $conn->prepare("SELECT pp.*, pr.nombre as producto_nombre 
                                       FROM pedido_productos pp 
                                       LEFT JOIN productos pr ON pp.producto_id = pr.id 
                                       WHERE pp.pedido_id = ?");
            $prodStmt->bind_param("i", $id);
            $prodStmt->execute();
            $productos = [];
            $prodResult = $prodStmt->get_result();
            while ($row = $prodResult->fetch_assoc()) {
                $productos[] = $row;
            }
            $pedido['productos'] = $productos;
            $prodStmt->close();
            
            sendResponse($pedido);
        } else {
            $sql = "SELECT p.*, pr.nombre as proveedor_nombre, u.nombre as creado_por_nombre 
                   FROM pedidos p 
                   LEFT JOIN proveedores pr ON p.proveedor_id = pr.id 
                   LEFT JOIN usuarios u ON p.creado_por = u.id 
                   WHERE 1=1";
            
            $params = [];
            $types = '';
            
            if (!empty($search)) {
                $sql .= " AND (p.numero_pedido LIKE ? OR pr.nombre LIKE ?)";
                $searchTerm = "%$search%";
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $types .= "ss";
            }
            
            if (!empty($estado) && $estado !== 'all') {
                // Mapear estado del frontend a BD para búsqueda
                // confirmado en frontend -> en_transito en BD
                // enviado en frontend -> enviado en BD
                if ($estado === 'confirmado') {
                    $sql .= " AND p.estado = 'en_transito'";
                    // No agregar parámetro ya que es un valor literal
                } else {
                    $estado_bd = estadoToBD($estado);
                    $sql .= " AND p.estado = ?";
                    $params[] = $estado_bd;
                    $types .= "s";
                }
            }
            
            $sql .= " ORDER BY p.fecha_creacion DESC";
            
            if (!empty($params)) {
                $stmt = $conn->prepare($sql);
                $stmt->bind_param($types, ...$params);
                $stmt->execute();
            } else {
                $stmt = $conn->prepare($sql);
                $stmt->execute();
            }
            $result = $stmt->get_result();
            
            $pedidos = [];
            while ($row = $result->fetch_assoc()) {
                // Obtener productos de cada pedido
                $prodStmt = $conn->prepare("SELECT pp.*, pr.nombre as producto_nombre 
                                           FROM pedido_productos pp 
                                           LEFT JOIN productos pr ON pp.producto_id = pr.id 
                                           WHERE pp.pedido_id = ?");
                $prodStmt->bind_param("i", $row['id']);
                $prodStmt->execute();
                $productos = [];
                $prodResult = $prodStmt->get_result();
                while ($prodRow = $prodResult->fetch_assoc()) {
                    $productos[] = $prodRow;
                }
                $row['productos'] = $productos;
                // Mapear estado de BD a frontend antes de agregar al array
                $row = mapearPedido($row);
                $pedidos[] = $row;
                $prodStmt->close();
            }
            $stmt->close();
            
            sendResponse($pedidos);
        }
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        $proveedor_id = $data['proveedor_id'] ?? null;
        $fecha_entrega = $data['fecha_entrega_estimada'] ?? null; // Opcional
        $notas = $data['notas'] ?? '';
        $creado_por = $data['creado_por'] ?? 1;
        $productos = $data['productos'] ?? [];
        $monto_total = $data['monto_total'] ?? 0.00;
        
        // Validaciones
        if (!$proveedor_id || !is_numeric($proveedor_id)) {
            sendError('Proveedor requerido', 400);
        }
        
        if (empty($productos) || !is_array($productos)) {
            sendError('Debe incluir al menos un producto en el pedido', 400);
        }
        
        // Validar que cada producto tenga los datos requeridos
        foreach ($productos as $index => $producto) {
            if (!isset($producto['producto_id']) || !is_numeric($producto['producto_id'])) {
                sendError("Producto #" . ($index + 1) . ": ID de producto requerido", 400);
            }
            if (!isset($producto['cantidad']) || !is_numeric($producto['cantidad']) || $producto['cantidad'] <= 0) {
                sendError("Producto #" . ($index + 1) . ": Cantidad debe ser mayor a 0", 400);
            }
            if (!isset($producto['precio_unitario']) || !is_numeric($producto['precio_unitario']) || $producto['precio_unitario'] < 0) {
                sendError("Producto #" . ($index + 1) . ": Precio unitario requerido", 400);
            }
        }
        
        // Generar número de pedido único
        $numero_pedido = 'PO-' . date('Y') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
        
        // Verificar que el número de pedido no exista
        $checkStmt = $conn->prepare("SELECT id FROM pedidos WHERE numero_pedido = ?");
        $attempts = 0;
        while ($attempts < 100) {
            $checkStmt->bind_param("s", $numero_pedido);
            $checkStmt->execute();
            $result = $checkStmt->get_result();
            if ($result->num_rows === 0) {
                break;
            }
            $numero_pedido = 'PO-' . date('Y') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
            $attempts++;
        }
        $checkStmt->close();
        
        $conn->begin_transaction();
        
        try {
            // Insertar el pedido (estado inicial: pendiente)
            $estado = estadoToBD('pendiente'); // Ahora pendiente se mantiene como pendiente
            $stmt = $conn->prepare("INSERT INTO pedidos (numero_pedido, proveedor_id, fecha_entrega_estimada, notas, creado_por, monto_total, estado) 
                                   VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("sisssds", $numero_pedido, $proveedor_id, $fecha_entrega, $notas, $creado_por, $monto_total, $estado);
            $stmt->execute();
            $pedido_id = $conn->insert_id;
            $stmt->close();
            
            // Insertar productos del pedido
            $prodStmt = $conn->prepare("INSERT INTO pedido_productos (pedido_id, producto_id, cantidad, precio_unitario, subtotal) 
                                       VALUES (?, ?, ?, ?, ?)");
            
            $productosInfo = [];
            foreach ($productos as $producto) {
                $producto_id = intval($producto['producto_id']);
                $cantidad = intval($producto['cantidad']);
                $precio_unitario = floatval($producto['precio_unitario']);
                $subtotal = $cantidad * $precio_unitario;
                
                $prodStmt->bind_param("iiidd", $pedido_id, $producto_id, $cantidad, $precio_unitario, $subtotal);
                $prodStmt->execute();
                
                $productosInfo[] = "Producto ID $producto_id: $cantidad unidades x $" . number_format($precio_unitario, 2) . " = $" . number_format($subtotal, 2);
            }
            $prodStmt->close();
            
            // Obtener nombre del usuario para auditoría
            $userStmt = $conn->prepare("SELECT nombre FROM usuarios WHERE id = ?");
            $userStmt->bind_param("i", $creado_por);
            $userStmt->execute();
            $userResult = $userStmt->get_result();
            $nombre_usuario = 'Sistema';
            if ($userRow = $userResult->fetch_assoc()) {
                $nombre_usuario = $userRow['nombre'];
            }
            $userStmt->close();
            
            // Registrar en auditoría
            $auditStmt = $conn->prepare("INSERT INTO auditoria (usuario_id, nombre_usuario, accion, entidad, entidad_id, cambios) 
                                       VALUES (?, ?, ?, ?, ?, ?)");
            $accion = 'Creación de pedido';
            $entidad = 'Pedido';
            $entidad_id_str = (string)$pedido_id;
            $cambios = "Pedido creado: $numero_pedido - Total: $" . number_format($monto_total, 2) . "\nProductos:\n" . implode("\n", $productosInfo);
            $auditStmt->bind_param("isssss", $creado_por, $nombre_usuario, $accion, $entidad, $entidad_id_str, $cambios);
            $auditStmt->execute();
            $auditStmt->close();
            
            $conn->commit();
            sendResponse(['success' => true, 'id' => $pedido_id, 'numero_pedido' => $numero_pedido, 'message' => 'Pedido creado exitosamente'], 201);
            
        } catch (Exception $e) {
            $conn->rollback();
            sendError('Error al crear pedido: ' . $e->getMessage(), 500);
        } catch (Error $e) {
            $conn->rollback();
            sendError('Error fatal: ' . $e->getMessage(), 500);
        }
        break;
        
    case 'PUT':
        // Actualizar estado del pedido
        $data = json_decode(file_get_contents('php://input'), true);
        $pedido_id = $data['id'] ?? $_GET['id'] ?? null;
        $nuevo_estado = $data['nuevo_estado'] ?? $data['estado'] ?? null;
        
        if (!$pedido_id || !is_numeric($pedido_id)) {
            sendError('ID de pedido requerido', 400);
        }
        
        // Validar que el estado sea uno de los permitidos (ahora la BD usa español directamente)
        $estados_permitidos = ['pendiente', 'confirmado', 'enviado', 'en_transito', 'entregado', 'cancelado'];
        if (!$nuevo_estado || !in_array($nuevo_estado, $estados_permitidos)) {
            sendError('Estado inválido. Estados permitidos: ' . implode(', ', $estados_permitidos) . '. Estado recibido: ' . ($nuevo_estado ?? 'null'), 400);
        }
        
        // Mapear estado del frontend a BD (ahora la BD usa español directamente)
        // El frontend envía: pendiente, confirmado, enviado, entregado, cancelado
        // La BD espera: pendiente, enviado, en_transito, entregado, cancelado
        $nuevo_estado_bd = estadoToBD($nuevo_estado);
        
        // Debug: Log para verificar el mapeo
        error_log("DEBUG: Estado recibido: '$nuevo_estado', Estado mapeado a BD: '$nuevo_estado_bd'");
        
        // Validar que el estado mapeado sea uno de los valores válidos del ENUM
        $estados_validos_bd = ['pendiente', 'enviado', 'en_transito', 'entregado', 'cancelado'];
        if (!in_array($nuevo_estado_bd, $estados_validos_bd)) {
            sendError('Error: Estado inválido para la base de datos. Estado recibido: "' . $nuevo_estado . '", Estado mapeado: "' . $nuevo_estado_bd . '". Estados válidos: ' . implode(', ', $estados_validos_bd), 400);
        }
        
        $conn->begin_transaction();
        
        try {
            // Obtener el pedido actual y sus productos
            $pedidoStmt = $conn->prepare("SELECT estado, proveedor_id FROM pedidos WHERE id = ?");
            $pedidoStmt->bind_param("i", $pedido_id);
            $pedidoStmt->execute();
            $result = $pedidoStmt->get_result();
            $pedidoActual = $result->fetch_assoc();
            $pedidoStmt->close();
            
            if (!$pedidoActual) {
                throw new Exception('Pedido no encontrado');
            }
            
            // Obtener estado actual de BD (ahora en español)
            $estado_actual_bd = trim($pedidoActual['estado'] ?? '');
            
            // Validar que el estado actual no esté vacío
            if (empty($estado_actual_bd)) {
                error_log("WARNING: Estado actual vacío para pedido ID: $pedido_id. Asignando 'pendiente' por defecto.");
                // Si está vacío, actualizar a 'pendiente' y continuar
                $updateDefStmt = $conn->prepare("UPDATE pedidos SET estado = 'pendiente' WHERE id = ?");
                $updateDefStmt->bind_param("i", $pedido_id);
                $updateDefStmt->execute();
                $updateDefStmt->close();
                $estado_actual_bd = 'pendiente';
            }
            
            error_log("DEBUG: Estado actual en BD para pedido $pedido_id: '$estado_actual_bd'");
            
            // Mapear estado actual de BD a frontend para comparación
            $estado_actual_frontend = estadoFromBD($estado_actual_bd);
            
            // Validar que no se pueda modificar un pedido ya entregado
            if ($estado_actual_frontend === 'entregado' || $estado_actual_bd === 'entregado') {
                throw new Exception('No se puede modificar el estado de un pedido que ya fue entregado');
            }
            
            // Verificar si el estado ya es el mismo (comparar en BD)
            if ($estado_actual_bd === $nuevo_estado_bd) {
                // El estado ya es el mismo, no hacer nada pero retornar éxito
                $conn->commit();
                sendResponse(['success' => true, 'message' => 'El pedido ya tiene ese estado'], 200);
            }
            
            // Si el estado cambia a "entregado", procesar la entrega
            if ($nuevo_estado === 'entregado' && $estado_actual_frontend !== 'entregado') {
                // Obtener productos del pedido
                $productosStmt = $conn->prepare("SELECT producto_id, cantidad FROM pedido_productos WHERE pedido_id = ?");
                $productosStmt->bind_param("i", $pedido_id);
                $productosStmt->execute();
                $productosResult = $productosStmt->get_result();
                
                while ($prod = $productosResult->fetch_assoc()) {
                    $producto_id = $prod['producto_id'];
                    $cantidad = $prod['cantidad'];
                    
                    // Actualizar stock del producto
                    $updateStockStmt = $conn->prepare("UPDATE productos SET stock = stock + ? WHERE id = ?");
                    $updateStockStmt->bind_param("ii", $cantidad, $producto_id);
                    $updateStockStmt->execute();
                    $updateStockStmt->close();
                    
                    // Generar referencia automática para el movimiento
                    $countStmt = $conn->prepare("SELECT COUNT(*) as total FROM movimientos WHERE tipo = 'entry'");
                    $countStmt->execute();
                    $countResult = $countStmt->get_result();
                    $countRow = $countResult->fetch_assoc();
                    $nextNumber = intval($countRow['total']) + 1;
                    $countStmt->close();
                    $referencia = 'ENTR-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
                    
                    // Obtener número de pedido para las notas
                    $numeroStmt = $conn->prepare("SELECT numero_pedido FROM pedidos WHERE id = ?");
                    $numeroStmt->bind_param("i", $pedido_id);
                    $numeroStmt->execute();
                    $numeroResult = $numeroStmt->get_result();
                    $numeroRow = $numeroResult->fetch_assoc();
                    $numero_pedido_actual = $numeroRow['numero_pedido'] ?? 'PO-' . $pedido_id;
                    $numeroStmt->close();
                    
                    // Registrar movimiento de entrada
                    $movimientoStmt = $conn->prepare("INSERT INTO movimientos (tipo, producto_id, cantidad, responsable_id, referencia, notas) 
                                                     VALUES ('entry', ?, ?, ?, ?, ?)");
                    $responsable_id = $data['usuario_id'] ?? 1;
                    $notas_movimiento = "Entrada por pedido entregado: " . $numero_pedido_actual;
                    $movimientoStmt->bind_param("iiiss", $producto_id, $cantidad, $responsable_id, $referencia, $notas_movimiento);
                    $movimientoStmt->execute();
                    $movimientoStmt->close();
                    
                    // Verificar si hay alertas de stock bajo que generar
                    $checkStockStmt = $conn->prepare("SELECT stock, stock_minimo, nombre FROM productos WHERE id = ?");
                    $checkStockStmt->bind_param("i", $producto_id);
                    $checkStockStmt->execute();
                    $productoData = $checkStockStmt->get_result()->fetch_assoc();
                    $checkStockStmt->close();
                    
                    if ($productoData && $productoData['stock'] < $productoData['stock_minimo']) {
                        $alertStmt = $conn->prepare("INSERT INTO alertas (tipo, titulo, mensaje, producto_id, severidad) 
                                                     VALUES ('low_stock', ?, ?, ?, 'high')");
                        $titulo = "Stock Bajo - " . $productoData['nombre'];
                        $mensaje = "El producto está por debajo del umbral mínimo (" . $productoData['stock'] . "/" . $productoData['stock_minimo'] . ")";
                        $alertStmt->bind_param("ssi", $titulo, $mensaje, $producto_id);
                        $alertStmt->execute();
                        $alertStmt->close();
                    }
                }
                $productosStmt->close();
            }
            
            // Actualizar el estado del pedido (usar el estado mapeado a BD)
            $updateStmt = $conn->prepare("UPDATE pedidos SET estado = ? WHERE id = ?");
            if (!$updateStmt) {
                throw new Exception('Error al preparar consulta UPDATE: ' . $conn->error);
            }
            
            $updateStmt->bind_param("si", $nuevo_estado_bd, $pedido_id);
            
            if (!$updateStmt->execute()) {
                throw new Exception('Error al ejecutar UPDATE: ' . $updateStmt->error . ' | Estado intentado: ' . $nuevo_estado_bd);
            }
            
            // Verificar que realmente se actualizó
            $affectedRows = $updateStmt->affected_rows;
            $updateStmt->close();
            
            // Si no se actualizó, puede ser que el estado ya sea el mismo (aunque ya lo verificamos antes)
            // O que el pedido no exista
            if ($affectedRows === 0) {
                // Verificar nuevamente si el pedido existe y su estado
                $checkStmt = $conn->prepare("SELECT estado FROM pedidos WHERE id = ?");
                $checkStmt->bind_param("i", $pedido_id);
                $checkStmt->execute();
                $checkResult = $checkStmt->get_result();
                $checkRow = $checkResult->fetch_assoc();
                $checkStmt->close();
                
                if (!$checkRow) {
                    throw new Exception('El pedido no existe en la base de datos');
                }
                
                $estado_actual_check = $checkRow['estado'] ?? '';
                
                // Si el estado es el mismo, no es un error, solo informar
                if ($estado_actual_check === $nuevo_estado_bd) {
                    $conn->commit();
                    sendResponse(['success' => true, 'message' => 'El pedido ya tiene ese estado'], 200);
                } else {
                    // Comparar usando mapeo para ver si son equivalentes
                    $estado_actual_mapped = estadoFromBD($estado_actual_check);
                    $nuevo_estado_mapped = estadoFromBD($nuevo_estado_bd);
                    if ($estado_actual_mapped === $nuevo_estado_mapped) {
                        $conn->commit();
                        sendResponse(['success' => true, 'message' => 'El pedido ya tiene ese estado'], 200);
                    } else {
                        throw new Exception('No se pudo actualizar el estado. Estado actual en BD: "' . $estado_actual_check . '", Estado intentado: "' . $nuevo_estado_bd . '"');
                    }
                }
            }
            
            // Verificar que el estado se guardó correctamente
            $verifyStmt = $conn->prepare("SELECT estado FROM pedidos WHERE id = ?");
            $verifyStmt->bind_param("i", $pedido_id);
            $verifyStmt->execute();
            $verifyResult = $verifyStmt->get_result();
            $verifyRow = $verifyResult->fetch_assoc();
            $verifyStmt->close();
            
            $estado_guardado = $verifyRow['estado'] ?? 'null';
            error_log("DEBUG: Estado guardado en BD: '$estado_guardado', Estado esperado: '$nuevo_estado_bd'");
            
            if (!$verifyRow) {
                throw new Exception('No se pudo verificar el estado guardado. El pedido puede no existir.');
            }
            
            // Verificar que el estado se guardó correctamente (puede ser que esté en formato diferente)
            if ($estado_guardado !== $nuevo_estado_bd) {
                // Intentar mapear de vuelta para comparar
                $estado_guardado_frontend = estadoFromBD($estado_guardado);
                $nuevo_estado_frontend = estadoFromBD($nuevo_estado_bd);
                
                // Si ambos mapean al mismo valor en frontend, está bien
                if ($estado_guardado_frontend !== $nuevo_estado_frontend) {
                    throw new Exception('El estado no se guardó correctamente. Estado esperado (BD): ' . $nuevo_estado_bd . ', Estado guardado: ' . $estado_guardado);
                }
            }
            
            // Obtener nombre del usuario para auditoría
            $usuario_id = $data['usuario_id'] ?? 1;
            $userStmt = $conn->prepare("SELECT nombre FROM usuarios WHERE id = ?");
            $userStmt->bind_param("i", $usuario_id);
            $userStmt->execute();
            $userResult = $userStmt->get_result();
            $nombre_usuario = 'Sistema';
            if ($userRow = $userResult->fetch_assoc()) {
                $nombre_usuario = $userRow['nombre'];
            }
            $userStmt->close();
            
            // Registrar en auditoría
            $auditStmt = $conn->prepare("INSERT INTO auditoria (usuario_id, nombre_usuario, accion, entidad, entidad_id, cambios) 
                                       VALUES (?, ?, ?, ?, ?, ?)");
            $accion = 'Actualización de estado de pedido';
            $entidad = 'Pedido';
            $entidad_id_str = (string)$pedido_id;
            $estado_anterior_frontend = estadoFromBD($pedidoActual['estado']);
            $cambios = "Estado cambiado de '$estado_anterior_frontend' a '$nuevo_estado'";
            if ($nuevo_estado === 'entregado') {
                $cambios .= " - Stock actualizado automáticamente";
            }
            $auditStmt->bind_param("isssss", $usuario_id, $nombre_usuario, $accion, $entidad, $entidad_id_str, $cambios);
            $auditStmt->execute();
            $auditStmt->close();
            
            $conn->commit();
            
            // Generar notificaciones
            if ($nuevo_estado === 'entregado') {
                // Crear alerta de entrega completada
                $alertStmt = $conn->prepare("INSERT INTO alertas (tipo, titulo, mensaje, severidad) 
                                            VALUES ('system', ?, ?, 'medium')");
                $titulo = "Pedido Entregado";
                $mensaje = "El pedido ha sido marcado como entregado. El inventario ha sido actualizado.";
                $alertStmt->bind_param("ss", $titulo, $mensaje);
                $alertStmt->execute();
                $alertStmt->close();
            }
            
            sendResponse(['success' => true, 'message' => 'Estado del pedido actualizado exitosamente'], 200);
            
        } catch (Exception $e) {
            $conn->rollback();
            sendError('Error al actualizar estado del pedido: ' . $e->getMessage(), 500);
        } catch (Error $e) {
            $conn->rollback();
            sendError('Error fatal: ' . $e->getMessage(), 500);
        }
        break;
        
    default:
        sendError('Método no permitido', 405);
}

$conn->close();
