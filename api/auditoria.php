<?php
require_once 'config.php';

$conn = getDBConnection();

// Ya no usamos búsqueda por texto, solo devolvemos todos los logs
// El filtrado por año se hace en el frontend
$sql = "SELECT * FROM auditoria ORDER BY fecha DESC";

$result = $conn->query($sql);

if (!$result) {
    sendError('Error en consulta de auditoría: ' . $conn->error, 500);
}

$logs = [];
while ($row = $result->fetch_assoc()) {
    $logs[] = $row;
}

$conn->close();

sendResponse($logs);
