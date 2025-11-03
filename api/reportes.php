<?php
require_once 'config.php';

$conn = getDBConnection();

// Obtener datos para reportes

// 1. Rotación de productos (productos con más movimientos)
$result = $conn->query("
    SELECT 
        p.nombre as product,
        COUNT(m.id) as rotacion
    FROM productos p
    LEFT JOIN movimientos m ON m.producto_id = p.id
    WHERE p.activo = TRUE
    GROUP BY p.id, p.nombre
    ORDER BY rotacion DESC
    LIMIT 10
");
$rotationData = [];
while ($row = $result->fetch_assoc()) {
    $rotationData[] = [
        'product' => $row['product'],
        'rotacion' => (int)$row['rotacion']
    ];
}

// 2. Datos mensuales de ventas/compras (últimos 6 meses)
$result = $conn->query("
    SELECT 
        DATE_FORMAT(m.fecha_movimiento, '%Y-%m') as mes,
        DATE_FORMAT(m.fecha_movimiento, '%b') as mes_nombre,
        SUM(CASE WHEN m.tipo = 'exit' THEN m.cantidad * p.precio ELSE 0 END) as ventas,
        SUM(CASE WHEN m.tipo = 'entry' THEN m.cantidad * p.precio ELSE 0 END) as compras
    FROM movimientos m
    INNER JOIN productos p ON p.id = m.producto_id
    WHERE m.fecha_movimiento >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
    GROUP BY mes, mes_nombre
    ORDER BY mes ASC
");
$monthlyData = [];
while ($row = $result->fetch_assoc()) {
    $ventas = (float)$row['ventas'];
    $compras = (float)$row['compras'];
    $margen = $ventas - $compras;
    $monthlyData[] = [
        'month' => $row['mes_nombre'],
        'ventas' => $ventas,
        'compras' => $compras,
        'margen' => $margen
    ];
}

$reportes = [
    'rotationData' => $rotationData,
    'monthlyData' => $monthlyData
];

$conn->close();
sendResponse($reportes);

