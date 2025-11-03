<?php
// Desactivar errores visuales que puedan romper el JSON
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Método no permitido', 405);
}

try {
    $conn = getDBConnection();
} catch (Exception $e) {
    sendError('Error de conexión: ' . $e->getMessage(), 500);
}

try {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendError('Error al decodificar JSON: ' . json_last_error_msg(), 400);
    }
    
    if (!isset($data['products']) || !is_array($data['products'])) {
        sendError('Se esperaba un array de productos', 400);
    }
    
    $products = $data['products'];
    $imported = 0;
    $errors = [];
    
    // Preparar statement para insertar productos
    $stmt = $conn->prepare("INSERT INTO productos (sku, nombre, descripcion, categoria_id, stock, stock_minimo, precio, proveedor_id) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    
    // Preparar statements para buscar categoría y proveedor
    $catStmt = $conn->prepare("SELECT id FROM categorias WHERE nombre = ?");
    $provStmt = $conn->prepare("SELECT id FROM proveedores WHERE nombre = ?");
    
    // Preparar statement para verificar SKU existente
    $skuCheckStmt = $conn->prepare("SELECT id FROM productos WHERE sku = ?");
    
    // Obtener el total actual de productos para generar SKUs
    $countResult = $conn->query("SELECT COUNT(*) as total FROM productos");
    $countRow = $countResult->fetch_assoc();
    $baseNumber = intval($countRow['total']);
    
    foreach ($products as $index => $product) {
        try {
            // Obtener datos del producto
            $nombre = trim($product['nombre'] ?? '');
            $descripcion = trim($product['descripcion'] ?? '');
            $categoria = trim($product['categoria'] ?? '');
            $proveedor = trim($product['proveedor'] ?? '');
            $stock = intval($product['stock'] ?? 0);
            $stock_minimo = intval($product['stock_minimo'] ?? 0);
            $precio = floatval($product['precio'] ?? 0);
            $sku = trim($product['sku'] ?? '');
            
            // Validaciones
            if (empty($nombre)) {
                $errors[] = "Fila " . ($index + 2) . ": El nombre es requerido";
                continue;
            }
            
            if (empty($categoria)) {
                $errors[] = "Fila " . ($index + 2) . ": La categoría es requerida";
                continue;
            }
            
            if (empty($proveedor)) {
                $errors[] = "Fila " . ($index + 2) . ": El proveedor es requerido";
                continue;
            }
            
            // Generar SKU si no se proporciona
            if (empty($sku)) {
                $baseNumber++;
                $sku = 'PROD-' . str_pad($baseNumber, 4, '0', STR_PAD_LEFT);
                
                // Verificar que el SKU generado no exista
                $attempts = 0;
                while ($attempts < 100) {
                    $skuCheckStmt->bind_param("s", $sku);
                    $skuCheckStmt->execute();
                    $skuResult = $skuCheckStmt->get_result();
                    if ($skuResult->num_rows == 0) {
                        break;
                    }
                    $baseNumber++;
                    $sku = 'PROD-' . str_pad($baseNumber, 4, '0', STR_PAD_LEFT);
                    $attempts++;
                }
            } else {
                // Verificar que el SKU proporcionado no exista
                $skuCheckStmt->bind_param("s", $sku);
                $skuCheckStmt->execute();
                $skuResult = $skuCheckStmt->get_result();
                if ($skuResult->num_rows > 0) {
                    $errors[] = "Fila " . ($index + 2) . ": El SKU '$sku' ya existe";
                    continue;
                }
            }
            
            // Obtener categoria_id
            $catStmt->bind_param("s", $categoria);
            $catStmt->execute();
            $catResult = $catStmt->get_result();
            $categoria_id = null;
            if ($catRow = $catResult->fetch_assoc()) {
                $categoria_id = $catRow['id'];
            } else {
                $errors[] = "Fila " . ($index + 2) . ": Categoría '$categoria' no encontrada";
                continue;
            }
            
            // Obtener proveedor_id
            $provStmt->bind_param("s", $proveedor);
            $provStmt->execute();
            $provResult = $provStmt->get_result();
            $proveedor_id = null;
            if ($provRow = $provResult->fetch_assoc()) {
                $proveedor_id = $provRow['id'];
            } else {
                $errors[] = "Fila " . ($index + 2) . ": Proveedor '$proveedor' no encontrado";
                continue;
            }
            
            // Insertar producto
            $stmt->bind_param("sssiiidd", $sku, $nombre, $descripcion, $categoria_id, $stock, $stock_minimo, $precio, $proveedor_id);
            
            if ($stmt->execute()) {
                $imported++;
                
                // Registrar en auditoría
                try {
                    $producto_id = $conn->insert_id;
                    $auditStmt = $conn->prepare("INSERT INTO auditoria (usuario_id, nombre_usuario, accion, entidad, entidad_id, cambios) 
                                                VALUES (?, ?, ?, ?, ?, ?)");
                    if ($auditStmt) {
                        $usuario_id = 1;
                        $nombre_usuario = 'Sistema';
                        $accion = 'Importación CSV de producto';
                        $entidad = 'Producto';
                        $entidad_id_str = (string)$producto_id;
                        $cambios = "Producto importado desde CSV: $nombre";
                        $auditStmt->bind_param("isssss", $usuario_id, $nombre_usuario, $accion, $entidad, $entidad_id_str, $cambios);
                        $auditStmt->execute();
                        $auditStmt->close();
                    }
                } catch (Exception $e) {
                    // Continuar aunque falle la auditoría
                }
            } else {
                $errors[] = "Fila " . ($index + 2) . ": Error al insertar - " . $conn->error;
            }
            
        } catch (Exception $e) {
            $errors[] = "Fila " . ($index + 2) . ": " . $e->getMessage();
        }
    }
    
    $stmt->close();
    $catStmt->close();
    $provStmt->close();
    $skuCheckStmt->close();
    
    sendResponse([
        'success' => true,
        'imported' => $imported,
        'total' => count($products),
        'errors' => $errors,
        'message' => "Se importaron $imported de " . count($products) . " productos"
    ]);
    
} catch (Exception $e) {
    sendError('Error al procesar importación: ' . $e->getMessage() . ' en línea ' . $e->getLine(), 500);
} catch (Error $e) {
    sendError('Error fatal: ' . $e->getMessage() . ' en línea ' . $e->getLine(), 500);
}

if (isset($conn) && $conn) {
    $conn->close();
}

