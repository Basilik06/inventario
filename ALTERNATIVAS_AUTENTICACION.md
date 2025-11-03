# Alternativas de Autenticación para el Sistema de Inventarios

## 🎯 Contexto Actual
**Stack actual:** PHP (backend) + Vanilla JavaScript (frontend)
**Estado:** Funcionando correctamente con autenticación básica basada en sesiones

---

## 📊 Comparativa de Soluciones

### 1. ✅ **Solución Actual - PHP Vanilla + JSON**
**¿Qué es?**  
Backend PHP tradicional con MySQL, frontend con JavaScript vanilla, comunicación por API REST con JSON.

**Ventajas:**
- ✅ Simple y directo
- ✅ No requiere aprendizaje de frameworks
- ✅ Llena de recursos
- ✅ Compatible con XAMPP
- ✅ Control total del flujo

**Desventajas:**
- ❌ Mucho código repetitivo
- ❌ Falta estructura organizacional
- ❌ Estado de sesión no persistente (requiere recargar datos)
- ❌ No hay estandarización de código

**Cuándo usarla:**
- Prototipos rápidos
- Proyectos pequeños (< 5000 LOC)
- Cuando necesitas control absoluto
- Equipos sin experiencia en frameworks

---

### 2. 🔧 **Laravel + Sanctum + Vue.js** ⭐ (Recomendada para producción)

**¿Qué es?**  
Framework PHP moderno con autenticación API (Sanctum) y frontend con Vue.js.

**Ventajas:**
- ✅ Laravel: ORM, migraciones, validaciones, seguridad
- ✅ Sanctum: tokens (SPA), cookies (cros-site), APIs
- ✅ Vue.js: reactividad, componentes reutilizables
- ✅ Comunidad y soporte amplios
- ✅ Migración paulatina posible
- ✅ Estructura clara y mantenible

**Desventajas:**
- ❌ Curva de aprendizaje media
- ❌ Overhead de recursos
- ❌ Necesita Composer

**Implementación:**
```bash
# Backend
composer create-project laravel/laravel inventario-api
php artisan make:auth  # Genera todo el sistema de auth
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"

# Frontend  
npm install @vue/cli
vue create inventario-frontend
npm install axios
```

**Estructura:**
```
inventario-api/               # Backend Laravel
├── app/
│   ├── Http/Controllers/
│   │   ├── AuthController.php
│   │   └── ProductoController.php
│   ├── Models/
│   │   ├── User.php
│   │   └── Producto.php
├── routes/api.php           # API routes
└── database/migrations/     # DB structure

inventario-frontend/          # Frontend Vue
├── src/
│   ├── views/
│   │   ├── Login.vue
│   │   └── Dashboard.vue
│   ├── components/
│   │   └── ProductosTable.vue
│   ├── services/
│   │   └── authService.js
│   └── router/index.js
```

**Ejemplo Auth:**
```php
// Laravel - app/Http/Controllers/AuthController.php
class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);
        
        if (Auth::attempt($credentials)) {
            $user = Auth::user();
            $token = $user->createToken('auth-token')->plainTextToken;
            return response()->json(['token' => $token, 'user' => $user]);
        }
        
        return response()->json(['error' => 'Credenciales inválidas'], 401);
    }
}
```

```javascript
// Vue.js - src/services/authService.js
import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8000/api' });

// Interceptor para añadir token automáticamente
API.interceptors.request.use(config => {
    const token = localStorage.getItem('auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const authService = {
    async login(email, password) {
        const response = await API.post('/login', { email, password });
        localStorage.setItem('auth_token', response.data.token);
        return response.data.user;
    },
    
    async logout() {
        await API.post('/logout');
        localStorage.removeItem('auth_token');
    }
};
```

---

### 3. 🚀 **Next.js (Full-Stack React) + NextAuth.js**

**¿Qué es?**  
React con SSR, API Routes y NextAuth.js.

**Ventajas:**
- ✅ Full-stack
- ✅ SSR/SEO
- ✅ NextAuth: OAuth, JWT, base de datos
- ✅ Rendimiento y DX

**Desventajas:**
- ❌ Complejo para proyectos pequeños
- ❌ Necesitas Node.js en producción

**Implementación:**
```bash
npx create-next-app@latest inventario
npm install next-auth prisma @prisma/client
```

