<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$conn = getDBConnection();

switch ($method) {
    case 'GET':
        $id = $_GET['id'] ?? null;
        $filtro = $_GET['filtro'] ?? 'all';
        
        if ($id) {
            $stmt = $conn->prepare("SELECT a.*, p.nombre as producto_nombre 
                                   FROM alertas a 
                                   LEFT JOIN productos p ON a.producto_id = p.id 
                                   WHERE a.id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $alerta = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            
            // Normalizar el campo leida a booleano
            if ($alerta) {
                $alerta['leida'] = (bool)(int)$alerta['leida'];
            }
            
            sendResponse($alerta);
        } else {
            $sql = "SELECT a.*, p.nombre as producto_nombre 
                   FROM alertas a 
                   LEFT JOIN productos p ON a.producto_id = p.id 
                   WHERE 1=1";
            
            if ($filtro === 'unread') {
                $sql .= " AND a.leida = FALSE";
            } elseif ($filtro === 'high') {
                $sql .= " AND a.severidad = 'high'";
            }
            
            $sql .= " ORDER BY a.fecha_creacion DESC";
            
            $result = $conn->query($sql);
            $alertas = [];
            while ($row = $result->fetch_assoc()) {
                // Normalizar el campo leida a booleano (MySQL devuelve 0/1 como string)
                $row['leida'] = (bool)(int)$row['leida'];
                $alertas[] = $row;
            }
            
            sendResponse($alertas);
        }
        break;
        
    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'] ?? null;
        $action = $data['action'] ?? '';
        
        if ($action === 'mark_read') {
            $stmt = $conn->prepare("UPDATE alertas SET leida = TRUE WHERE id = ?");
            $stmt->bind_param("i", $id);
            
            if ($stmt->execute()) {
                sendResponse(['success' => true, 'message' => 'Alerta marcada como leída']);
            } else {
                sendError('Error al actualizar alerta');
            }
            $stmt->close();
        } else {
            sendError('Acción no válida');
        }
        break;
        
    case 'DELETE':
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            sendError('ID de alerta requerido');
        }
        
        $stmt = $conn->prepare("DELETE FROM alertas WHERE id = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            sendResponse(['success' => true, 'message' => 'Alerta eliminada exitosamente']);
        } else {
            sendError('Error al eliminar alerta');
        }
        $stmt->close();
        break;
        
    default:
        sendError('Método no permitido', 405);
}

$conn->close();
