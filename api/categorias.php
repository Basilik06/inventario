<?php
require_once 'config.php';

$conn = getDBConnection();

$result = $conn->query("SELECT * FROM categorias ORDER BY nombre");
$categorias = [];
while ($row = $result->fetch_assoc()) {
    $categorias[] = $row;
}

$conn->close();
sendResponse($categorias);
