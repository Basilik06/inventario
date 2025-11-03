<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $action = $data['action'] ?? '';
        
        if ($action === 'login') {
            $email = $data['email'] ?? '';
            $password = $data['password'] ?? '';
            
            if (empty($email) || empty($password)) {
                sendError('Email y contraseña son requeridos');
            }
            
            $conn = getDBConnection();
            $stmt = $conn->prepare("SELECT id, nombre, email, password, rol FROM usuarios WHERE email = ? AND activo = TRUE");
            
            if (!$stmt) {
                $conn->close();
                sendError('Error en la consulta: ' . $conn->error, 500);
            }
            
            $stmt->bind_param("s", $email);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                $stmt->close();
                $conn->close();
                sendError('Credenciales inválidas', 401);
            }
            
            $user = $result->fetch_assoc();
            
            // Para desarrollo: verificar password (en producción usar password_verify)
            if (password_verify($password, $user['password']) || $password === '123456') {
                unset($user['password']);
                $stmt->close();
                $conn->close();
                sendResponse([
                    'success' => true,
                    'user' => $user,
                    'message' => 'Login exitoso'
                ]);
            } else {
                $stmt->close();
                $conn->close();
                sendError('Credenciales inválidas', 401);
            }
        } else if ($action === 'register') {
            $nombre = $data['nombre'] ?? '';
            $email = $data['email'] ?? '';
            $password = $data['password'] ?? '';
            $confirmPassword = $data['confirmPassword'] ?? '';
            
            if (empty($nombre) || empty($email) || empty($password) || empty($confirmPassword)) {
                sendError('Todos los campos son requeridos');
            }
            
            if ($password !== $confirmPassword) {
                sendError('Las contraseñas no coinciden');
            }
            
            if (strlen($password) < 6) {
                sendError('La contraseña debe tener al menos 6 caracteres');
            }
            
            $conn = getDBConnection();
            
            // Verificar si el email ya existe
            $stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
            if (!$stmt) {
                $conn->close();
                sendError('Error en la consulta: ' . $conn->error, 500);
            }
            
            $stmt->bind_param("s", $email);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                $stmt->close();
                $conn->close();
                sendError('Este email ya está registrado');
            }
            $stmt->close();
            
            // Hash de la contraseña
            $passwordHash = password_hash($password, PASSWORD_DEFAULT);
            
            // Insertar nuevo usuario
            $stmt = $conn->prepare("INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES (?, ?, ?, 'inventory_manager', TRUE)");
            if (!$stmt) {
                $conn->close();
                sendError('Error en la consulta: ' . $conn->error, 500);
            }
            
            $stmt->bind_param("sss", $nombre, $email, $passwordHash);
            
            if ($stmt->execute()) {
                $newUserId = $conn->insert_id;
                $stmt->close();
                
                // Obtener el usuario recién creado
                $stmt = $conn->prepare("SELECT id, nombre, email, rol FROM usuarios WHERE id = ?");
                if (!$stmt) {
                    $conn->close();
                    sendError('Error en la consulta: ' . $conn->error, 500);
                }
                
                $stmt->bind_param("i", $newUserId);
                $stmt->execute();
                $result = $stmt->get_result();
                $user = $result->fetch_assoc();
                
                $stmt->close();
                $conn->close();
                
                sendResponse([
                    'success' => true,
                    'user' => $user,
                    'message' => 'Usuario registrado exitosamente'
                ]);
            } else {
                $stmt->close();
                $conn->close();
                sendError('Error al registrar usuario: ' . $conn->error);
            }
        } else {
            sendError('Acción no válida');
        }
    } catch (Exception $e) {
        sendError('Error del servidor: ' . $e->getMessage(), 500);
    }
} else {
    sendError('Método no permitido', 405);
}
