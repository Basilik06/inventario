# Guía de Instalación - Sistema de Control de Inventarios

## Requisitos Previos

- XAMPP instalado (con Apache y MySQL activos)
- Navegador web moderno (Chrome, Firefox, Edge, Safari)

## Pasos de Instalación

### 1. Configurar XAMPP

1. Abre XAMPP Control Panel
2. Inicia **Apache** y **MySQL**
3. Verifica que ambos estén en ejecución (botones en verde)

### 2. Importar Base de Datos

1. Abre tu navegador y ve a: `http://localhost/phpmyadmin`
2. En el menú lateral, haz clic en **"Nueva"** para crear una base de datos
3. O bien, haz clic en la pestaña **"Importar"**
4. Haz clic en **"Seleccionar archivo"** y busca el archivo `inventario.sql`
5. Haz clic en **"Continuar"** o **"Ejecutar"**
6. Verifica que se haya creado la base de datos `sistema_inventarios` con todas las tablas

**Alternativa (desde línea de comandos):**

Si tienes MySQL en tu PATH, puedes ejecutar:
```bash
mysql -u root -p < inventario.sql
```

### 3. Copiar Archivos

1. Copia toda la carpeta `nuevo` a tu directorio de XAMPP:
   - **Ruta típica en Windows:** `C:\xampp\htdocs\`
   - O crea una carpeta llamada `inventario` dentro de `htdocs`

2. La estructura debería quedar así:
   ```
   C:\xampp\htdocs\inventario\
   ├── index.html
   ├── styles.css
   ├── app.js
   ├── data.js
   ├── api/
   │   ├── config.php
   │   ├── auth.php
   │   ├── productos.php
   │   ├── proveedores.php
   │   ├── movimientos.php
   │   ├── pedidos.php
   │   ├── alertas.php
   │   ├── auditoria.php
   │   ├── dashboard.php
   │   └── categorias.php
   └── inventario.sql
   ```

### 4. Configurar Conexión a Base de Datos (si es necesario)

Si tu configuración de MySQL es diferente (usuario/password), edita el archivo:
```
nuevo/api/config.php
```

Y modifica estas líneas:
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');      // Cambia si es diferente
define('DB_PASS', '');          // Cambia si tienes contraseña
define('DB_NAME', 'sistema_inventarios');
```

### 5. Acceder a la Aplicación

1. Abre tu navegador
2. Ve a: `http://localhost/inventario/` (o la ruta donde copiaste los archivos)
3. Deberías ver la pantalla de login

### 6. Credenciales de Acceso

**Usuario de Prueba:**
- **Email:** `ana.garcia@empresa.com`
- **Contraseña:** `123456`

**Otros usuarios disponibles:**
- `pedro.sanchez@empresa.com` / `123456`
- `maria.lopez@empresa.com` / `123456`
- `juan.martinez@empresa.com` / `123456`

## Solución de Problemas

### Error: "No se puede conectar a la base de datos"

1. Verifica que MySQL esté corriendo en XAMPP
2. Verifica las credenciales en `api/config.php`
3. Verifica que la base de datos `sistema_inventarios` exista

### Error: "404 Not Found" en las peticiones API

1. Verifica que Apache esté corriendo
2. Verifica que los archivos estén en la ruta correcta
3. Verifica que la carpeta `api` exista y tenga los archivos PHP

### Error: "CORS" o problemas de permisos

Los archivos PHP ya incluyen headers CORS. Si aún tienes problemas:
1. Verifica que estés accediendo desde `http://localhost` (no `file://`)
2. Verifica que los headers en `api/config.php` estén correctos

### La página carga pero no hay datos

1. Verifica que la base de datos tenga datos:
   - Abre phpMyAdmin
   - Selecciona `sistema_inventarios`
   - Verifica que las tablas tengan registros
2. Verifica la consola del navegador (F12) para ver errores

## Verificar Instalación

1. Accede a `http://localhost/inventario/`
2. Inicia sesión con las credenciales
3. Deberías ver el Dashboard con datos
4. Navega por las diferentes secciones:
   - Productos
   - Proveedores
   - Movimientos
   - Pedidos
   - etc.

## Notas Importantes

- Todos los datos se guardan en la base de datos MySQL
- Los cambios son persistentes (no se pierden al recargar)
- La contraseña de desarrollo es `123456` (hasheada en la BD)
- En producción, cambia todas las contraseñas y configuración de seguridad

## Estructura de la Base de Datos

La base de datos incluye:
- **usuarios** - Usuarios del sistema
- **categorias** - Categorías de productos
- **proveedores** - Proveedores
- **productos** - Catálogo de productos
- **pedidos** - Pedidos a proveedores
- **pedido_productos** - Detalles de pedidos
- **movimientos** - Entradas y salidas de inventario
- **alertas** - Sistema de alertas
- **auditoria** - Log de todas las acciones

¡Listo para usar! 🎉

