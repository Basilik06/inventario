-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 03-11-2025 a las 02:38:07
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `inventario`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `alertas`
--

CREATE TABLE `alertas` (
  `id` int(11) NOT NULL,
  `tipo` enum('low_stock','order_delayed','system','threshold') NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `mensaje` text DEFAULT NULL,
  `producto_id` int(11) DEFAULT NULL,
  `severidad` enum('high','medium','low') DEFAULT 'medium',
  `leida` tinyint(1) DEFAULT 0,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `alertas`
--

INSERT INTO `alertas` (`id`, `tipo`, `titulo`, `mensaje`, `producto_id`, `severidad`, `leida`, `fecha_creacion`) VALUES
(1, 'low_stock', 'Stock Bajo - Cartucho Tinta HP Negro', 'El producto está por debajo del umbral mínimo (7/20)', 8, 'high', 0, '2025-11-02 01:04:50'),
(2, 'low_stock', 'Stock Bajo - Monitor LG 27\"', 'El producto está por debajo del umbral mínimo (12/15)', 2, 'medium', 0, '2025-11-02 01:04:50'),
(3, 'low_stock', 'Stock Bajo - Mouse Inalámbrico', 'El producto está por debajo del umbral mínimo (8/25)', 4, 'high', 1, '2025-11-02 01:04:50'),
(4, 'order_delayed', 'Pedido próximo a vencer', 'Pedido #PO-2025-001 debe llegar en 2 días', NULL, 'medium', 0, '2025-11-02 01:04:50'),
(5, 'low_stock', 'Stock Bajo - Papel Bond A4', 'El producto est├í por debajo del umbral m├¡nimo (156/200)', 7, 'low', 0, '2025-11-02 03:40:03'),
(6, 'order_delayed', 'Pedido retrasado', 'El pedido PO-2025-002 lleva 5 d├¡as sin entregar', NULL, 'high', 0, '2025-11-02 03:40:03'),
(7, 'system', 'Actualizaci├│n del sistema disponible', 'Nueva versi├│n del sistema disponible. Se recomienda actualizar.', NULL, 'medium', 0, '2025-11-02 03:40:03'),
(8, 'threshold', 'Umbral de inventario alcanzado', 'El inventario total ha superado el umbral establecido de 1000 unidades', NULL, 'medium', 0, '2025-11-02 03:40:03'),
(9, 'low_stock', 'Stock Bajo - Teclado Mec├ínico', 'El producto est├í por debajo del umbral m├¡nimo (67/100)', 3, 'medium', 0, '2025-11-02 03:40:03'),
(10, 'order_delayed', 'Pedido cancelado pendiente', 'El pedido PO-2025-004 requiere atenci├│n inmediata', NULL, 'high', 0, '2025-11-02 03:40:03'),
(11, 'system', 'Respaldo de base de datos pendiente', 'Se recomienda realizar un respaldo de la base de datos', NULL, 'low', 0, '2025-11-02 03:40:03'),
(12, 'threshold', 'Alta rotaci├│n de productos', 'Los productos est├ín siendo vendidos muy r├ípidamente', NULL, 'medium', 0, '2025-11-02 03:40:03'),
(13, 'system', 'Pedido Entregado', 'El pedido ha sido marcado como entregado. El inventario ha sido actualizado.', NULL, 'medium', 0, '2025-11-02 19:30:04'),
(15, 'low_stock', 'Stock Bajo - Producto 1', 'El producto está por debajo del umbral mínimo (5/20)', NULL, 'high', 0, '2025-11-02 21:40:02'),
(16, 'low_stock', 'Stock Bajo - Producto 2', 'El producto está por debajo del umbral mínimo (8/15)', NULL, 'medium', 0, '2025-11-02 21:40:02'),
(17, 'low_stock', 'Stock Bajo - Producto 3', 'El producto está por debajo del umbral mínimo (10/25)', NULL, 'high', 0, '2025-11-02 21:40:02'),
(18, 'order_delayed', 'Pedido Pendiente', 'Hay un pedido que requiere atención inmediata', NULL, 'high', 0, '2025-11-02 21:40:02'),
(19, 'system', 'Movimiento de Inventario', 'Se registró una salida importante de inventario', NULL, 'medium', 0, '2025-11-02 21:40:02'),
(20, 'threshold', 'Revisión Requerida', 'Se requiere revisar el nivel de stock de varios productos', NULL, 'low', 0, '2025-11-02 21:40:02'),
(21, 'system', 'Alerta de Sistema', 'El sistema ha detectado una inconsistencia en los datos', NULL, 'high', 0, '2025-11-02 21:40:02'),
(22, 'threshold', 'Notificación General', 'Nueva actualización disponible en el sistema', NULL, 'low', 0, '2025-11-02 21:40:02'),
(23, 'low_stock', 'Stock Bajo - Monitor LG 28\"', 'El producto está por debajo del umbral mínimo (40/50)', 24, 'high', 0, '2025-11-03 01:02:58');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `auditoria`
--

CREATE TABLE `auditoria` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `nombre_usuario` varchar(100) DEFAULT NULL,
  `accion` varchar(100) NOT NULL,
  `entidad` varchar(50) NOT NULL,
  `entidad_id` varchar(50) DEFAULT NULL,
  `cambios` text DEFAULT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `auditoria`
--

INSERT INTO `auditoria` (`id`, `usuario_id`, `nombre_usuario`, `accion`, `entidad`, `entidad_id`, `cambios`, `fecha`) VALUES
(1, 1, 'Ana García', 'Actualización de producto', 'Producto', '2', 'Stock actualizado: 20 → 12', '2025-11-02 01:04:50'),
(2, 2, 'Pedro Sánchez', 'Creación de pedido', 'Pedido', '4', 'Nuevo pedido creado - Proveedor: TechCorp S.A.', '2025-11-02 01:04:50'),
(3, 1, 'Ana García', 'Registro de movimiento', 'Movimiento', '1', 'Entrada de inventario - 25 unidades', '2025-11-02 01:04:50'),
(4, NULL, 'María López', 'Actualización de proveedor', 'Proveedor', '2', 'Teléfono actualizado', '2025-11-02 01:04:50'),
(5, 1, 'Ana García', 'Eliminación de alerta', 'Alerta', '5', 'Alerta marcada como resuelta', '2025-11-02 01:04:50'),
(6, 1, 'Sistema', 'Eliminación de producto', 'Producto', '14', 'Producto ID 14 marcado como inactivo', '2025-11-02 14:15:24'),
(7, 1, 'Sistema', 'Eliminación de producto', 'Producto', '13', 'Producto ID 13 marcado como inactivo', '2025-11-02 14:15:27'),
(8, 1, 'Ana García', 'Creación de producto', 'Producto', '16', 'Nuevo producto: prueba', '2025-11-02 14:26:09'),
(9, 1, 'Sistema', 'Eliminación de producto', 'Producto', '16', 'Producto ID 16 marcado como inactivo', '2025-11-02 14:27:01'),
(10, 1, 'Ana García', 'Creación de producto', 'Producto', '17', 'Nuevo producto: prueba', '2025-11-02 14:30:37'),
(11, 1, 'Ana García', 'Creación de producto', 'Producto', '18', 'Nuevo producto: Sneider', '2025-11-02 14:31:14'),
(12, 1, 'Ana García', 'Creación de producto', 'Producto', '19', 'Nuevo producto: pepe', '2025-11-02 14:32:06'),
(13, 1, 'Sistema', 'Eliminación de producto', 'Producto', '19', 'Producto ID 19 marcado como inactivo', '2025-11-02 14:37:18'),
(14, 1, 'Sistema', 'Eliminación de producto', 'Producto', '18', 'Producto ID 18 marcado como inactivo', '2025-11-02 14:37:20'),
(15, 1, 'Sistema', 'Eliminación de producto', 'Producto', '17', 'Producto ID 17 marcado como inactivo', '2025-11-02 14:37:24'),
(16, 1, 'Ana García', 'Creación de producto', 'Producto', '20', 'Nuevo producto: pepe', '2025-11-02 14:37:51'),
(17, 1, 'Ana García', 'Creación de producto', 'Producto', '21', 'Nuevo producto: Sneider', '2025-11-02 14:42:36'),
(18, 1, 'Sistema', 'Actualización de producto', 'Producto', '21', 'Producto actualizado: Sneider', '2025-11-02 14:43:47'),
(19, 1, 'Sistema', 'Actualización de producto', 'Producto', '2', 'Producto actualizado: Monitor LG 27\"', '2025-11-02 14:43:57'),
(20, 1, 'Sistema', 'Eliminación de producto', 'Producto', '21', 'Producto ID 21 marcado como inactivo', '2025-11-02 14:44:16'),
(21, 1, 'Sistema', 'Eliminación de producto', 'Producto', '20', 'Producto ID 20 marcado como inactivo', '2025-11-02 14:44:19'),
(22, 1, 'Ana García', 'Creación de producto', 'Producto', '22', 'Nuevo producto: Sneider', '2025-11-02 14:47:24'),
(23, 1, 'Sistema', 'Eliminación de producto', 'Producto', '22', 'Producto eliminado: Sneider (SKU: PROD-0007)', '2025-11-02 14:47:38'),
(24, 1, 'Ana García', 'Creación de producto', 'Producto', '23', 'Nuevo producto: Sneider', '2025-11-02 14:52:48'),
(25, 1, 'Sistema', 'Eliminación de producto', 'Producto', '23', 'Producto eliminado: Sneider (SKU: PROD-0007)', '2025-11-02 15:15:04'),
(26, 1, 'Sistema', 'Actualización de producto', 'Producto', '2', 'Producto actualizado: Monitor LG 27\"', '2025-11-02 15:15:20'),
(27, 1, 'Sistema', 'Creación de proveedor', 'Proveedor', '6', 'Nuevo proveedor: prueba', '2025-11-02 15:34:06'),
(28, 1, 'Sistema', 'Actualización de proveedor', 'Proveedor', '5', 'Proveedor actualizado: Sneider', '2025-11-02 15:40:29'),
(29, 1, 'Sistema', 'Eliminación de proveedor', 'Proveedor', '5', 'Proveedor eliminado: Sneider', '2025-11-02 15:40:38'),
(30, 1, 'Sistema', 'Eliminación de proveedor', 'Proveedor', '6', 'Proveedor eliminado permanentemente: prueba', '2025-11-02 15:44:50'),
(31, 1, 'Sistema', 'Creación de proveedor', 'Proveedor', '7', 'Nuevo proveedor: Sneider', '2025-11-02 15:47:27'),
(32, 1, 'María López', 'Registro de movimiento', 'Movimiento', '7', 'Entrada de inventario - 50 unidades - Ref: ENTR-0004', '2025-11-02 16:52:09'),
(33, 1, 'Ana García', 'Registro de movimiento', 'Movimiento', '8', 'Salida de inventario - 50 unidades - Ref: SAL-0003', '2025-11-02 16:52:51'),
(34, 1, 'Ana García', 'Registro de movimiento', 'Movimiento', '9', 'Entrada de inventario - 50 unidades - Ref: ENTR-0005', '2025-11-02 16:55:40'),
(35, 1, 'Ana García', 'Registro de movimiento', 'Movimiento', '10', 'Salida de inventario - 20 unidades - Ref: SAL-0004', '2025-11-02 16:57:12'),
(36, 1, 'Ana García', 'Registro de movimiento', 'Movimiento', '11', 'Salida de inventario - 7 unidades - Ref: SAL-0005', '2025-11-02 16:57:22'),
(37, 1, 'Ana García', 'Creación de pedido', 'Pedido', '5', 'Pedido creado: PO-2025-3862 - Total: $24,999.00\nProductos:\nProducto ID 2: 100 unidades x $249.99 = $24,999.00', '2025-11-02 17:51:20'),
(38, 1, 'Ana García', 'Actualización de estado de pedido', 'Pedido', '5', 'Estado cambiado de \'created\' a \'espera_confirmacion\'', '2025-11-02 18:10:00'),
(39, 1, 'Ana García', 'Creación de pedido', 'Pedido', '6', 'Pedido creado: PO-2025-5264 - Total: $899.90\nProductos:\nProducto ID 3: 10 unidades x $89.99 = $899.90', '2025-11-02 18:16:40'),
(40, 1, 'Ana García', 'Actualización de estado de pedido', 'Pedido', '6', 'Estado cambiado de \'\' a \'cancelado\'', '2025-11-02 18:16:53'),
(41, 1, 'Ana García', 'Actualización de estado de pedido', 'Pedido', '6', 'Estado cambiado de \'\' a \'enviado\'', '2025-11-02 18:22:13'),
(42, 1, 'Ana García', 'Actualización de estado de pedido', 'Pedido', '6', 'Estado cambiado de \'\' a \'enviado\'', '2025-11-02 18:27:56'),
(43, 1, 'Ana García', 'Actualización de estado de pedido', 'Pedido', '6', 'Estado cambiado de \'\' a \'en_transito\'', '2025-11-02 18:55:12'),
(44, 1, 'Ana García', 'Actualización de estado de pedido', 'Pedido', '1', 'Estado cambiado de \'shipped\' a \'en_transito\'', '2025-11-02 18:55:18'),
(45, 1, 'Ana García', 'Actualización de estado de pedido', 'Pedido', '6', 'Estado cambiado de \'\' a \'en_transito\'', '2025-11-02 18:58:11'),
(46, 1, 'Ana García', 'Actualización de estado de pedido', 'Pedido', '2', 'Estado cambiado de \'confirmed\' a \'en_transito\'', '2025-11-02 18:58:18'),
(47, 1, 'Ana García', 'Actualización de estado de pedido', 'Pedido', '3', 'Estado cambiado de \'delivered\' a \'en_transito\'', '2025-11-02 18:58:28'),
(48, 1, 'Ana García', 'Actualización de estado de pedido', 'Pedido', '6', 'Estado cambiado de \'\' a \'en_transito\'', '2025-11-02 19:01:29'),
(49, 1, 'Ana García', 'Actualización de estado de pedido', 'Pedido', '6', 'Estado cambiado de \'\' a \'enviado\'', '2025-11-02 19:01:40'),
(50, 1, 'Ana García', 'Actualización de estado de pedido', 'Pedido', '6', 'Estado cambiado de \'\' a \'pendiente\'', '2025-11-02 19:05:39'),
(51, 1, 'Ana García', 'Actualización de estado de pedido', 'Pedido', '6', 'Estado cambiado de \'\' a \'en_transito\'', '2025-11-02 19:05:44'),
(52, 1, 'Ana García', 'Actualización de estado de pedido', 'Pedido', '6', 'Estado cambiado de \'\' a \'en_transito\'', '2025-11-02 19:06:30'),
(53, 1, 'Ana García', 'Actualización de estado de pedido', 'Pedido', '6', 'Estado cambiado de \'\' a \'en_transito\'', '2025-11-02 19:10:00'),
(54, 1, 'Ana García', 'Actualización de estado de pedido', 'Pedido', '6', 'Estado cambiado de \'\' a \'en_transito\'', '2025-11-02 19:12:15'),
(55, 1, 'Ana García', 'Actualización de estado de pedido', 'Pedido', '6', 'Estado cambiado de \'\' a \'enviado\'', '2025-11-02 19:14:20'),
(56, 1, 'Ana García', 'Actualización de estado de pedido', 'Pedido', '6', 'Estado cambiado de \'\' a \'enviado\'', '2025-11-02 19:15:05'),
(57, 1, 'Ana García', 'Actualización de estado de pedido', 'Pedido', '6', 'Estado cambiado de \'\' a \'en_transito\'', '2025-11-02 19:29:28'),
(58, 1, 'Ana García', 'Actualización de estado de pedido', 'Pedido', '5', 'Estado cambiado de \'\' a \'entregado\' - Stock actualizado automáticamente', '2025-11-02 19:30:04'),
(59, 1, 'Ana García', 'Actualización de estado de pedido', 'Pedido', '1', 'Estado cambiado de \'\' a \'cancelado\'', '2025-11-02 19:30:14'),
(60, 1, 'Ana García', 'Actualización de estado de pedido', 'Pedido', '2', 'Estado cambiado de \'\' a \'confirmado\'', '2025-11-02 19:34:21'),
(61, 1, 'Ana García', 'Actualización de estado de pedido', 'Pedido', '3', 'Estado cambiado de \'\' a \'pendiente\'', '2025-11-02 19:34:39'),
(62, 1, 'Ana García', 'Actualización de estado de pedido', 'Pedido', '5', 'Estado cambiado de \'\' a \'enviado\'', '2025-11-02 20:25:13'),
(63, 1, 'Ana García', 'Actualización de estado de pedido', 'Pedido', '1', 'Estado cambiado de \'\' a \'enviado\'', '2025-11-02 20:25:22'),
(64, 1, 'Ana García', 'Actualización de estado de pedido', 'Pedido', '2', 'Estado cambiado de \'pendiente\' a \'entregado\' - Stock actualizado automáticamente', '2025-11-02 20:25:39'),
(65, 1, 'Ana García', 'Actualización de estado de pedido', 'Pedido', '3', 'Estado cambiado de \'\' a \'cancelado\'', '2025-11-02 20:25:46'),
(66, 1, 'Ana García', 'Actualización de estado de pedido', 'Pedido', '4', 'Estado cambiado de \'\' a \'enviado\'', '2025-11-02 20:25:51'),
(67, 1, 'Ana García', 'Actualización de estado de pedido', 'Pedido', '5', 'Estado cambiado de \'enviado\' a \'confirmado\'', '2025-11-02 20:30:52'),
(68, 1, 'Sistema', 'Actualización de producto', 'Producto', '3', 'Producto actualizado: Teclado Mecánico Logitech', '2025-11-02 20:35:42'),
(69, 1, 'Ana García', 'Actualización de estado de pedido', 'Pedido', '5', 'Estado cambiado de \'confirmado\' a \'pendiente\'', '2025-11-02 20:37:28'),
(70, 1, 'Ana García', 'Creación de producto', 'Producto', '100', 'Nuevo producto creado - Laptop HP EliteBook', '2024-01-15 14:30:00'),
(71, 2, 'Pedro Sánchez', 'Actualización de producto', 'Producto', '101', 'Stock actualizado: 50 → 35', '2024-02-20 18:15:00'),
(72, 1, 'Ana García', 'Creación de pedido', 'Pedido', '50', 'Nuevo pedido creado - Proveedor: TechCorp S.A.', '2024-03-10 13:00:00'),
(73, NULL, 'María López', 'Registro de movimiento', 'Movimiento', '200', 'Entrada de inventario - 100 unidades', '2024-04-05 15:45:00'),
(74, 2, 'Pedro Sánchez', 'Actualización de proveedor', 'Proveedor', '10', 'Email actualizado a nuevo@proveedor.com', '2024-05-12 20:20:00'),
(75, 1, 'Ana García', 'Eliminación de producto', 'Producto', '102', 'Producto eliminado permanentemente', '2024-06-18 12:30:00'),
(76, NULL, 'María López', 'Registro de movimiento', 'Movimiento', '201', 'Salida de inventario - 25 unidades', '2024-07-22 17:10:00'),
(77, 2, 'Pedro Sánchez', 'Actualización de pedido', 'Pedido', '51', 'Estado cambiado a entregado', '2024-08-30 19:45:00'),
(78, 1, 'Ana García', 'Creación de categoría', 'Categoría', '5', 'Nueva categoría: Equipos de Red', '2024-09-14 14:00:00'),
(79, NULL, 'María López', 'Actualización de producto', 'Producto', '103', 'Precio actualizado: $50.00 → $45.00', '2024-10-25 13:30:00'),
(80, 2, 'Pedro Sánchez', 'Registro de movimiento', 'Movimiento', '202', 'Entrada de inventario - 75 unidades', '2024-11-08 18:20:00'),
(81, 1, 'Ana García', 'Actualización de pedido', 'Pedido', '52', 'Estado cambiado a en tránsito', '2024-12-15 15:15:00'),
(82, 1, 'Ana García', 'Actualización de estado de pedido', 'Pedido', '6', 'Estado cambiado de \'pendiente\' a \'enviado\'', '2025-11-02 21:53:56'),
(83, 1, 'Ana García', 'Creación de producto', 'Producto', '24', 'Nuevo producto: Monitor LG 28\"', '2025-11-03 01:02:28'),
(84, 1, 'Administrador', 'Registro de movimiento', 'Movimiento', '15', 'Entrada de inventario - 10 unidades - Ref: ENTR-0009', '2025-11-03 01:02:58');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias`
--

CREATE TABLE `categorias` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `categorias`
--

INSERT INTO `categorias` (`id`, `nombre`, `descripcion`, `fecha_creacion`) VALUES
(1, 'Electrónica', 'Equipos electrónicos y dispositivos', '2025-11-02 01:04:50'),
(2, 'Periféricos', 'Periféricos de computadora', '2025-11-02 01:04:50'),
(3, 'Mobiliario', 'Muebles de oficina', '2025-11-02 01:04:50'),
(4, 'Suministros', 'Suministros de oficina y consumibles', '2025-11-02 01:04:50');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `movimientos`
--

CREATE TABLE `movimientos` (
  `id` int(11) NOT NULL,
  `tipo` enum('entry','exit') NOT NULL,
  `producto_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `responsable_id` int(11) DEFAULT NULL,
  `referencia` varchar(100) DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `fecha_movimiento` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `movimientos`
--

INSERT INTO `movimientos` (`id`, `tipo`, `producto_id`, `cantidad`, `responsable_id`, `referencia`, `notas`, `fecha_movimiento`) VALUES
(1, 'entry', 1, 25, 1, 'PO-2025-001', 'Recepción pedido mensual', '2025-11-02 01:04:50'),
(2, 'exit', 3, 15, 2, 'SO-2025-045', 'Venta área comercial', '2025-11-02 01:04:50'),
(3, 'entry', 7, 100, NULL, 'PO-2025-002', NULL, '2025-11-02 01:04:50'),
(4, 'exit', 2, 8, 1, 'SO-2025-046', 'Asignación nuevo departamento', '2025-11-02 01:04:50'),
(5, 'entry', 5, 15, NULL, 'PO-2025-003', NULL, '2025-11-02 01:04:50'),
(7, 'entry', 2, 50, NULL, 'ENTR-0004', 'prueba', '2025-11-02 16:52:09'),
(8, 'exit', 2, 50, 1, 'SAL-0003', 'prueba 2', '2025-11-02 16:52:51'),
(9, 'entry', 2, 50, 1, 'ENTR-0005', '', '2025-11-02 16:55:40'),
(10, 'exit', 2, 20, 1, 'SAL-0004', '', '2025-11-02 16:57:12'),
(11, 'exit', 2, 7, 1, 'SAL-0005', '', '2025-11-02 16:57:22'),
(12, 'entry', 2, 100, 1, 'ENTR-0006', 'Entrada por pedido entregado: PO-2025-3862', '2025-11-02 19:30:04'),
(13, 'entry', 4, 50, 1, 'ENTR-0007', 'Entrada por pedido entregado: PO-2025-002', '2025-11-02 20:25:39'),
(14, 'entry', 3, 30, 1, 'ENTR-0008', 'Entrada por pedido entregado: PO-2025-002', '2025-11-02 20:25:39'),
(15, 'entry', 24, 10, 1, 'ENTR-0009', 'ninguna', '2025-11-03 01:02:58');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedidos`
--

CREATE TABLE `pedidos` (
  `id` int(11) NOT NULL,
  `numero_pedido` varchar(50) NOT NULL,
  `proveedor_id` int(11) NOT NULL,
  `estado` enum('pendiente','enviado','en_transito','entregado','cancelado') DEFAULT 'pendiente',
  `monto_total` decimal(10,2) DEFAULT 0.00,
  `fecha_entrega_estimada` date DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `creado_por` int(11) DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pedidos`
--

INSERT INTO `pedidos` (`id`, `numero_pedido`, `proveedor_id`, `estado`, `monto_total`, `fecha_entrega_estimada`, `notas`, `creado_por`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'PO-2025-001', 1, 'enviado', 4999.80, '2025-10-25', NULL, 1, '2025-11-02 01:04:50', '2025-11-02 20:25:22'),
(2, 'PO-2025-002', 2, 'entregado', 4199.20, '2025-10-28', NULL, 2, '2025-11-02 01:04:50', '2025-11-02 20:25:39'),
(3, 'PO-2025-003', 3, 'cancelado', 5249.85, '2025-10-18', NULL, 1, '2025-11-02 01:04:50', '2025-11-02 20:25:46'),
(4, 'PO-2025-004', 1, 'enviado', 1079.70, '2025-10-30', NULL, 2, '2025-11-02 01:04:50', '2025-11-02 20:25:51'),
(5, 'PO-2025-3862', 1, 'pendiente', 24999.00, '2025-11-06', '', 1, '2025-11-02 17:51:20', '2025-11-02 20:37:28'),
(6, 'PO-2025-5264', 2, 'enviado', 899.90, '2025-11-12', '', 1, '2025-11-02 18:16:40', '2025-11-02 21:53:56');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedido_productos`
--

CREATE TABLE `pedido_productos` (
  `id` int(11) NOT NULL,
  `pedido_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pedido_productos`
--

INSERT INTO `pedido_productos` (`id`, `pedido_id`, `producto_id`, `cantidad`, `precio_unitario`, `subtotal`) VALUES
(1, 1, 2, 20, 249.99, 4999.80),
(2, 2, 4, 50, 29.99, 1499.50),
(3, 2, 3, 30, 89.99, 2699.70),
(4, 3, 5, 15, 349.99, 5249.85),
(5, 4, 8, 30, 35.99, 1079.70),
(6, 5, 2, 100, 249.99, 24999.00),
(7, 6, 3, 10, 89.99, 899.90);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id` int(11) NOT NULL,
  `sku` varchar(50) NOT NULL,
  `nombre` varchar(200) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `categoria_id` int(11) DEFAULT NULL,
  `stock` int(11) DEFAULT 0,
  `stock_minimo` int(11) DEFAULT 0,
  `precio` decimal(10,2) DEFAULT 0.00,
  `proveedor_id` int(11) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id`, `sku`, `nombre`, `descripcion`, `categoria_id`, `stock`, `stock_minimo`, `precio`, `proveedor_id`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'SKU-001', 'Laptop Dell Inspiron 15', 'Laptop empresarial con procesador Intel i7', 1, 80, 20, 899.99, 1, 0, '2025-11-02 01:04:50', '2025-11-02 13:54:15'),
(2, 'SKU-002', 'Monitor LG 27\"', 'Monitor LED Full HD con ajuste de altura', 1, 138, 15, 249.99, 1, 1, '2025-11-02 01:04:50', '2025-11-02 19:30:04'),
(3, 'SKU-003', 'Teclado Mecánico Logitech', 'Teclado mecánico retroiluminado RGB', 2, 29, 30, 89.99, 2, 1, '2025-11-02 01:04:50', '2025-11-02 20:35:42'),
(4, 'SKU-004', 'Mouse Inalámbrico', 'Mouse ergonómico inalámbrico 2.4GHz', 2, 58, 25, 29.99, 2, 1, '2025-11-02 01:04:50', '2025-11-02 20:25:39'),
(5, 'SKU-005', 'Silla Ergonómica Pro', 'Silla de oficina con soporte lumbar ajustable', 3, 23, 10, 349.99, 3, 1, '2025-11-02 01:04:50', '2025-11-02 01:04:50'),
(6, 'SKU-006', 'Escritorio Standing Desk', 'Escritorio ajustable en altura eléctrico', 3, 15, 8, 599.99, 3, 1, '2025-11-02 01:04:50', '2025-11-02 01:04:50'),
(7, 'SKU-007', 'Papel Bond A4 (Resma)', 'Resma de 500 hojas papel bond blanco', 4, 156, 100, 4.99, 2, 1, '2025-11-02 01:04:50', '2025-11-02 01:04:50'),
(8, 'SKU-008', 'Cartucho Tinta HP Negro', 'Cartucho de tinta original HP 664XL', 4, 700, 20, 35.99, 1, 0, '2025-11-02 01:04:50', '2025-11-02 13:38:37'),
(24, 'PROD-0007', 'Monitor LG 28\"', 'algo', 1, 40, 50, 40.00, 1, 1, '2025-11-03 01:02:28', '2025-11-03 01:02:58');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proveedores`
--

CREATE TABLE `proveedores` (
  `id` int(11) NOT NULL,
  `nombre` varchar(200) NOT NULL,
  `contacto` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `telefono` varchar(20) NOT NULL,
  `direccion` text DEFAULT NULL,
  `productos_suministrados` int(11) DEFAULT 0,
  `total_pedidos` int(11) DEFAULT 0,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `proveedores`
--

INSERT INTO `proveedores` (`id`, `nombre`, `contacto`, `email`, `telefono`, `direccion`, `productos_suministrados`, `total_pedidos`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'TechCorp S.A.', 'Carlos Rodríguez', 'ventas@techcorp.com', '+34 912 345 678', 'Av. Tecnología 123, Madrid', 3, 2, 1, '2025-11-02 01:04:50', '2025-11-02 01:04:50'),
(2, 'Office Supplies Inc.', 'María López', 'contacto@officesupplies.com', '+34 913 456 789', 'C/ Suministros 45, Barcelona', 3, 1, 1, '2025-11-02 01:04:50', '2025-11-02 01:04:50'),
(3, 'Muebles Corp', 'Juan Martínez', 'info@mueblescorp.com', '+34 914 567 890', 'Polígono Industrial 7, Valencia', 2, 1, 1, '2025-11-02 01:04:50', '2025-11-02 01:04:50'),
(7, 'Sneider', '5456', 'ana.garcia@empresa.com', '6245455888', 'calle 13 12N-48 villa del rosario', 0, 0, 1, '2025-11-02 15:47:27', '2025-11-02 15:47:27');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('admin','inventory_manager','buyer','auditor') DEFAULT 'inventory_manager',
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `rol`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'Administrador', 'admin@admin.com', '$2y$10$nm1zQIguDUnym0pU7mGU7O/ZieE5yHAu3DU9uuPe3k2IjKyu7WxwK', 'admin', 1, '2025-11-02 01:04:50', '2025-11-03 00:37:50'),
(2, 'Pedro Sánchez', 'pedro.sanchez@empresa.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'inventory_manager', 1, '2025-11-02 01:04:50', '2025-11-02 01:04:50'),
(6, 'Juan', 'juan@gmail.com', '$2y$10$sYuLncvks0B9IVdwuadbcuZIdzFCDTIC0QzE8Hn.252UiSabcQ8VO', 'inventory_manager', 1, '2025-11-02 01:46:10', '2025-11-02 01:46:10'),
(7, 'juana', 'juana@gmail.com', '$2y$10$HzNA7GE763KVsreFhqhqa.FiEOpPHSm3yMmbw97B9wJUTi8KDuS8W', 'inventory_manager', 1, '2025-11-03 00:11:05', '2025-11-03 00:11:05'),
(8, 'sneider', 'sneider@gmail.com', '$2y$10$ENSwaJ4WVKjLSNLcyfeNgOmpAYRHYDs02syqtaZ7B5PEEy6LKH/Yu', 'inventory_manager', 1, '2025-11-03 01:04:04', '2025-11-03 01:04:04');

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vista_dashboard`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `vista_dashboard` (
`total_productos` bigint(21)
,`inventario_total` decimal(32,0)
,`productos_stock_bajo` bigint(21)
,`valor_total_inventario` decimal(42,2)
,`pedidos_pendientes` bigint(21)
,`alertas_no_leidas` bigint(21)
);

-- --------------------------------------------------------

--
-- Estructura para la vista `vista_dashboard`
--
DROP TABLE IF EXISTS `vista_dashboard`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vista_dashboard`  AS SELECT (select count(0) from `productos` where `productos`.`activo` = 1) AS `total_productos`, (select sum(`productos`.`stock`) from `productos` where `productos`.`activo` = 1) AS `inventario_total`, (select count(0) from `productos` where `productos`.`stock` < `productos`.`stock_minimo` and `productos`.`activo` = 1) AS `productos_stock_bajo`, (select sum(`productos`.`stock` * `productos`.`precio`) from `productos` where `productos`.`activo` = 1) AS `valor_total_inventario`, (select count(0) from `pedidos` where `pedidos`.`estado` not in ('delivered','cancelled')) AS `pedidos_pendientes`, (select count(0) from `alertas` where `alertas`.`leida` = 0) AS `alertas_no_leidas` ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `alertas`
--
ALTER TABLE `alertas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `producto_id` (`producto_id`),
  ADD KEY `idx_leida` (`leida`),
  ADD KEY `idx_severidad` (`severidad`),
  ADD KEY `idx_tipo` (`tipo`);

--
-- Indices de la tabla `auditoria`
--
ALTER TABLE `auditoria`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_usuario` (`usuario_id`),
  ADD KEY `idx_entidad` (`entidad`),
  ADD KEY `idx_fecha` (`fecha`);

--
-- Indices de la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `movimientos`
--
ALTER TABLE `movimientos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `responsable_id` (`responsable_id`),
  ADD KEY `idx_producto` (`producto_id`),
  ADD KEY `idx_tipo` (`tipo`),
  ADD KEY `idx_fecha` (`fecha_movimiento`);

--
-- Indices de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `numero_pedido` (`numero_pedido`),
  ADD KEY `creado_por` (`creado_por`),
  ADD KEY `idx_proveedor` (`proveedor_id`),
  ADD KEY `idx_estado` (`estado`);

--
-- Indices de la tabla `pedido_productos`
--
ALTER TABLE `pedido_productos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pedido` (`pedido_id`),
  ADD KEY `idx_producto` (`producto_id`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sku` (`sku`),
  ADD KEY `idx_categoria` (`categoria_id`),
  ADD KEY `idx_proveedor` (`proveedor_id`),
  ADD KEY `idx_sku` (`sku`);

--
-- Indices de la tabla `proveedores`
--
ALTER TABLE `proveedores`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `alertas`
--
ALTER TABLE `alertas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT de la tabla `auditoria`
--
ALTER TABLE `auditoria`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=85;

--
-- AUTO_INCREMENT de la tabla `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `movimientos`
--
ALTER TABLE `movimientos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `pedido_productos`
--
ALTER TABLE `pedido_productos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT de la tabla `proveedores`
--
ALTER TABLE `proveedores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `alertas`
--
ALTER TABLE `alertas`
  ADD CONSTRAINT `alertas_ibfk_1` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `auditoria`
--
ALTER TABLE `auditoria`
  ADD CONSTRAINT `auditoria_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `movimientos`
--
ALTER TABLE `movimientos`
  ADD CONSTRAINT `movimientos_ibfk_1` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`),
  ADD CONSTRAINT `movimientos_ibfk_2` FOREIGN KEY (`responsable_id`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD CONSTRAINT `pedidos_ibfk_1` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`),
  ADD CONSTRAINT `pedidos_ibfk_2` FOREIGN KEY (`creado_por`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `pedido_productos`
--
ALTER TABLE `pedido_productos`
  ADD CONSTRAINT `pedido_productos_ibfk_1` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pedido_productos_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`);

--
-- Filtros para la tabla `productos`
--
ALTER TABLE `productos`
  ADD CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `productos_ibfk_2` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
