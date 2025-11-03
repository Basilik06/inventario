# Sistema de Control de Inventarios

Sistema web completo de gestión de inventarios desarrollado con tecnologías web estándar (HTML, CSS, JavaScript) y PHP como backend. Permite gestionar productos, proveedores, movimientos de inventario, pedidos, alertas, usuarios y generar reportes estadísticos.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Requisitos del Sistema](#-requisitos-del-sistema)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Uso del Sistema](#-uso-del-sistema)
- [Roles de Usuario](#-roles-de-usuario)
- [Solución de Problemas](#-solución-de-problemas)
- [Seguridad](#-seguridad)
- [Contribuciones](#-contribuciones)
- [Licencia](#-licencia)

## ✨ Características

### Funcionalidades Principales

- ✅ **Dashboard Interactivo**
  - Resumen estadístico del inventario
  - Gráficos de movimientos de stock (últimos 6 meses)
  - Distribución por categorías
  - Análisis de costos
  - Estado de pedidos
  - Productos más movidos
  - Valor por categoría
  - Tendencias de pedidos
  - Alertas activas en tiempo real

- ✅ **Gestión de Productos**
  - CRUD completo (Crear, Leer, Actualizar, Eliminar)
  - Código SKU único automático
  - Control de stock mínimo
  - Categorización
  - Asociación con proveedores
  - Búsqueda y filtrado avanzado
  - Importación desde CSV

- ✅ **Gestión de Proveedores**
  - Información completa de contacto
  - Historial de pedidos
  - Productos suministrados
  - Estadísticas de proveedores

- ✅ **Gestión de Movimientos de Inventario**
  - Registro de entradas y salidas
  - Actualización automática de stock
  - Referencias automáticas (ENTR-0001, SAL-0001)
  - Filtrado por tipo y búsqueda
  - Historial completo de movimientos

- ✅ **Gestión de Pedidos**
  - Creación de pedidos con múltiples productos
  - Estados: Pendiente, Confirmado, En tránsito, Entregado, Cancelado
  - Actualización automática de stock al entregar
  - Seguimiento completo de pedidos

- ✅ **Sistema de Alertas**
  - Alertas automáticas por stock bajo
  - Alertas de pedidos retrasados
  - Alertas del sistema
  - Clasificación por severidad
  - Notificación de alertas no leídas

- ✅ **Historial de Auditoría**
  - Registro completo de todas las acciones
  - Filtrado por año
  - Información detallada de cambios
  - Búsqueda en historial

- ✅ **Gestión de Usuarios y Roles**
  - Crear, editar y eliminar usuarios
  - Asignación de roles
  - Control de acceso basado en roles
  - Activar/desactivar usuarios

- ✅ **Reportes e Informes**
  - Rotación de productos
  - Análisis de costos
  - Análisis de stock
  - Estadísticas de proveedores
  - Exportación de datos

- ✅ **Configuración del Sistema**
  - Preferencias del usuario
  - Configuración de notificaciones

### Características Técnicas

- 🔒 Sistema de autenticación seguro con hash de contraseñas
- 📱 Diseño responsive (Mobile y Desktop)
- 🔍 Búsqueda y filtrado en tiempo real
- 📊 Gráficos interactivos con Chart.js
- 💾 Persistencia de datos en MySQL/MariaDB
- 🔄 Actualización automática de stock
- 📝 Registro automático de auditoría
- ⚡ Actualizaciones sin recargar página
- 🎨 Interfaz moderna y intuitiva

## 🛠 Tecnologías Utilizadas

### Frontend
- **HTML5** - Estructura semántica
- **CSS3** - Estilos personalizados y responsive
- **JavaScript (ES6+)** - Lógica de la aplicación
- **Bootstrap 5.3.2** - Framework CSS para componentes UI
- **Bootstrap Icons** - Librería de iconos
- **Chart.js 4.4.0** - Gráficos y visualizaciones

### Backend
- **PHP 7.4+** - Lenguaje del servidor
- **MySQL/MariaDB** - Base de datos relacional
- **MySQLi** - Extensión PHP para MySQL

### Servidor
- **Apache** - Servidor web HTTP
- **XAMPP** - Entorno de desarrollo local (recomendado)

## 📦 Requisitos del Sistema

### Requisitos Mínimos

- **Servidor Web:**
  - XAMPP (Windows), LAMP (Linux) o MAMP (macOS)
  - Apache 2.4+
  - PHP 7.4 o superior
  - MySQL 5.7+ o MariaDB 10.3+

- **Cliente:**
  - Navegador web moderno con soporte para:
    - ES6+ (JavaScript moderno)
    - CSS Grid y Flexbox
    - Fetch API
    - LocalStorage

### Navegadores Soportados

- ✅ Chrome/Edge (recomendado)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

## 🚀 Instalación

### Paso 1: Descargar e Instalar XAMPP

1. Descarga XAMPP desde [https://www.apachefriends.org/](https://www.apachefriends.org/)
2. Instala XAMPP en tu sistema
3. Abre el **XAMPP Control Panel**
4. Inicia los servicios **Apache** y **MySQL**
5. Verifica que ambos estén en ejecución (indicadores en verde)

### Paso 2: Clonar o Descargar el Proyecto

**Opción A - Clonar con Git:**
```bash
git clone https://github.com/tu-usuario/inventario.git
cd inventario
```

**Opción B - Descargar ZIP:**
1. Descarga el proyecto como ZIP
2. Extrae el contenido en una carpeta accesible

### Paso 3: Copiar Archivos al Directorio de XAMPP

**Windows:**
```bash
# Copia todos los archivos a:
C:\xampp\htdocs\inventario\
```

**Linux/Mac:**
```bash
# Copia todos los archivos a:
/opt/lampp/htdocs/inventario/
# o
/Applications/XAMPP/htdocs/inventario/
```

**Estructura final esperada:**
```
htdocs/inventario/
├── index.html
├── styles.css
├── app.js
├── data.js
├── inventario.sql
├── README.md
└── api/
    ├── config.php
    ├── auth.php
    ├── productos.php
    ├── proveedores.php
    ├── movimientos.php
    ├── pedidos.php
    ├── alertas.php
    ├── auditoria.php
    ├── dashboard.php
    ├── reportes.php
    ├── categorias.php
    └── usuarios.php
```

### Paso 4: Importar Base de Datos

#### Opción A: Usando phpMyAdmin (Recomendado)

1. Abre tu navegador y ve a: `http://localhost/phpmyadmin`
2. Haz clic en la pestaña **"Importar"**
3. Haz clic en **"Seleccionar archivo"** y busca `inventario.sql`
4. Haz clic en **"Continuar"** o **"Ejecutar"**
5. Verifica que se haya creado la base de datos `sistema_inventarios` con todas las tablas

**Nota:** Si el archivo SQL crea una base de datos diferente, ajusta el nombre en `api/config.php`

#### Opción B: Desde Línea de Comandos

```bash
# Windows (desde la carpeta del proyecto)
mysql -u root -p < inventario.sql

# Linux/Mac
mysql -u root -p < inventario.sql
```

**Nota:** Si MySQL no está en tu PATH, usa la ruta completa:
```bash
# Windows
C:\xampp\mysql\bin\mysql.exe -u root -p < inventario.sql

# Linux
/opt/lampp/bin/mysql -u root -p < inventario.sql
```

### Paso 5: Configurar Conexión a Base de Datos

1. Abre el archivo `api/config.php`
2. Verifica o modifica las credenciales según tu configuración:

```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');      // Usuario de MySQL
define('DB_PASS', '');           // Contraseña de MySQL (vacía por defecto en XAMPP)
define('DB_NAME', 'inventario'); // Nombre de la base de datos
                           // Nota: El SQL crea 'sistema_inventarios', 
                           // ajusta este valor según tu base de datos
```

**⚠️ Importante:** En producción, cambia estas credenciales por valores seguros.

### Paso 6: Acceder a la Aplicación

1. Abre tu navegador
2. Navega a: `http://localhost/inventario/`
3. Deberías ver la pantalla de login

### Paso 7: Credenciales de Acceso

El sistema incluye usuarios de prueba preconfigurados:

#### Usuario Administrador
- **Email:** `ana.garcia@empresa.com`
- **Contraseña:** `123456`
- **Rol:** Administrador (acceso completo)

#### Usuarios de Prueba Adicionales
- **Email:** `pedro.sanchez@empresa.com` / **Contraseña:** `123456` (Gestor de Inventario)
- **Email:** `maria.lopez@empresa.com` / **Contraseña:** `123456` (Gestor de Inventario)
- **Email:** `juan.martinez@empresa.com` / **Contraseña:** `123456` (Gestor de Inventario)

**🔒 Seguridad:** En producción, cambia TODAS las contraseñas por defecto.

## ⚙️ Configuración

### Configuración de Base de Datos

Archivo: `api/config.php`

```php
// Configuración de conexión
define('DB_HOST', 'localhost');    // Host de MySQL
define('DB_USER', 'root');          // Usuario
define('DB_PASS', '');              // Contraseña
define('DB_NAME', 'inventario');     // Nombre de BD

// Configuración de charset
$conn->set_charset("utf8mb4");
```

### Configuración de CORS

El sistema incluye headers CORS configurados en `api/config.php`:

```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
```

**⚠️ En producción:** Cambia `Access-Control-Allow-Origin: *` por el dominio específico de tu aplicación.

### Personalización de Colores

Archivo: `styles.css`

```css
:root {
    --primary-color: #27AE60;      /* Color principal (verde) */
    --primary-dark: #1e8449;         /* Verde oscuro */
    --text-dark: #212121;            /* Texto oscuro */
    --text-muted: #BDBDBD;           /* Texto gris */
    --border-color: #E0E0E0;          /* Color de bordes */
    --bg-light: #FAFAFA;              /* Fondo claro */
}
```

## 📁 Estructura del Proyecto

```
inventario/
│
├── index.html                  # Página principal
├── styles.css                  # Estilos CSS personalizados
├── app.js                      # Lógica principal de la aplicación
├── data.js                     # Datos mock (no usado en producción)
├── inventario.sql              # Script SQL para crear la BD
├── README.md                   # Este archivo
├── INSTALACION.md              # Guía detallada de instalación
│
└── api/                        # Backend PHP
    ├── config.php              # Configuración de BD y funciones helper
    ├── auth.php                # Autenticación (login/registro)
    ├── productos.php           # CRUD de productos
    ├── proveedores.php         # CRUD de proveedores
    ├── movimientos.php         # CRUD de movimientos
    ├── pedidos.php             # CRUD de pedidos
    ├── alertas.php             # Gestión de alertas
    ├── auditoria.php           # Historial de auditoría
    ├── dashboard.php           # Datos del dashboard
    ├── reportes.php            # Datos de reportes
    ├── categorias.php          # Gestión de categorías
    ├── usuarios.php            # CRUD de usuarios
    └── importar_productos.php # Importación CSV
```

## 📖 Uso del Sistema

### Primeros Pasos

1. **Iniciar Sesión**
   - Accede a `http://localhost/inventario/`
   - Ingresa las credenciales de administrador
   - Serás redirigido al dashboard

2. **Explorar el Dashboard**
   - Revisa las estadísticas generales
   - Observa los gráficos interactivos
   - Revisa las alertas activas

3. **Gestionar Productos**
   - Ve a **Productos** → **Agregar Producto**
   - Completa el formulario con los datos del producto
   - El sistema generará automáticamente un SKU único

4. **Registrar Movimientos**
   - Ve a **Movimientos** → **Nuevo Movimiento**
   - Selecciona tipo (Entrada o Salida)
   - El stock se actualizará automáticamente

5. **Crear Pedidos**
   - Ve a **Pedidos** → **Nuevo Pedido**
   - Selecciona proveedor y productos
   - El sistema calculará automáticamente los totales

### Funcionalidades por Sección

#### Dashboard
- Visualiza estadísticas generales
- Gráficos de movimientos y tendencias
- Alertas en tiempo real
- Resumen de inventario

#### Productos
- Agregar, editar, eliminar productos
- Buscar por nombre o SKU
- Filtrar por categoría
- Importar desde CSV

#### Proveedores
- Gestionar información de proveedores
- Ver historial de pedidos
- Estadísticas por proveedor

#### Movimientos
- Registrar entradas y salidas
- Ver historial completo
- Filtros por tipo y fecha

#### Pedidos
- Crear nuevos pedidos
- Actualizar estado de pedidos
- Ver detalles y seguimiento

#### Alertas
- Ver todas las alertas
- Filtrar por tipo y severidad
- Marcar como leídas

#### Historial
- Ver registro completo de acciones
- Filtrar por año
- Buscar en historial

#### Usuarios & Roles
- Crear, editar, eliminar usuarios
- Asignar roles
- Activar/desactivar usuarios

## 👥 Roles de Usuario

El sistema incluye dos roles principales con diferentes permisos:

### 🔑 Administrador
**Acceso completo a todas las funcionalidades:**
- ✅ Inicio (Dashboard)
- ✅ Productos
- ✅ Proveedores
- ✅ Movimientos
- ✅ Pedidos
- ✅ Informes
- ✅ Alertas
- ✅ **Historial** (exclusivo)
- ✅ **Usuarios & Roles** (exclusivo)
- ✅ Configuración

### 📦 Gestor de Inventario
**Acceso a funciones operativas:**
- ✅ Inicio (Dashboard)
- ✅ Productos
- ✅ Proveedores
- ✅ Movimientos
- ✅ Pedidos
- ✅ Informes
- ✅ Alertas
- ✅ Configuración
- ❌ Historial (no tiene acceso)
- ❌ Usuarios & Roles (no tiene acceso)

El sistema automáticamente muestra/oculta las opciones del menú según el rol del usuario.

## 🔧 Solución de Problemas

### Error: "No se puede conectar a la base de datos"

**Causas posibles:**
1. MySQL no está corriendo en XAMPP
2. Credenciales incorrectas en `api/config.php`
3. La base de datos no existe

**Solución:**
1. Verifica que MySQL esté corriendo en XAMPP Control Panel
2. Verifica las credenciales en `api/config.php`
3. Verifica que el nombre de la base de datos coincida (por defecto: `sistema_inventarios`)
4. Importa nuevamente el archivo `inventario.sql`

### Error: "404 Not Found" en las peticiones API

**Causas posibles:**
1. Apache no está corriendo
2. Archivos en ubicación incorrecta
3. Ruta incorrecta en la URL

**Solución:**
1. Inicia Apache en XAMPP Control Panel
2. Verifica que los archivos estén en `htdocs/inventario/`
3. Accede desde `http://localhost/inventario/` (no `file://`)

### Error: "CORS" o problemas de permisos

**Causas posibles:**
1. Accediendo desde `file://` en lugar de `http://localhost`
2. Headers CORS incorrectos

**Solución:**
1. Siempre accede desde `http://localhost/inventario/`
2. Verifica los headers en `api/config.php`

### La página carga pero no hay datos

**Causas posibles:**
1. Base de datos vacía
2. Errores en la consola del navegador
3. Problemas con las consultas SQL

**Solución:**
1. Verifica que la base de datos tenga datos en phpMyAdmin
2. Abre la consola del navegador (F12) y revisa errores
3. Verifica los logs de PHP en XAMPP

### Error de PHP: "Call to undefined function"

**Causa:** Extensión PHP no habilitada

**Solución:**
1. Abre `php.ini` en XAMPP
2. Busca y descomenta (quita el `;`) las extensiones necesarias:
   ```ini
   extension=mysqli
   extension=mbstring
   ```
3. Reinicia Apache

### Las gráficas no se muestran

**Causas posibles:**
1. Chart.js no está cargando
2. Datos incorrectos desde la API
3. JavaScript deshabilitado

**Solución:**
1. Verifica la consola del navegador (F12)
2. Verifica que Chart.js esté cargado (red)
3. Verifica que la API devuelva datos correctos

### Problemas con caracteres especiales (acentos, ñ)

**Causa:** Codificación de caracteres incorrecta

**Solución:**
1. Verifica que la BD use `utf8mb4`
2. Verifica que `api/config.php` configure charset:
   ```php
   $conn->set_charset("utf8mb4");
   ```
3. Verifica que `index.html` tenga:
   ```html
   <meta charset="UTF-8">
   ```

## 🔒 Seguridad

### Recomendaciones para Producción

1. **Cambiar Credenciales por Defecto**
   - Cambiar todas las contraseñas de usuarios
   - Usar contraseñas seguras en MySQL
   - Cambiar credenciales en `api/config.php`

2. **Configurar CORS Correctamente**
   ```php
   // En producción, usar dominio específico:
   header('Access-Control-Allow-Origin: https://tu-dominio.com');
   ```

3. **Habilitar HTTPS**
   - Usar certificado SSL
   - Forzar conexiones HTTPS

4. **Validación de Inputs**
   - El sistema ya incluye validación en backend y frontend
   - Agregar validación adicional según necesidades

5. **Sanitización de Datos**
   - Todas las consultas usan prepared statements (ya implementado)
   - Validar y sanitizar todos los inputs

6. **Actualizar PHP**
   - Usar la versión más reciente de PHP
   - Mantener actualizado para parches de seguridad

7. **Backups Regulares**
   - Configurar backups automáticos de la base de datos
   - Guardar backups en ubicación segura

### Configuración de Seguridad en PHP

Archivo: `php.ini`
```ini
display_errors = Off          # En producción
log_errors = On                # Registrar errores
expose_php = Off               # Ocultar versión de PHP
allow_url_fopen = Off          # Si no es necesario
```

## 📊 Base de Datos

### Estructura de Tablas

- **usuarios** - Usuarios del sistema con roles
- **categorias** - Categorías de productos
- **proveedores** - Información de proveedores
- **productos** - Catálogo de productos
- **pedidos** - Pedidos a proveedores
- **pedido_productos** - Detalles de productos en pedidos
- **movimientos** - Entradas y salidas de inventario
- **alertas** - Sistema de alertas
- **auditoria** - Registro completo de acciones

### Scripts de Base de Datos

- `inventario.sql` - Script completo de creación e inserción de datos iniciales

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guía de Estilo de Código

- Usar indentación consistente (espacios, no tabs)
- Seguir convenciones de nombres claros
- Comentar código complejo
- Mantener funciones pequeñas y enfocadas

## 📝 Licencia

Este proyecto está disponible bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte, por favor:
1. Revisa la sección de [Solución de Problemas](#-solución-de-problemas)
2. Verifica los issues existentes en GitHub
3. Crea un nuevo issue si es necesario

## 🎯 Roadmap

Funcionalidades planeadas para futuras versiones:

- [ ] Exportación de reportes a PDF/Excel
- [ ] Notificaciones por email
- [ ] API REST documentada
- [ ] Modo oscuro
- [ ] Aplicación móvil
- [ ] Integración con códigos de barras
- [ ] Múltiples almacenes
- [ ] Sistema de inventarios avanzado

## 🙏 Agradecimientos

- Bootstrap por el framework CSS
- Chart.js por las librerías de gráficos
- XAMPP por el entorno de desarrollo

---

**Desarrollado con ❤️ para la gestión eficiente de inventarios**