**Ejemplo:**
```typescript
// pages/api/auth/[...nextauth].ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export default NextAuth({
    providers: [
        CredentialsProvider({
            async authorize(credentials) {
                // Verificar en DB
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });
                if (user && await bcrypt.compare(credentials.password, user.password)) {
                    return { id: user.id, email: user.email, name: user.name };
                }
                return null;
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) token.id = user.id;
            return token;
        },
        async session({ session, token }) {
            session.user.id = token.id;
            return session;
        }
    }
});

// pages/_app.tsx
import { SessionProvider } from 'next-auth/react';

export default function App({ Component, pageProps }) {
    return (
        <SessionProvider>
            <Component {...pageProps} />
        </SessionProvider>
    );
}

// pages/login.tsx
import { signIn } from 'next-auth/react';

export default function Login() {
    const handleLogin = async () => {
        const result = await signIn('credentials', {
            email: formData.email,
            password: formData.password,
            redirect: false
        });
        if (result.ok) router.push('/dashboard');
    };
}
```

---

### 4. 🔐 **Solución Híbrida - Mejorar PHP Actual + JWT**

**¿Qué es?**  
PHP actual con JWT, mejor manejo del frontend y una capa de estado.

**Ventajas:**
- ✅ JWT: sin sesiones, stateless
- ✅ Escalable con microservicios
- ✅ Reutilizable en apps móviles
- ✅ Mejora ligera al setup actual

**Desventajas:**
- ❌ No hay logout inmediato
- ❌ Payload limitado
- ❌ Implementación manual de validaciones

**Implementación:**
```bash
composer require firebase/php-jwt
```

```php
// api/jwt.php
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JWTManager {
    private static $secret = 'tu-clave-secreta-super-segura';
    
    public static function generate($userId) {
        $payload = [
            'user_id' => $userId,
            'exp' => time() + 3600 // 1 hora
        ];
        return JWT::encode($payload, self::$secret, 'HS256');
    }
    
    public static function validate($token) {
        try {
            return JWT::decode($token, new Key(self::$secret, 'HS256'));
        } catch (Exception $e) {
            return null;
        }
    }
}
```

```javascript
// app.js - Mejora del frontend
class AuthManager {
    constructor() {
        this.token = localStorage.getItem('jwt_token');
    }
    
    setToken(token) {
        this.token = token;
        localStorage.setItem('jwt_token', token);
    }
    
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }
    
    async login(email, password) {
        const response = await fetch('api/auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', email, password })
        });
        const data = await response.json();
        if (data.token) {
            this.setToken(data.token);
        }
        return data;
    }
}

const auth = new AuthManager();
```

---

### 5. 🌐 **Solución Cloud - Supabase Auth**

**¿Qué es?**  
Auth y base de datos gestionadas con SDKs.

**Ventajas:**
- ✅ Fácil: providers, UI, gestión de usuarios
- ✅ Escalable y seguro
- ✅ Free tier suficiente para MVPs

**Desventajas:**
- ❌ Coste conforme crece
- ❌ Dependencia externa
- ❌ Migración compleja

**Implementación:**
```bash
npm install @supabase/supabase-js
```

```javascript
// supabase.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://tu-proyecto.supabase.co',
    'tu-anon-key'
);

// Login
await supabase.auth.signInWithPassword({
    email: 'user@example.com',
    password: 'password123'
});

// Proteger rutas
const { data: { session } } = await supabase.auth.getSession();
if (!session) window.location.href = '/login';
```

---

### 6. 🛠️ **Solución SPA - React + React Router + Context API**

**¿Qué es?**  
SPA con Context/Redux para estado de usuario.

**Ventajas:**
- ✅ Separación clara frontend/backend
- ✅ Estado global
- ✅ Experiencia de uso fluida

**Desventajas:**
- ❌ SEO limitado
- ❌ Arquitectura más grande

**Implementación:**
```bash
npx create-react-app inventario-frontend
npm install axios react-router-dom
```

```javascript
// src/context/AuthContext.js
import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const login = async (email, password) => {
        setLoading(true);
        const response = await fetch('/api/auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', email, password })
        });
        const data = await response.json();
        if (data.success) {
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        setLoading(false);
        return data;
    };
    
    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };
    
    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

// ProtectedRoute.js
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute({ children }) {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" />;
}
```

