<?php
require_once 'config.php';

$conn = getDBConnection();

// Verificar errores de conexión
if ($conn->connect_error) {
    sendError('Error de conexión: ' . $conn->connect_error, 500);
}

// Obtener estadísticas del dashboard
$stats = [];

// Inventario Total
$result = $conn->query("SELECT SUM(stock) as total FROM productos WHERE activo = TRUE");
if (!$result) {
    sendError('Error en consulta de inventario total: ' . $conn->error, 500);
}
$row = $result->fetch_assoc();
$stats['inventario_total'] = (int)($row['total'] ?? 0);

// Productos con stock bajo
$result = $conn->query("SELECT COUNT(*) as total FROM productos WHERE stock < stock_minimo AND activo = TRUE");
if (!$result) {
    sendError('Error en consulta de stock bajo: ' . $conn->error, 500);
}
$row = $result->fetch_assoc();
$stats['stock_bajo'] = (int)($row['total'] ?? 0);

// Pedidos pendientes (ahora la BD usa español directamente: 'pendiente')
$result = $conn->query("SELECT COUNT(*) as total FROM pedidos WHERE estado = 'pendiente'");
if (!$result) {
    sendError('Error en consulta de pedidos pendientes: ' . $conn->error, 500);
}
$row = $result->fetch_assoc();
$stats['pedidos_pendientes'] = (int)($row['total'] ?? 0);

// Valor total
$result = $conn->query("SELECT SUM(stock * precio) as total FROM productos WHERE activo = TRUE");
if (!$result) {
    sendError('Error en consulta de valor total: ' . $conn->error, 500);
}
$row = $result->fetch_assoc();
$stats['valor_total'] = (float)($row['total'] ?? 0);

// Movimientos recientes
$result = $conn->query("SELECT m.*, p.nombre as producto_nombre, u.nombre as responsable_nombre 
                        FROM movimientos m 
                        LEFT JOIN productos p ON m.producto_id = p.id 
                        LEFT JOIN usuarios u ON m.responsable_id = u.id 
                        ORDER BY m.fecha_movimiento DESC LIMIT 5");
if (!$result) {
    sendError('Error en consulta de movimientos recientes: ' . $conn->error, 500);
}
$movimientos = [];
while ($row = $result->fetch_assoc()) {
    $movimientos[] = $row;
}
$stats['movimientos_recientes'] = $movimientos;

// Productos con stock bajo (detalles)
$result = $conn->query("SELECT *, (stock / stock_minimo * 100) as porcentaje 
                       FROM productos 
                       WHERE stock < stock_minimo AND activo = TRUE 
                       ORDER BY porcentaje ASC LIMIT 5");
if (!$result) {
    sendError('Error en consulta de productos con stock bajo: ' . $conn->error, 500);
}
$productos_bajo = [];
while ($row = $result->fetch_assoc()) {
    $productos_bajo[] = $row;
}
$stats['productos_stock_bajo'] = $productos_bajo;

// Alertas no leídas
$result = $conn->query("SELECT * FROM alertas WHERE leida = FALSE ORDER BY fecha_creacion DESC LIMIT 4");
if (!$result) {
    sendError('Error en consulta de alertas: ' . $conn->error, 500);
}
$alertas = [];
while ($row = $result->fetch_assoc()) {
    $alertas[] = $row;
}
$stats['alertas_activas'] = $alertas;

// Datos para gráficos
// 1. Movimientos de stock por mes (últimos 6 meses)
// Generar los últimos 6 meses completos aunque no tengan datos
$mesesEspanol = [
    'Jan' => 'Ene', 'Feb' => 'Feb', 'Mar' => 'Mar', 'Apr' => 'Abr',
    'May' => 'May', 'Jun' => 'Jun', 'Jul' => 'Jul', 'Aug' => 'Ago',
    'Sep' => 'Sep', 'Oct' => 'Oct', 'Nov' => 'Nov', 'Dec' => 'Dic'
];

$result = $conn->query("
    SELECT 
        DATE_FORMAT(months.month_date, '%Y-%m') as mes,
        DATE_FORMAT(months.month_date, '%b') as mes_nombre,
        COALESCE(SUM(CASE WHEN m.tipo = 'entry' THEN m.cantidad ELSE 0 END), 0) as entradas,
        COALESCE(SUM(CASE WHEN m.tipo = 'exit' THEN m.cantidad ELSE 0 END), 0) as salidas
    FROM (
        SELECT DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 5 MONTH), '%Y-%m-01') as month_date
        UNION ALL SELECT DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 4 MONTH), '%Y-%m-01')
        UNION ALL SELECT DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 3 MONTH), '%Y-%m-01')
        UNION ALL SELECT DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 2 MONTH), '%Y-%m-01')
        UNION ALL SELECT DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m-01')
        UNION ALL SELECT DATE_FORMAT(NOW(), '%Y-%m-01')
    ) as months
    LEFT JOIN movimientos m ON DATE_FORMAT(m.fecha_movimiento, '%Y-%m') = DATE_FORMAT(months.month_date, '%Y-%m')
    GROUP BY months.month_date, mes, mes_nombre
    ORDER BY months.month_date ASC
