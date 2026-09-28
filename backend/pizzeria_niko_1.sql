-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 02-09-2026 a las 18:25:10
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
-- Base de datos: `pizzeria_niko_1`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `bebidas`
--

CREATE TABLE `bebidas` (
  `id_bebida` int(11) NOT NULL,
  `nombre` text NOT NULL,
  `precio` float NOT NULL,
  `descripcion` text NOT NULL,
  `estado` enum('Activo','Inactivo') NOT NULL,
  `url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `bebidas`
--

INSERT INTO `bebidas` (`id_bebida`, `nombre`, `precio`, `descripcion`, `estado`, `url`) VALUES
(1, 'Pepsi', 2, '2 litros', 'Activo', '');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categoria_pizza`
--

CREATE TABLE `categoria_pizza` (
  `id_categoria_pizza` int(11) NOT NULL,
  `categoria` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `categoria_pizza`
--

INSERT INTO `categoria_pizza` (`id_categoria_pizza`, `categoria`) VALUES
(1, 'Normal'),
(2, 'Familiar'),
(3, 'Gigante');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cierres_caja`
--

CREATE TABLE `cierres_caja` (
  `id_cierre` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `fecha_hora` datetime DEFAULT current_timestamp(),
  `monto_efectivo_usd` decimal(10,2) DEFAULT 0.00,
  `monto_efectivo_bs` decimal(12,2) DEFAULT 0.00,
  `monto_punto_bs` decimal(12,2) DEFAULT 0.00,
  `monto_pago_movil_bs` decimal(12,2) DEFAULT 0.00,
  `total_usdt` decimal(10,2) DEFAULT 0.00,
  `num_ordenes` int(11) DEFAULT 0,
  `id_sucursal` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `cierres_caja`
--

INSERT INTO `cierres_caja` (`id_cierre`, `id_usuario`, `fecha_hora`, `monto_efectivo_usd`, `monto_efectivo_bs`, `monto_punto_bs`, `monto_pago_movil_bs`, `total_usdt`, `num_ordenes`, `id_sucursal`) VALUES
(1, 4, '2026-08-14 10:11:54', 0.00, 0.00, 3855.36, 1542.14, 7.00, 2, 1),
(2, 4, '2026-08-14 10:20:13', 0.00, 0.00, 0.00, 0.00, 0.00, 0, 1),
(3, 4, '2026-08-14 10:21:59', 0.00, 0.00, 3855.36, 1542.14, 7.00, 2, 1),
(4, 4, '2026-08-14 10:22:10', 0.00, 0.00, 3855.36, 1542.14, 7.00, 2, 1),
(5, 4, '2026-08-14 10:22:41', 0.00, 0.00, 3855.36, 1542.14, 7.00, 2, 1),
(6, 4, '2026-08-15 15:21:03', 0.00, 0.00, 3855.36, 0.00, 5.00, 1, 1),
(9, 4, '2026-08-15 15:44:34', 0.00, 0.00, 0.00, 3855.36, 5.00, 1, 1),
(10, 4, '2026-08-15 18:02:06', 0.00, 0.00, 3855.36, 0.00, 5.00, 1, 1),
(11, 4, '2026-08-16 12:56:23', 0.00, 0.00, 16346.71, 0.00, 21.20, 2, 1),
(12, 4, '2026-08-16 18:15:50', 0.00, 0.00, 7710.72, 3855.36, 15.00, 3, 1),
(13, 4, '2026-08-19 11:08:41', 2.00, 0.00, 2326.01, 3876.68, 10.00, 2, 1),
(14, 4, '2026-09-02 11:17:21', 0.00, 7500.00, 28580.06, 2394.98, 48.02, 8, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `id_cliente` int(11) NOT NULL,
  `cedula` text NOT NULL,
  `nombre` text NOT NULL,
  `telefono` int(11) NOT NULL,
  `descripcion` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `clientes`
--

INSERT INTO `clientes` (`id_cliente`, `cedula`, `nombre`, `telefono`, `descripcion`) VALUES
(1, '12345678', 'a', 11, 'd'),
(2, '123456', 'gol', 123456, ''),
(3, '1234567', 'ii', 123, ''),
(4, '12345899', 'Francisco Miranda', 412255557, ''),
(5, '123', 'pedro', 0, '');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `combos`
--

CREATE TABLE `combos` (
  `id_combo` int(11) NOT NULL,
  `nombre` text NOT NULL,
  `descripcion` text NOT NULL,
  `precio` float NOT NULL,
  `estado` enum('Activo','Inactivo') NOT NULL DEFAULT 'Activo',
  `url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `combo_detalle`
--

CREATE TABLE `combo_detalle` (
  `id_combo_detalle` int(11) NOT NULL,
  `id_combo` int(11) NOT NULL,
  `tipo_producto` enum('Pizza','Bebida') NOT NULL,
  `id_producto_origen` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuracion_tasa`
--

CREATE TABLE `configuracion_tasa` (
  `id_config` int(11) NOT NULL,
  `tasa_api` float NOT NULL,
  `tasa_sistema` float NOT NULL,
  `anclado` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `configuracion_tasa`
--

INSERT INTO `configuracion_tasa` (`id_config`, `tasa_api`, `tasa_sistema`, `anclado`, `fecha_actualizacion`) VALUES
(1, 801.175, 801.175, 0, '2026-09-02 15:16:21');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `delivery`
--

CREATE TABLE `delivery` (
  `id_delivery` int(11) NOT NULL,
  `digitos` int(11) NOT NULL,
  `nombre` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `delivery`
--

INSERT INTO `delivery` (`id_delivery`, `digitos`, `nombre`) VALUES
(1, 1234, 'gg'),
(2, 1236, 'ggg'),
(3, 1235, 'jfdd'),
(4, 1237, 'asd'),
(5, 1238, 'asd'),
(6, 7777, 'ff');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_venta_extras`
--

CREATE TABLE `detalle_venta_extras` (
  `id_detalle_extra` int(11) NOT NULL,
  `id_detalle` int(11) NOT NULL,
  `id_extra` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `detalle_venta_extras`
--

INSERT INTO `detalle_venta_extras` (`id_detalle_extra`, `id_detalle`, `id_extra`) VALUES
(6, 11, 2),
(7, 17, 3),
(8, 20, 2),
(9, 19, 3),
(12, 21, 3),
(13, 21, 4),
(14, 22, 3),
(15, 22, 4),
(17, 26, 3),
(18, 26, 1),
(19, 27, 6),
(20, 28, 6),
(21, 29, 3),
(22, 30, 4),
(23, 55, 6),
(24, 88, 4);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `extras`
--

CREATE TABLE `extras` (
  `id_extras` int(11) NOT NULL,
  `nombre` text NOT NULL,
  `precio` float NOT NULL,
  `id_categoria_pizza` int(11) NOT NULL,
  `estado` enum('Activo','Inactivo') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `extras`
--

INSERT INTO `extras` (`id_extras`, `nombre`, `precio`, `id_categoria_pizza`, `estado`) VALUES
(1, 'Extra Pepperonii', 4, 3, 'Activo'),
(2, 'Jalapeños', 3, 1, 'Activo'),
(3, 'Chiwi', 2, 1, 'Activo'),
(4, 'Jesse Heiman', 1, 1, 'Activo'),
(5, 'Extra', 2, 1, 'Activo'),
(6, 'qs', 2, 3, 'Activo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `heladeria`
--

CREATE TABLE `heladeria` (
  `id_heladeria` int(11) NOT NULL,
  `nombre` text NOT NULL,
  `precio` float NOT NULL,
  `descripcion` text NOT NULL,
  `estado` enum('Activo','Inactivo') NOT NULL,
  `url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notificaciones`
--

CREATE TABLE `notificaciones` (
  `id_notificacion` int(11) NOT NULL,
  `id_venta` int(11) NOT NULL,
  `id_cliente` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `monto_restante` float NOT NULL,
  `fecha_hora` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `estado` enum('Pendiente','Listo') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `notificaciones`
--

INSERT INTO `notificaciones` (`id_notificacion`, `id_venta`, `id_cliente`, `id_usuario`, `monto_restante`, `fecha_hora`, `estado`) VALUES
(4, 72, 3, 4, 5, '2026-08-19 15:58:26', 'Listo'),
(5, 73, 2, 4, 5, '2026-08-19 16:46:07', 'Listo'),
(6, 74, 2, 4, 5, '2026-08-19 16:35:50', 'Pendiente'),
(7, 75, 2, 4, 5, '2026-08-19 16:46:13', 'Listo'),
(8, 76, 3, 4, 5, '2026-08-19 16:45:59', 'Listo'),
(9, 77, 3, 4, 5, '2026-08-19 16:45:54', 'Listo'),
(10, 82, 3, 4, 5, '2026-08-21 21:46:37', 'Pendiente');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pin`
--

CREATE TABLE `pin` (
  `id_pin` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `pin` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `pin`
--

INSERT INTO `pin` (`id_pin`, `id_usuario`, `pin`) VALUES
(1, 4, '1236');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pizza`
--

CREATE TABLE `pizza` (
  `id_pizza` int(11) NOT NULL,
  `nombre` text NOT NULL,
  `precio` float NOT NULL,
  `descripcion` text NOT NULL,
  `id_categoria_pizza` int(11) NOT NULL,
  `estado` enum('Activo','Inactivo') NOT NULL,
  `url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `pizza`
--

INSERT INTO `pizza` (`id_pizza`, `nombre`, `precio`, `descripcion`, `id_categoria_pizza`, `estado`, `url`) VALUES
(3, 'Pepe', 5, 'Quesito', 1, 'Activo', 'https://res.cloudinary.com/di9z6ke80/image/upload/f_auto,q_auto/v1/pizzas/cij3iflcavd8fxwmysho?_a=BAMAPqWO0'),
(4, 'Pizza con Doble Queso', 3, '', 2, 'Activo', 'https://res.cloudinary.com/di9z6ke80/image/upload/f_auto,q_auto/v1/pizzas/ztkm0nzj3bnv7gn40jel?_a=BAMAPqWO0'),
(5, 'Qs', 3, 's', 3, 'Activo', 'https://res.cloudinary.com/di9z6ke80/image/upload/f_auto,q_auto/v1/pizzas/ezgppgevx60si6qtftzz?_a=BAMAPqWO0'),
(6, 'pizzita', 7, 'Queso y Chiwi', 1, 'Activo', 'https://res.cloudinary.com/di9z6ke80/image/upload/f_auto,q_auto/v1/pizzas/wvk54kuuak0p6opm8irk?_a=BAMAPqWO0'),
(7, 'Pizza new', 2, 'Queso  y peperoni', 3, 'Activo', NULL),
(8, 'New Pizza', 2, 'Queso', 3, 'Activo', NULL),
(9, 'New Pizza', 5, '', 3, 'Activo', NULL),
(10, 'Queso', 2, 'ff', 2, 'Activo', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sucursal`
--

CREATE TABLE `sucursal` (
  `id_sucursal` int(11) NOT NULL,
  `sucursal` text NOT NULL,
  `direccion` text NOT NULL,
  `estado` enum('Activo','Inactivo') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `sucursal`
--

INSERT INTO `sucursal` (`id_sucursal`, `sucursal`, `direccion`, `estado`) VALUES
(1, 'sucur', '', 'Activo'),
(2, 'Laberinto', 'Carrera 1', 'Activo'),
(3, 'Sucursal Oeste', 'Av 1', 'Activo'),
(4, 'Laberito 2', 'Carrera 3', 'Activo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL,
  `nombre_completo` text NOT NULL,
  `email` text NOT NULL,
  `password` text NOT NULL,
  `pin` text DEFAULT NULL,
  `id_sucursal` int(11) NOT NULL,
  `rol` enum('admin','chef','cashier','mesero','despachador') NOT NULL,
  `estado` enum('Activo','Inactivo') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `nombre_completo`, `email`, `password`, `pin`, `id_sucursal`, `rol`, `estado`) VALUES
(1, 'juancito', 'admin@pizzeria.com', '$2b$10$QFXgzNNcDUjVlxzv7LTnzOrHsTHHVhd29uyYolLl18TGjtxgZLMza', NULL, 1, 'admin', 'Activo'),
(2, 'nn', 'nuevo@pizzeria.com', '$2b$10$QFXgzNNcDUjVlxzv7LTnzOrHsTHHVhd29uyYolLl18TGjtxgZLMza', NULL, 1, 'despachador', 'Activo'),
(3, 'María López', 'maria@pizzeria.com', '$2b$10$1B6DBxnyh8FMAzE093tP0OuiwCkXdD1u21KqEi9PxmnG0sgnEN3TS', NULL, 1, 'chef', 'Activo'),
(4, 'Carlos Rodríguez', 'carlos@pizzeria.com', '$2b$10$8kLDMPcK64RveiKjkU4NeeW0UpU5P8FHMKPQj5Q8vBbQxIUkkN0CO', '1235', 1, 'cashier', 'Activo'),
(5, 'Sofia Torres', 'sofia@pizzeria.com', '$2b$10$qDN/.t0bL/5jQnEWPpDP8ehAD8wAbIYEaVgriCvr08sfv/7ONXbjK', NULL, 1, 'mesero', 'Activo'),
(6, 'Laura Jiménez', 'laura@pizzeria.com', '$2b$10$BzxMXWPl7NSMaWxbb/ASiuK5PO1BTvD0hy9AvQfenwAXwPdOtH3La', NULL, 1, 'despachador', 'Activo'),
(17, 'Jorge Curioso', 'jorge@pizzeria.com', '$2b$10$jsWCMjqSasUQkLxIGNrO6eTgtNwkNetr8jyzeeNNTgPggSpqX908O', NULL, 2, 'mesero', 'Activo'),
(18, 'Mick Jagger', 'jagger', '$2b$10$vjW4Mu2pF8VoXDOCmVKnhuWy9kJbFh01Jc8APRmm2g3rizv2KS52G', NULL, 2, 'despachador', 'Inactivo'),
(19, 'Mick Jagger', 'jagger@pizzeria.com', '$2b$10$vEsu84ObGeFHg10STsahTui.rM51sTZBSSKo1fLjGE9LMbL7lzajW', NULL, 2, 'chef', 'Activo'),
(20, 'Mick Jagger', 'jagger@pizzeria.com', '$2b$10$Ssg2/j7zTfOlzolNSiNuv.pc4jxyWa2FweXnZbn7A12Ecya5Ijrry', NULL, 1, 'chef', 'Activo'),
(21, 'Mick Jagger', 'jagger@pizzeria.com', '$2b$10$MGUrBuKxSKdxd0kNrbJRLexE1NoQ2p4EaRUnB6qH/0l5AajWjjfyy', NULL, 4, 'chef', 'Activo'),
(22, 'Victor Doom', 'doom@doom.com', '$2b$10$Ru9iRLnzuCOS4tUchXAv0OajbdoQ1jGh9eEEMvdrer5UBNpUvW2aK', NULL, 4, 'cashier', 'Activo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas`
--

CREATE TABLE `ventas` (
  `id_venta` int(11) NOT NULL,
  `id_cliente` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `id_delivery` int(11) DEFAULT NULL,
  `fecha_hora` timestamp NOT NULL DEFAULT current_timestamp(),
  `tasa_cambio` float NOT NULL,
  `monto_total_usd` float NOT NULL,
  `monto_total_bs` float NOT NULL,
  `despacho` enum('Local','Llevar','Delivery','Pick Up') NOT NULL,
  `estado` enum('Completado','Pendiente','Rechazado','Cerrado','Reembolsado') NOT NULL,
  `id_sucursal` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `ventas`
--

INSERT INTO `ventas` (`id_venta`, `id_cliente`, `id_usuario`, `id_delivery`, `fecha_hora`, `tasa_cambio`, `monto_total_usd`, `monto_total_bs`, `despacho`, `estado`, `id_sucursal`) VALUES
(5, 1, 1, NULL, '2026-07-30 19:03:07', 744.23, 13.5, 10047.1, 'Local', 'Cerrado', 1),
(6, 1, 1, NULL, '2026-07-30 19:07:10', 744.23, 28, 20838.3, 'Llevar', 'Cerrado', 1),
(7, 1, 1, NULL, '2026-07-30 19:08:29', 744.23, 36, 26792.2, 'Local', 'Cerrado', 1),
(11, 1, 1, NULL, '2026-07-30 19:17:14', 744.23, 16.5, 12279.7, 'Local', 'Cerrado', 1),
(12, 1, 1, NULL, '2026-07-30 19:57:03', 744.23, 13.5, 10047.1, 'Local', 'Cerrado', 1),
(13, 2, 1, NULL, '2026-07-30 19:57:46', 744.23, 13, 9674.94, 'Local', 'Cerrado', 1),
(14, 1, 1, NULL, '2026-07-31 14:30:42', 745.64, 15, 11184.6, 'Local', 'Cerrado', 1),
(15, 1, 1, NULL, '2026-07-31 20:01:16', 745.64, 5, 3728.19, 'Local', 'Cerrado', 1),
(16, 1, 1, NULL, '2026-08-02 01:09:22', 748.79, 12.8, 9584.47, 'Local', 'Cerrado', 1),
(17, 1, 1, NULL, '2026-08-02 16:03:29', 748.79, 8, 5990.29, 'Llevar', 'Cerrado', 1),
(18, 1, 1, NULL, '2026-08-02 15:59:36', 748.79, 16, 11980.6, 'Local', 'Cerrado', 1),
(19, 3, 1, NULL, '2026-08-02 22:58:20', 748.79, 7, 5241.5, 'Local', 'Cerrado', 1),
(20, 1, 1, NULL, '2026-08-02 23:54:23', 748.79, 9, 6739.08, '', 'Cerrado', 1),
(21, 1, 1, NULL, '2026-08-02 23:54:40', 748.79, 5, 3743.93, 'Local', 'Cerrado', 1),
(22, 2, 1, NULL, '2026-08-02 23:55:44', 748.79, 21.8, 16323.5, 'Local', 'Cerrado', 1),
(23, 3, 1, NULL, '2026-08-03 00:33:21', 748.79, 5, 3743.93, 'Local', 'Cerrado', 1),
(24, 2, 1, NULL, '2026-08-03 12:03:10', 748.79, 8, 5990.29, 'Local', 'Cerrado', 1),
(25, 3, 1, NULL, '2026-08-06 21:47:08', 755.9, 6, 4535.4, 'Local', 'Cerrado', 1),
(26, 3, 1, NULL, '2026-08-06 21:47:46', 755.9, 5, 3779.5, 'Llevar', 'Cerrado', 1),
(27, 3, 1, NULL, '2026-08-06 22:09:54', 755.9, 2, 1511.8, 'Local', 'Cerrado', 1),
(28, 3, 1, NULL, '2026-08-06 22:10:10', 755.9, 3, 2267.7, 'Local', 'Cerrado', 1),
(29, 3, 1, NULL, '2026-08-07 12:16:46', 755.9, 5, 3779.5, 'Local', 'Cerrado', 1),
(30, 1, 1, NULL, '2026-08-07 12:32:40', 755.9, 3, 2267.7, 'Llevar', 'Cerrado', 1),
(31, 1, 1, NULL, '2026-08-07 14:06:14', 755.9, 5, 3779.5, 'Llevar', 'Cerrado', 1),
(32, 3, 1, NULL, '2026-08-08 20:17:52', 757.54, 5, 3787.7, 'Pick Up', 'Cerrado', 1),
(33, 3, 1, NULL, '2026-08-08 20:20:09', 757.54, 5, 3787.7, 'Delivery', 'Cerrado', 1),
(34, 3, 1, NULL, '2026-08-10 08:55:09', 757.54, 5, 3787.7, 'Local', 'Cerrado', 1),
(35, 3, 1, NULL, '2026-08-10 08:55:26', 757.54, 5, 3787.7, 'Pick Up', 'Cerrado', 1),
(36, 3, 1, 1, '2026-08-10 08:55:44', 757.54, 5, 3787.7, 'Delivery', 'Cerrado', 1),
(37, 3, 1, NULL, '2026-08-10 09:53:40', 757.54, 5, 3787.7, 'Delivery', 'Cerrado', 1),
(38, 3, 1, NULL, '2026-08-10 09:55:56', 757.54, 5, 3787.7, 'Delivery', 'Cerrado', 1),
(39, 2, 1, NULL, '2026-08-10 09:57:53', 757.54, 5, 3787.7, 'Delivery', 'Cerrado', 1),
(40, 3, 1, NULL, '2026-08-10 10:01:51', 757.54, 5, 3787.7, 'Delivery', 'Cerrado', 1),
(41, 3, 1, NULL, '2026-08-10 10:03:03', 757.54, 5, 3787.7, 'Delivery', 'Cerrado', 1),
(42, 3, 1, NULL, '2026-08-10 10:03:27', 757.54, 5, 3787.7, 'Delivery', 'Cerrado', 1),
(43, 3, 1, NULL, '2026-08-10 10:09:38', 757.54, 5, 3787.7, 'Delivery', 'Cerrado', 1),
(44, 3, 1, NULL, '2026-08-10 10:11:45', 757.54, 5, 3787.7, 'Delivery', 'Cerrado', 1),
(45, 3, 1, NULL, '2026-08-10 10:36:45', 757.54, 5, 3787.7, 'Local', 'Cerrado', 1),
(46, 3, 1, NULL, '2026-08-10 10:40:55', 757.54, 5, 3787.7, 'Llevar', 'Cerrado', 1),
(47, 3, 1, 1, '2026-08-10 10:41:18', 757.54, 5, 3787.7, 'Delivery', 'Cerrado', 1),
(48, 3, 1, 1, '2026-08-10 10:47:14', 757.54, 5, 3787.7, 'Delivery', 'Cerrado', 1),
(49, 2, 1, 6, '2026-08-10 10:48:25', 757.54, 5, 3787.7, 'Pick Up', 'Cerrado', 1),
(50, 1, 1, NULL, '2026-08-10 12:24:09', 760, 5, 3800, 'Local', 'Cerrado', 1),
(51, 1, 1, NULL, '2026-08-10 22:23:02', 760, 5, 3800, 'Local', 'Cerrado', 1),
(52, 3, 1, NULL, '2026-08-13 20:14:31', 766.86, 5, 3834.3, 'Local', 'Cerrado', 1),
(53, 3, 1, NULL, '2026-08-14 13:38:15', 771.07, 5, 3855.36, 'Local', 'Cerrado', 1),
(54, 3, 1, NULL, '2026-08-14 13:38:44', 771.07, 2, 1542.14, 'Llevar', 'Cerrado', 1),
(55, 3, 1, NULL, '2026-08-15 19:20:29', 771.07, 5, 3855.36, 'Local', 'Cerrado', 1),
(56, 3, 1, NULL, '2026-08-15 19:39:31', 771.07, 5, 3855.36, 'Local', 'Cerrado', 1),
(57, 3, 1, 1, '2026-08-15 22:00:16', 771.07, 5, 3855.36, 'Delivery', 'Cerrado', 1),
(58, 3, 1, NULL, '2026-08-16 16:51:58', 771.07, 5, 3855.36, 'Local', 'Cerrado', 1),
(59, 3, 1, NULL, '2026-08-16 16:53:13', 771.07, 16.2, 12491.3, 'Llevar', 'Cerrado', 1),
(60, 3, 1, NULL, '2026-08-16 17:01:01', 771.07, 5, 3855.36, 'Llevar', 'Cerrado', 1),
(61, 3, 1, NULL, '2026-08-16 17:01:46', 771.07, 3, 2313.21, 'Local', 'Cerrado', 1),
(62, 3, 1, NULL, '2026-08-16 21:57:22', 771.07, 5, 3855.36, 'Local', 'Cerrado', 1),
(63, 3, 1, NULL, '2026-08-19 13:47:41', 775.34, 3, 2326.01, 'Local', 'Cerrado', 1),
(64, 3, 1, NULL, '2026-08-19 14:47:20', 775.34, 5, 3876.68, 'Pick Up', 'Cerrado', 1),
(65, 3, 4, NULL, '2026-08-19 15:01:18', 775.34, 0, 0, 'Pick Up', 'Cerrado', 1),
(66, 3, 4, NULL, '2026-08-19 15:02:10', 775.34, 5, 3876.68, 'Pick Up', 'Cerrado', 1),
(67, 3, 1, NULL, '2026-08-19 15:12:05', 775.34, 5, 3876.68, 'Pick Up', 'Cerrado', 1),
(68, 3, 4, NULL, '2026-08-19 15:12:13', 775.34, 0, 0, 'Pick Up', 'Cerrado', 1),
(69, 3, 4, NULL, '2026-08-19 15:25:43', 775.34, 5, 3876.68, 'Pick Up', 'Cerrado', 1),
(70, 3, 4, NULL, '2026-08-19 15:30:04', 775.34, 5, 3876.68, 'Pick Up', 'Cerrado', 1),
(71, 2, 4, NULL, '2026-08-19 15:35:32', 775.34, 9, 6978.02, 'Pick Up', 'Cerrado', 1),
(72, 3, 4, NULL, '2026-08-19 15:48:21', 775.34, 5, 3876.68, 'Pick Up', 'Cerrado', 1),
(73, 2, 4, NULL, '2026-08-19 16:16:54', 775.34, 5, 3876.68, 'Pick Up', 'Cerrado', 1),
(74, 2, 4, NULL, '2026-08-19 16:35:50', 775.34, 0, 0, 'Pick Up', 'Cerrado', 1),
(75, 2, 4, NULL, '2026-08-19 16:38:26', 775.34, 5, 3876.68, 'Pick Up', 'Cerrado', 1),
(76, 3, 4, NULL, '2026-08-19 16:42:54', 775.34, 5, 3876.68, 'Pick Up', 'Cerrado', 1),
(77, 3, 4, NULL, '2026-08-19 16:45:26', 775.34, 5, 3876.68, 'Pick Up', 'Cerrado', 1),
(78, 3, 1, NULL, '2026-08-21 21:15:53', 779.95, 5, 3899.76, 'Local', 'Cerrado', 1),
(79, 3, 1, NULL, '2026-08-21 21:16:11', 779.95, 5, 3899.76, 'Llevar', 'Cerrado', 1),
(80, 3, 1, NULL, '2026-08-21 21:17:17', 779.95, 3, 2339.86, 'Llevar', 'Cerrado', 1),
(81, 3, 1, NULL, '2026-08-21 21:24:29', 779.95, 6, 4679.71, 'Local', 'Cerrado', 1),
(82, 3, 4, NULL, '2026-08-21 21:46:37', 779.95, 0, 0, 'Pick Up', 'Cerrado', 1),
(83, 3, 1, NULL, '2026-08-25 00:16:42', 784.66, 7, 5492.64, 'Local', 'Cerrado', 1),
(84, 3, 1, NULL, '2026-08-25 00:19:17', 784.66, 5, 3923.32, 'Local', 'Cerrado', 4),
(85, 3, 1, NULL, '2026-08-31 21:17:12', 794.99, 7, 5564.94, 'Local', 'Cerrado', 1),
(86, 2, 1, NULL, '2026-08-31 21:31:18', 794.99, 5, 3974.96, 'Local', 'Cerrado', 1),
(87, 2, 1, NULL, '2026-08-31 21:34:17', 794.99, 0, 0, 'Llevar', 'Reembolsado', 1),
(88, 2, 1, NULL, '2026-09-01 15:48:13', 798.33, 5, 3991.63, 'Local', 'Cerrado', 1),
(89, 2, 1, NULL, '2026-09-01 15:48:46', 798.33, 0, 0, 'Llevar', 'Reembolsado', 1),
(90, 2, 1, NULL, '2026-09-01 15:54:13', 798.33, 7, 5588.28, 'Local', 'Cerrado', 1),
(91, 2, 1, NULL, '2026-09-01 16:02:24', 798.33, 5, 3991.63, 'Local', 'Cerrado', 1),
(92, 1, 4, NULL, '2026-09-01 16:07:12', 750, 10, 7500, 'Local', 'Cerrado', 1),
(93, 2, 1, NULL, '2026-09-01 16:09:40', 798.33, 7, 5588.28, 'Local', 'Cerrado', 1),
(94, 2, 1, NULL, '2026-09-01 16:11:22', 798.33, 7, 5588.28, 'Llevar', 'Cerrado', 1),
(95, 2, 1, NULL, '2026-09-01 16:15:12', 798.33, 4.8, 3831.96, 'Llevar', 'Cerrado', 1),
(96, 2, 1, NULL, '2026-09-01 16:16:25', 798.33, 3, 2394.98, 'Llevar', 'Cerrado', 1),
(97, 2, 1, NULL, '2026-09-01 16:44:35', 798.33, 0, 0, 'Llevar', 'Reembolsado', 1),
(98, 5, 1, NULL, '2026-09-01 17:36:07', 798.33, 0, 0, 'Local', 'Reembolsado', 1),
(99, 1, 1, NULL, '2026-09-02 15:19:40', 801.17, 0, 0, 'Local', 'Reembolsado', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas_pagos`
--

CREATE TABLE `ventas_pagos` (
  `id_pago` int(11) NOT NULL,
  `id_venta` int(11) NOT NULL,
  `metodo_pago` enum('Punto','Pago_Movil','Efectivo') NOT NULL,
  `monto_usd` float NOT NULL,
  `monto_bs` float NOT NULL,
  `referencia` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `ventas_pagos`
--

INSERT INTO `ventas_pagos` (`id_pago`, `id_venta`, `metodo_pago`, `monto_usd`, `monto_bs`, `referencia`) VALUES
(5, 5, 'Punto', 13.5, 10047.1, NULL),
(6, 6, 'Efectivo', 14.56, 10838.3, NULL),
(7, 6, 'Punto', 13.44, 10000, NULL),
(8, 7, 'Pago_Movil', 20.16, 15000, NULL),
(9, 7, 'Punto', 15.84, 11792.2, NULL),
(13, 11, 'Punto', 16.5, 12279.7, NULL),
(14, 12, 'Punto', 13.5, 10047.1, NULL),
(15, 13, 'Punto', 13, 9674.94, NULL),
(16, 14, 'Punto', 15, 11184.6, NULL),
(17, 15, 'Punto', 5, 3728.19, NULL),
(18, 16, 'Punto', 12.8, 9584.47, NULL),
(19, 17, 'Punto', 5, 3743.93, NULL),
(20, 18, 'Punto', 10, 7487.86, NULL),
(21, 18, '', 6, 4492.72, NULL),
(22, 19, 'Punto', 5, 3743.93, NULL),
(23, 17, '', 3, 2246.36, NULL),
(24, 19, '', 2, 1497.57, '444'),
(25, 19, '', 3, 2246.36, NULL),
(26, 19, 'Punto', 1, 748.79, NULL),
(27, 20, 'Efectivo', 9, 6739.08, NULL),
(28, 21, 'Punto', 5, 3743.93, NULL),
(29, 22, 'Pago_Movil', 1.45, 1082.04, NULL),
(30, 22, 'Punto', 13.35, 10000, NULL),
(31, 22, 'Punto', 3, 2246.36, NULL),
(32, 23, 'Punto', 3, 2246.36, NULL),
(33, 22, 'Punto', 4, 2995.15, NULL),
(34, 23, 'Punto', 2, 1497.57, NULL),
(35, 24, 'Punto', 8, 5990.29, NULL),
(36, 25, 'Punto', 6, 4535.4, NULL),
(37, 26, 'Efectivo', 5, 3779.5, NULL),
(38, 27, 'Punto', 2, 1511.8, NULL),
(39, 28, 'Punto', 3, 2267.7, NULL),
(40, 29, 'Punto', 5, 3779.5, NULL),
(41, 30, 'Punto', 3, 2267.7, NULL),
(42, 31, 'Punto', 5, 3779.5, NULL),
(43, 32, 'Punto', 5, 3787.7, NULL),
(44, 33, 'Punto', 5, 3787.7, NULL),
(45, 34, 'Punto', 5, 3787.7, NULL),
(46, 35, 'Punto', 5, 3787.7, NULL),
(47, 36, 'Punto', 5, 3787.7, NULL),
(48, 37, 'Punto', 5, 3787.7, NULL),
(49, 38, 'Punto', 5, 3787.7, NULL),
(50, 39, 'Pago_Movil', 5, 3787.7, NULL),
(51, 40, 'Punto', 5, 3787.7, NULL),
(52, 41, 'Pago_Movil', 5, 3787.7, NULL),
(53, 42, 'Punto', 5, 3787.7, NULL),
(54, 43, 'Punto', 5, 3787.7, NULL),
(55, 44, 'Punto', 5, 3787.7, NULL),
(56, 45, 'Punto', 5, 3787.7, NULL),
(57, 46, 'Punto', 5, 3787.7, NULL),
(58, 47, 'Punto', 5, 3787.7, NULL),
(59, 48, 'Punto', 5, 3787.7, NULL),
(60, 49, 'Punto', 5, 3787.7, NULL),
(61, 50, 'Punto', 0.99, 750, NULL),
(62, 50, 'Pago_Movil', 4.01, 3050, NULL),
(63, 51, 'Punto', 5, 3800, NULL),
(64, 52, 'Efectivo', 5, 3834.3, NULL),
(65, 53, 'Punto', 5, 3855.36, 'Bs'),
(66, 54, 'Pago_Movil', 2, 1542.14, 'Bs'),
(67, 55, 'Punto', 5, 3855.36, 'Bs'),
(68, 56, 'Pago_Movil', 5, 3855.36, 'Bs'),
(69, 57, 'Punto', 5, 3855.36, 'Bs'),
(70, 58, 'Punto', 5, 3855.36, 'Bs'),
(71, 59, 'Punto', 16.2, 12491.3, 'Bs'),
(72, 60, 'Punto', 5, 3855.36, 'Bs'),
(73, 61, 'Pago_Movil', 5, 3855.36, 'Bs'),
(74, 62, 'Punto', 5, 3855.36, 'Bs'),
(75, 63, 'Pago_Movil', 5, 3876.68, 'Bs'),
(76, 64, 'Efectivo', 2, 0, 'USD'),
(77, 64, 'Punto', 3, 2326.01, 'Bs'),
(78, 66, 'Punto', 2, 1550.67, 'USD'),
(79, 67, 'Punto', 5, 3876.68, 'Bs'),
(80, 69, 'Punto', 5, 3876.68, 'Bs'),
(81, 70, 'Punto', 3.87, 3000, 'Bs'),
(82, 70, 'Pago_Movil', 1.13, 876.13, 'Bs'),
(83, 71, 'Punto', 2.58, 2000, 'Bs'),
(84, 71, 'Punto', 6.42, 4977.66, 'Bs'),
(85, 72, 'Punto', 5, 3876.68, 'Bs'),
(86, 77, 'Punto', 5, 3876.68, 'Bs'),
(87, 76, 'Punto', 5, 3876.68, 'Bs'),
(88, 73, 'Punto', 5, 3876.68, 'Bs'),
(89, 75, 'Punto', 5, 3876.68, 'Bs'),
(90, 78, 'Pago_Movil', 5, 3899.76, 'Bs'),
(91, 79, 'Punto', 5, 3899.76, 'Bs'),
(92, 80, 'Punto', 3, 2339.86, 'Bs'),
(93, 81, 'Punto', 6, 4679.71, 'Bs'),
(94, 83, 'Punto', 7, 5492.64, 'Bs'),
(95, 84, 'Punto', 5, 3923.32, 'Bs'),
(96, 85, 'Punto', 7, 5564.94, 'Bs'),
(97, 86, 'Punto', 5, 3974.96, 'Bs'),
(98, 87, 'Punto', 0, 0, 'Bs'),
(99, 88, 'Punto', 5, 3991.63, 'Bs'),
(100, 89, 'Punto', 0, 0, 'Bs'),
(101, 90, 'Punto', 7, 5588.28, 'Bs'),
(102, 91, 'Punto', 5, 3991.63, 'Bs'),
(103, 92, 'Efectivo', 10, 7500, 'Bs'),
(104, 93, 'Punto', 7, 5588.28, 'Bs'),
(105, 94, 'Punto', 7, 5588.28, 'Bs'),
(106, 95, 'Punto', 4.8, 3831.96, 'Bs'),
(107, 96, 'Pago_Movil', 3, 2394.98, 'Bs'),
(108, 97, 'Punto', 0, 0, 'Bs'),
(109, 98, 'Pago_Movil', 0, 0, 'Bs'),
(110, 99, 'Punto', 0, 0, 'Bs');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `venta_detalle`
--

CREATE TABLE `venta_detalle` (
  `id_detalle` int(11) NOT NULL,
  `id_venta` int(11) NOT NULL,
  `tipo_producto` enum('Pizza','Bebida','Helado','Combo') NOT NULL,
  `id_producto_origen` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `monto_total` float NOT NULL,
  `nota` text DEFAULT NULL,
  `estado` enum('Pendiente','Preparado','Horno','Completado','Mesero','Despacho','pDespacho','Cerrado','Cancelado') NOT NULL DEFAULT 'Pendiente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `venta_detalle`
--

INSERT INTO `venta_detalle` (`id_detalle`, `id_venta`, `tipo_producto`, `id_producto_origen`, `cantidad`, `monto_total`, `nota`, `estado`) VALUES
(1, 5, 'Pizza', 6, 1, 13.5, '', 'Cerrado'),
(2, 6, 'Pizza', 5, 1, 13, '', 'Cerrado'),
(3, 6, 'Bebida', 3, 1, 1.5, '', 'Cerrado'),
(4, 6, 'Pizza', 6, 1, 13.5, '', 'Cerrado'),
(5, 7, 'Pizza', 5, 1, 13, '', 'Cerrado'),
(6, 7, 'Pizza', 7, 1, 17, '', 'Cerrado'),
(7, 7, 'Bebida', 8, 1, 6, '', 'Cerrado'),
(11, 11, 'Pizza', 3, 1, 16.5, 'Mucho queso', 'Cerrado'),
(12, 12, 'Pizza', 6, 1, 13.5, '', 'Cerrado'),
(13, 13, 'Pizza', 5, 1, 13, '', 'Cerrado'),
(14, 14, 'Pizza', 6, 1, 13.5, '', 'Cerrado'),
(15, 14, 'Bebida', 3, 1, 1.5, '', 'Cerrado'),
(16, 15, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(17, 16, 'Pizza', 3, 1, 8, '', 'Cerrado'),
(18, 16, 'Pizza', 4, 1, 4.8, '', 'Cerrado'),
(19, 17, 'Pizza', 3, 1, 8, '', 'Cerrado'),
(20, 18, 'Pizza', 3, 2, 16, '', 'Cerrado'),
(21, 19, 'Pizza', 4, 1, 7, 'sd', 'Cerrado'),
(22, 20, 'Pizza', 3, 1, 9, '', 'Cerrado'),
(23, 21, 'Pizza', 3, 1, 5, '45', 'Cerrado'),
(24, 22, 'Pizza', 3, 1, 5, 'sin pitillo', 'Cerrado'),
(25, 22, 'Bebida', 1, 1, 2, 'sin pitillo', 'Cerrado'),
(26, 22, 'Pizza', 4, 1, 9.8, '', 'Cerrado'),
(27, 22, 'Pizza', 5, 1, 5, '', 'Cerrado'),
(28, 23, 'Pizza', 5, 1, 5, '', 'Cerrado'),
(29, 24, 'Pizza', 3, 1, 8, '', 'Cerrado'),
(30, 25, 'Pizza', 3, 1, 6, '', 'Cerrado'),
(31, 26, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(32, 27, 'Bebida', 1, 1, 2, '', 'Cerrado'),
(33, 28, 'Pizza', 5, 1, 3, '', 'Cerrado'),
(34, 29, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(35, 30, 'Pizza', 5, 1, 3, '', 'Cerrado'),
(36, 31, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(37, 32, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(38, 33, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(39, 34, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(40, 35, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(41, 36, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(42, 37, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(43, 38, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(44, 39, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(45, 40, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(46, 41, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(47, 42, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(48, 43, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(49, 44, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(50, 45, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(51, 46, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(52, 47, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(53, 48, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(54, 49, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(55, 50, 'Pizza', 5, 1, 5, '', 'Cerrado'),
(56, 51, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(57, 52, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(58, 53, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(59, 54, 'Bebida', 1, 1, 2, '', 'Cerrado'),
(60, 55, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(61, 56, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(62, 57, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(63, 58, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(64, 59, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(65, 59, 'Pizza', 6, 1, 11.2, '', 'Cerrado'),
(66, 60, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(67, 61, 'Pizza', 4, 1, 3, '', 'Cerrado'),
(68, 62, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(69, 63, 'Pizza', 4, 1, 3, '', 'Cerrado'),
(70, 64, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(71, 65, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(72, 66, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(73, 67, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(74, 68, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(75, 69, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(76, 70, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(77, 71, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(78, 71, 'Bebida', 1, 2, 4, '', 'Cerrado'),
(79, 72, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(80, 73, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(81, 74, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(82, 75, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(83, 76, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(84, 77, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(85, 78, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(86, 79, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(87, 80, 'Pizza', 5, 1, 3, '', 'Cerrado'),
(88, 81, 'Pizza', 3, 1, 6, '', 'Cerrado'),
(89, 82, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(90, 83, 'Pizza', 6, 1, 7, '', 'Cerrado'),
(91, 84, 'Pizza', 9, 1, 5, '', 'Cerrado'),
(92, 85, 'Pizza', 6, 1, 7, '', 'Cerrado'),
(93, 86, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(94, 87, 'Pizza', 3, 1, 0, '', 'Cerrado'),
(95, 88, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(96, 89, 'Pizza', 6, 1, 0, '', 'Cerrado'),
(97, 90, 'Pizza', 6, 1, 7, '', 'Cerrado'),
(98, 91, 'Pizza', 3, 1, 5, '', 'Cerrado'),
(99, 92, 'Pizza', 1, 1, 10, '', 'Cerrado'),
(100, 93, 'Pizza', 6, 1, 7, '', 'Cerrado'),
(101, 94, 'Pizza', 6, 1, 7, '', 'Cerrado'),
(102, 95, 'Pizza', 4, 1, 4.8, '', 'Cerrado'),
(103, 96, 'Pizza', 5, 1, 3, '', 'Cerrado'),
(104, 97, 'Pizza', 7, 1, 0, '', 'Cerrado'),
(105, 98, 'Pizza', 3, 1, 0, '', 'Cerrado'),
(106, 99, 'Pizza', 6, 1, 0, '', 'Cancelado');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `venta_detalle_combo`
--

CREATE TABLE `venta_detalle_combo` (
  `id_venta_detalle_combo` int(11) NOT NULL,
  `id_detalle` int(11) NOT NULL,
  `tipo_producto` enum('Pizza','Bebida') NOT NULL,
  `id_producto_origen` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `bebidas`
--
ALTER TABLE `bebidas`
  ADD PRIMARY KEY (`id_bebida`);

--
-- Indices de la tabla `categoria_pizza`
--
ALTER TABLE `categoria_pizza`
  ADD PRIMARY KEY (`id_categoria_pizza`);

--
-- Indices de la tabla `cierres_caja`
--
ALTER TABLE `cierres_caja`
  ADD PRIMARY KEY (`id_cierre`),
  ADD KEY `fk_cierre_usuario` (`id_usuario`),
  ADD KEY `id_sucursal` (`id_sucursal`);

--
-- Indices de la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id_cliente`);

--
-- Indices de la tabla `combos`
--
ALTER TABLE `combos`
  ADD PRIMARY KEY (`id_combo`);

--
-- Indices de la tabla `combo_detalle`
--
ALTER TABLE `combo_detalle`
  ADD PRIMARY KEY (`id_combo_detalle`),
  ADD KEY `id_combo` (`id_combo`);

--
-- Indices de la tabla `configuracion_tasa`
--
ALTER TABLE `configuracion_tasa`
  ADD PRIMARY KEY (`id_config`);

--
-- Indices de la tabla `delivery`
--
ALTER TABLE `delivery`
  ADD PRIMARY KEY (`id_delivery`);

--
-- Indices de la tabla `detalle_venta_extras`
--
ALTER TABLE `detalle_venta_extras`
  ADD PRIMARY KEY (`id_detalle_extra`),
  ADD KEY `id_detalle` (`id_detalle`),
  ADD KEY `id_extra` (`id_extra`);

--
-- Indices de la tabla `extras`
--
ALTER TABLE `extras`
  ADD PRIMARY KEY (`id_extras`),
  ADD KEY `id_categoria_pizza` (`id_categoria_pizza`);

--
-- Indices de la tabla `heladeria`
--
ALTER TABLE `heladeria`
  ADD PRIMARY KEY (`id_heladeria`);

--
-- Indices de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD PRIMARY KEY (`id_notificacion`),
  ADD KEY `id_cliente` (`id_cliente`),
  ADD KEY `id_venta` (`id_venta`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `pin`
--
ALTER TABLE `pin`
  ADD PRIMARY KEY (`id_pin`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `pizza`
--
ALTER TABLE `pizza`
  ADD PRIMARY KEY (`id_pizza`),
  ADD KEY `id_categoria_pizza` (`id_categoria_pizza`);

--
-- Indices de la tabla `sucursal`
--
ALTER TABLE `sucursal`
  ADD PRIMARY KEY (`id_sucursal`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD KEY `id_sucursal` (`id_sucursal`);

--
-- Indices de la tabla `ventas`
--
ALTER TABLE `ventas`
  ADD PRIMARY KEY (`id_venta`),
  ADD KEY `id_cliente` (`id_cliente`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_delivery` (`id_delivery`),
  ADD KEY `id_sucursal` (`id_sucursal`);

--
-- Indices de la tabla `ventas_pagos`
--
ALTER TABLE `ventas_pagos`
  ADD PRIMARY KEY (`id_pago`),
  ADD KEY `id_venta` (`id_venta`);

--
-- Indices de la tabla `venta_detalle`
--
ALTER TABLE `venta_detalle`
  ADD PRIMARY KEY (`id_detalle`),
  ADD KEY `id_venta` (`id_venta`),
  ADD KEY `id_producto_origen` (`id_producto_origen`);

--
-- Indices de la tabla `venta_detalle_combo`
--
ALTER TABLE `venta_detalle_combo`
  ADD PRIMARY KEY (`id_venta_detalle_combo`),
  ADD KEY `id_detalle` (`id_detalle`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `bebidas`
--
ALTER TABLE `bebidas`
  MODIFY `id_bebida` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `categoria_pizza`
--
ALTER TABLE `categoria_pizza`
  MODIFY `id_categoria_pizza` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `cierres_caja`
--
ALTER TABLE `cierres_caja`
  MODIFY `id_cierre` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id_cliente` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `combos`
--
ALTER TABLE `combos`
  MODIFY `id_combo` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `combo_detalle`
--
ALTER TABLE `combo_detalle`
  MODIFY `id_combo_detalle` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `configuracion_tasa`
--
ALTER TABLE `configuracion_tasa`
  MODIFY `id_config` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `delivery`
--
ALTER TABLE `delivery`
  MODIFY `id_delivery` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `detalle_venta_extras`
--
ALTER TABLE `detalle_venta_extras`
  MODIFY `id_detalle_extra` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT de la tabla `extras`
--
ALTER TABLE `extras`
  MODIFY `id_extras` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `heladeria`
--
ALTER TABLE `heladeria`
  MODIFY `id_heladeria` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  MODIFY `id_notificacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `pin`
--
ALTER TABLE `pin`
  MODIFY `id_pin` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `pizza`
--
ALTER TABLE `pizza`
  MODIFY `id_pizza` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `sucursal`
--
ALTER TABLE `sucursal`
  MODIFY `id_sucursal` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT de la tabla `ventas`
--
ALTER TABLE `ventas`
  MODIFY `id_venta` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT de la tabla `ventas_pagos`
--
ALTER TABLE `ventas_pagos`
  MODIFY `id_pago` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=111;

--
-- AUTO_INCREMENT de la tabla `venta_detalle`
--
ALTER TABLE `venta_detalle`
  MODIFY `id_detalle` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=107;

--
-- AUTO_INCREMENT de la tabla `venta_detalle_combo`
--
ALTER TABLE `venta_detalle_combo`
  MODIFY `id_venta_detalle_combo` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `cierres_caja`
--
ALTER TABLE `cierres_caja`
  ADD CONSTRAINT `cierres_caja_ibfk_1` FOREIGN KEY (`id_sucursal`) REFERENCES `sucursal` (`id_sucursal`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cierre_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `combo_detalle`
--
ALTER TABLE `combo_detalle`
  ADD CONSTRAINT `combo_detalle_ibfk_1` FOREIGN KEY (`id_combo`) REFERENCES `combos` (`id_combo`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `detalle_venta_extras`
--
ALTER TABLE `detalle_venta_extras`
  ADD CONSTRAINT `dve_ibfk_1` FOREIGN KEY (`id_detalle`) REFERENCES `venta_detalle` (`id_detalle`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `dve_ibfk_2` FOREIGN KEY (`id_extra`) REFERENCES `extras` (`id_extras`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `extras`
--
ALTER TABLE `extras`
  ADD CONSTRAINT `extras_ibfk_1` FOREIGN KEY (`id_categoria_pizza`) REFERENCES `categoria_pizza` (`id_categoria_pizza`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD CONSTRAINT `notificaciones_ibfk_1` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id_venta`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `notificaciones_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `notificaciones_ibfk_3` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `pin`
--
ALTER TABLE `pin`
  ADD CONSTRAINT `pin_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `pizza`
--
ALTER TABLE `pizza`
  ADD CONSTRAINT `pizza_ibfk_1` FOREIGN KEY (`id_categoria_pizza`) REFERENCES `categoria_pizza` (`id_categoria_pizza`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`id_sucursal`) REFERENCES `sucursal` (`id_sucursal`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `ventas`
--
ALTER TABLE `ventas`
  ADD CONSTRAINT `ventas_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ventas_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ventas_ibfk_3` FOREIGN KEY (`id_delivery`) REFERENCES `delivery` (`id_delivery`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ventas_ibfk_4` FOREIGN KEY (`id_sucursal`) REFERENCES `sucursal` (`id_sucursal`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `ventas_pagos`
--
ALTER TABLE `ventas_pagos`
  ADD CONSTRAINT `vp_ibfk_1` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id_venta`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `venta_detalle`
--
ALTER TABLE `venta_detalle`
  ADD CONSTRAINT `vd_ibfk_1` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id_venta`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `venta_detalle_combo`
--
ALTER TABLE `venta_detalle_combo`
  ADD CONSTRAINT `vdc_ibfk_1` FOREIGN KEY (`id_detalle`) REFERENCES `venta_detalle` (`id_detalle`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