---

### 7. 🔥 **FastAPI (Python) + Jinja2 + HTMX**

**¿Qué es?**  
Backend Python con endpoints API y UI con HTMX.

**Ventajas:**
- ✅ Velocidad y APIs ágiles
- ✅ HTMX evita JavaScript complejo
- ✅ Tipado con Pydantic

**Desventajas:**
- ❌ Cambio de stack
- ❌ Comunidad menor en web

**Implementación:**
```bash
pip install fastapi uvicorn sqlalchemy python-jose[cryptography] passlib[bcrypt] jinja2
```

```python
# main.py
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

app = FastAPI()
security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY)
        return payload
    except:
        raise HTTPException(status_code=401)

@app.post("/api/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401)
    access_token = create_access_token({"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
```

---

### 8. ⚛️ **SvelteKit + Svelte Stores**

**¿Qué es?**  
Svelte + SvelteKit y stores reactivos.

**Ventajas:**
- ✅ Ligero y rápido
- ✅ Código simple
- ✅ Stores reactivos

**Desventajas:**
- ❌ Ecosistema más pequeño
- ❌ Menos recursos

**Implementación:**
```bash
npm create svelte@latest inventario
npm install @supabase/supabase-js
```

```javascript
// src/stores/auth.js
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const user = writable(null);

if (browser) {
    const stored = localStorage.getItem('user');
    if (stored) user.set(JSON.parse(stored));
}

export const login = async (email, password) => {
    const response = await fetch('/api/auth.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'login', email, password })
    });
    const data = await response.json();
    if (data.success) {
        user.set(data.user);
        if (browser) localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
};

// +page.svelte
<script>
    import { user, login } from '$lib/stores/auth';
    import { goto } from '$app/navigation';
    
    $: if ($user) goto('/dashboard');
</script>
```

---

## 📊 Tabla Comparativa Final

| Solución | Complejidad | Curva aprendizaje | Escalabilidad | Comunidad | Producción Ready |
|----------|-------------|-------------------|---------------|-----------|------------------|
| **PHP Actual** | ⭐ | ⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Sí |
| **Laravel + Vue** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅✅ Muy buena |
| **Next.js + NextAuth** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅✅ Excelente |
| **PHP + JWT** | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅✅ Sí |
| **Supabase** | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ Sí |
| **React SPA** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅✅ Sí |
| **FastAPI + HTMX** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ✅✅ Sí |
| **SvelteKit** | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ✅✅ Sí |

---

## 🎯 **Recomendación según Escenario**

### Prototipo rápido / MVP
→ **PHP Actual + JWT** o **Supabase**

### Migración progresiva
→ **Laravel + Vue.js** (añade por partes)

### Proyecto desde cero
→ **Next.js + NextAuth** o **Laravel + Vue**

### Solo frontend
→ **React SPA** o **SvelteKit**

### APIs públicas / mobile
→ **PHP + JWT** o **FastAPI**

---

## 🚀 Plan de Migración Recomendado

Si decides migrar, aquí está el plan gradual:

### Fase 1: Mejorar lo Actual (1 semana)
1. Añadir JWT
2. Estructurar el frontend (MVC)
3. Estado con localStorage + clases
4. Manejo de errores unificado

### Fase 2: Introducir Composer (1 semana)  
1. Instalar Laravel
2. Migrar usuarios a Laravel
3. Endpoints en paralelo (viejo + nuevo)
4. Validación con Requests

### Fase 3: Frontend Moderno (2 semanas)
1. Vue.js o React
2. Componentes
3. Routing
4. Redux/Vuex
5. Tests

### Fase 4: Completar migración (1 semana)
1. Desactivar código legacy
2. Optimizaciones
3. Documentación
4. Deploy

---

## 🤔 **Mi Recomendación Personal**

Para tu caso:
1. **Ahora:** Mejorar el PHP actual con JWT y mejor estructura frontend (2-3 días)
2. **Próximo proyecto:** Next.js + NextAuth por DX y rendimiento
3. **Empresa establecida:** Laravel + Vue por ecosistema, recursos y producción

¿Con cuál comenzamos? Puedo implementar la que prefieras.