");
if (!$result) {
    $stats['stockData'] = [];
} else {
    $stockData = [];
    while ($row = $result->fetch_assoc()) {
        $mesNombre = $row['mes_nombre'];
        // Convertir a español si es necesario
        if (isset($mesesEspanol[$mesNombre])) {
            $mesNombre = $mesesEspanol[$mesNombre];
        }
        $stockData[] = [
            'month' => $mesNombre,
            'entradas' => (int)$row['entradas'],
            'salidas' => (int)$row['salidas']
        ];
    }
    $stats['stockData'] = $stockData;
}

// 2. Distribución por categoría (stock por categoría)
$result = $conn->query("
    SELECT 
        c.nombre as name,
        SUM(p.stock) as value,
        CASE 
            WHEN c.id = 1 THEN '#27AE60'
            WHEN c.id = 2 THEN '#3498DB'
            WHEN c.id = 3 THEN '#9B59B6'
            WHEN c.id = 4 THEN '#F39C12'
            ELSE CONCAT('#', LPAD(FLOOR(RAND() * 16777215), 6, '0'))
        END as color
    FROM categorias c
    LEFT JOIN productos p ON p.categoria_id = c.id AND p.activo = TRUE
    GROUP BY c.id, c.nombre
    HAVING value > 0
    ORDER BY value DESC
");
if (!$result) {
    $stats['categoryData'] = [];
} else {
    $categoryData = [];
    while ($row = $result->fetch_assoc()) {
        $categoryData[] = [
            'name' => $row['name'],
            'value' => (int)$row['value'],
            'color' => $row['color']
        ];
    }
    $stats['categoryData'] = $categoryData;
}

// 3. Análisis de costos por día (últimos 7 días)
$result = $conn->query("
    SELECT 
        DATE_FORMAT(m.fecha_movimiento, '%W') as dia,
        DATE_FORMAT(m.fecha_movimiento, '%a') as dia_corto,
        SUM(CASE WHEN m.tipo = 'entry' THEN m.cantidad * p.precio ELSE 0 END) as costo
    FROM movimientos m
    INNER JOIN productos p ON p.id = m.producto_id
    WHERE m.fecha_movimiento >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    GROUP BY DATE(m.fecha_movimiento), dia, dia_corto
    ORDER BY DATE(m.fecha_movimiento) ASC
");
if (!$result) {
    $stats['costData'] = [];
} else {
    $costData = [];
    while ($row = $result->fetch_assoc()) {
        $costData[] = [
            'day' => $row['dia_corto'],
            'costo' => (float)$row['costo']
        ];
    }
    $stats['costData'] = $costData;
}

// 4. Estado de pedidos
$result = $conn->query("
    SELECT 
        CASE 
            WHEN estado = 'pendiente' THEN 'Pendiente'
            WHEN estado = 'en_transito' OR estado = 'confirmado' THEN 'En Tránsito'
            WHEN estado = 'enviado' THEN 'Enviado'
            WHEN estado = 'entregado' THEN 'Entregado'
            WHEN estado = 'cancelado' THEN 'Cancelado'
            ELSE estado
        END as estado_display,
        estado,
        COUNT(*) as cantidad
    FROM pedidos
    GROUP BY estado, estado_display
");
if (!$result) {
    $stats['ordersStatusData'] = [];
} else {
    $ordersStatus = [];
    $colors = ['#3498DB', '#9B59B6', '#F39C12', '#27AE60', '#E74C3C'];
    $colorIndex = 0;
    while ($row = $result->fetch_assoc()) {
        $ordersStatus[] = [
            'label' => $row['estado_display'],
            'value' => (int)$row['cantidad'],
            'color' => $colors[$colorIndex % count($colors)]
        ];
        $colorIndex++;
    }
    $stats['ordersStatusData'] = $ordersStatus;
}

// 5. Productos más movidos (Top 5 con más salidas en último mes)
$result = $conn->query("
    SELECT 
        p.nombre as producto,
        SUM(m.cantidad) as total_salidas
    FROM movimientos m
    INNER JOIN productos p ON p.id = m.producto_id
    WHERE m.tipo = 'exit' 
        AND m.fecha_movimiento >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
        AND p.activo = TRUE
    GROUP BY p.id, p.nombre
    ORDER BY total_salidas DESC
    LIMIT 5
");
if (!$result) {
    $stats['topProductsData'] = [];
} else {
    $topProducts = [];
    while ($row = $result->fetch_assoc()) {
        $topProducts[] = [
            'producto' => $row['producto'],
            'total' => (int)$row['total_salidas']
        ];
    }
    $stats['topProductsData'] = $topProducts;
}

// 6. Valor por categoría
$result = $conn->query("
    SELECT 
        c.nombre as categoria,
        SUM(p.stock * p.precio) as valor_total
    FROM categorias c
    LEFT JOIN productos p ON p.categoria_id = c.id AND p.activo = TRUE
    GROUP BY c.id, c.nombre
    HAVING valor_total > 0
    ORDER BY valor_total DESC
");
if (!$result) {
    $stats['valueByCategoryData'] = [];
} else {
    $valueByCategory = [];
    $catColors = ['#27AE60', '#3498DB', '#9B59B6', '#F39C12', '#E74C3C', '#1ABC9C', '#E67E22'];
    $colorIdx = 0;
    while ($row = $result->fetch_assoc()) {
        $valueByCategory[] = [
            'categoria' => $row['categoria'],
            'valor' => (float)$row['valor_total'],
            'color' => $catColors[$colorIdx % count($catColors)]
        ];
        $colorIdx++;
    }
    $stats['valueByCategoryData'] = $valueByCategory;
}

// 7. Tendencias de pedidos (pedidos por mes últimos 6 meses)
// Generar los últimos 6 meses completos aunque no tengan pedidos
$result = $conn->query("
    SELECT 
        DATE_FORMAT(months.month_date, '%Y-%m') as mes,
        DATE_FORMAT(months.month_date, '%b') as mes_nombre,
        COALESCE(COUNT(p.id), 0) as cantidad
    FROM (
        SELECT DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 5 MONTH), '%Y-%m-01') as month_date
        UNION ALL SELECT DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 4 MONTH), '%Y-%m-01')
        UNION ALL SELECT DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 3 MONTH), '%Y-%m-01')
        UNION ALL SELECT DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 2 MONTH), '%Y-%m-01')
        UNION ALL SELECT DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m-01')
        UNION ALL SELECT DATE_FORMAT(NOW(), '%Y-%m-01')
    ) as months
    LEFT JOIN pedidos p ON DATE_FORMAT(p.fecha_creacion, '%Y-%m') = DATE_FORMAT(months.month_date, '%Y-%m')
    GROUP BY months.month_date, mes, mes_nombre
    ORDER BY months.month_date ASC
");
if (!$result) {
    $stats['ordersTrendData'] = [];
} else {
    $ordersTrend = [];
    while ($row = $result->fetch_assoc()) {
        $mesNombre = $row['mes_nombre'];
        // Convertir a español si es necesario
        if (isset($mesesEspanol[$mesNombre])) {
            $mesNombre = $mesesEspanol[$mesNombre];
        }
        $ordersTrend[] = [
            'month' => $mesNombre,
            'cantidad' => (int)$row['cantidad']
        ];
    }
    $stats['ordersTrendData'] = $ordersTrend;
}

$conn->close();
sendResponse($stats);
