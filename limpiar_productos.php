<?php
/**
 * Script para limpiar productos eliminados desde la página
 * Marca como inactivos (activo = FALSE) los productos especificados
 */

require_once 'api/config.php';

header('Content-Type: text/html; charset=utf-8');

try {
    $conn = getDBConnection();
    
    echo "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Limpieza de Productos</title>";
    echo "<style>body{font-family:Arial,sans-serif;padding:20px;max-width:1200px;margin:0 auto;}";
    echo "table{border-collapse:collapse;width:100%;margin:20px 0;}";
    echo "th,td{border:1px solid #ddd;padding:8px;text-align:left;}";
    echo "th{background-color:#4CAF50;color:white;}";
    echo ".btn{background-color:#4CAF50;color:white;padding:10px 20px;border:none;cursor:pointer;margin:5px;}";
    echo ".btn:hover{background-color:#45a049;}";
    echo ".warning{color:orange;font-weight:bold;}</style></head><body>";
    
    echo "<h1>Limpieza de Base de Datos - Productos</h1>";
    echo "<p>Base de datos: <strong>" . DB_NAME . "</strong></p>";
    
    // Si se pasa el parámetro clean=yes, limpiar todos los productos activos que deberían estar inactivos
    if (isset($_GET['clean']) && $_GET['clean'] === 'yes') {
        echo "<div class='warning'>⚠️ Limpiando productos...</div>";
        
        // Primero, obtener todos los productos activos
        $products = $conn->query("SELECT id, sku, nombre FROM productos WHERE activo = TRUE");
        
        $cleaned = 0;
        while ($row = $products->fetch_assoc()) {
            // Marcar como inactivo
            $stmt = $conn->prepare("UPDATE productos SET activo = FALSE WHERE id = ?");
            $stmt->bind_param("i", $row['id']);
            if ($stmt->execute()) {
                $cleaned++;
                echo "<p>✓ Producto {$row['sku']} ({$row['nombre']}) marcado como inactivo</p>";
            }
            $stmt->close();
        }
        
        echo "<h2 style='color:green;'>✅ Limpieza completada: $cleaned productos marcados como inactivos</h2>";
        echo "<p><a href='limpiar_productos.php'>← Volver a la lista</a></p>";
    } else {
        // Mostrar estado actual
        $countActive = $conn->query("SELECT COUNT(*) as total FROM productos WHERE activo = TRUE");
        $activeRow = $countActive->fetch_assoc();
        $totalActive = $activeRow['total'];
        
        $countInactive = $conn->query("SELECT COUNT(*) as total FROM productos WHERE activo = FALSE");
        $inactiveRow = $countInactive->fetch_assoc();
        $totalInactive = $inactiveRow['total'];
        
        echo "<div style='background:#f0f0f0;padding:15px;margin:20px 0;border-radius:5px;'>";
        echo "<p><strong>Productos activos:</strong> $totalActive</p>";
        echo "<p><strong>Productos inactivos:</strong> $totalInactive</p>";
        echo "</div>";
        
        // Mostrar todos los productos activos
        $products = $conn->query("SELECT id, sku, nombre, stock, precio FROM productos WHERE activo = TRUE ORDER BY id DESC");
        
        if ($products->num_rows > 0) {
            echo "<h2>Productos Activos en la Base de Datos</h2>";
            echo "<p class='warning'>⚠️ Si eliminaste productos desde la página pero todavía aparecen aquí, significa que tienen activo = TRUE y necesitan ser limpiados.</p>";
            
            echo "<table>";
            echo "<tr><th>ID</th><th>SKU</th><th>Nombre</th><th>Stock</th><th>Precio</th><th>Estado</th></tr>";
            
            while ($row = $products->fetch_assoc()) {
                echo "<tr>";
                echo "<td>" . $row['id'] . "</td>";
                echo "<td>" . htmlspecialchars($row['sku']) . "</td>";
                echo "<td>" . htmlspecialchars($row['nombre']) . "</td>";
                echo "<td>" . $row['stock'] . "</td>";
                echo "<td>$" . number_format($row['precio'], 2) . "</td>";
                echo "<td><span style='color:green;'>ACTIVO</span></td>";
                echo "</tr>";
            }
            echo "</table>";
            
            if ($totalActive > 0) {
                echo "<hr>";
                echo "<h3>Opciones de Limpieza</h3>";
                echo "<p>Si necesitas marcar TODOS los productos como inactivos (limpieza completa):</p>";
                echo "<a href='?clean=yes' class='btn' onclick=\"return confirm('¿Estás seguro? Esto marcará TODOS los productos activos como inactivos.')\">Limpiar TODOS los productos activos</a>";
                echo "<p><small>Nota: Esto marcará todos los productos con activo = TRUE como activo = FALSE. Usa con precaución.</small></p>";
            }
        } else {
            echo "<p style='color:green;'>✓ No hay productos activos en la base de datos.</p>";
        }
        
        // Mostrar productos inactivos también
        $inactiveProducts = $conn->query("SELECT id, sku, nombre FROM productos WHERE activo = FALSE ORDER BY id DESC LIMIT 20");
        if ($inactiveProducts->num_rows > 0) {
            echo "<hr>";
            echo "<h2>Últimos Productos Inactivos (muestra los primeros 20)</h2>";
            echo "<table>";
            echo "<tr><th>ID</th><th>SKU</th><th>Nombre</th></tr>";
            while ($row = $inactiveProducts->fetch_assoc()) {
                echo "<tr>";
                echo "<td>" . $row['id'] . "</td>";
                echo "<td>" . htmlspecialchars($row['sku']) . "</td>";
                echo "<td>" . htmlspecialchars($row['nombre']) . "</td>";
                echo "</tr>";
            }
            echo "</table>";
        }
    }
    
    echo "<hr>";
    echo "<p><small>Para reactivar un producto específico, ejecuta en phpMyAdmin: <code>UPDATE productos SET activo = TRUE WHERE id = ?</code></small></p>";
    
    $conn->close();
    
    echo "</body></html>";
    
} catch (Exception $e) {
    echo "<p style='color:red;'>❌ Error: " . htmlspecialchars($e->getMessage()) . "</p>";
}
