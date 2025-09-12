# 📧 Guía de Configuración de Email

Esta guía te ayudará a configurar el servicio de email para enviar códigos MFA usando diferentes proveedores.

## 🔧 Configuración Rápida

### 1. Gmail (Recomendado para desarrollo)

```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="brandonailon19@gmail.com"
SMTP_PASS="utkd lhqf wlxc pvhs"  # ⚠️ NO uses tu contraseña normal
SMTP_FROM="noreply@mail.com"
```

**Pasos para Gmail:**
1. Ve a tu [Cuenta de Google](https://myaccount.google.com/)
2. Seguridad → Verificación en 2 pasos (debe estar activada)
3. Seguridad → Contraseñas de aplicaciones
4. Genera una nueva contraseña de aplicación
5. Usa esa contraseña en `SMTP_PASS`

### 2. Outlook/Hotmail

```bash
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT="587"
SMTP_USER="tu-email@outlook.com"
SMTP_PASS="tu-contraseña"
SMTP_FROM="noreply@tuapp.com"
```

### 3. Yahoo Mail

```bash
SMTP_HOST="smtp.mail.yahoo.com"
SMTP_PORT="587"
SMTP_USER="tu-email@yahoo.com"
SMTP_PASS="tu-app-password"  # Generar en configuración de Yahoo
SMTP_FROM="noreply@tuapp.com"
```

### 4. Proveedores Profesionales

#### SendGrid (Recomendado para producción)
```bash
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"  # Literalmente "apikey"
SMTP_PASS="tu-sendgrid-api-key"
SMTP_FROM="noreply@tudominio.com"
```

#### Mailgun
```bash
SMTP_HOST="smtp.mailgun.org"
SMTP_PORT="587"
SMTP_USER="postmaster@tu-dominio.mailgun.org"
SMTP_PASS="tu-mailgun-smtp-password"
SMTP_FROM="noreply@tudominio.com"
```

#### Amazon SES
```bash
SMTP_HOST="email-smtp.us-east-1.amazonaws.com"  # Cambia la región
SMTP_PORT="587"
SMTP_USER="tu-access-key-id"
SMTP_PASS="tu-secret-access-key"
SMTP_FROM="noreply@tudominio.com"
```

## 🧪 Probar Configuración

### Método 1: Endpoint de Prueba
```bash
POST /auth/test-email
{
  "email": "tu-email-de-prueba@gmail.com"
}
```

### Método 2: Registro de Usuario
1. Registra un usuario nuevo
2. Verifica que llegue el email de bienvenida

### Método 3: Login con MFA
1. Haz login con credenciales válidas
2. Verifica que llegue el código MFA

## 🛠️ Solución de Problemas

### Error: "Invalid login"
- **Gmail**: Verifica que uses App Password, no tu contraseña normal
- **Yahoo**: Activa "Allow apps that use less secure sign in"
- **Outlook**: Verifica que la cuenta no tenga 2FA o usa App Password

### Error: "Connection timeout"
- Verifica el `SMTP_HOST` y `SMTP_PORT`
- Algunos firewalls bloquean puertos SMTP
- Intenta con puerto 465 (SSL) en lugar de 587 (TLS)

### Error: "Authentication failed"
- Verifica `SMTP_USER` y `SMTP_PASS`
- Para Gmail: debe ser App Password de 16 caracteres
- Para SendGrid: usuario debe ser exactamente "apikey"

### Emails no llegan
- Verifica la carpeta de spam/junk
- Confirma que `SMTP_FROM` sea un email válido
- Algunos proveedores requieren dominio verificado

## 📋 Variables de Entorno Completas

Copia esto a tu archivo `.env`:

```bash
# Database
DATABASE_URL="postgresql://umg:mfa-umg@localhost:5432/postgres?schema=public"

# JWT Secrets
JWT_ACCESS_SECRET="tu-super-secreto-access-key"
JWT_REFRESH_SECRET="tu-super-secreto-refresh-key"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# Email Configuration - Gmail Example
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="tu-app-password-de-16-caracteres"
SMTP_FROM="noreply@tuapp.com"

# MFA Configuration
MFA_CODE_EXPIRATION_MINUTES="10"
MFA_CODE_LENGTH="6"
```

## 🎨 Plantillas de Email Incluidas

El sistema incluye 3 plantillas HTML profesionales:

### 1. 🔐 Código MFA (Login)
- Diseño azul con código destacado
- Información de expiración (10 min)
- Advertencias de seguridad

### 2. 🔓 Recuperación de Contraseña
- Diseño rojo para urgencia
- Código para reset de contraseña
- Consejos de seguridad

### 3. 🎉 Email de Bienvenida
- Diseño verde amigable
- Información de características de seguridad
- Instrucciones de uso

## 🚀 Funcionalidades del Servicio

- ✅ **Plantillas HTML responsivas**
- ✅ **Fallback a texto plano**
- ✅ **Logging detallado**
- ✅ **Manejo de errores robusto**
- ✅ **Configuración flexible**
- ✅ **Pruebas de conexión**
- ✅ **Soporte múltiples proveedores**

## 📱 Ejemplos de Uso en el Código

### Enviar código MFA
```typescript
// Se envía automáticamente en el login
const mfaCode = await authService.generateMfaCode(userId);
// El email se envía internamente
```

### Enviar email de bienvenida
```typescript
// Se envía automáticamente al registrarse
const user = await authService.createUser(userData);
// El email de bienvenida se envía internamente
```

### Probar conexión
```typescript
const isConnected = await emailService.testConnection();
console.log('Email service:', isConnected ? 'OK' : 'Error');
```

¡Tu servicio de email está listo para usar! 🎉
