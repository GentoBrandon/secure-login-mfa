# Sistema de Autenticación MFA con Prisma

Este documento explica cómo funciona el sistema de autenticación con MFA (Multi-Factor Authentication) implementado con Prisma.

## Estructura de Base de Datos

### Tabla `users`
- `id`: ID único del usuario (autoincremental)
- `email`: Email único del usuario
- `password`: Hash de la contraseña
- `firstName`: Nombre del usuario (opcional)
- `lastName`: Apellido del usuario (opcional)
- `isActive`: Estado del usuario (activo/inactivo)
- `createdAt`: Fecha de creación
- `updatedAt`: Fecha de última actualización

### Tabla `verification_codes`
- `id`: ID único del código (autoincremental)
- `userId`: ID del usuario (clave foránea)
- `code`: Código de verificación de 6 dígitos
- `type`: Tipo de código (LOGIN_MFA, PASSWORD_RESET, EMAIL_VERIFICATION)
- `expiresAt`: Fecha de expiración
- `isUsed`: Estado del código (usado/no usado)
- `createdAt`: Fecha de creación
- `updatedAt`: Fecha de última actualización

## Flujo de Autenticación MFA

### 1. Registro de Usuario
```bash
POST /auth/register
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123",
  "firstName": "Juan",
  "lastName": "Pérez"
}
```

### 2. Inicio de Sesión (Paso 1)
```bash
POST /auth/login
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Código de verificación enviado a tu email",
  "tempToken": "temp_1_1694445123456",
  "expiresAt": "2023-09-11T20:42:52.000Z"
}
```

### 3. Verificación MFA (Paso 2)
```bash
POST /auth/verify-mfa
{
  "email": "usuario@ejemplo.com",
  "code": "123456"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Autenticación completada exitosamente",
  "user": {
    "id": 1,
    "email": "usuario@ejemplo.com",
    "firstName": "Juan",
    "lastName": "Pérez"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

### 4. Probar Configuración de Email (Desarrollo)
```bash
POST /auth/test-email
{
  "email": "tu-email@ejemplo.com"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Email de prueba enviado exitosamente"
}
```

### 5. Renovar Token de Acceso
```bash
POST /auth/refresh
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Token renovado exitosamente",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

### 5. Obtener Perfil de Usuario (Protegido)
```bash
GET /auth/profile
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "usuario@ejemplo.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "isActive": true,
    "createdAt": "2023-09-11T19:32:52.000Z"
  }
}
```

### 6. Validar Token (Protegido)
```bash
POST /auth/validate-token
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Token válido",
  "user": {
    "sub": 1,
    "email": "usuario@ejemplo.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "iat": 1694445123,
    "exp": 1694446023
  }
}
```

## Endpoints Protegidos de Ejemplo

### Dashboard (Requiere Autenticación)
```bash
GET /protected/dashboard
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Datos Administrativos (Requiere Autenticación)
```bash
GET /protected/admin
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Configuración de Variables de Entorno

Copia el archivo `.env.example` a `.env` y configura las siguientes variables:

```bash
# Database
DATABASE_URL="postgresql://umg:mfa-umg@localhost:5432/postgres?schema=public"

# JWT Secrets (cambiar en producción)
JWT_ACCESS_SECRET="your-super-secret-access-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@yourapp.com"

# MFA Configuration
MFA_CODE_EXPIRATION_MINUTES="10"
MFA_CODE_LENGTH="6"
```

## Comandos de Prisma

```bash
# Generar cliente de Prisma
npx prisma generate

# Crear migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones en producción
npx prisma migrate deploy

# Ver base de datos en navegador
npx prisma studio

# Reset de base de datos (CUIDADO: elimina todos los datos)
npx prisma migrate reset
```

## Características de Seguridad Implementadas

1. **Hash de contraseñas**: Uso de bcrypt con salt rounds
2. **Códigos temporales**: Los códigos MFA expiran en 10 minutos
3. **Códigos de un solo uso**: Los códigos se marcan como usados después de la verificación
4. **Invalidación automática**: Los códigos anteriores se invalidan al generar uno nuevo
5. **JWT Tokens**: Access tokens (15 min) y refresh tokens (7 días)
6. **Protección de rutas**: Guard JWT para endpoints protegidos
7. **Renovación automática**: Sistema de refresh tokens sin almacenar en base de datos
8. **Servicio de Email**: Envío automático de códigos MFA con plantillas HTML profesionales
9. **Múltiples proveedores**: Soporte para Gmail, Outlook, SendGrid, Mailgun, etc.
10. **Plantillas responsivas**: Emails HTML con diseño moderno y fallback a texto plano
11. **Índices de base de datos**: Para búsquedas eficientes por código, usuario y expiración
12. **Cascading delete**: Los códigos se eliminan automáticamente al eliminar un usuario
13. **Configuración flexible**: Variables de entorno para secretos y tiempos de expiración

## Próximos Pasos Recomendados

1. ✅ **JWT Tokens**: ¡Implementado! Sistema completo de access y refresh tokens
2. ✅ **Servicio de Email**: ¡Implementado! Envío automático de códigos MFA con plantillas HTML
3. **Rate Limiting**: Implementar límites de intentos de verificación
4. **Logging**: Registrar intentos de autenticación para auditoría
5. **Validación**: Agregar validadores de DTO con class-validator
6. **Tests**: Escribir tests unitarios e integración
7. **Swagger**: Documentar la API con OpenAPI/Swagger
8. **Roles y Permisos**: Sistema de autorización basado en roles
9. **Blacklist de tokens**: Para logout seguro y revocación de tokens
10. **Métricas**: Dashboard de métricas de autenticación y seguridad

## Estructura de Archivos Creados

```
backend/src/
├── auth/
│   ├── dto/
│   │   └── create-user.dto.ts (DTOs para registro, login, MFA y refresh)
│   ├── guards/
│   │   └── jwt-auth.guard.ts (Guard para proteger rutas)
│   ├── auth.controller.ts (Endpoints de autenticación + test email)
│   ├── auth.service.ts (Lógica de autenticación y MFA)
│   ├── jwt.service.ts (Servicio de JWT tokens)
│   └── auth.module.ts (Módulo de autenticación)
├── email/
│   ├── email.service.ts (Servicio de envío de emails con plantillas)
│   └── email.module.ts (Módulo de email)
├── protected/
│   ├── protected.controller.ts (Ejemplos de rutas protegidas)
│   └── protected.module.ts
├── prisma.service.ts (Servicio de Prisma)
└── app.module.ts (Módulo principal actualizado)

backend/prisma/
├── schema.prisma (Esquema con tablas User y VerificationCode)
└── migrations/
    └── 20250911193252_init/
        └── migration.sql

backend/
├── .env.example (Template de variables de entorno)
└── PRISMA_MFA_SETUP.md (Esta documentación)
```

## API Endpoints Disponibles

### Públicos (No requieren autenticación)
- `POST /auth/register` - Registro de usuario (+ envío de email de bienvenida)
- `POST /auth/login` - Primer paso del login (+ envío de código MFA por email)
- `POST /auth/verify-mfa` - Segundo paso del login (verificación MFA + generación de tokens)
- `POST /auth/refresh` - Renovar access token usando refresh token
- `POST /auth/test-email` - Probar configuración de email (desarrollo)

### Protegidos (Requieren Bearer token)
- `GET /auth/profile` - Obtener perfil del usuario autenticado
- `POST /auth/validate-token` - Validar si el token es válido
- `GET /protected/dashboard` - Dashboard protegido de ejemplo
- `GET /protected/admin` - Datos administrativos protegidos de ejemplo
